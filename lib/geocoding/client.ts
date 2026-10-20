/**
 * Browser helpers for the address fields (reservation, admin).
 *
 * /api/geocoding/search returns either a ready place (coordinates known: curated hub,
 * Mapbox) or a Google suggestion (placeId only). resolvePlace() turns the picked
 * suggestion into coordinates; one "session" groups the keystrokes and that final
 * lookup so Google bills them together.
 */

export interface AddressSuggestion {
  label: string;
  lat: number | null;
  lng: number | null;
  placeId?: string;
}

let sessionToken: string | null = null;

function currentSession(): string {
  if (!sessionToken) {
    sessionToken =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return sessionToken;
}

/** Throws on HTTP error (and AbortError when aborted). */
export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const res = await fetch(
    `/api/geocoding/search?q=${encodeURIComponent(query)}&session=${encodeURIComponent(currentSession())}`,
    { signal }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'search failed');
  return Array.isArray(data.results)
    ? data.results.map((r: { label: string; latitude: number | null; longitude: number | null; placeId?: string }) => ({
        label: r.label,
        lat: r.latitude,
        lng: r.longitude,
        placeId: r.placeId,
      }))
    : [];
}

/** Coordinates of the picked suggestion; null if they cannot be found. Ends the session. */
export async function resolvePlace(s: AddressSuggestion): Promise<{ label: string; lat: number; lng: number } | null> {
  if (typeof s.lat === 'number' && typeof s.lng === 'number') return { label: s.label, lat: s.lat, lng: s.lng };
  if (!s.placeId) return null;

  const session = currentSession();
  sessionToken = null; // the next search starts a new session
  try {
    const res = await fetch(`/api/geocoding/place?id=${encodeURIComponent(s.placeId)}&session=${encodeURIComponent(session)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.latitude === 'number' && typeof data.longitude === 'number'
      ? { label: s.label, lat: data.latitude, lng: data.longitude }
      : null;
  } catch {
    return null;
  }
}
