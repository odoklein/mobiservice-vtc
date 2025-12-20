/**
 * Seed pricing_rules table with current pricing values from lib/pricing.ts
 * Run this script to populate the database with initial pricing configuration
 */

import { db } from './index';
import { pricingRules } from './schema';

const TVA_RATE = 0.10; // 10% TVA

/**
 * Calculate HT price from TTC
 */
function calculateHT(ttc: number): number {
  return Math.round((ttc / (1 + TVA_RATE)) * 100) / 100;
}

/**
 * Seed all pricing rules
 */
export async function seedPricingRules() {
  console.log('🌱 Seeding pricing rules...');

  // Clear existing rules (optional - comment out if you want to keep existing)
  // await db.delete(pricingRules);

  const rulesToInsert = [];

  // ============================================================================
  // FORFAITS (Hourly Packages)
  // ============================================================================
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

  for (const forfait of FORFAITS) {
    // Day rate
    rulesToInsert.push({
      ruleType: 'forfait',
      serviceType: 'hourly',
      timeSlot: 'day',
      priceHT: calculateHT(forfait.day).toString(),
      priceTTC: forfait.day.toString(),
      forfaitHours: forfait.hours,
      forfaitMaxKm: forfait.maxKm,
      hourlyRateTTC: (forfait.day / forfait.hours).toString(),
      description: `Forfait ${forfait.hours}H / ${forfait.maxKm}km (Jour)`,
      isActive: true,
    });

    // Night rate
    rulesToInsert.push({
      ruleType: 'forfait',
      serviceType: 'hourly',
      timeSlot: 'night',
      priceHT: calculateHT(forfait.night).toString(),
      priceTTC: forfait.night.toString(),
      forfaitHours: forfait.hours,
      forfaitMaxKm: forfait.maxKm,
      hourlyRateTTC: (forfait.night / forfait.hours).toString(),
      description: `Forfait ${forfait.hours}H / ${forfait.maxKm}km (Nuit)`,
      isActive: true,
    });
  }

  // ============================================================================
  // PER-KM RATES - TP (Transfer Point) - Constant rate
  // ============================================================================
  rulesToInsert.push({
    ruleType: 'per_km',
    serviceType: 'transfer',
    timeSlot: 'day',
    priceHT: calculateHT(1.32).toString(),
    priceTTC: '1.32',
    perKm: '1.32',
    zoneType: 'tp',
    description: 'Tarif TP (Jour) - Prix constant au km',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'per_km',
    serviceType: 'transfer',
    timeSlot: 'night',
    priceHT: calculateHT(1.90).toString(),
    priceTTC: '1.90',
    perKm: '1.90',
    zoneType: 'tp',
    description: 'Tarif TP (Nuit) - Prix constant au km',
    isActive: true,
  });

  // ============================================================================
  // PER-KM RATES - CA (Course d'Approche) - Tiered brackets
  // ============================================================================
  const DAY_CA_RATES = {
    '0-25': 1.32,
    '25-50': 1.32,
    '50-75': 1.10,
    '75-100': 0.90,
    '100+': 0.70,
  };

  const NIGHT_CA_RATES = {
    '0-25': 1.90,
    '25-50': 1.70,
    '50-75': 1.40,
    '75-100': 1.10,
    '100+': 0.70,
  };

  // Day CA rates
  for (const [bracket, rate] of Object.entries(DAY_CA_RATES)) {
    const [min, max] = bracket.split('-').map((s) => (s.includes('+') ? null : parseInt(s)));
    rulesToInsert.push({
      ruleType: 'per_km',
      serviceType: 'transfer',
      timeSlot: 'day',
      priceHT: calculateHT(rate).toString(),
      priceTTC: rate.toString(),
      perKm: rate.toString(),
      zoneType: 'ca',
      maxKm: max || null,
      description: `Tarif CA (Jour) - ${bracket}km`,
      isActive: true,
    });
  }

  // Night CA rates
  for (const [bracket, rate] of Object.entries(NIGHT_CA_RATES)) {
    const [min, max] = bracket.split('-').map((s) => (s.includes('+') ? null : parseInt(s)));
    rulesToInsert.push({
      ruleType: 'per_km',
      serviceType: 'transfer',
      timeSlot: 'night',
      priceHT: calculateHT(rate).toString(),
      priceTTC: rate.toString(),
      perKm: rate.toString(),
      zoneType: 'ca',
      maxKm: max || null,
      description: `Tarif CA (Nuit) - ${bracket}km`,
      isActive: true,
    });
  }

  // ============================================================================
  // FORFAIT AGGLOMERATION (≤25km A/R)
  // ============================================================================
  rulesToInsert.push({
    ruleType: 'forfait',
    serviceType: 'agglomeration',
    timeSlot: 'day',
    priceHT: calculateHT(33.00).toString(),
    priceTTC: '33.00',
    maxKm: 25,
    description: 'Forfait agglomération (Jour) - ≤25km A/R',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'forfait',
    serviceType: 'agglomeration',
    timeSlot: 'night',
    priceHT: calculateHT(47.50).toString(),
    priceTTC: '47.50',
    maxKm: 25,
    description: 'Forfait agglomération (Nuit) - ≤25km A/R',
    isActive: true,
  });

  // ============================================================================
  // MDA (Mise à Disposition) - Per minute rates
  // ============================================================================
  rulesToInsert.push({
    ruleType: 'mda',
    serviceType: 'mda',
    timeSlot: 'day',
    priceHT: calculateHT(1.20).toString(),
    priceTTC: '1.20',
    perMinute: '1.20',
    description: 'MDA (Jour) - Par minute après 10 min gratuites',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'mda',
    serviceType: 'mda',
    timeSlot: 'night',
    priceHT: calculateHT(1.80).toString(),
    priceTTC: '1.80',
    perMinute: '1.80',
    description: 'MDA (Nuit) - Par minute après 10 min gratuites',
    isActive: true,
  });

  // ============================================================================
  // AIRPORT RATES
  // ============================================================================
  rulesToInsert.push({
    ruleType: 'airport',
    serviceType: 'airport',
    timeSlot: 'day',
    priceHT: calculateHT(116).toString(),
    priceTTC: '116.00',
    description: 'Aéroport Genève (Jour)',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'airport',
    serviceType: 'airport',
    timeSlot: 'night',
    priceHT: calculateHT(130).toString(),
    priceTTC: '130.00',
    description: 'Aéroport Genève (Nuit)',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'airport',
    serviceType: 'airport',
    timeSlot: 'day',
    priceHT: calculateHT(232).toString(),
    priceTTC: '232.00',
    description: 'Aéroport Lyon-Saint Exupéry (Jour)',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'airport',
    serviceType: 'airport',
    timeSlot: 'night',
    priceHT: calculateHT(260).toString(),
    priceTTC: '260.00',
    description: 'Aéroport Lyon-Saint Exupéry (Nuit)',
    isActive: true,
  });

  // ============================================================================
  // EXTRA HOUR RATES (beyond forfait)
  // ============================================================================
  rulesToInsert.push({
    ruleType: 'extra_hour',
    serviceType: 'hourly',
    timeSlot: 'day',
    priceHT: calculateHT(116).toString(),
    priceTTC: '116.00',
    perHour: '116.00',
    description: 'Heure supplémentaire (Jour)',
    isActive: true,
  });

  rulesToInsert.push({
    ruleType: 'extra_hour',
    serviceType: 'hourly',
    timeSlot: 'night',
    priceHT: calculateHT(130).toString(),
    priceTTC: '130.00',
    perHour: '130.00',
    description: 'Heure supplémentaire (Nuit)',
    isActive: true,
  });

  // ============================================================================
  // MINIMUM PRICE
  // ============================================================================
  rulesToInsert.push({
    ruleType: 'min_price',
    serviceType: 'transfer',
    timeSlot: 'day',
    priceHT: calculateHT(33).toString(),
    priceTTC: '33.00',
    minPrice: '33.00',
    description: 'Prix minimum (Forfait agglomération jour)',
    isActive: true,
  });

  // Insert all rules
  try {
    await db.insert(pricingRules).values(rulesToInsert);
    console.log(`✅ Successfully seeded ${rulesToInsert.length} pricing rules`);
    return { success: true, count: rulesToInsert.length };
  } catch (error) {
    console.error('❌ Error seeding pricing rules:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedPricingRules()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

