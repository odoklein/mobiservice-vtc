// Pricing calculation utilities - Grille Tarifaire 2025/2026

export interface PricingInput {
  serviceType: 'transfer' | 'airport' | 'hourly' | 'business' | 'mda';
  distance?: number; // in km
  duration?: number; // in minutes
  hours?: number; // for hourly service
  airportType?: 'lyon' | 'geneva';
  pickupTime?: Date; // to determine day/night rate
  isRoundTrip?: boolean; // aller-retour or one-way
  waitingMinutes?: number; // for MDA (mise à disposition)
}

export interface PricingResult {
  basePrice: number;
  distance?: number;
  duration?: number;
  breakdown: {
    baseFare?: number;
    distanceCharge?: number;
    timeCharge?: number;
    hourlyCharge?: number;
    forfaitApplied?: boolean;
    forfaitDiscount?: number;
    forfaitName?: string;
    waitingCharge?: number;
  };
  totalPrice: number;
  totalPriceHT: number;
  currency: string;
  isForfait?: boolean;
  isNightRate?: boolean;
  rateType?: string;
}

// TVA rate
const TVA_RATE = 0.10; // 10% TVA

// Check if it's night rate (20h-7h or Sunday/Holiday)
function isNightRate(date?: Date): boolean {
  if (!date) return false;
  const hours = date.getHours();
  const day = date.getDay();
  // Night: 20h-7h or Sunday (0)
  return hours >= 20 || hours < 7 || day === 0;
}

// Tariffs TTC (all prices include TVA)
const TARIFFS = {
  // Hourly base rate
  hourlyBase: { day: 33, night: 46.20 },
  
  // Per km rates
  agglomeration: { day: 1.65, night: 2.20 }, // up to 24km round trip
  horsAgglomeration: { day: 1.65, night: 2.20 }, // from 24km with client round trip
  horsAgglomerationOneWay: { day: 1.10, night: 1.65 }, // from 12km one way with client
  deplacement: { day: 1.10, night: 1.65 }, // empty vehicle from 12km
  
  // Forfaits (packages) TTC
  forfaits: [
    { hours: 3, maxKm: 270, day: 348, night: 390, hourlyDay: 116, hourlyNight: 130 },
    { hours: 4, maxKm: 360, day: 464, night: 520, hourlyDay: 116, hourlyNight: 130 },
    { hours: 5, maxKm: 450, day: 580, night: 650, hourlyDay: 116, hourlyNight: 130 },
    { hours: 6, maxKm: 540, day: 660, night: 750, hourlyDay: 110, hourlyNight: 125 },
    { hours: 7, maxKm: 630, day: 735, night: 812, hourlyDay: 105, hourlyNight: 116 },
    { hours: 8, maxKm: 720, day: 792, night: 880, hourlyDay: 99, hourlyNight: 110 },
  ],
  
  // Extra hour beyond forfait
  extraHour: { day: 116, night: 130 },
  
  // MDA (Mise à disposition) - per minute after 10 free minutes
  mda: { day: 1.20, night: 1.80, freeMinutes: 10 },
  
  // Agglomeration threshold
  agglomerationMaxKm: 24,
};

// Find best forfait for given hours/km
function findBestForfait(hours: number, km: number, isNight: boolean) {
  // Find the smallest forfait that covers the requirements
  for (const forfait of TARIFFS.forfaits) {
    if (hours <= forfait.hours && km <= forfait.maxKm) {
      return {
        ...forfait,
        price: isNight ? forfait.night : forfait.day,
        hourlyRate: isNight ? forfait.hourlyNight : forfait.hourlyDay,
      };
    }
  }
  // Return largest forfait if exceeded
  const largest = TARIFFS.forfaits[TARIFFS.forfaits.length - 1];
  return {
    ...largest,
    price: isNight ? largest.night : largest.day,
    hourlyRate: isNight ? largest.hourlyNight : largest.hourlyDay,
  };
}

