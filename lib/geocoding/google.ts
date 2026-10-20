/**
 * Google Places API (New) — autocomplete for addresses AND establishments
 * (hospitals, clinics, hotels, schools, shops…), the same data Uber relies on.
 * Server-side only: the key never reaches the browser.
 *
 * Flow (Google "session" pricing):
 *  1. autocomplete() on each keystroke → suggestions with a placeId, no coordinates;
 *  2. placeLocation() once, when the customer picks a suggestion → coordinates.
 * Both calls share the same sessionToken, so the keystrokes are billed as one session.
 */

import { HAUTE_SAVOIE_AUTOCOMPLETE_BIAS } from '@/lib/constants';

const API = 'https://places.googleapis.com/v1';

export function getGoogleApiKey(): string | null {
    return process.env.GOOGLE_MAPS_API_KEY || null;
}

export interface GooglePrediction {
    label: string;
    placeId: string;
}

interface AutocompleteResponse {
    suggestions?: Array<{
        placePrediction?: {
            placeId: string;
            text?: { text: string };
            structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
        };
    }>;
}

export async function googleAutocomplete(input: string, sessionToken?: string): Promise<GooglePrediction[]> {
    const key = getGoogleApiKey();
    if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

    const response = await fetch(`${API}/places:autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify({
            input,
            ...(sessionToken && { sessionToken }),
            languageCode: 'fr',
            includedRegionCodes: ['fr', 'ch'],
            // Bias (not restriction) towards Haute-Savoie; 50 km is the API maximum
            locationBias: {
                circle: {
                    center: {
                        latitude: HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lat,
                        longitude: HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lng,
                    },
                    radius: 50_000,
                },
            },
        }),
    });
    if (!response.ok) {
        throw new Error(`Google Places autocomplete error (${response.status}): ${await response.text()}`);
    }

    const data: AutocompleteResponse = await response.json();
    const predictions: GooglePrediction[] = [];
    for (const s of data.suggestions ?? []) {
        const p = s.placePrediction;
        if (!p?.placeId) continue;
        const main = p.structuredFormat?.mainText?.text;
        const secondary = p.structuredFormat?.secondaryText?.text;
        const label = main ? (secondary ? `${main}, ${secondary}` : main) : p.text?.text;
        if (label) predictions.push({ label, placeId: p.placeId });
    }
    return predictions;
}

/** Coordinates of a picked suggestion (Place Details, "location" field only = cheapest tier). */
export async function googlePlaceLocation(
    placeId: string,
    sessionToken?: string
): Promise<{ latitude: number; longitude: number } | null> {
    const key = getGoogleApiKey();
    if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

    const url = new URL(`${API}/places/${encodeURIComponent(placeId)}`);
    if (sessionToken) url.searchParams.set('sessionToken', sessionToken);

    const response = await fetch(url.toString(), {
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'location' },
    });
    if (!response.ok) {
        throw new Error(`Google Place Details error (${response.status}): ${await response.text()}`);
    }

    const data: { location?: { latitude: number; longitude: number } } = await response.json();
    return data.location ?? null;
}
