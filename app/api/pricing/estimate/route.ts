import { NextRequest, NextResponse } from 'next/server';
import { VTC_DEPOT_COORDS, calculateTransferPrice } from '@/lib/pricing/tariffs-2026';
import { getRouteMatrix } from '@/lib/routing/distancematrix';

/**
 * POST /api/pricing/estimate
 * 
 * Calcule une estimation de prix pour un trajet A/S ou A/R
 * selon la logique CA/TP/retour dépôt avec tarifs jour/nuit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      pickupDate, // ISO string or Date
      pickupTime, // HH:mm format
      tripType = 'one-way', // 'one-way' | 'round-trip'
      tollCost = 0, // Coût péages estimé (€ TTC) - optionnel
    } = body;

    // Validation
    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json(
        { success: false, error: 'Coordonnées de départ et d\'arrivée requises' },
        { status: 400 }
      );
    }

    if (!pickupDate || !pickupTime) {
      return NextResponse.json(
        { success: false, error: 'Date et heure de prise en charge requises' },
        { status: 400 }
      );
    }

    // Construire la date complète en heure locale (pas UTC)
    // Utiliser les composants de date pour garantir l'heure locale
    const [year, month, day] = pickupDate.split('-').map(Number);
    const [hours, minutes] = pickupTime.split(':').map(Number);
    
    // Créer la date en heure locale explicite
    const pickupDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    
    if (isNaN(pickupDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Date/heure invalide' },
        { status: 400 }
      );
    }

    // Debug: Vérifier la date construite
    console.log('[PRICING] Date construite:', {
      pickupDate,
      pickupTime,
      constructed: pickupDateTime.toISOString(),
      localHours: pickupDateTime.getHours(),
      localDay: pickupDateTime.getDay(),
      dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][pickupDateTime.getDay()],
      isSunday: pickupDateTime.getDay() === 0,
    });

    // Calculer les distances CA/TP/retour
    const depot = { lat: VTC_DEPOT_COORDS.lat, lng: VTC_DEPOT_COORDS.lng };
    const pickup = { lat: pickupLat, lng: pickupLng };
    const dropoff = { lat: dropoffLat, lng: dropoffLng };

    let distanceCA_out: number;
    let distanceTP: number;
    let distanceCA_return: number;
    let totalDuration: number;

    try {
      const segments = await getRouteMatrix(depot, pickup, dropoff);
      distanceCA_out = segments.distanceCA;
      distanceTP = segments.distanceTP;
      // RÈGLE N°1: Le retour au dépôt est TOUJOURS inclus dans le calcul
      // Même pour un aller simple, le retour du véhicule est facturé
      distanceCA_return = segments.distanceReturn;
      totalDuration = segments.totalDuration;
    } catch (error) {
      console.error('Distance calculation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de calculer les distances. Vérifiez les adresses.',
          message: error instanceof Error ? error.message : 'Erreur de calcul de distance',
        },
        { status: 500 }
      );
    }

    // Calculer le prix selon la logique tarifaire
    const pricing = calculateTransferPrice(
      distanceCA_out,
      distanceTP,
      distanceCA_return,
      tripType,
      pickupDateTime,
      tollCost
    );

    // Préparer la réponse
    return NextResponse.json({
      success: true,
      estimation: {
        // Distances (km)
        distances: {
          ca_out: distanceCA_out,
          tp: distanceTP,
          ca_return: distanceCA_return, // TOUJOURS inclus (règle n°1)
          total: distanceCA_out + distanceTP + distanceCA_return,
        },
        // Durée (minutes)
        duration: totalDuration,
        // Prix
        pricing: {
          totalTTC: pricing.totalTTC,
          totalHT: pricing.totalHT,
          tva: pricing.tva,
          isNightRate: pricing.isNightRate,
          rateType: pricing.isNightRate
            ? 'Tarif nuit (20h-7h + Dim/JF)'
            : 'Tarif jour (7h-20h sauf Dim/JF)',
          breakdown: {
            // Breakdown masqué côté client mais disponible pour admin
            costCA_out: pricing.breakdown.costCA_out,
            costTP: pricing.breakdown.costTP, // Doublé pour A/R client
            costCA_return: pricing.breakdown.costCA_return, // TOUJOURS inclus (règle n°1)
            tollCost: pricing.breakdown.tollCost,
            isForfaitAgglomeration: pricing.breakdown.isForfaitAgglomeration,
            bracket: pricing.breakdown.bracket,
          },
        },
        // Métadonnées
        tripType,
        pickupDateTime: pickupDateTime.toISOString(),
        depot: {
          address: '4 rue des artisans, 74300 Cluses',
          coordinates: depot,
        },
      },
    });
  } catch (error) {
    console.error('Pricing estimate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du calcul de l\'estimation',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

