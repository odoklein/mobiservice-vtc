import { NextRequest, NextResponse } from 'next/server';
import { getRouteMatrix } from '@/lib/routing/distancematrix';
import { getMinimumLeadTimeForCA } from '@/lib/booking/ca-lead-time';
import { VTC_DEPOT } from '@/lib/constants';

/**
 * POST /api/booking/lead-time
 * Returns minimum booking lead time based on CA Aller (depot → pickup).
 * Body: { pickupLat: number, pickupLng: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickupLat, pickupLng } = body;

    if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number') {
      return NextResponse.json(
        { success: false, error: 'pickupLat and pickupLng required (numbers)' },
        { status: 400 }
      );
    }

    const depot = { lat: VTC_DEPOT.lat, lng: VTC_DEPOT.lng };
    const pickup = { lat: pickupLat, lng: pickupLng };
    // Use pickup as dropoff to get only depot → pickup (CA Aller)
    const distances = await getRouteMatrix(depot, pickup, pickup);
    const caAllerKm = distances.distanceCA;

    const result = getMinimumLeadTimeForCA(caAllerKm);
    const earliest = new Date();
    earliest.setMinutes(earliest.getMinutes() + result.leadTimeMinutes);

    return NextResponse.json({
      success: true,
      distanceCA: caAllerKm,
      leadTimeMinutes: result.leadTimeMinutes,
      leadTimeHours: result.leadTimeHours,
      earliestPickup: earliest.toISOString(),
    });
  } catch (error) {
    console.error('[lead-time]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Impossible de calculer le délai minimum.',
      },
      { status: 500 }
    );
  }
}
