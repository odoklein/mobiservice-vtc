/**
 * Server-side quotes: ONE implementation shared by the price shown to the customer
 * (/api/pricing/estimate) and the price saved with the booking (/api/bookings).
 *
 *  - Transfer (A/S, A/R): Mapbox distances + toll detection + tariffs-2026 engine,
 *    with the tariffs edited in the admin (lib/pricing/transfer-config.ts).
 *  - Hourly forfait (mise à disposition): Mapbox duration + forfait grid.
 */

import { getRouteMatrix } from '@/lib/routing/mapbox';
import { calculateTollForTrip } from '@/lib/services/toll-calculator';
import { calculatePrice } from '@/lib/pricing';
import {
  VTC_DEPOT_COORDS,
  calculateTransferPrice,
  type TransferTariffConfig,
} from '@/lib/pricing/tariffs-2026';
import { getTransferConfig } from '@/lib/pricing/transfer-config';

export type TripType = 'one-way' | 'round-trip';
export interface LatLng {
  lat: number;
  lng: number;
}

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/**
 * Build a local date/time from a calendar date and "HH:mm".
 * The date may be "YYYY-MM-DD", an ISO string, or a Date (calendar day = UTC day, which is
 * how the booking page sends it: local noon, safe in any server timezone).
 */
export function buildDateTime(date: string | Date, time: string): Date | null {
  const iso = date instanceof Date ? date.toISOString() : String(date);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const t = /^(\d{1,2}):(\d{2})/.exec(String(time).trim());
  if (!m || !t) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2]), 0);
  return isNaN(d.getTime()) ? null : d;
}

export interface TransferQuoteInput {
  pickup: LatLng;
  dropoff: LatLng;
  pickupDateTime: Date;
  returnDateTime?: Date | null;
  tripType: TripType;
  waitingMinutes?: number;
  /** One-way toll known by the caller (browser), used ONLY if automatic toll detection is unavailable. */
  tollCostFallback?: number;
}

/** Same shape as the historical /api/pricing/estimate `estimation` object, with mixed-rate fields added. */
export async function computeTransferQuote(input: TransferQuoteInput) {
  const { pickup, dropoff, pickupDateTime, tripType } = input;
  const waitingMinutes = Math.min(480, Math.max(0, Math.round(input.waitingMinutes || 0)));
  const returnDateTime = tripType === 'round-trip' ? input.returnDateTime ?? null : null;
  const depot = { lat: VTC_DEPOT_COORDS.lat, lng: VTC_DEPOT_COORDS.lng };

  const segments = await getRouteMatrix(depot, pickup, dropoff);
  const distanceCA_out = segments.distanceCA;
  const distanceTP = segments.distanceTP;
  // A/S : retour dropoff → dépôt. A/R : le client revient à son point de départ, donc pickup → dépôt.
  const distanceCA_return = tripType === 'round-trip' ? segments.distanceCA : segments.distanceReturn;

  // Péages détectés automatiquement (jamais bloquant : sans détection, 0 €)
  let tollCostOneWay = 0;
  let tollDetails = '';
  try {
    const toll = await calculateTollForTrip({ depot, pickup, dropoff, tripType });
    if (toll.hasTolls) {
      tollCostOneWay = toll.tollCost;
      tollDetails = toll.details;
    } else if (!toll.reliable && input.tollCostFallback && input.tollCostFallback > 0) {
      // Détection indisponible : on garde le péage vu par le client plutôt que de l'oublier
      tollCostOneWay = Math.min(500, input.tollCostFallback);
    }
  } catch (error) {
    console.warn('[PRICING] Toll detection failed:', error);
    if (input.tollCostFallback && input.tollCostFallback > 0) tollCostOneWay = Math.min(500, input.tollCostFallback);
  }

  const config = await getTransferConfig();
  const pricing = calculateTransferPrice(
    distanceCA_out,
    distanceTP,
    distanceCA_return,
    tripType,
    pickupDateTime,
    tollCostOneWay,
    waitingMinutes,
    { returnTime: returnDateTime, config }
  );

  return {
    result: buildTransferEstimation({
      distanceCA_out,
      distanceTP,
      distanceCA_return,
      duration: segments.durationTP, // Passenger duration (TP)
      totalDuration: segments.totalDuration, // Driver round-trip duration
      durations: {
        ca_out: segments.durationCA,
        tp: segments.durationTP,
        ca_return: segments.durationReturn,
        total: segments.totalDuration,
      },
      tripType,
      pickupDateTime,
      returnDateTime,
      waitingMinutes,
      tollCostOneWay,
      tollDetails,
      freeMinutes: config.mda.freeMinutes,
      pricing,
    }),
    measures: {
      distanceCA_out,
      distanceTP,
      distanceCA_return,
      duration: segments.durationTP,
      totalDuration: segments.totalDuration,
      tollCostOneWay,
    },
    pricing,
    config,
  };
}

