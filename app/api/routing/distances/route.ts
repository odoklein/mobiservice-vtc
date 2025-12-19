import { NextRequest, NextResponse } from 'next/server';
import { getRouteMatrix } from '@/lib/routing/distancematrix';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { depot, pickup, dropoff } = body;

        // Validate input
        if (!depot || !pickup || !dropoff) {
            return NextResponse.json(
                { error: 'Missing required coordinates: depot, pickup, dropoff' },
                { status: 400 }
            );
        }

        if (!depot.lat || !depot.lng || !pickup.lat || !pickup.lng || !dropoff.lat || !dropoff.lng) {
            return NextResponse.json(
                { error: 'Invalid coordinates format' },
                { status: 400 }
            );
        }

        // Call OpenRouteService to get distances
        const distances = await getRouteMatrix(depot, pickup, dropoff);

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
