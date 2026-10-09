/**
 * Mapbox Geocoding & Search API service
 * Server-side only - handles address & POI search (Airports, Stations, Addresses)
 *
 * Uses Mapbox Search Box API (v1 forward) for full POI & address support,
 * with fallback to Geocoding v6, intelligent hub prioritization (e.g. Geneva Airport),
 * and anti-spam filtering.
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
    label: string; // Formatted address / POI
    latitude: number;
    longitude: number;
}

interface SearchBoxFeature {
    type: string;
    geometry: { type: string; coordinates: [number, number] };
    properties: {
        name?: string;
        full_address?: string;
        place_formatted?: string;
        feature_type?: string;
        poi_category?: string[];
        coordinates?: { longitude: number; latitude: number };
    };
}

interface GeocodingV6Feature {
    geometry: { type: string; coordinates: [number, number] };
    properties: {
        full_address?: string;
        place_formatted?: string;
        name?: string;
        coordinates?: { longitude: number; latitude: number };
    };
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Curated key transport hubs in Haute-Savoie / Genevois / Auvergne-Rhône-Alpes
 * Guarantees 100% precision for airports and train stations even with typos (e.g. "airpot geneve").
 */
const PRIORITY_HUBS = [
    {
        name: 'Aéroport de Genève (GVA)',
        address: "Aéroport de Genève, Route de l'Aéroport 21, 1215 Le Grand-Saconnex, Suisse",
        lat: 46.2380,
        lng: 6.1090,
        requiredKeywords: ['aeroport', 'airpot', 'airport', 'gva', 'cointrin'],
        secondaryKeywords: ['geneve', 'geneva', 'suisse', 'ch', 'cointrin'],
    },
    {
        name: 'Aéroport Lyon Saint-Exupéry (LYS)',
        address: 'Aéroport Lyon Saint-Exupéry, 69125 Colombier-Saugnieu, France',
        lat: 45.7256,
        lng: 5.0811,
        requiredKeywords: ['aeroport', 'airpot', 'airport', 'lys', 'saint-exupery', 'st exupery'],
        secondaryKeywords: ['lyon'],
    },
    {
        name: "Gare d'Annecy",
        address: 'Place de la Gare, 74000 Annecy, France',
        lat: 45.9023,
        lng: 6.1219,
        requiredKeywords: ['gare', 'sncf'],
        secondaryKeywords: ['annecy'],
    },
    {
        name: 'Gare de Genève-Cornavin',
        address: 'Place de Cornavin, 1201 Genève, Suisse',
        lat: 46.2104,
        lng: 6.1424,
        requiredKeywords: ['gare', 'cornavin', 'cff'],
        secondaryKeywords: ['geneve', 'geneva'],
    },
    {
        name: 'Gare de Cluses',
        address: 'Place de la Gare, 74300 Cluses, France',
        lat: 46.0601,
        lng: 6.5772,
        requiredKeywords: ['gare', 'sncf'],
        secondaryKeywords: ['cluses'],
    },
    {
        name: 'Chamonix-Mont-Blanc',
        address: 'Chamonix-Mont-Blanc, 74400, France',
        lat: 45.9237,
        lng: 6.8694,
        requiredKeywords: ['chamonix'],
        secondaryKeywords: [],
    },
    {
        name: 'Megève',
        address: 'Megève, 74120, France',
        lat: 45.8567,
        lng: 6.6175,
        requiredKeywords: ['megeve'],
        secondaryKeywords: [],
    },
    {
        name: 'La Clusaz',
        address: 'La Clusaz, 74220, France',
        lat: 45.9044,
        lng: 6.4242,
        requiredKeywords: ['clusaz'],
        secondaryKeywords: [],
    },
];

