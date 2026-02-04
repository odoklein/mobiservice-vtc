/**
 * Immobilisation MAD (Mise à disposition) for A/R with return 1–3 days after.
 * Grid: total distance (CA Aller + TP + CA Retour) + return day → minutes and € TTC (27€/15min after 15 min free).
 */

export type ReturnDaysAfter = 1 | 2 | 3;

export interface ImmobilisationMADResult {
  /** Total minutes of immobilisation (including 15 free) */
  totalMinutes: number;
  /** Chargeable 15-min blocks (after 15 min free) */
  chargeableBlocks15: number;
  /** Price TTC (27 € per 15 min block) */
  priceTTC: number;
  /** Human label e.g. "75 min (27€ × 4 = 108€)" */
  label: string;
}

/** 27 € TTC per 15 min (immobilisation MAD, no day/night) */
const PRICE_PER_15MIN = 27;
const FREE_MINUTES = 15;

/**
 * Get immobilisation MAD minutes and price from total distance and return day.
 * Total = CA Aller + TP + CA Retour (for A/R this is CA_aller + TP*2 + CA_retour).
 */
export function getImmobilisationMAD(
  totalDistanceKm: number,
  returnDaysAfter: ReturnDaysAfter
): ImmobilisationMADResult {
  let totalMinutes: number;
  if (totalDistanceKm < 25) {
    // Block: suggest forfait agglomération (caller should block A/R 1-3 days)
    totalMinutes = 0;
  } else if (totalDistanceKm < 150) {
    totalMinutes = 15; // 15 min = free only
  } else if (totalDistanceKm < 200) {
    totalMinutes = 30; // 30 - 15 = 15 min chargeable = 1 block
    if (returnDaysAfter === 1) totalMinutes = 30;
    else if (returnDaysAfter === 2) totalMinutes = 30;
    else totalMinutes = 30;
  } else if (totalDistanceKm < 250) {
    if (returnDaysAfter === 1) totalMinutes = 45;
    else if (returnDaysAfter === 2) totalMinutes = 60;
    else totalMinutes = 75;
  } else {
    if (returnDaysAfter === 1) totalMinutes = 75;
    else if (returnDaysAfter === 2) totalMinutes = 90;
    else totalMinutes = 105;
  }

  const chargeableMinutes = Math.max(0, totalMinutes - FREE_MINUTES);
  const chargeableBlocks15 = Math.ceil(chargeableMinutes / 15);
  const priceTTC = chargeableBlocks15 * PRICE_PER_15MIN;
  const label =
    chargeableBlocks15 === 0
      ? `${totalMinutes} min (gratuit)`
      : `${totalMinutes} min (27€ × ${chargeableBlocks15} = ${priceTTC}€ TTC)`;

  return {
    totalMinutes,
    chargeableBlocks15,
    priceTTC,
    label,
  };
}

/** Check if A/R 1–3 days is allowed (total >= 25 km). */
export function isAR13DaysAllowed(totalDistanceKm: number): boolean {
  return totalDistanceKm >= 25;
}
