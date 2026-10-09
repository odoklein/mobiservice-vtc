'use client';

import { useEffect, useState } from 'react';
import { toISODate } from './utils';

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

export type ServiceType = 'transfer' | 'hourly';
export type TripType = 'one-way' | 'round-trip';

/** Estimation unifiée, calculée côté serveur par /api/pricing/estimate (même calcul que l'enregistrement). */
export interface Quote {
  kind: ServiceType;
  totalTTC: number;
  totalHT: number;
  tva: number;
  /** Tarif de l'aller (ou de la course en aller simple). */
  isNightRate: boolean;
  /** Tarif du retour (aller-retour). */
  isNightRateReturn: boolean;
  /** Aller et retour ne sont pas au même tarif (jour/nuit). */
  isMixedRate: boolean;
  rateType: string;
  distanceCA: number;
  distanceTP: number;
  distanceReturn: number;
  /** Durée totale estimée (minutes), approche et retour dépôt inclus. */
  duration: number;
  /** A/R : CA aller + 2×TP + CA retour — base du bloc < 25 km et de l'immobilisation. */
  totalAR?: number;
  toll?: { detected: boolean; totalIncluded: number; details: string; cost: number };
  /** Temps d'attente facturé (aller simple et aller-retour). */
  mad?: { minutes: number; freeMinutes: number; chargeableMinutes: number; cost: number };
  breakdown?: Record<string, unknown>;
  debugInfo?: unknown;
  forfait?: {
    name?: string;
    adjusted: boolean;
    requestedHours?: number;
    appliedHours?: number;
    message?: string;
  };
}

export interface QuoteParams {
  serviceType: ServiceType;
  tripType: TripType;
  pickup: Place | null;
  dropoff: Place | null;
  date: Date | null;
  time: string;
  /** Aller-retour : date et heure du retour (pour tarifer le retour jour ou nuit). */
  returnDate: Date | null;
  returnTime: string;
  /** Durée de la mise à disposition (heures). */
  hours: number;
  waitingMinutes: number;
}

const DEBOUNCE_MS = 350;
const TIME_RE = /^\d{1,2}:\d{2}$/;

/**
 * Calcule l'estimation en temps réel avec le moteur de tarification du serveur
 * (POST /api/pricing/estimate) : mêmes tarifs que l'administration, mêmes règles que
 * le prix enregistré à la confirmation.
 */
export function useQuote(params: QuoteParams) {
  const { serviceType, tripType, pickup, dropoff, date, time, returnDate, returnTime, hours, waitingMinutes } = params;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const ready = !!pickup && !!dropoff && !!date && TIME_RE.test(time);
  const isRoundTrip = serviceType === 'transfer' && tripType === 'round-trip';
  const returnReady = isRoundTrip && !!returnDate && TIME_RE.test(returnTime);

  useEffect(() => {
    if (!ready || !pickup || !dropoff || !date) {
      setQuote(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const res = await fetch('/api/pricing/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType,
            pickupLat: pickup.lat,
            pickupLng: pickup.lng,
            dropoffLat: dropoff.lat,
            dropoffLng: dropoff.lng,
            pickupDate: toISODate(date),
            pickupTime: time,
            tripType: serviceType === 'hourly' ? 'one-way' : tripType,
            ...(returnReady && returnDate ? { returnDate: toISODate(returnDate), returnTime } : {}),
            waitingMinutes: serviceType === 'hourly' ? 0 : waitingMinutes,
            hours,
          }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.estimation) {
          throw new Error(data.message || data.error || 'Estimation indisponible');
        }
        const est = data.estimation;
        const p = est.pricing;
        const next: Quote = {
          kind: est.kind === 'hourly' ? 'hourly' : 'transfer',
          totalTTC: p.totalTTC,
          totalHT: p.totalHT,
          tva: p.tva,
          isNightRate: !!p.isNightRate,
          isNightRateReturn: !!(p.isNightRateReturn ?? p.isNightRate),
          isMixedRate: !!p.isMixedRate,
          rateType: p.rateType,
          distanceCA: est.distances.ca_out,
          distanceTP: est.distances.tp,
          distanceReturn: est.distances.ca_return,
          duration: est.duration,
          totalAR: est.distances.totalAR,
          toll: p.tollInfo,
          mad: p.mad,
          breakdown: p.breakdown,
          debugInfo: est.debugInfo,
          forfait: p.forfait,
        };
        if (!controller.signal.aborted) setQuote(next);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setQuote(null);
          setError((err as Error).message || 'Estimation indisponible');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    const timer = setTimeout(run, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    ready,
    serviceType,
    tripType,
    pickup?.lat,
    pickup?.lng,
    dropoff?.lat,
    dropoff?.lng,
    date?.getTime(),
    time,
    returnReady,
    returnDate?.getTime(),
    returnTime,
    hours,
    waitingMinutes,
    attempt,
  ]);

  const retry = () => setAttempt((n) => n + 1);

  return { quote, loading, error, ready, retry };
}