/** Price from already-known measures (used as a fallback when routing is unavailable at booking time). */
export async function priceTransferFromMeasures(params: {
  distanceCA: number;
  distanceTP: number;
  distanceReturn: number;
  tripType: TripType;
  pickupDateTime: Date;
  returnDateTime?: Date | null;
  tollCostOneWay?: number;
  waitingMinutes?: number;
  config?: TransferTariffConfig;
}) {
  const config = params.config ?? (await getTransferConfig());
  const isRT = params.tripType === 'round-trip';
  return calculateTransferPrice(
    params.distanceCA,
    params.distanceTP,
    isRT ? params.distanceCA : params.distanceReturn,
    params.tripType,
    params.pickupDateTime,
    Math.max(0, params.tollCostOneWay || 0),
    Math.min(480, Math.max(0, Math.round(params.waitingMinutes || 0))),
    { returnTime: isRT ? params.returnDateTime ?? null : null, config }
  );
}

function buildTransferEstimation(p: {
  distanceCA_out: number;
  distanceTP: number;
  distanceCA_return: number;
  duration: number;
  totalDuration?: number;
  durations?: { ca_out: number; tp: number; ca_return: number; total: number };
  tripType: TripType;
  pickupDateTime: Date;
  returnDateTime: Date | null;
  waitingMinutes: number;
  tollCostOneWay: number;
  tollDetails: string;
  freeMinutes: number;
  pricing: ReturnType<typeof calculateTransferPrice>;
}) {
  const { pricing, tripType } = p;
  const isRT = tripType === 'round-trip';
  const label = (night: boolean) => (night ? 'Tarif nuit / Dim & JF 24/24' : 'Tarif jour (7h-20h sauf Dim/JF)');
  const rateType = pricing.isMixedRate
    ? `Tarif mixte (aller ${pricing.isNightRate ? 'nuit' : 'jour'} / retour ${pricing.isNightRateReturn ? 'nuit' : 'jour'})`
    : label(pricing.isNightRate);

  return {
    kind: 'transfer' as const,
    distances: {
      ca_out: p.distanceCA_out,
      tp: p.distanceTP,
      ca_return: p.distanceCA_return, // TOUJOURS inclus (règle n°1)
      total: p.distanceCA_out + p.distanceTP + p.distanceCA_return,
      // A/R 1–3 jours : distance totale (CA Aller + 2×TP + CA Retour) pour bloc < 25 km et immobilisation
      ...(isRT && { totalAR: p.distanceCA_out * 2 + p.distanceTP * 2 }),
    },
    duration: p.duration,
    totalDuration: p.totalDuration,
    durations: p.durations,
    pricing: {
      totalTTC: pricing.totalTTC,
      totalHT: pricing.totalHT,
      tva: pricing.tva,
      isNightRate: pricing.isNightRate,
      isNightRateReturn: pricing.isNightRateReturn,
      isMixedRate: pricing.isMixedRate,
      rateType,
      dayName: DAY_NAMES[p.pickupDateTime.getDay()],
      breakdown: {
        costCA_out: pricing.breakdown.costCA_out,
        costTP: pricing.breakdown.costTP,
        costCA_return: pricing.breakdown.costCA_return,
        tollCost: pricing.breakdown.tollCost,
        madCost: pricing.breakdown.madCost,
        isForfaitAgglomeration: pricing.breakdown.isForfaitAgglomeration,
        bracket: pricing.breakdown.bracket,
        pricePerKmCA: pricing.breakdown.pricePerKmCA,
        pricePerKmTP: pricing.breakdown.pricePerKmTP,
        rateOut: pricing.breakdown.rateOut,
        rateReturn: pricing.breakdown.rateReturn,
        isMixedRate: pricing.isMixedRate,
      },
      // TVA différenciée (prestation 10%, péage et MAD 20%)
      tvaBreakdown: pricing.debugInfo?.tvaDetails ?? undefined,
      mad: {
        minutes: p.waitingMinutes,
        freeMinutes: p.freeMinutes,
        chargeableMinutes: Math.max(0, p.waitingMinutes - p.freeMinutes),
        cost: pricing.breakdown.madCost,
      },
      tollInfo: {
        detected: p.tollCostOneWay > 0,
        cost: p.tollCostOneWay,
        details:
          p.tollDetails ||
          (p.tollCostOneWay > 0 ? `Péages inclus: ${p.tollCostOneWay.toFixed(2)}€` : 'Aucun péage détecté'),
        tripMultiplier: isRT ? 2 : 1,
        totalIncluded: isRT ? p.tollCostOneWay * 2 : p.tollCostOneWay,
      },
    },
    tripType,
    pickupDateTime: p.pickupDateTime.toISOString(),
    returnDateTime: p.returnDateTime ? p.returnDateTime.toISOString() : null,
    depot: {
      address: '4 rue des artisans, 74300 Cluses',
      coordinates: { lat: VTC_DEPOT_COORDS.lat, lng: VTC_DEPOT_COORDS.lng },
    },
    // Debug info - détails complets du calcul
    debugInfo: pricing.debugInfo,
  };
}

