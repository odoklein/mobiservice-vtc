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
      waitingMinutes = 0, // Durée d'attente en minutes (pour A/R) - optionnel
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

    // Construire la date complète en heure locale uniquement (éviter tout décalage UTC)
    const dateOnly = typeof pickupDate === 'string' && pickupDate.includes('T')
      ? pickupDate.split('T')[0]
      : String(pickupDate).slice(0, 10);
    const [year, month, day] = dateOnly.split('-').map(Number);
    const timePart = String(pickupTime).trim();
    const timeParts = timePart.includes(':') ? timePart.split(':') : [timePart, '0'];
    const [hours, minutes] = [Number(timeParts[0]) || 0, Number(timeParts[1]) || 0];

    const pickupDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    if (isNaN(pickupDateTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Date/heure invalide' },
        { status: 400 }
      );
    }

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[pickupDateTime.getDay()];
    const rateLabel = pickupDateTime.getDay() === 0 || pickupDateTime.getHours() >= 20 || pickupDateTime.getHours() < 7
      ? 'Tarif nuit / Dim & JF 24/24'
      : 'Tarif jour (7h-20h sauf Dim/JF)';
    console.log('[PRICING] Date construite (local):', {
      pickupDate: dateOnly,
      pickupTime,
      dayName,
      rateLabel,
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

      // RÈGLE CORRECTE selon type de trajet:
      // - ALLER SIMPLE (A/S): Le client va de pickup → dropoff
      //   → CA retour = dropoff → dépôt
      // - ALLER-RETOUR (A/R): Le client va de pickup → dropoff → pickup
      //   → CA retour = pickup → dépôt (même que CA aller car il revient au point de départ)
      if (tripType === 'round-trip') {
        // Pour A/R: le client revient à son point de départ (pickup)
        // donc le CA retour est identique au CA aller (pickup → depot)
        distanceCA_return = segments.distanceCA; // pickup → depot
        console.log('[PRICING] A/R détecté - CA retour = CA aller (pickup→depot):', distanceCA_return);
      } else {
        // Pour A/S: le client termine à dropoff
        // donc le CA retour part de dropoff
        distanceCA_return = segments.distanceReturn; // dropoff → depot
        console.log('[PRICING] A/S détecté - CA retour depuis dropoff→depot:', distanceCA_return);
      }

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

    // Détecter automatiquement les péages sur le trajet
    let autoDetectedTollCost = tollCost;
    let tollDetails = '';

    if (tollCost === 0) {
      // Importer le service de détection de péages
      const { calculateTollForTrip } = await import('@/lib/services/toll-calculator');

      try {
        const tollResult = await calculateTollForTrip({
          depot,
          pickup,
          dropoff,
          tripType,
        });

        if (tollResult.hasTolls) {
          autoDetectedTollCost = tollResult.tollCost;
          tollDetails = tollResult.details;
          console.log('[PRICING] Péages détectés automatiquement:', {
            cost: autoDetectedTollCost,
            details: tollDetails,
          });
        }
      } catch (tollError) {
        console.warn('[PRICING] Échec de la détection automatique des péages:', tollError);
        // Continue sans péages si la détection échoue
      }
    }

    // Calculer le prix selon la logique tarifaire
    const pricing = calculateTransferPrice(
      distanceCA_out,
      distanceTP,
      distanceCA_return,
      tripType,
      pickupDateTime,
      autoDetectedTollCost,  // Utiliser le coût détecté automatiquement
      waitingMinutes  // Ajouter le temps d'attente
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
          // A/R 1–3 jours : distance totale (CA Aller + 2×TP + CA Retour) pour bloc < 25 km et immobilisation
          ...(tripType === 'round-trip' && {
            totalAR: distanceCA_out * 2 + distanceTP * 2,
          }),
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
            ? 'Tarif nuit / Dim & JF 24/24'
            : 'Tarif jour (7h-20h sauf Dim/JF)',
          dayName,
          breakdown: {
            // Breakdown masqué côté client mais disponible pour admin
            costCA_out: pricing.breakdown.costCA_out,
            costTP: pricing.breakdown.costTP, // Doublé pour A/R client
            costCA_return: pricing.breakdown.costCA_return, // TOUJOURS inclus (règle n°1)
            tollCost: pricing.breakdown.tollCost,
            isForfaitAgglomeration: pricing.breakdown.isForfaitAgglomeration,
            bracket: pricing.breakdown.bracket,
            pricePerKmCA: pricing.breakdown.pricePerKmCA,
            pricePerKmTP: pricing.breakdown.pricePerKmTP,
          },
          // TVA différenciée (prestation 10%, péage et MAD 20%)
          tvaBreakdown: pricing.debugInfo?.tvaDetails ?? undefined,
          // Informations sur les péages
          tollInfo: {
            detected: autoDetectedTollCost > 0,
            cost: autoDetectedTollCost,
            details: tollDetails || (autoDetectedTollCost > 0 ? `Péages inclus: ${autoDetectedTollCost.toFixed(2)}€` : 'Aucun péage détecté'),
            tripMultiplier: tripType === 'round-trip' ? 2 : 1,
            totalIncluded: tripType === 'round-trip' ? autoDetectedTollCost * 2 : autoDetectedTollCost,
          },
        },
        // Métadonnées
        tripType,
        pickupDateTime: pickupDateTime.toISOString(),
        depot: {
          address: '4 rue des artisans, 74300 Cluses',
          coordinates: depot,
        },
        // Debug info - détails complets du calcul
        debugInfo: pricing.debugInfo,
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

