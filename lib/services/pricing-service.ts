/**
 * Dynamic Pricing Service
 * Loads pricing from database with caching and fallback to hardcoded values
 * Client-safe: database imports only happen server-side
 */

// Conditional database imports (server-side only)
const isServer = typeof window === 'undefined';

let db: any = null;
let pricingRules: any = null;
let eq: any = null;

// Lazy load database to avoid client-side errors
async function getDb() {
  if (!isServer) {
    return null;
  }
  if (!db) {
    try {
      // Dynamic imports to avoid client-side execution
      const [dbModule, schema, drizzle] = await Promise.all([
        import('@/lib/db'),
        import('@/lib/db/schema'),
        import('drizzle-orm'),
      ]);
      db = dbModule.db;
      pricingRules = schema.pricingRules;
      eq = drizzle.eq;
    } catch (error) {
      console.warn('[PRICING] Database not available:', error);
      return null;
    }
  }
  return db;
}

const TVA_RATE = 0.10;

// Cache configuration
let pricingCache: PricingConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PricingConfig {
  forfaits: Array<{
    hours: number;
    maxKm: number;
    day: number;
    night: number;
  }>;
  dayRates: {
    tpRate: number;
    caRates: {
      '0-25': number;
      '25-50': number;
      '50-75': number;
      '75-100': number;
      '100+': number;
    };
  };
  nightRates: {
    tpRate: number;
    caRates: {
      '0-25': number;
      '25-50': number;
      '50-75': number;
      '75-100': number;
      '100+': number;
    };
  };
  forfaitAgglomeration: {
    day: number;
    night: number;
    thresholdKm: number;
  };
  mdaRates: {
    day: number;
    night: number;
    freeMinutes: number;
    per15MinDay?: number;
    per15MinNight?: number;
  };
  airportRates: {
    geneva: { day: number; night: number };
    lyon: { day: number; night: number };
  };
  extraHour: {
    day: number;
    night: number;
  };
  minPrice: number;
}

/**
 * Load pricing rules from database
 */
async function loadPricingFromDatabase(): Promise<PricingConfig | null> {
  // Skip on client-side
  if (!isServer) {
    return null;
  }

  const database = await getDb();

  if (!database || !pricingRules || !eq) {
    return null;
  }

  try {
    const rules = await database
      .select()
      .from(pricingRules)
      .where(eq(pricingRules.isActive, true));

    if (rules.length === 0) {
      console.warn('[PRICING] No active pricing rules found in database');
      return null;
    }

    // Initialize config structure
    const config: PricingConfig = {
      forfaits: [],
      dayRates: {
        tpRate: 1.32,
        caRates: {
          '0-25': 1.32,
          '25-50': 1.32,
          '50-75': 1.10,
          '75-100': 0.90,
          '100+': 0.70,
        },
      },
      nightRates: {
        tpRate: 1.90,
        caRates: {
          '0-25': 1.90,
          '25-50': 1.70,
          '50-75': 1.40,
          '75-100': 1.10,
          '100+': 0.70,
        },
      },
      forfaitAgglomeration: {
        day: 33.00,
        night: 47.50,
        thresholdKm: 25,
      },
      mdaRates: {
        day: 1.20,
        night: 1.80,
        freeMinutes: 15,
        per15MinDay: 18,
        per15MinNight: 27,
      },
      airportRates: {
        geneva: { day: 116, night: 130 },
        lyon: { day: 232, night: 260 },
      },
      extraHour: {
        day: 116,
        night: 130,
      },
      minPrice: 33,
    };

    // Process rules
    for (const rule of rules) {
      const priceTTC = parseFloat(rule.priceTTC || '0');

      // Forfaits
      if (rule.ruleType === 'forfait' && rule.serviceType === 'hourly' && rule.forfaitHours) {
        const existing = config.forfaits.find(
          (f) => f.hours === rule.forfaitHours && f.maxKm === rule.forfaitMaxKm
        );

        if (existing) {
          if (rule.timeSlot === 'day') {
            existing.day = priceTTC;
          } else {
            existing.night = priceTTC;
          }
        } else {
          config.forfaits.push({
            hours: rule.forfaitHours,
            maxKm: rule.forfaitMaxKm || 0,
            day: rule.timeSlot === 'day' ? priceTTC : 0,
            night: rule.timeSlot === 'night' ? priceTTC : 0,
          });
        }
      }

      // Agglomeration forfait
      if (rule.ruleType === 'forfait' && rule.serviceType === 'agglomeration') {
        if (rule.timeSlot === 'day') {
          config.forfaitAgglomeration.day = priceTTC;
        } else {
          config.forfaitAgglomeration.night = priceTTC;
        }
        if (rule.maxKm) {
          config.forfaitAgglomeration.thresholdKm = rule.maxKm;
        }
      }

      // TP rates (per-km, zoneType='tp')
      if (rule.ruleType === 'per_km' && rule.zoneType === 'tp') {
        if (rule.timeSlot === 'day') {
          config.dayRates.tpRate = priceTTC;
        } else {
          config.nightRates.tpRate = priceTTC;
        }
      }

      // CA rates (per-km, zoneType='ca')
      if (rule.ruleType === 'per_km' && rule.zoneType === 'ca' && rule.maxKm !== null) {
        let bracket: keyof typeof config.dayRates.caRates;
        if (rule.maxKm <= 25) bracket = '0-25';
        else if (rule.maxKm <= 50) bracket = '25-50';
        else if (rule.maxKm <= 75) bracket = '50-75';
        else if (rule.maxKm <= 100) bracket = '75-100';
        else bracket = '100+';

        if (rule.timeSlot === 'day') {
          config.dayRates.caRates[bracket] = priceTTC;
        } else {
          config.nightRates.caRates[bracket] = priceTTC;
        }
      }

      // MDA rates
      if (rule.ruleType === 'mda' && rule.perMinute) {
        const perMin = parseFloat(rule.perMinute);
        if (rule.timeSlot === 'day') {
          config.mdaRates.day = perMin;
        } else {
          config.mdaRates.night = perMin;
        }
      }

      // Airport rates
      if (rule.ruleType === 'airport') {
        if (rule.description?.includes('Genève')) {
          if (rule.timeSlot === 'day') {
            config.airportRates.geneva.day = priceTTC;
          } else {
            config.airportRates.geneva.night = priceTTC;
          }
        } else if (rule.description?.includes('Lyon')) {
          if (rule.timeSlot === 'day') {
            config.airportRates.lyon.day = priceTTC;
          } else {
            config.airportRates.lyon.night = priceTTC;
          }
        }
      }

      // Extra hour
      if (rule.ruleType === 'extra_hour') {
        if (rule.timeSlot === 'day') {
          config.extraHour.day = priceTTC;
        } else {
          config.extraHour.night = priceTTC;
        }
      }

      // Min price
      if (rule.ruleType === 'min_price' && rule.minPrice) {
        config.minPrice = parseFloat(rule.minPrice);
      }
    }

    // Sort forfaits by hours
    config.forfaits.sort((a, b) => a.hours - b.hours);

    return config;
  } catch (error) {
    console.error('[PRICING] Error loading from database:', error);
    return null;
  }
}

