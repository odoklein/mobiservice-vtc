/**
 * Price saved with a booking.
 *
 * The browser only sends the trip (addresses, coordinates, dates, options). The price is
 * recomputed here with EXACTLY the same engine as the estimate the customer saw
 * (lib/pricing/transfer-quote.ts), so the saved price equals the displayed price and
 * cannot be tampered with. Distances and tolls are measured server-side; the values sent
 * by the browser are only used as a fallback if routing is temporarily unavailable.
 */

import {
  buildDateTime,
  computeHourlyQuote,
  computeTransferQuote,
  priceHourlyFromMeasures,
  priceTransferFromMeasures,
} from '@/lib/pricing/transfer-quote';

export interface BookingPriceInput {
  serviceType: 'transfer' | 'hourly' | string;
  tripType?: 'one-way' | 'round-trip' | string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupDate: Date | string;
  pickupTime: string;
  returnDate?: Date | string | null;
  returnTime?: string | null;
  waitingMinutes?: number;
  hours?: number;
  // Fallback values measured by the browser
  distanceCA?: number;
  distanceTP?: number;
  distanceReturn?: number;
  duration?: number;
  tollCost?: number;
}

export interface ServerPrice {
  totalPrice: number;
  totalPriceHT: number;
  tva: number;
  currency: 'EUR';
  isNightRate: boolean;
  rateType: string;
  isForfait?: boolean;
  breakdown: Record<string, any>;
  /** Measures used for the price (replace the browser's values when measured server-side). */
  measures?: { distanceCA: number; distanceTP: number; distanceReturn: number; duration: number };
  source: 'server-routing' | 'browser-measures';
}

const hasCoords = (v: BookingPriceInput) =>
  [v.pickupLat, v.pickupLng, v.dropoffLat, v.dropoffLng].every((c) => typeof c === 'number' && isFinite(c));

const hasMeasures = (v: BookingPriceInput) =>
  [v.distanceCA, v.distanceTP, v.distanceReturn].every((d) => typeof d === 'number' && isFinite(d) && d >= 0);