function matchPriorityHubs(query: string): GeocodingResult[] {
    const qNorm = normalizeText(query);
    const qWords = qNorm.split(/\s+/).filter((w) => w.length >= 2);
    if (qWords.length === 0) return [];

    const matches: GeocodingResult[] = [];

    for (const hub of PRIORITY_HUBS) {
        // Direct code match (e.g. "gva", "lys")
        if (hub.requiredKeywords.includes(qNorm)) {
            matches.push({ label: hub.address, latitude: hub.lat, longitude: hub.lng });
            continue;
        }

        // Match at least one required keyword
        const hasReq = hub.requiredKeywords.some((rk) =>
            qWords.some((qw) => qw.includes(rk) || rk.includes(qw))
        );
        if (!hasReq) continue;

        // If secondary keywords exist, check if query contains secondary keyword when query has 2+ words
        if (qWords.length > 1 && hub.secondaryKeywords && hub.secondaryKeywords.length > 0) {
            const hasSec = hub.secondaryKeywords.some((sk) =>
                qWords.some((qw) => qw.includes(sk) || sk.includes(qw))
            );
            if (!hasSec) continue;
        }

        matches.push({ label: hub.address, latitude: hub.lat, longitude: hub.lng });
    }

    return matches;
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
 * Call Mapbox Search Box Forward API
 * Supports POIs (Airports, Stations, Hotels, etc.) & Street Addresses with typo tolerance.
 */
async function callSearchBoxApi(searchText: string, accessToken: string): Promise<GeocodingResult[]> {
    const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward');
    url.searchParams.set('q', searchText);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('language', 'fr');
    url.searchParams.set('country', 'fr,ch');
    url.searchParams.set('limit', '10');
    url.searchParams.set(
        'proximity',
        `${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lng},${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lat}`
    );

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Mapbox Search Box API error (${response.status})`);
    }

    const data = await response.json();
    const features: SearchBoxFeature[] = Array.isArray(data.features) ? data.features : [];

    const isAirportQuery = /airpo?rt|aeroport|gva|lys/i.test(searchText);

    const airportItems: GeocodingResult[] = [];
    const regularItems: GeocodingResult[] = [];

    for (const f of features) {
        const p = f.properties;
        const name = p.name || '';
        const full = p.full_address || '';
        const place = p.place_formatted || '';
        const cat = Array.isArray(p.poi_category) ? p.poi_category.join(' ') : '';

        // Ignore rental / apartment spam & competitor taxi ads
        const isSpam = /apartment|cosy flat|villa close to|chambre|one-bedroom|taxi |transferts|fly'vtc/i.test(name);
        if (isSpam) continue;

        const isAirportFeature =
            /a[ée]roport|terminal|airport/i.test(name) || /a[ée]roport|terminal/i.test(cat);

        // Build clean readable address label
        let label = '';
        if (p.feature_type === 'poi') {
            label = name;
            if (place && !name.toLowerCase().includes(place.toLowerCase())) {
                label += `, ${place}`;
            }
        } else if (full) {
            label = full;
        } else if (name && place) {
            label = `${name}, ${place}`;
        } else {
            label = name || place || 'Adresse inconnue';
        }

        const coords = p.coordinates ?? {
            longitude: f.geometry.coordinates[0],
            latitude: f.geometry.coordinates[1],
        };

        const item: GeocodingResult = {
            label,
            latitude: coords.latitude,
            longitude: coords.longitude,
        };

        if (isAirportFeature) {
            airportItems.push(item);
        } else {
            // When user specifically searched for an airport, suppress broad city/region results (e.g. "Genève, canton de Genève")
            if (isAirportQuery && (p.feature_type === 'place' || p.feature_type === 'region')) {
                continue;
            }
            regularItems.push(item);
        }
    }

    return [...airportItems, ...regularItems];
}

/**
 * Fallback to Mapbox Geocoding v6 (forward) if Search Box API fails
 */
async function callGeocodingV6Api(searchText: string, accessToken: string): Promise<GeocodingResult[]> {
    const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
    url.searchParams.set('q', searchText);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('language', 'fr');
    url.searchParams.set('country', 'fr,ch');
    url.searchParams.set('limit', '6');
    url.searchParams.set('autocomplete', 'true');
    url.searchParams.set(
        'proximity',
        `${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lng},${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lat}`
    );

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Mapbox Geocoding API error (${response.status})`);
    }

    const data = await response.json();
    const features: GeocodingV6Feature[] = Array.isArray(data.features) ? data.features : [];

    return features.map((feature) => {
        const coords = feature.properties.coordinates ?? {
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
        };

        return {
            label:
                feature.properties.full_address ||
                feature.properties.place_formatted ||
                feature.properties.name ||
                'Adresse inconnue',
            latitude: coords.latitude,
            longitude: coords.longitude,
        };
    });
}

/**
 * Search for addresses & POIs using Mapbox
 * Features:
 * 1. Curated hub prioritization (Geneva Airport, Lyon Airport, Gares, etc.)
 * 2. Search Box API v1 for POI (Airports, Terminals, Hotels) & address resolution
 * 3. Fallback to Geocoding v6
 * 4. Spam filtering and 1-hour caching
 *
 * @param searchText - Address or POI search query
 * @returns Array of geocoding results (max 6)
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

    const accessToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }

    try {
        // 1. Get priority hub matches
        const priorityMatches = matchPriorityHubs(trimmed);

        // 2. Query Mapbox Search Box API (or fallback to Geocoding v6)
        let apiResults: GeocodingResult[] = [];
        try {
            apiResults = await callSearchBoxApi(trimmed, accessToken);
        } catch (searchBoxErr) {
            console.warn('Mapbox Search Box API failed, falling back to Geocoding v6:', searchBoxErr);
            apiResults = await callGeocodingV6Api(trimmed, accessToken);
        }

        // 3. Deduplicate and merge results (priority hubs first)
        const merged: GeocodingResult[] = [];
        const seenLabels = new Set<string>();

        const normalizeLabelForDedup = (label: string) =>
            label
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]/g, '');

        for (const item of [...priorityMatches, ...apiResults]) {
            const key = normalizeLabelForDedup(item.label);
            if (!seenLabels.has(key)) {
                seenLabels.add(key);
                merged.push(item);
            }
        }

        const finalResults = merged.slice(0, 6);
        storeInCache(trimmed, finalResults);
        return finalResults;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Recherche d'adresse temporairement indisponible. ${error.message}`);
        }
        throw new Error("Recherche d'adresse temporairement indisponible.");
    }
}

/**
 * Clear the geocoding cache (useful for testing)
 */
export function clearGeocodeCache(): void {
    geocodeCache.clear();
}
