import { db } from '@/lib/db';
import { companySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { VTC_DEPOT } from '@/lib/constants';

/**
 * Position du dépôt VTC (point de départ / retour de tous les calculs de distance).
 *
 * Stockée dans company_settings (clé `depot_location`, JSON) depuis l'admin
 * « Dépôt ». Sans valeur enregistrée, ou si la base est indisponible, on utilise
 * VTC_DEPOT de lib/constants.ts.
 */
export interface DepotLocation {
  address: string;
  lat: number;
  lng: number;
}

export const DEPOT_SETTING_KEY = 'depot_location';

export const DEFAULT_DEPOT: DepotLocation = {
  address: VTC_DEPOT.address,
  lat: VTC_DEPOT.lat,
  lng: VTC_DEPOT.lng,
};

/** Valide une position (adresse non vide, lat/lng réels dans les bornes). Retourne null si invalide. */
export function parseDepotLocation(value: unknown): DepotLocation | null {
  if (!value || typeof value !== 'object') return null;
  const { address, lat, lng } = value as Record<string, unknown>;
  if (typeof address !== 'string' || !address.trim() || address.length > 300) return null;
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  // 0,0 = coordonnées manquantes, jamais un vrai dépôt
  if (lat === 0 && lng === 0) return null;
  return { address: address.trim(), lat, lng };
}

/** Dépôt enregistré en base, ou null s'il n'y en a pas (lève une erreur si la base est indisponible). */
export async function getStoredDepot(): Promise<DepotLocation | null> {
  const rows = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.settingKey, DEPOT_SETTING_KEY))
    .limit(1);

  const raw = rows[0]?.settingValue;
  if (!raw) return null;
  try {
    const depot = parseDepotLocation(JSON.parse(raw));
    if (!depot) console.warn('[DEPOT] Valeur enregistrée invalide, dépôt par défaut utilisé');
    return depot;
  } catch {
    console.warn('[DEPOT] Valeur enregistrée illisible, dépôt par défaut utilisé');
    return null;
  }
}

let depotCache: DepotLocation | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 s (le cache est propre à chaque instance serveur)

/** Dépôt utilisé par la tarification (cache 30 s, dépôt par défaut si rien d'enregistré ou base indisponible). */
export async function getDepot(): Promise<DepotLocation> {
  const now = Date.now();
  if (depotCache && now - cacheTimestamp < CACHE_TTL) {
    return depotCache;
  }

  let depot = DEFAULT_DEPOT;
  try {
    depot = (await getStoredDepot()) ?? DEFAULT_DEPOT;
  } catch (error) {
    console.warn('[DEPOT] Lecture impossible, dépôt par défaut utilisé:', error);
  }

  depotCache = depot;
  cacheTimestamp = now;
  return depot;
}

/** Enregistre le dépôt et vide le cache pour que le prochain devis l'utilise. */
export async function saveDepot(depot: DepotLocation): Promise<void> {
  const value = JSON.stringify({ address: depot.address, lat: depot.lat, lng: depot.lng });
  await db
    .insert(companySettings)
    .values({
      settingKey: DEPOT_SETTING_KEY,
      settingValue: value,
      settingType: 'json',
      category: 'depot',
      description: 'Adresse et coordonnées GPS du dépôt VTC (point de départ des calculs de tarification)',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: companySettings.settingKey,
      set: {
        settingValue: value,
        updatedAt: new Date(),
      },
    });
  invalidateDepotCache();
}

export function invalidateDepotCache() {
  depotCache = null;
  cacheTimestamp = 0;
}
