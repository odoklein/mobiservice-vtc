/**
 * French Toll (Péage) Detection and Cost Calculation Service
 * Uses Google Maps Directions API to detect toll roads and estimate costs
 */

interface TollResult {
    hasTolls: boolean;
    estimatedCost: number; // in EUR
    tollSections: string[];
    confidence: 'high' | 'medium' | 'low';
}

interface RouteSegment {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
}

/**
 * Common French toll roads and their approximate costs
 * Based on 2026 rates for lightweight vehicles (Class 1)
 */
const FRENCH_TOLL_DATABASE = {
    // A40 - Route des Alpes (Haute-Savoie)
    'A40_CLUSES_GENEVE': { distance: 68, cost: 8.90 },
    'A40_ANNECY_GENEVE': { distance: 45, cost: 6.20 },
    'A40_ANNECY_CHAMONIX': { distance: 85, cost: 11.40 },

    // A41 - Annecy - Lyon
    'A41_ANNECY_CHAMBERY': { distance: 45, cost: 6.20 },
    'A41_ANNECY_LYON': { distance: 135, cost: 17.80 },

    // A43 - Lyon to Chambéry/Modane
    'A43_LYON_CHAMBERY': { distance: 105, cost: 14.10 },

    // A6/A7 - Lyon to south
    'A6_LYON_VALENCE': { distance: 100, cost: 13.40 },

    // Default rate: approximately 0.13€/km for autoroutes
    DEFAULT_RATE_PER_KM: 0.13,
};

/**
 * Detect if route uses toll roads via Google Maps Directions API
 */
async function detectTollsViaGoogleMaps(segment: RouteSegment): Promise<TollResult> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('[TOLL] Google Maps API key not configured');
        return { hasTolls: false, estimatedCost: 0, tollSections: [], confidence: 'low' };
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
        url.searchParams.set('origin', `${segment.origin.lat},${segment.origin.lng}`);
        url.searchParams.set('destination', `${segment.destination.lat},${segment.destination.lng}`);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('language', 'fr');
        url.searchParams.set('alternatives', 'false');

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Google Directions API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
            return { hasTolls: false, estimatedCost: 0, tollSections: [], confidence: 'low' };
        }

        const route = data.routes[0];
        const legs = route.legs || [];

        let hasTolls = false;
        const tollSections: string[] = [];

        // Check route summary for toll indicators
        const summary = route.summary?.toLowerCase() || '';
        const tollKeywords = ['a40', 'a41', 'a43', 'a6', 'a7', 'péage', 'autoroute'];

        for (const keyword of tollKeywords) {
            if (summary.includes(keyword)) {
                hasTolls = true;
                if (keyword.startsWith('a')) {
                    tollSections.push(keyword.toUpperCase());
                }
            }
        }

        // Check individual steps for toll road indicators
        for (const leg of legs) {
            for (const step of leg.steps || []) {
                const instructions = step.html_instructions?.toLowerCase() || '';
                const maneuver = step.maneuver?.toLowerCase() || '';

                if (instructions.includes('péage') || instructions.includes('autoroute') ||
                    maneuver.includes('toll') || instructions.match(/a\d{1,2}/)) {
                    hasTolls = true;
                }
            }
        }

        // If tolls detected, estimate cost
        let estimatedCost = 0;
        if (hasTolls && legs.length > 0) {
            const totalDistanceKm = legs.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) / 1000;

            // Try to match known toll routes
            estimatedCost = estimateTollCostByRoute(tollSections, totalDistanceKm);

            if (estimatedCost === 0 && totalDistanceKm > 0) {
                // Fallback: use default rate if on autoroute
                estimatedCost = Math.round(totalDistanceKm * FRENCH_TOLL_DATABASE.DEFAULT_RATE_PER_KM * 100) / 100;
            }
        }

        return {
            hasTolls,
            estimatedCost,
            tollSections,
            confidence: hasTolls ? 'medium' : 'high',
        };

    } catch (error) {
        console.error('[TOLL] Detection error:', error);
        return { hasTolls: false, estimatedCost: 0, tollSections: [], confidence: 'low' };
    }
}

/**
 * Estimate toll cost based on detected autoroute sections
 */
function estimateTollCostByRoute(tollSections: string[], distanceKm: number): number {
    // Check if route matches known toll segments
    const routeKey = tollSections.join('_');

    // Common Haute-Savoie routes
    if (routeKey.includes('A40')) {
        if (distanceKm >= 80) return 11.40; // Annecy-Chamonix range
        if (distanceKm >= 60) return 8.90;  // Cluses-Geneva range
        if (distanceKm >= 40) return 6.20;  // Annecy-Geneva range
    }

    if (routeKey.includes('A41')) {
        if (distanceKm >= 120) return 17.80; // Annecy-Lyon
        if (distanceKm >= 40) return 6.20;   // Annecy-Chambéry
    }

    if (routeKey.includes('A43')) {
        if (distanceKm >= 100) return 14.10; // Lyon-Chambéry
    }

    // Default calculation
    return 0;
}

