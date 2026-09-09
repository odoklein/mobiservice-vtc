/**
 * Mapbox Directions API routing service
 * Server-side only - handles distance calculations for VTC pricing
 *
 * API: https://docs.mapbox.com/api/navigation/directions/
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

function getCacheKey(depot: Coordinates, pickup: Coordinates, dropoff: Coordinates): string {
    return `${depot.lng},${depot.lat}|${pickup.lng},${pickup.lat}|${dropoff.lng},${dropoff.lat}`;
}

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

function storeInCache(cacheKey: string, distances: RouteDistances): void {
    routeCache.set(cacheKey, {
        distances,
        timestamp: Date.now(),
    });
}

/**
 * Call Mapbox Directions API to get driving distance/duration between two points
 */
async function getDistanceBetweenPoints(
    origin: Coordinates,
    destination: Coordinates,
    accessToken: string
): Promise<{ distance: number; duration: number }> {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('overview', 'false');
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('alternatives', 'false');

    const response = await fetch(url.toString());

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mapbox Directions API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`Mapbox Directions API: Route not found (${data.code || 'UNKNOWN'})`);
    }

    const route = data.routes[0];

    return {
        distance: route.distance / 1000, // meters to km
        duration: Math.round(route.duration / 60), // seconds to minutes
    };
}

/**
 * Call Mapbox Directions API to get driving distances for all 3 segments
 *
 * @throws Error if API call fails or access token is missing
 */
async function callDirectionsApi(
    depot: Coordinates,
    pickup: Coordinates,
    dropoff: Coordinates
): Promise<RouteDistances> {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }

    try {
        // Make 3 separate calls for each segment (accurate driving distance,
        // important in mountainous Haute-Savoie region)
        const [segmentCA, segmentTP, segmentReturn] = await Promise.all([
            getDistanceBetweenPoints(depot, pickup, accessToken),      // Depot → Pickup
            getDistanceBetweenPoints(pickup, dropoff, accessToken),    // Pickup → Dropoff
            getDistanceBetweenPoints(dropoff, depot, accessToken),     // Dropoff → Depot
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
            throw new Error(`Mapbox routing failed: ${error.message}`);
        }
        throw new Error('Mapbox routing failed: Unknown error');
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
    const cacheKey = getCacheKey(depot, pickup, dropoff);
    const cached = getFromCache(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const distances = await callDirectionsApi(depot, pickup, dropoff);
        storeInCache(cacheKey, distances);
        return distances;
    } catch (error) {
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
