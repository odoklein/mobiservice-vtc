import { NextRequest, NextResponse } from 'next/server';
import { googlePlaceLocation } from '@/lib/geocoding/google';

/**
 * GET /api/geocoding/place?id=<Google placeId>&session=<token>
 * Coordinates of the suggestion the customer picked (see lib/geocoding/google.ts).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('id');

    if (!placeId || !/^[\w-]{10,300}$/.test(placeId)) {
        return NextResponse.json({ error: 'Missing or invalid parameter: id' }, { status: 400 });
    }

    try {
        const location = await googlePlaceLocation(placeId, searchParams.get('session') || undefined);
        if (!location) {
            return NextResponse.json({ error: 'Lieu introuvable' }, { status: 404 });
        }
        return NextResponse.json(location);
    } catch (error) {
        console.error('Place details error:', error);
        return NextResponse.json(
            { error: 'Recherche d\'adresse temporairement indisponible.' },
            { status: 500 }
        );
    }
}
