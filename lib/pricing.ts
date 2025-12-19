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
// ============================================================================

const TVA_RATE = 0.10; // 10% TVA

// Agglomeration forfait
const FORFAIT_AGGLOMERATION_THRESHOLD_KM = 25; // ≤ 25km A/R
const FORFAIT_AGGLOMERATION_DAY = 33.00; // 33€ TTC jour
const FORFAIT_AGGLOMERATION_NIGHT = 47.50; // 47,50€ TTC nuit

// Tarifs JOUR (7h-20h sauf dimanche/jours fériés)
const DAY_RATES = {
  TP_RATE: 1.32, // Prix au km pour TP (constant)
  CA_RATES: {
    '0-25': 1.32,    // Forfait agglomération
    '25-50': 1.32,   // > 25km jusqu'à 50km
    '50-75': 1.10,   // > 50km jusqu'à 75km
    '75-100': 0.90,  // > 75km jusqu'à 100km
    '100+': 0.70,    // > 100km
  },
};

// Tarifs NUIT (20h-7h + dimanche/jours fériés)
const NIGHT_RATES = {
  TP_RATE: 1.90, // Prix au km pour TP (constant)
  CA_RATES: {
    '0-25': 1.90,    // Forfait agglomération
    '25-50': 1.70,   // > 25km jusqu'à 50km
    '50-75': 1.40,   // > 50km jusqu'à 75km
    '75-100': 1.10,  // > 75km jusqu'à 100km
    '100+': 0.70,    // > 100km
  },
};

// Forfaits (hourly packages) TTC - Grille 2026
const FORFAITS = [
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

// Export for display
export { FORFAITS };

// MDA (Mise à disposition) - per minute after 10 free minutes
const MDA_RATES = { day: 1.20, night: 1.80, freeMinutes: 10 };

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
function findBestForfait(hours: number, km: number, isNight: boolean) {
  for (const forfait of FORFAITS) {
    if (hours <= forfait.hours && km <= forfait.maxKm) {
      return {
        ...forfait,
        price: isNight ? forfait.night : forfait.day,
      };
    }
  }
  // Return largest if exceeded
  const largest = FORFAITS[FORFAITS.length - 1];
  return {
    ...largest,
    price: isNight ? largest.night : largest.day,
  };
}

// ============================================================================
// MAIN PRICING CALCULATION
// ============================================================================

export function calculatePrice(input: PricingInput): PricingResult {
  const night = isNightRate(input.pickupTime);
  const breakdown: PricingResult['breakdown'] = {};

  let totalPrice = 0;
  let rateType = night ? 'Tarif nuit (20h-7h + Dim/JF)' : 'Tarif jour (7h-20h sauf Dim/JF)';

  // ===== TRANSFER SERVICE (CA/TP Calculation) =====
  if (input.serviceType === 'transfer' && input.distanceCA !== undefined && input.distanceTP !== undefined && input.distanceReturn !== undefined) {
    const distanceCA = input.distanceCA;
    const distanceTP = input.distanceTP;
    const distanceReturn = input.distanceReturn;
    const totalDistanceRoundTrip = distanceCA + distanceTP + distanceReturn;

    // Check for agglomeration forfait
    if (totalDistanceRoundTrip <= FORFAIT_AGGLOMERATION_THRESHOLD_KM) {
      totalPrice = night ? FORFAIT_AGGLOMERATION_NIGHT : FORFAIT_AGGLOMERATION_DAY;
      breakdown.forfaitApplied = true;
      breakdown.forfaitName = 'Forfait agglomération';
      rateType += ' (≤25km A/R)';
    } else {
      // Tiered pricing
      const rates = night ? NIGHT_RATES : DAY_RATES;
      const bracket = getDistanceBracket(totalDistanceRoundTrip);
      const pricePerKmCA = rates.CA_RATES[bracket as keyof typeof rates.CA_RATES];
      const pricePerKmTP = rates.TP_RATE;

      const costCA = distanceCA * pricePerKmCA;
      const costTP = distanceTP * pricePerKmTP;
      const costReturn = distanceReturn * pricePerKmCA;

      totalPrice = costCA + costTP + costReturn;
      breakdown.distanceCharge = totalPrice;
      rateType += ` (${bracket}km)`;
    }
  }

  // ===== AIRPORT SERVICE =====
  else if (input.serviceType === 'airport') {
    if (input.airportType === 'geneva') {
      totalPrice = night ? 130 : 116;
    } else if (input.airportType === 'lyon') {
      totalPrice = night ? 260 : 232;
    } else {
      totalPrice = night ? 130 : 116;
    }
    rateType = 'Forfait aéroport';
  }

  // ===== HOURLY SERVICE (Mise à Disposition) =====
  else if (input.serviceType === 'hourly') {
    const requestedHours = input.hours || 2;
    
    // Find the matching forfait from the grid
    // Forfaits start at 2H, so always use the forfait system
    const forfait = findBestForfait(requestedHours, requestedHours * 90, night);
    totalPrice = forfait.price;
    breakdown.forfaitApplied = true;
    breakdown.forfaitName = `Forfait ${forfait.hours}H`;
    rateType = `Mise à disposition ${forfait.hours}H`;
  }

  // ===== BUSINESS SERVICE =====
  else if (input.serviceType === 'business') {
    const estHours = input.hours || 4;
    const forfait = findBestForfait(estHours, estHours * 90, night);
    totalPrice = forfait.price;
    breakdown.forfaitApplied = true;
    breakdown.forfaitName = `Forfait ${forfait.hours}H`;
    rateType = 'Forfait business';
  }

  // ===== MDA (Mise à Disposition) =====
  else if (input.serviceType === 'mda') {
    const waitingMinutes = input.waitingMinutes || 0;
    const chargeableMinutes = Math.max(0, waitingMinutes - MDA_RATES.freeMinutes);
    const minuteRate = night ? MDA_RATES.night : MDA_RATES.day;
    breakdown.waitingCharge = chargeableMinutes * minuteRate;
    totalPrice = breakdown.waitingCharge;
    rateType = 'Mise à disposition';
  }

  // ===== FALLBACK FOR LEGACY DISTANCE-BASED =====
  else if (input.distance) {
    // Use simple calculation for backward compatibility
    const distance = input.distance;
    const rate = night ? 1.90 : 1.32;
    breakdown.distanceCharge = distance * rate;
    breakdown.baseFare = night ? 46.20 : 33;
    totalPrice = (breakdown.baseFare || 0) + (breakdown.distanceCharge || 0);
  }

  // Apply minimum price
  totalPrice = Math.max(totalPrice, FORFAIT_AGGLOMERATION_DAY);

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

