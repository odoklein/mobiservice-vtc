/**
 * Adapter between the pricing configuration edited in the admin (database, see
 * lib/services/pricing-service.ts) and the transfer pricing engine (tariffs-2026.ts).
 *
 * This is what makes the admin "Tarifs" page effective: the price shown to the customer
 * and the price saved with the booking both use the values returned here.
 * If the database is unavailable the engine's built-in defaults are used.
 */

import { getPricingConfig, type PricingConfig } from '@/lib/services/pricing-service';
import {
  DEFAULT_TRANSFER_CONFIG,
  type TransferTariffConfig,
} from '@/lib/pricing/tariffs-2026';

const positive = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

const BRACKETS = ['0-25', '25-50', '50-75', '75-100', '100+'] as const;

function ratesFrom(
  source: PricingConfig['dayRates'],
  fallback: TransferTariffConfig['dayRates']
): TransferTariffConfig['dayRates'] {
  const caRates = { ...fallback.caRates };
  for (const bracket of BRACKETS) caRates[bracket] = positive(source?.caRates?.[bracket], fallback.caRates[bracket]);
  return { tpRate: positive(source?.tpRate, fallback.tpRate), caRates };
}

/** Convert the admin/database configuration into the engine configuration (invalid values fall back to defaults). */
export function toTransferConfig(config: PricingConfig): TransferTariffConfig {
  const d = DEFAULT_TRANSFER_CONFIG;
  return {
    dayRates: ratesFrom(config.dayRates, d.dayRates),
    nightRates: ratesFrom(config.nightRates, d.nightRates),
    forfaitAgglomeration: {
      day: positive(config.forfaitAgglomeration?.day, d.forfaitAgglomeration.day),
      night: positive(config.forfaitAgglomeration?.night, d.forfaitAgglomeration.night),
      thresholdKm: positive(config.forfaitAgglomeration?.thresholdKm, d.forfaitAgglomeration.thresholdKm),
    },
    mda: {
      freeMinutes: typeof config.mdaRates?.freeMinutes === 'number' && config.mdaRates.freeMinutes >= 0
        ? config.mdaRates.freeMinutes
        : d.mda.freeMinutes,
      day: positive(config.mdaRates?.day, d.mda.day),
      night: positive(config.mdaRates?.night, d.mda.night),
    },
    minPrice: positive(config.minPrice, d.minPrice),
  };
}

/** Current transfer tariffs (database with 5 min cache, defaults on failure). */
export async function getTransferConfig(): Promise<TransferTariffConfig> {
  try {
    return toTransferConfig(await getPricingConfig());
  } catch (error) {
    console.warn('[PRICING] Transfer config unavailable, using defaults:', error);
    return DEFAULT_TRANSFER_CONFIG;
  }
}
