import { NextRequest, NextResponse } from 'next/server';
import { getRouteMatrix } from '@/lib/routing/mapbox';
import { getDepot } from '@/lib/settings/depot-settings';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // body.depot is accepted for compatibility but ignored: the depot is always the one saved in the admin
        const { pickup, dropoff } = body;

        // Validate input
        if (!pickup || !dropoff) {
            return NextResponse.json(
                { error: 'Missing required coordinates: pickup, dropoff' },
                { status: 400 }
            );
        }

        if (!pickup.lat || !pickup.lng || !dropoff.lat || !dropoff.lng) {
            return NextResponse.json(
                { error: 'Invalid coordinates format' },
                { status: 400 }
            );
        }

        const { lat, lng } = await getDepot();
        const distances = await getRouteMatrix({ lat, lng }, pickup, dropoff);

        return NextResponse.json(distances);
    } catch (error) {
        console.error('Routing API error:', error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Distance calculation failed',
                message: 'Estimation temporairement indisponible. Merci de nous contacter.',
            },
            { status: 500 }
        );
    }
}
