/**
 * Mapbox Geocoding API (v6) service
 * Server-side only - handles address search
 *
 * API: https://docs.mapbox.com/api/search/geocoding/
 */

import { HAUTE_SAVOIE_AUTOCOMPLETE_BIAS } from '@/lib/constants';

// Simple in-memory cache for geocoding results
interface CacheEntry {
    results: GeocodingResult[];
    timestamp: number;
}

const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface GeocodingResult {
    label: string; // Formatted address
    latitude: number;
    longitude: number;
}

interface MapboxFeature {
    geometry: { type: string; coordinates: [number, number] };
    properties: {
        full_address?: string;
        place_formatted?: string;
        name?: string;
        coordinates?: { longitude: number; latitude: number };
    };
}

function getFromCache(searchText: string): GeocodingResult[] | null {
    const entry = geocodeCache.get(searchText.toLowerCase().trim());
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL_MS) {
        geocodeCache.delete(searchText.toLowerCase().trim());
        return null;
    }

    return entry.results;
}

function storeInCache(searchText: string, results: GeocodingResult[]): void {
    geocodeCache.set(searchText.toLowerCase().trim(), {
        results,
        timestamp: Date.now(),
    });
}

/**
 * Call Mapbox Geocoding API v6 (forward)
 *
 * @param searchText - Address search query
 * @returns Array of geocoding results (max 5)
 * @throws Error if API call fails or access token is missing
 */
async function callGeocodingApi(searchText: string): Promise<GeocodingResult[]> {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }

    const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
    url.searchParams.set('q', searchText);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('language', 'fr');
    url.searchParams.set('country', 'fr,ch');
    url.searchParams.set('limit', '5');
    url.searchParams.set('autocomplete', 'true');
    url.searchParams.set(
        'proximity',
        `${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lng},${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lat}`
    );

    try {
        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mapbox Geocoding API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const features: MapboxFeature[] = Array.isArray(data.features) ? data.features : [];

        const results: GeocodingResult[] = features.slice(0, 5).map((feature) => {
            const coords = feature.properties.coordinates ?? {
                longitude: feature.geometry.coordinates[0],
                latitude: feature.geometry.coordinates[1],
            };

            return {
                label: feature.properties.full_address || feature.properties.place_formatted || feature.properties.name || 'Adresse inconnue',
                latitude: coords.latitude,
                longitude: coords.longitude,
            };
        });

        return results;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Mapbox geocoding failed: ${error.message}`);
        }
        throw new Error('Mapbox geocoding failed: Unknown error');
    }
}

/**
 * Search for addresses using Mapbox Geocoding
 * Uses caching to reduce API calls
 *
 * @param searchText - Address search query
 * @returns Array of geocoding results
 * @throws Error with user-friendly message if search fails
 */
export async function searchAddress(searchText: string): Promise<GeocodingResult[]> {
    const trimmed = searchText.trim();
    if (trimmed.length < 3) {
        return [];
    }

    const cached = getFromCache(trimmed);
    if (cached) {
        return cached;
    }

    try {
        const results = await callGeocodingApi(trimmed);
        storeInCache(trimmed, results);
        return results;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Recherche d'adresse temporairement indisponible. ${error.message}`);
        }
        throw new Error('Recherche d\'adresse temporairement indisponible.');
    }
}

/**
 * Clear the geocoding cache (useful for testing)
 */
export function clearGeocodeCache(): void {
    geocodeCache.clear();
}
