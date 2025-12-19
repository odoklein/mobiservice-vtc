import { NextRequest, NextResponse } from 'next/server';
import { searchAddress } from '@/lib/geocoding/distancematrix';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Missing query parameter: q' },
                { status: 400 }
            );
        }

        // Require minimum 3 characters
        if (query.trim().length < 3) {
            return NextResponse.json({ results: [] });
        }

        // Call OpenRouteService geocoding
        const results = await searchAddress(query);

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Geocoding API error:', error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Geocoding search failed',
                message: 'Recherche d\'adresse temporairement indisponible.',
            },
            { status: 500 }
        );
    }
}
