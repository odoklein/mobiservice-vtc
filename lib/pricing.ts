// Pricing calculation utilities - Grille Tarifaire 2025/2026
// Unified pricing engine using CA/TP segmented calculation

import { isFrenchHoliday } from './holidays';
import { VTC_DEPOT } from './constants';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PricingInput {
  serviceType: 'transfer' | 'airport' | 'hourly' | 'business' | 'mda';

  // Trip type
  tripType?: 'one-way' | 'round-trip';

  // For CA/TP calculation (transfer service)
  distanceCA?: number; // Depot → Pickup (km)
  distanceTP?: number; // Pickup → Dropoff (km)
  distanceReturn?: number; // Dropoff → Depot (km)

  // Legacy distance (for airport/hourly services)
  distance?: number; // Total distance in km
  duration?: number; // in minutes

  // Hourly service
  hours?: number; // for hourly/business service

  // Airport service
  airportType?: 'lyon' | 'geneva';

  // Day/night determination
  pickupTime?: Date;

  // MDA
  waitingMinutes?: number;

  // Péages
  tollCost?: number; // Coût des péages (€ TTC) - x1 pour A/S, x2 pour A/R
}

export interface PricingResult {
  // Final pricing (ONLY these exposed to UI)
  totalPrice: number; // TTC
  totalPriceHT: number;
  tva: number;
  currency: string;

  // Rate metadata (for display)
  isNightRate: boolean;
  rateType: string;
  isForfait?: boolean;

  // Internal breakdown (NOT exposed to frontend UI)
  breakdown: {
    baseFare?: number;
    distanceCharge?: number;
    hourlyCharge?: number;
    waitingCharge?: number;
    forfaitApplied?: boolean;
    forfaitDiscount?: number;
    forfaitName?: string;
  };

  // Distance info (for admin/logs only)
  distance?: number;
  duration?: number;
}

// ============================================================================
// PRICING CONSTANTS - 2025/2026 TARIFF GRID
// Now loaded dynamically from database with fallback to hardcoded values
// ============================================================================

import { getPricingConfig, getPricingConfigSync } from './services/pricing-service';

const TVA_RATE = 0.10; // 10% TVA

// Export FORFAITS for display (loaded from dynamic config with fallback)
// Initialize with fallback values for immediate use
export let FORFAITS: Array<{ hours: number; maxKm: number; day: number; night: number }> = [
  { hours: 2, maxKm: 180, day: 232, night: 280 },
  { hours: 2.5, maxKm: 225, day: 290, night: 337.50 },
  { hours: 3, maxKm: 270, day: 348, night: 390 },
  { hours: 3.5, maxKm: 315, day: 406, night: 455 },
  { hours: 4, maxKm: 360, day: 464, night: 520 },
  { hours: 4.5, maxKm: 405, day: 522, night: 585 },
  { hours: 5, maxKm: 450, day: 580, night: 650 },
  { hours: 5.5, maxKm: 495, day: 638, night: 715 },
  { hours: 6, maxKm: 540, day: 660, night: 750 },
  { hours: 6.5, maxKm: 585, day: 715, night: 812.50 },
  { hours: 7, maxKm: 630, day: 735, night: 840 },
  { hours: 7.5, maxKm: 675, day: 787.50, night: 900 },
  { hours: 8, maxKm: 720, day: 840, night: 960 },
];