/**
 * Get hardcoded fallback pricing (current constants)
 */
function getHardcodedPricing(): PricingConfig {
  return {
    forfaits: [
      { hours: 1, maxKm: 90, day: 116, night: 140 },
      { hours: 1.5, maxKm: 135, day: 174, night: 210 },
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
    ],
    dayRates: {
      tpRate: 1.32,
      caRates: {
        '0-25': 1.32,
        '25-50': 1.32,
        '50-75': 1.10,
        '75-100': 0.90,
        '100+': 0.70,
      },
    },
    nightRates: {
      tpRate: 1.90,
      caRates: {
        '0-25': 1.90,
        '25-50': 1.70,
        '50-75': 1.40,
        '75-100': 1.10,
        '100+': 0.70,
      },
    },
    forfaitAgglomeration: {
      day: 33.00,
      night: 47.50,
      thresholdKm: 25,
    },
    mdaRates: {
      day: 1.20,
      night: 1.80,
      freeMinutes: 15,
      per15MinDay: 18,
      per15MinNight: 27,
    },
    airportRates: {
      geneva: { day: 116, night: 130 },
      lyon: { day: 232, night: 260 },
    },
    extraHour: {
      day: 116,
      night: 130,
    },
    minPrice: 33,
  };
}

/**
 * Get pricing configuration (from cache, database, or fallback)
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  // Check cache
  const now = Date.now();
  if (pricingCache && now - cacheTimestamp < CACHE_TTL) {
    return pricingCache;
  }

  // Try to load from database
  const dbConfig = await loadPricingFromDatabase();
  if (dbConfig) {
    pricingCache = dbConfig;
    cacheTimestamp = now;
    return dbConfig;
  }

  // Fallback to hardcoded
  console.warn('[PRICING] Using hardcoded fallback pricing');
  const fallback = getHardcodedPricing();
  pricingCache = fallback;
  cacheTimestamp = now;
  return fallback;
}

/**
 * Invalidate pricing cache (call after updates)
 */
export function invalidatePricingCache() {
  pricingCache = null;
  cacheTimestamp = 0;
  console.log('[PRICING] Cache invalidated');
}

/**
 * Get pricing config synchronously (uses cache or fallback)
 * Use this in server components where async is not available
 */
export function getPricingConfigSync(): PricingConfig {
  if (pricingCache) {
    return pricingCache;
  }
  return getHardcodedPricing();
}