/* -------------------------------- hourly forfait -------------------------------- */

export interface HourlyQuoteInput {
  pickup: LatLng;
  dropoff: LatLng;
  pickupDateTime: Date;
  hours: number;
}

/** Duration (minutes) used to size the forfait: measured by Mapbox, never trusted from the browser. */
export async function computeHourlyQuote(input: HourlyQuoteInput) {
  const depot = { lat: VTC_DEPOT_COORDS.lat, lng: VTC_DEPOT_COORDS.lng };
  const segments = await getRouteMatrix(depot, input.pickup, input.dropoff);
  return {
    result: await priceHourly({
      hours: input.hours,
      pickupDateTime: input.pickupDateTime,
      distanceCA: segments.distanceCA,
      distanceTP: segments.distanceTP,
      distanceReturn: segments.distanceReturn,
      duration: segments.totalDuration,
    }),
    measures: { duration: segments.totalDuration },
  };
}

export async function priceHourlyFromMeasures(params: {
  hours: number;
  pickupDateTime: Date;
  distanceCA: number;
  distanceTP: number;
  distanceReturn: number;
  duration: number;
}) {
  return priceHourly(params);
}

async function priceHourly(p: {
  hours: number;
  pickupDateTime: Date;
  distanceCA: number;
  distanceTP: number;
  distanceReturn: number;
  duration: number;
}) {
  const pricing = await calculatePrice({
    serviceType: 'hourly',
    tripType: 'one-way',
    distanceCA: p.distanceCA,
    distanceTP: p.distanceTP,
    distanceReturn: p.distanceReturn,
    pickupTime: p.pickupDateTime,
    hours: p.hours,
    duration: p.duration,
  });

  return {
    kind: 'hourly' as const,
    distances: {
      ca_out: p.distanceCA,
      tp: p.distanceTP,
      ca_return: p.distanceReturn,
      total: p.distanceCA + p.distanceTP + p.distanceReturn,
    },
    duration: p.duration,
    pricing: {
      totalTTC: pricing.totalPrice,
      totalHT: pricing.totalPriceHT,
      tva: pricing.tva,
      isNightRate: pricing.isNightRate,
      isNightRateReturn: pricing.isNightRate,
      isMixedRate: false,
      rateType: pricing.rateType,
      dayName: DAY_NAMES[p.pickupDateTime.getDay()],
      breakdown: pricing.breakdown,
      forfait: {
        name: pricing.breakdown?.forfaitName,
        adjusted: !!pricing.forfaitAdjusted,
        requestedHours: pricing.requestedHours,
        appliedHours: pricing.appliedHours,
        message: pricing.suggestionMessage?.replace('⚠️ Attention : ', ''),
      },
    },
    tripType: 'one-way' as const,
    pickupDateTime: p.pickupDateTime.toISOString(),
    returnDateTime: null,
    depot: {
      address: '4 rue des artisans, 74300 Cluses',
      coordinates: { lat: VTC_DEPOT_COORDS.lat, lng: VTC_DEPOT_COORDS.lng },
    },
    debugInfo: undefined,
  };
}