// Update FORFAITS from config when available (async, non-blocking)
// Only on server-side to avoid client-side database errors
if (typeof window === 'undefined') {
  getPricingConfig().then((config) => {
    FORFAITS = config.forfaits;
  }).catch(() => {
    // Keep fallback values if config fails to load
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine if pickup time qualifies for night rate
 * Night: 20h-7h OR Sunday OR French public holiday
 */
function isNightRate(date?: Date): boolean {
  if (!date) return false;

  const hours = date.getHours();
  const day = date.getDay();

  // Check time range (20h-7h)
  const isNightHours = hours >= 20 || hours < 7;

  // Check if Sunday
  const isSunday = day === 0;

  // Check French holidays
  const isHoliday = isFrenchHoliday(date);

  return isNightHours || isSunday || isHoliday;
}

/**
 * Determine distance bracket for tiered pricing
 */
function getDistanceBracket(totalDistanceRoundTrip: number): string {
  if (totalDistanceRoundTrip <= 25) return '0-25';
  if (totalDistanceRoundTrip <= 50) return '25-50';
  if (totalDistanceRoundTrip <= 75) return '50-75';
  if (totalDistanceRoundTrip <= 100) return '75-100';
  return '100+';
}

/**
 * Find best forfait for hourly services
 */
function findBestForfait(forfaits: Array<{ hours: number; maxKm: number; day: number; night: number }>, hours: number, km: number, isNight: boolean) {
  for (const forfait of forfaits) {
    if (hours <= forfait.hours && km <= forfait.maxKm) {
      return {
        ...forfait,
        price: isNight ? forfait.night : forfait.day,
      };
    }
  }
  // Return largest if exceeded
  const largest = forfaits[forfaits.length - 1];
  return {
    ...largest,
    price: isNight ? largest.night : largest.day,
  };
}

// ============================================================================
// MAIN PRICING CALCULATION
// ============================================================================

export async function calculatePrice(input: PricingInput): Promise<PricingResult> {
  // Check if we're on client-side
  if (typeof window !== 'undefined') {
    // Client-side: use sync version with fallback
    return calculatePriceSync(input);
  }
  // Server-side: try to load from database
  try {
    const config = await getPricingConfig();
    return calculatePriceWithConfig(input, config);
  } catch (error) {
    // Fallback to sync version if database fails
    console.warn('[PRICING] Database load failed, using fallback:', error);
    return calculatePriceSync(input);
  }
}

/**
 * Synchronous version using cached or fallback config
 */
export function calculatePriceSync(input: PricingInput): PricingResult {
  const config = getPricingConfigSync();
  return calculatePriceWithConfig(input, config);
}

function calculatePriceWithConfig(input: PricingInput, config: any): PricingResult {
  const night = isNightRate(input.pickupTime);
  const breakdown: PricingResult['breakdown'] = {};

  let totalPrice = 0;
  let rateType = night ? 'Tarif nuit (20h-7h + Dim/JF)' : 'Tarif jour (7h-20h sauf Dim/JF)';

  // ===== TRANSFER SERVICE (CA/TP Calculation) =====
  if (input.serviceType === 'transfer' && input.distanceCA !== undefined && input.distanceTP !== undefined && input.distanceReturn !== undefined) {
    const distanceCA = input.distanceCA;
    const distanceTP = input.distanceTP;
    // RÈGLE N°1: Le retour au dépôt est TOUJOURS inclus (même en A/S)
    const distanceReturn = input.distanceReturn;
    const totalDistanceRoundTrip = distanceCA + distanceTP + distanceReturn;
    const tripType = input.tripType || 'one-way';

    // Check for agglomeration forfait
    if (totalDistanceRoundTrip <= config.forfaitAgglomeration.thresholdKm) {
      totalPrice = night ? config.forfaitAgglomeration.night : config.forfaitAgglomeration.day;
      breakdown.forfaitApplied = true;
      breakdown.forfaitName = 'Forfait agglomération';
      rateType += ' (≤25km A/R)';
    } else {
      // Tiered pricing
      const rates = night ? config.nightRates : config.dayRates;
      const bracket = getDistanceBracket(totalDistanceRoundTrip);
      const pricePerKmCA = rates.caRates[bracket as keyof typeof rates.caRates];
      const pricePerKmTP = rates.tpRate;

      const costCA = distanceCA * pricePerKmCA;
      // RÈGLE: En A/R client, le TP est doublé
      const costTP = tripType === 'round-trip' ? distanceTP * pricePerKmTP * 2 : distanceTP * pricePerKmTP;
      // RÈGLE N°1: CA_retour est TOUJOURS inclus
      const costReturn = distanceReturn * pricePerKmCA;

      totalPrice = costCA + costTP + costReturn;
      breakdown.distanceCharge = totalPrice;
      rateType += ` (${bracket}km)`;
    }

    // Ajouter les péages (x1 pour A/S, x2 pour A/R)
    const tollCost = input.tollCost || 0;
    const finalTollCost = tripType === 'round-trip' ? tollCost * 2 : tollCost;
    totalPrice += finalTollCost;
  }

  // ===== AIRPORT SERVICE =====
  else if (input.serviceType === 'airport') {
    if (input.airportType === 'geneva') {
      totalPrice = night ? config.airportRates.geneva.night : config.airportRates.geneva.day;
    } else if (input.airportType === 'lyon') {
      totalPrice = night ? config.airportRates.lyon.night : config.airportRates.lyon.day;
    } else {
      totalPrice = night ? config.airportRates.geneva.night : config.airportRates.geneva.day;
    }
    rateType = 'Forfait aéroport';
  }

  // ===== HOURLY SERVICE (Mise à Disposition) =====
  else if (input.serviceType === 'hourly') {
    const requestedHours = input.hours || 2;
    
    // Find the matching forfait from the grid
    // Forfaits start at 2H, so always use the forfait system
    const forfait = findBestForfait(config.forfaits, requestedHours, requestedHours * 90, night);
    totalPrice = forfait.price;
    breakdown.forfaitApplied = true;
    breakdown.forfaitName = `Forfait ${forfait.hours}H`;
    rateType = `Mise à disposition ${forfait.hours}H`;
  }

  // ===== BUSINESS SERVICE =====
  else if (input.serviceType === 'business') {
    const estHours = input.hours || 4;
    const forfait = findBestForfait(config.forfaits, estHours, estHours * 90, night);
    totalPrice = forfait.price;
    breakdown.forfaitApplied = true;
    breakdown.forfaitName = `Forfait ${forfait.hours}H`;
    rateType = 'Forfait business';
  }

  // ===== MDA (Mise à Disposition) =====
  else if (input.serviceType === 'mda') {
    const waitingMinutes = input.waitingMinutes || 0;
    const chargeableMinutes = Math.max(0, waitingMinutes - config.mdaRates.freeMinutes);
    const minuteRate = night ? config.mdaRates.night : config.mdaRates.day;
    breakdown.waitingCharge = chargeableMinutes * minuteRate;
    totalPrice = breakdown.waitingCharge;
    rateType = 'Mise à disposition';
  }

  // ===== FALLBACK FOR LEGACY DISTANCE-BASED =====
  else if (input.distance) {
    // Use simple calculation for backward compatibility
    const distance = input.distance;
    const rate = night ? config.nightRates.tpRate : config.dayRates.tpRate;
    breakdown.distanceCharge = distance * rate;
    breakdown.baseFare = night ? config.forfaitAgglomeration.night : config.forfaitAgglomeration.day;
    totalPrice = (breakdown.baseFare || 0) + (breakdown.distanceCharge || 0);
  }

  // Apply minimum price
  totalPrice = Math.max(totalPrice, config.minPrice);

  // Calculate HT and TVA
  const totalPriceHT = Math.round((totalPrice / (1 + TVA_RATE)) * 100) / 100;
  const tva = Math.round((totalPrice - totalPriceHT) * 100) / 100;

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalPriceHT,
    tva,
    currency: 'EUR',
    isNightRate: night,
    rateType,
    isForfait: breakdown.forfaitApplied,
    breakdown,
    distance: input.distance || (input.distanceTP || 0),
    duration: input.duration,
  };
}


export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price);
}

