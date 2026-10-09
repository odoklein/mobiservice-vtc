import { NextRequest, NextResponse } from 'next/server';
import { buildDateTime, computeHourlyQuote, computeTransferQuote } from '@/lib/pricing/transfer-quote';

/**
 * POST /api/pricing/estimate
 *
 * Estimation de prix, calculée côté serveur avec les tarifs de l'administration :
 *  - Transfert A/S ou A/R : logique CA/TP/retour dépôt, tarifs jour/nuit, péages, attente.
 *    Pour un A/R, la date/heure du retour (returnDate + returnTime) permet de tarifer
 *    l'aller et le retour séparément (tarif mixte si l'un est de jour et l'autre de nuit).
 *  - Mise à disposition (serviceType = 'hourly') : forfait horaire.
 *
 * Le même calcul sert à enregistrer la réservation (voir /api/bookings) : le prix affiché
 * est donc celui qui est enregistré.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      serviceType = 'transfer', // 'transfer' | 'hourly'
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      pickupDate, // 'YYYY-MM-DD' ou ISO
      pickupTime, // HH:mm
      returnDate, // A/R : 'YYYY-MM-DD' ou ISO
      returnTime, // A/R : HH:mm
      tripType = 'one-way', // 'one-way' | 'round-trip'
      waitingMinutes = 0, // Temps d'attente demandé (minutes)
      hours = 2, // Mise à disposition : durée demandée (heures)
    } = body;

    // Validation
    const coords = [pickupLat, pickupLng, dropoffLat, dropoffLng];
    if (coords.some((c) => typeof c !== 'number' || !isFinite(c))) {
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

    const pickupDateTime = buildDateTime(pickupDate, pickupTime);
    if (!pickupDateTime) {
      return NextResponse.json({ success: false, error: 'Date/heure invalide' }, { status: 400 });
    }

    const pickup = { lat: pickupLat, lng: pickupLng };
    const dropoff = { lat: dropoffLat, lng: dropoffLng };

    try {
      if (serviceType === 'hourly') {
        const h = Number(hours);
        // Les durées proposées viennent des forfaits de l'admin (voir /api/pricing/forfaits)
        if (!isFinite(h) || h < 0.5 || h > 24) {
          return NextResponse.json({ success: false, error: 'Durée de mise à disposition invalide (0,5 à 24 h)' }, { status: 400 });
        }
        const { result } = await computeHourlyQuote({ pickup, dropoff, pickupDateTime, hours: h });
        return NextResponse.json({ success: true, estimation: result });
      }

      const trip = tripType === 'round-trip' ? 'round-trip' : 'one-way';
      let returnDateTime: Date | null = null;
      if (trip === 'round-trip' && returnDate && returnTime) {
        returnDateTime = buildDateTime(returnDate, returnTime);
        if (!returnDateTime) {
          return NextResponse.json({ success: false, error: 'Date/heure de retour invalide' }, { status: 400 });
        }
      }

      const { result } = await computeTransferQuote({
        pickup,
        dropoff,
        pickupDateTime,
        returnDateTime,
        tripType: trip,
        waitingMinutes: Number(waitingMinutes) || 0,
      });
      return NextResponse.json({ success: true, estimation: result });
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
