/**
 * Minimum booking lead time based on CA Aller (depot → pickup) distance.
 * Client spec: 0-30km = 1h, then brackets up to 900km = 14h.
 */

export interface CALeadTimeResult {
  /** CA Aller distance in km */
  distanceKm: number;
  /** Minimum lead time in minutes */
  leadTimeMinutes: number;
  /** Minimum lead time in hours (for display) */
  leadTimeHours: number;
}

/** Bracket: [minKm, maxKm] → lead time in minutes */
const BRACKETS: Array<{ minKm: number; maxKm: number; minutes: number }> = [
  { minKm: 0, maxKm: 30, minutes: 60 },
  { minKm: 30, maxKm: 60, minutes: 90 },
  { minKm: 60, maxKm: 90, minutes: 120 },
  { minKm: 90, maxKm: 120, minutes: 150 },
  { minKm: 120, maxKm: 150, minutes: 180 },
  // +30 min per 40 km: 150-190, 190-230, ...
  { minKm: 150, maxKm: 190, minutes: 210 },
  { minKm: 190, maxKm: 230, minutes: 240 },
  { minKm: 230, maxKm: 270, minutes: 270 },
  { minKm: 270, maxKm: 310, minutes: 300 },
  { minKm: 310, maxKm: 350, minutes: 330 },
  { minKm: 350, maxKm: 390, minutes: 360 },
  // +30 min per 30 km: 390-420, 420-450, ... up to 900 → 14h = 840 min
  { minKm: 390, maxKm: 420, minutes: 360 },
  { minKm: 420, maxKm: 450, minutes: 390 },
  { minKm: 450, maxKm: 480, minutes: 420 },
  { minKm: 480, maxKm: 510, minutes: 450 },
  { minKm: 510, maxKm: 540, minutes: 480 },
  { minKm: 540, maxKm: 570, minutes: 510 },
  { minKm: 570, maxKm: 600, minutes: 540 },
  { minKm: 600, maxKm: 630, minutes: 570 },
  { minKm: 630, maxKm: 660, minutes: 600 },
  { minKm: 660, maxKm: 690, minutes: 630 },
  { minKm: 690, maxKm: 720, minutes: 660 },
  { minKm: 720, maxKm: 750, minutes: 690 },
  { minKm: 750, maxKm: 780, minutes: 720 },
  { minKm: 780, maxKm: 810, minutes: 750 },
  { minKm: 810, maxKm: 840, minutes: 780 },
  { minKm: 840, maxKm: 870, minutes: 810 },
  { minKm: 870, maxKm: 900, minutes: 840 },
  { minKm: 900, maxKm: Infinity, minutes: 840 }, // 14h max
];

/**
 * Get minimum lead time (in minutes) for a given CA Aller distance.
 */
export function getMinimumLeadTimeForCA(caAllerKm: number): CALeadTimeResult {
  const km = Math.max(0, caAllerKm);
  for (const b of BRACKETS) {
    if (km >= b.minKm && km < b.maxKm) {
      return {
        distanceKm: km,
        leadTimeMinutes: b.minutes,
        leadTimeHours: Math.round((b.minutes / 60) * 10) / 10,
      };
    }
  }
  return {
    distanceKm: km,
    leadTimeMinutes: 840,
    leadTimeHours: 14,
  };
}

/**
 * Returns the earliest pickup datetime the client can choose (now + lead time).
 */
export function getEarliestPickupDateTime(caAllerKm: number): Date {
  const { leadTimeMinutes } = getMinimumLeadTimeForCA(caAllerKm);
  const d = new Date();
  d.setMinutes(d.getMinutes() + leadTimeMinutes);
  return d;
}
