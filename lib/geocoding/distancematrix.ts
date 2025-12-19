/**
 * DistanceMatrix.ai Geocoding Service
 * Server-side only - handles address search
 * 
 * API: https://distancematrix.ai/geocoding-api
 */

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

/**
 * Get geocoding results from cache if available and fresh
 */
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

/**
 * Store geocoding results in cache
 */
function storeInCache(searchText: string, results: GeocodingResult[]): void {
    geocodeCache.set(searchText.toLowerCase().trim(), {
        results,
        timestamp: Date.now(),
    });
}

/**
 * Call DistanceMatrix.ai Geocoding API
 * 
 * @param searchText - Address search query
 * @returns Array of geocoding results (max 5)
 * @throws Error if API call fails or API key is missing
 */
async function callGeocodingApi(searchText: string): Promise<GeocodingResult[]> {
    const apiKey = process.env.DISTANCEMATRIX_API_KEY;

    if (!apiKey) {
        throw new Error('DISTANCEMATRIX_API_KEY is not configured');
    }

    // Build query URL
    const url = new URL('https://api.distancematrix.ai/maps/api/geocode/json');
    url.searchParams.set('address', searchText);
    url.searchParams.set('key', apiKey);
    // Add language parameter for French results
    url.searchParams.set('language', 'fr');

    try {
        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DistanceMatrix Geocoding API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`DistanceMatrix Geocoding API error: ${data.status}`);
        }

        if (!data.result || !Array.isArray(data.result)) {
            return [];
        }

        // Transform results to our format (limit to 5)
        const results: GeocodingResult[] = data.result.slice(0, 5).map((item: any) => ({
            label: item.formatted_address || 'Adresse inconnue',
            latitude: item.geometry?.location?.lat || 0,
            longitude: item.geometry?.location?.lng || 0,
        }));

        return results;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`DistanceMatrix geocoding failed: ${error.message}`);
        }
        throw new Error('DistanceMatrix geocoding failed: Unknown error');
    }
}

/**
 * Search for addresses using DistanceMatrix.ai Geocoding
 * Uses caching to reduce API calls
 * 
 * @param searchText - Address search query
 * @returns Array of geocoding results
 * @throws Error with user-friendly message if search fails
 */
export async function searchAddress(searchText: string): Promise<GeocodingResult[]> {
    // Validate input
    const trimmed = searchText.trim();
    if (trimmed.length < 3) {
        return [];
    }

    // Check cache first
    const cached = getFromCache(trimmed);
    if (cached) {
        return cached;
    }

    try {
        // Call DistanceMatrix.ai Geocoding API
        const results = await callGeocodingApi(trimmed);

        // Store in cache
        storeInCache(trimmed, results);

        return results;
    } catch (error) {
        // Re-throw with consistent error message
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
