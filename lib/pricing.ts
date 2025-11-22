// Pricing calculation utilities

export interface PricingInput {
  serviceType: 'transfer' | 'airport' | 'hourly' | 'business';
  distance?: number; // in km
  duration?: number; // in minutes
  hours?: number; // for hourly service
  airportType?: 'lyon' | 'geneva';
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
  };
  totalPrice: number;
  currency: string;
}

export function calculatePrice(input: PricingInput): PricingResult {
  let basePrice = 0;
  let totalPrice = 0;
  const breakdown: PricingResult['breakdown'] = {};

  switch (input.serviceType) {
    case 'transfer':
      breakdown.baseFare = 10;
      breakdown.distanceCharge = (input.distance || 0) * 2;
      totalPrice = breakdown.baseFare + breakdown.distanceCharge;
      totalPrice = Math.max(totalPrice, 30); // Minimum 30€
      basePrice = totalPrice;
      break;

    case 'airport':
      if (input.airportType === 'lyon') {
        totalPrice = 80;
      } else if (input.airportType === 'geneva') {
        totalPrice = 150;
      } else {
        totalPrice = 80; // default
      }
      basePrice = totalPrice;
      break;

    case 'hourly':
      const hours = input.hours || 2;
      breakdown.hourlyCharge = hours * 65;
      totalPrice = breakdown.hourlyCharge;
      totalPrice = Math.max(totalPrice, 130); // Minimum 2 hours
      basePrice = totalPrice;
      break;

    case 'business':
      // Custom pricing - default estimate
      totalPrice = 100;
      basePrice = totalPrice;
      break;
  }

  return {
    basePrice,
    distance: input.distance,
    duration: input.duration,
    breakdown,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: 'EUR',
  };
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(price);
}