export function calculatePrice(input: PricingInput): PricingResult {
  let totalPrice = 0;
  let totalPriceHT = 0;
  let isForfait = false;
  const breakdown: PricingResult['breakdown'] = {};
  
  const night = isNightRate(input.pickupTime);
  const distance = input.distance || 0;
  const hours = input.hours || 0;
  const durationHours = (input.duration || 0) / 60;
  
  let rateType = night ? 'Tarif nuit' : 'Tarif jour';

  switch (input.serviceType) {
    case 'transfer':
      // Determine rate based on distance and trip type
      if (distance <= TARIFFS.agglomerationMaxKm) {
        // Agglomeration rate
        const rate = night ? TARIFFS.agglomeration.night : TARIFFS.agglomeration.day;
        breakdown.distanceCharge = distance * rate;
        rateType += ' (agglomération)';
      } else if (input.isRoundTrip) {
        // Outside agglomeration, round trip
        const rate = night ? TARIFFS.horsAgglomeration.night : TARIFFS.horsAgglomeration.day;
        breakdown.distanceCharge = distance * rate;
        rateType += ' (hors agglo. A/R)';
      } else {
        // Outside agglomeration, one way
        const rate = night ? TARIFFS.horsAgglomerationOneWay.night : TARIFFS.horsAgglomerationOneWay.day;
        breakdown.distanceCharge = distance * rate;
        rateType += ' (hors agglo.)';
      }
      
      // Check if forfait is better value
      const estimatedHours = Math.max(durationHours, 1);
      if (distance >= 135 || estimatedHours >= 3) {
        const forfait = findBestForfait(Math.ceil(estimatedHours), distance, night);
        const forfaitPrice = forfait.price;
        
        if (forfaitPrice < (breakdown.distanceCharge || 0) + 50) {
          // Forfait is better value
          totalPrice = forfaitPrice;
          isForfait = true;
          breakdown.forfaitApplied = true;
          breakdown.forfaitName = `Forfait ${forfait.hours}H / ${forfait.maxKm}km`;
          breakdown.forfaitDiscount = (breakdown.distanceCharge || 0) - forfaitPrice + 50;
          breakdown.distanceCharge = undefined;
        }
      }
      
      if (!isForfait) {
        breakdown.baseFare = night ? 46.20 : 33; // Minimum prise en charge
        totalPrice = (breakdown.baseFare || 0) + (breakdown.distanceCharge || 0);
      }
      
      totalPrice = Math.max(totalPrice, night ? 46.20 : 33); // Minimum
      break;

    case 'airport':
      // Geneva is closer to Haute-Savoie
      if (input.airportType === 'geneva') {
        totalPrice = night ? 130 : 116; // ~1h
      } else if (input.airportType === 'lyon') {
        totalPrice = night ? 260 : 232; // ~2h
      } else {
        totalPrice = night ? 130 : 116;
      }
      rateType = 'Forfait aéroport';
      break;

    case 'hourly':
      const requestedHours = input.hours || 2;
      
      if (requestedHours >= 3) {
        // Use forfait pricing
        const forfait = findBestForfait(requestedHours, requestedHours * 90, night);
        totalPrice = forfait.price;
        
        // Add extra hours if beyond forfait
        if (requestedHours > forfait.hours) {
          const extraHours = requestedHours - forfait.hours;
          const extraRate = night ? TARIFFS.extraHour.night : TARIFFS.extraHour.day;
          breakdown.hourlyCharge = extraHours * extraRate;
          totalPrice += breakdown.hourlyCharge;
        }
        
        isForfait = true;
        breakdown.forfaitApplied = true;
        breakdown.forfaitName = `Forfait ${forfait.hours}H`;
        rateType = `Forfait ${forfait.hours}H`;
      } else {
        // Standard hourly rate
        const hourlyRate = night ? TARIFFS.hourlyBase.night : TARIFFS.hourlyBase.day;
        breakdown.hourlyCharge = requestedHours * hourlyRate;
        totalPrice = breakdown.hourlyCharge;
        totalPrice = Math.max(totalPrice, hourlyRate * 2); // Minimum 2 hours
      }
      break;

    case 'mda':
      // Mise à disposition - 10 min free, then per minute
      const waitingMinutes = input.waitingMinutes || 0;
      const chargeableMinutes = Math.max(0, waitingMinutes - TARIFFS.mda.freeMinutes);
      const minuteRate = night ? TARIFFS.mda.night : TARIFFS.mda.day;
      breakdown.waitingCharge = chargeableMinutes * minuteRate;
      totalPrice = breakdown.waitingCharge;
      rateType = 'Mise à disposition';
      break;

    case 'business':
      // Custom pricing based on estimated needs
      const estHours = input.hours || 4;
      const forfait = findBestForfait(estHours, estHours * 90, night);
      totalPrice = forfait.price;
      isForfait = true;
      breakdown.forfaitApplied = true;
      breakdown.forfaitName = `Forfait ${forfait.hours}H`;
      rateType = 'Forfait business';
      break;
  }

  // Calculate HT from TTC
  totalPriceHT = Math.round((totalPrice / (1 + TVA_RATE)) * 100) / 100;

  return {
    basePrice: totalPrice,
    distance: input.distance,
    duration: input.duration,
    breakdown,
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalPriceHT,
    currency: 'EUR',
    isForfait,
    isNightRate: night,
    rateType,
  };
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price);
}