export async function recomputeBookingPrice(v: BookingPriceInput): Promise<ServerPrice> {
  const pickupDateTime = buildDateTime(v.pickupDate, v.pickupTime);
  if (!pickupDateTime) throw new Error('Invalid pickup date/time');

  if (v.serviceType === 'hourly') {
    const hours = v.hours ?? 2;
    let quote: Awaited<ReturnType<typeof priceHourlyFromMeasures>>;
    let source: ServerPrice['source'] = 'server-routing';
    let duration = v.duration ?? 0;
    if (hasCoords(v)) {
      try {
        const q = await computeHourlyQuote({
          pickup: { lat: v.pickupLat!, lng: v.pickupLng! },
          dropoff: { lat: v.dropoffLat!, lng: v.dropoffLng! },
          pickupDateTime,
          hours,
        });
        quote = q.result;
        duration = q.measures.duration;
      } catch (error) {
        console.warn('[BOOKING] Routing unavailable, using browser measures for hourly price:', error);
        if (!hasMeasures(v)) throw error;
        source = 'browser-measures';
        quote = await priceHourlyFromMeasures({
          hours,
          pickupDateTime,
          distanceCA: v.distanceCA!,
          distanceTP: v.distanceTP!,
          distanceReturn: v.distanceReturn!,
          duration,
        });
      }
    } else if (hasMeasures(v)) {
      source = 'browser-measures';
      quote = await priceHourlyFromMeasures({
        hours,
        pickupDateTime,
        distanceCA: v.distanceCA!,
        distanceTP: v.distanceTP!,
        distanceReturn: v.distanceReturn!,
        duration,
      });
    } else {
      throw new Error('Missing coordinates for hourly price');
    }

    return {
      totalPrice: quote.pricing.totalTTC,
      totalPriceHT: quote.pricing.totalHT,
      tva: quote.pricing.tva,
      currency: 'EUR',
      isNightRate: quote.pricing.isNightRate,
      rateType: quote.pricing.rateType,
      isForfait: true,
      breakdown: quote.pricing.breakdown ?? {},
      measures: {
        distanceCA: quote.distances.ca_out,
        distanceTP: quote.distances.tp,
        distanceReturn: quote.distances.ca_return,
        duration: quote.duration,
      },
      source,
    };
  }

  // ----- Transfer (A/S or A/R) -----
  const tripType = v.tripType === 'round-trip' ? 'round-trip' : 'one-way';
  const returnDateTime =
    tripType === 'round-trip' && v.returnDate && v.returnTime ? buildDateTime(v.returnDate, v.returnTime) : null;
  const waitingMinutes = v.waitingMinutes ?? 0;

  let pricing: Awaited<ReturnType<typeof priceTransferFromMeasures>>;
  let measures: NonNullable<ServerPrice['measures']>;
  let tollUnit = 0;
  let source: ServerPrice['source'] = 'server-routing';

  try {
    if (!hasCoords(v)) throw new Error('Missing coordinates');
    const q = await computeTransferQuote({
      pickup: { lat: v.pickupLat!, lng: v.pickupLng! },
      dropoff: { lat: v.dropoffLat!, lng: v.dropoffLng! },
      pickupDateTime,
      returnDateTime,
      tripType,
      waitingMinutes,
      tollCostFallback: v.tollCost,
    });
    pricing = q.pricing;
    tollUnit = q.measures.tollCostOneWay;
    measures = {
      distanceCA: q.measures.distanceCA_out,
      distanceTP: q.measures.distanceTP,
      distanceReturn: tripType === 'round-trip' ? q.measures.distanceCA_out : q.measures.distanceCA_return,
      duration: q.measures.duration,
    };
  } catch (error) {
    console.warn('[BOOKING] Routing unavailable, using browser measures for transfer price:', error);
    if (!hasMeasures(v)) throw error;
    source = 'browser-measures';
    tollUnit = Math.max(0, v.tollCost || 0);
    pricing = await priceTransferFromMeasures({
      distanceCA: v.distanceCA!,
      distanceTP: v.distanceTP!,
      distanceReturn: v.distanceReturn!,
      tripType,
      pickupDateTime,
      returnDateTime,
      tollCostOneWay: tollUnit,
      waitingMinutes,
    });
    measures = {
      distanceCA: v.distanceCA!,
      distanceTP: v.distanceTP!,
      distanceReturn: v.distanceReturn!,
      duration: v.duration ?? 0,
    };
  }

  const transportTTC = pricing.debugInfo.calculDetaille.sousTotalAvantPeages;
  const rateLabel = (night: boolean) => (night ? 'Tarif nuit / Dim & JF 24/24' : 'Tarif jour (7h-20h sauf Dim/JF)');
  const rateType = pricing.isMixedRate
    ? `Tarif mixte (aller ${pricing.isNightRate ? 'nuit' : 'jour'} / retour ${pricing.isNightRateReturn ? 'nuit' : 'jour'})`
    : rateLabel(pricing.isNightRate);

  return {
    totalPrice: pricing.totalTTC,
    totalPriceHT: pricing.totalHT,
    tva: pricing.tva,
    currency: 'EUR',
    isNightRate: pricing.isNightRate,
    rateType,
    isForfait: pricing.breakdown.isForfaitAgglomeration,
    breakdown: {
      // Champs lus par les PDF (devis / facture)
      distanceCharge: transportTTC,
      waitingCharge: pricing.breakdown.madCost || undefined,
      forfaitApplied: pricing.breakdown.isForfaitAgglomeration,
      forfaitName: pricing.breakdown.isForfaitAgglomeration ? 'Forfait agglomération' : undefined,
      // Détail du calcul
      tollCost: pricing.breakdown.tollCost,
      costCA_out: pricing.breakdown.costCA_out,
      costTP: pricing.breakdown.costTP,
      costCA_return: pricing.breakdown.costCA_return,
      bracket: pricing.breakdown.bracket,
      rateOut: pricing.breakdown.rateOut,
      rateReturn: pricing.breakdown.rateReturn,
      isMixedRate: pricing.isMixedRate,
      tvaDetails: pricing.debugInfo.tvaDetails,
    },
    measures,
    source,
  };
}