/**
 * Calculate toll cost for VTC trip
 * 
 * RÈGLE IMPORTANTE: Les péages ne sont comptés QUE lorsque le client est dans le véhicule
 * - ✅ Pickup → Dropoff : PÉAGES COMPTÉS (client dans le véhicule)
 * - ❌ Depot → Pickup : PAS de péages (chauffeur seul)
 * - ❌ Dropoff → Depot : PAS de péages (chauffeur seul - retour à vide)
 * 
 * Cela signifie que seul le trajet principal (TP) est facturé avec péages.
 * Le chauffeur absorbe les coûts de péages pour les trajets CA.
 */
export async function calculateTollForTrip(params: {
    depot: { lat: number; lng: number };
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
    tripType: 'one-way' | 'round-trip';
}): Promise<{
    tollCost: number; // Cost for one-way (will be multiplied by 2 for round-trip in pricing)
    tollCostOneWay: number; // Always the single direction cost
    hasTolls: boolean;
    details: string;
    segments: {
        mainTrip: { hasTolls: boolean; cost: number; sections: string[] };
        depotToPickup: { hasTolls: boolean; cost: number; sections: string[]; note: string };
        dropoffToDepot: { hasTolls: boolean; cost: number; sections: string[]; note: string };
    };
}> {
    try {
        console.log('[TOLL] Détection des péages - UNIQUEMENT sur trajet client (pickup → dropoff)');

        // ✅ SEUL SEGMENT FACTURÉ: Pickup → Dropoff (le client est dans le véhicule)
        const mainTripSegment = await detectTollsViaGoogleMaps({
            origin: params.pickup,
            destination: params.dropoff,
        });

        // ❌ Depot → Pickup (chauffeur seul - NON FACTURÉ au client)
        const depotToPickupSegment = await detectTollsViaGoogleMaps({
            origin: params.depot,
            destination: params.pickup,
        });

        // ❌ Dropoff → Depot (chauffeur seul - NON FACTURÉ au client)
        const dropoffToDepotSegment = await detectTollsViaGoogleMaps({
            origin: params.dropoff,
            destination: params.depot,
        });

        // SEUL le trajet principal est facturé
        const billableTollCost = mainTripSegment.estimatedCost;
        const hasTolls = mainTripSegment.hasTolls;

        // Construire le détail pour l'affichage
        let details = '';
        if (hasTolls) {
            const sections = mainTripSegment.tollSections;
            details = `🚗 Péages trajet client: ${sections.join(', ') || 'Autoroute'} - ${billableTollCost.toFixed(2)}€`;
        } else {
            details = 'Pas de péage sur le trajet client';
        }

        // Info pour logs de debug
        console.log('[TOLL] Résultat détection:', {
            trajetClientFacture: {
                hasTolls: mainTripSegment.hasTolls,
                cost: mainTripSegment.estimatedCost,
                sections: mainTripSegment.tollSections,
            },
            trajetsNonFactures: {
                depotVersPickup: {
                    hasTolls: depotToPickupSegment.hasTolls,
                    cost: depotToPickupSegment.estimatedCost,
                    note: 'NON FACTURÉ - chauffeur seul',
                },
                dropoffVersDepot: {
                    hasTolls: dropoffToDepotSegment.hasTolls,
                    cost: dropoffToDepotSegment.estimatedCost,
                    note: 'NON FACTURÉ - chauffeur seul (retour à vide)',
                },
            },
        });

        return {
            tollCost: Math.round(billableTollCost * 100) / 100,
            tollCostOneWay: Math.round(billableTollCost * 100) / 100,
            hasTolls,
            details,
            segments: {
                mainTrip: {
                    hasTolls: mainTripSegment.hasTolls,
                    cost: mainTripSegment.estimatedCost,
                    sections: mainTripSegment.tollSections,
                },
                depotToPickup: {
                    hasTolls: depotToPickupSegment.hasTolls,
                    cost: depotToPickupSegment.estimatedCost,
                    sections: depotToPickupSegment.tollSections,
                    note: 'NON FACTURÉ - chauffeur seul',
                },
                dropoffToDepot: {
                    hasTolls: dropoffToDepotSegment.hasTolls,
                    cost: dropoffToDepotSegment.estimatedCost,
                    sections: dropoffToDepotSegment.tollSections,
                    note: 'NON FACTURÉ - retour à vide',
                },
            },
        };

    } catch (error) {
        console.error('[TOLL] Erreur de calcul:', error);
        return {
            tollCost: 0,
            tollCostOneWay: 0,
            hasTolls: false,
            details: 'Erreur lors de la détection des péages',
            segments: {
                mainTrip: { hasTolls: false, cost: 0, sections: [] },
                depotToPickup: { hasTolls: false, cost: 0, sections: [], note: 'NON FACTURÉ' },
                dropoffToDepot: { hasTolls: false, cost: 0, sections: [], note: 'NON FACTURÉ' },
            },
        };
    }
}

/**
 * Simplified toll estimation for common routes (no API call needed)
 */
export function estimateTollByDistance(distanceKm: number, useAutoroute: boolean = true): number {
    if (!useAutoroute || distanceKm < 10) return 0;

    // Conservative estimate: 0.13€/km for autoroutes
    return Math.round(distanceKm * FRENCH_TOLL_DATABASE.DEFAULT_RATE_PER_KM * 100) / 100;
}
