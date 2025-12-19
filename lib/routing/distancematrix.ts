/**
 * DistanceMatrix.ai Routing Service
 * Server-side only - handles distance calculations for VTC pricing
 * 
 * API: https://distancematrix.ai/distance-matrix-api
 */

// Simple in-memory cache for route distances
interface CacheEntry {
    distances: RouteDistances;
    timestamp: number;
}

const routeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface RouteDistances {
    distanceCA: number; // km: Depot → Pickup
    distanceTP: number; // km: Pickup → Dropoff
    distanceReturn: number; // km: Dropoff → Depot
    totalDistance: number; // km: Total round trip
    durationCA: number; // minutes
    durationTP: number; // minutes
    durationReturn: number; // minutes
    totalDuration: number; // minutes
}

interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Generate cache key from coordinates
 */
function getCacheKey(depot: Coordinates, pickup: Coordinates, dropoff: Coordinates): string {
    return `${depot.lng},${depot.lat}|${pickup.lng},${pickup.lat}|${dropoff.lng},${dropoff.lat}`;
}

/**
 * Get route distances from cache if available and fresh
 */
function getFromCache(cacheKey: string): RouteDistances | null {
    const entry = routeCache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_TTL_MS) {
        routeCache.delete(cacheKey);
        return null;
    }

    return entry.distances;
}

/**
 * Store route distances in cache
 */
function storeInCache(cacheKey: string, distances: RouteDistances): void {
    routeCache.set(cacheKey, {
        distances,
        timestamp: Date.now(),
    });
}

/**
 * Call DistanceMatrix.ai API to get driving distance between two points
 */
async function getDistanceBetweenPoints(
    origin: Coordinates,
    destination: Coordinates,
    apiKey: string
): Promise<{ distance: number; duration: number }> {
    const url = new URL('https://api.distancematrix.ai/maps/api/distancematrix/json');
    url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
    url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DistanceMatrix API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
        throw new Error(`DistanceMatrix API error: ${data.status}`);
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
        throw new Error(`DistanceMatrix API: Route not found (${element?.status || 'UNKNOWN'})`);
    }

    return {
        distance: element.distance.value / 1000, // meters to km
        duration: Math.round(element.duration.value / 60), // seconds to minutes
    };
}

/**
 * Call DistanceMatrix.ai Matrix API to get driving distances for all 3 segments
 * 
 * @throws Error if API call fails or API key is missing
 */
async function callDistanceMatrixApi(
    depot: Coordinates,
    pickup: Coordinates,
    dropoff: Coordinates
): Promise<RouteDistances> {
    const apiKey = process.env.DISTANCEMATRIX_API_KEY;

    if (!apiKey) {
        throw new Error('DISTANCEMATRIX_API_KEY is not configured');
    }

    try {
        // Make 3 separate API calls for each segment
        // (DistanceMatrix.ai charges per element, so this is equivalent)
        const [segmentCA, segmentTP, segmentReturn] = await Promise.all([
            getDistanceBetweenPoints(depot, pickup, apiKey),      // Depot → Pickup
            getDistanceBetweenPoints(pickup, dropoff, apiKey),    // Pickup → Dropoff
            getDistanceBetweenPoints(dropoff, depot, apiKey),     // Dropoff → Depot
        ]);

        return {
            distanceCA: Math.round(segmentCA.distance * 10) / 10, // Round to 1 decimal
            distanceTP: Math.round(segmentTP.distance * 10) / 10,
            distanceReturn: Math.round(segmentReturn.distance * 10) / 10,
            totalDistance: Math.round((segmentCA.distance + segmentTP.distance + segmentReturn.distance) * 10) / 10,
            durationCA: segmentCA.duration,
            durationTP: segmentTP.duration,
            durationReturn: segmentReturn.duration,
            totalDuration: segmentCA.duration + segmentTP.duration + segmentReturn.duration,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`DistanceMatrix routing failed: ${error.message}`);
        }
        throw new Error('DistanceMatrix routing failed: Unknown error');
    }
}

/**
 * Get route matrix with 3-segment distances for VTC pricing
 * Uses caching to reduce API calls
 * 
 * @param depot - VTC depot location
 * @param pickup - Customer pickup location
 * @param dropoff - Customer dropoff location
 * @returns Route distances for all 3 segments
 * @throws Error with user-friendly message if routing fails
 */
export async function getRouteMatrix(
    depot: Coordinates,
    pickup: Coordinates,
    dropoff: Coordinates
): Promise<RouteDistances> {
    // Check cache first
    const cacheKey = getCacheKey(depot, pickup, dropoff);
    const cached = getFromCache(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        // Call DistanceMatrix.ai API
        const distances = await callDistanceMatrixApi(depot, pickup, dropoff);

        // Store in cache
        storeInCache(cacheKey, distances);

        return distances;
    } catch (error) {
        // Re-throw with consistent error message
        if (error instanceof Error) {
            throw new Error(`Estimation temporairement indisponible. ${error.message}`);
        }
        throw new Error('Estimation temporairement indisponible. Merci de nous contacter.');
    }
}

/**
 * Clear the route cache (useful for testing)
 */
export function clearRouteCache(): void {
    routeCache.clear();
}
