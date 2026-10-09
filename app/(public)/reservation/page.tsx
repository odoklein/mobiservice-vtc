'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  IconCheck,
  IconClock,
  IconArrowRight,
  IconArrowLeft,
  IconPlus,
  IconMinus,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconLuggage,
  IconPhone,
  IconShieldCheck,
  IconLoader2,
  IconAlertTriangle,
  IconRoute,
  IconCalculator,
  IconCode,
  IconReceipt,
} from '@tabler/icons-react';
import { CONTACT } from '@/lib/constants';
import { getImmobilisationMAD, isAR13DaysAllowed, type ReturnDaysAfter } from '@/lib/booking/immobilisation-mad';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Trajet', 'Quand', 'Voyageurs', 'Confirmation'];

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const HOURLY_FORFAITS = [
  { hours: 1, label: '1h', maxKm: 90 },
  { hours: 1.5, label: '1h30', maxKm: 135 },
  { hours: 2, label: '2h', maxKm: 180 },
  { hours: 2.5, label: '2h30', maxKm: 225 },
  { hours: 3, label: '3h', maxKm: 270 },
  { hours: 3.5, label: '3h30', maxKm: 315 },
  { hours: 4, label: '4h', maxKm: 360 },
  { hours: 5, label: '5h', maxKm: 450 },
  { hours: 6, label: '6h', maxKm: 540 },
  { hours: 7, label: '7h', maxKm: 630 },
  { hours: 8, label: '8h', maxKm: 720 },
];

interface Place {
  label: string;
  lat: number;
  lng: number;
}

interface Estimation {
  kind?: 'transfer' | 'hourly';
  distances: { ca_out: number; tp: number; ca_return: number; total: number; totalAR?: number };
  duration: number;
  pricing: {
    totalTTC: number;
    totalHT: number;
    tva: number;
    isNightRate: boolean;
    rateType: string;
    dayName: string;
    tollInfo?: { detected: boolean; cost: number; details: string; totalIncluded: number };
    breakdown?: {
      costCA_out?: number;
      costTP?: number;
      costCA_return?: number;
      tollCost?: number;
      madCost?: number;
      isForfaitAgglomeration?: boolean;
      bracket?: string;
      pricePerKmCA?: number;
      pricePerKmTP?: number;
      rateOut?: string;
      rateReturn?: string;
      isMixedRate?: boolean;
      forfaitName?: string;
    };
    forfait?: {
      name?: string;
      adjusted?: boolean;
      requestedHours?: number;
      appliedHours?: number;
      message?: string;
    };
  };
}

/* ---------------------------------- utils --------------------------------- */

const pad = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatLongDate = (d: Date) =>
  `${DAY_NAMES[d.getDay()].charAt(0).toUpperCase()}${DAY_NAMES[d.getDay()].slice(1)} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
const formatShortDate = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 4)}.`;

const formatHours = (h: number) => {
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  return minutes > 0 ? `${whole}h${minutes}` : `${whole}h`;
};

/** Grille du mois, semaines commençant le lundi. */
function buildMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const start = new Date(year, month, 1 - offset);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks.filter((week) => week.some((d) => d.getMonth() === month));
}

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) for (const m of [0, 30]) slots.push(`${pad(h)}:${pad(m)}`);
  return slots;
})();

const combineDateTime = (date: Date, time: string) => {
  const [h, m] = time.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h || 0, m || 0, 0);
};

/* ----------------------------- address field ------------------------------ */

function AddressField({
  label,
  placeholder,
  pinClass,
  value,
  optional = false,
  onTextChange,
  onSelect,
}: {
  label: string;
  placeholder: string;
  pinClass: string;
  value: string;
  optional?: boolean;
  onTextChange: (text: string) => void;
  onSelect: (place: Place) => void;
}) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        const results: Place[] = Array.isArray(data.results)
          ? data.results.map((r: { label: string; latitude: number; longitude: number }) => ({
              label: r.label,
              lat: r.latitude,
              lng: r.longitude,
            }))
          : [];
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlight(-1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
  };

  const choose = (place: Place) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    onSelect(place);
    setOpen(false);
    setSuggestions([]);
    setHighlight(-1);
    setLoading(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700 block">{label}</label>
        {optional && <span className="text-xs text-gray-400 font-normal">Optionnel</span>}
      </div>
      <div className="relative">
        <IconMapPin size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${pinClass}`} />
        <input
          type="text"
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onTextChange(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && highlight >= 0) {
              e.preventDefault();
              choose(suggestions[highlight]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449] text-sm"
        />
        {loading && (
          <IconLoader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onClick={() => choose(s)}
              className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors ${
                highlight === i ? 'bg-[#4BC449]/8' : 'hover:bg-gray-50'
              }`}
            >
              <IconMapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-800 leading-snug">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- calendar ------------------------------- */

function Calendar({
  viewMonth,
  onMonthChange,
  selected,
  minDate,
  onSelect,
  compact = false,
}: {
  viewMonth: Date;
  onMonthChange: (d: Date) => void;
  selected: Date | null;
  minDate: Date;
  onSelect: (d: Date) => void;
  compact?: boolean;
}) {
  const weeks = useMemo(
    () => buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth()),
    [viewMonth]
  );
  const min = startOfDay(minDate);
  const canGoPrev =
    new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1) >
    new Date(min.getFullYear(), min.getMonth(), 1);

  return (
    <div>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <IconChevronLeft size={compact ? 18 : 20} />
        </button>
        <span className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          {MONTH_NAMES[viewMonth.getMonth()].charAt(0).toUpperCase() + MONTH_NAMES[viewMonth.getMonth()].slice(1)}{' '}
          {viewMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <IconChevronRight size={compact ? 18 : 20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-1">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
          <div key={d} className={`text-center font-medium text-gray-400 ${compact ? 'text-[10px] py-1' : 'text-xs py-2'}`}>
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0">
          {week.map((day) => {
            const inMonth = day.getMonth() === viewMonth.getMonth();
            const disabled = !inMonth || day < min;
            const isSel = sameDay(day, selected);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => !disabled && onSelect(day)}
                disabled={disabled}
                className={`${compact ? 'h-8 text-xs' : 'h-10 text-sm'} rounded-lg transition-all ${
                  isSel
                    ? 'bg-[#4BC449] text-white font-bold'
                    : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- time grid ------------------------------ */

function TimeGrid({
  value,
  onChange,
  minDateTime,
  day,
  compact = false,
}: {
  value: string;
  onChange: (t: string) => void;
  minDateTime: Date | null;
  day: Date | null;
  compact?: boolean;
}) {
  const isDisabled = (t: string) => {
    if (!minDateTime || !day) return false;
    return combineDateTime(day, t) < minDateTime;
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
        {TIME_SLOTS.map((t) => {
          const disabled = isDisabled(t);
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => onChange(t)}
              className={`${compact ? 'py-2.5 text-xs' : 'py-3 text-sm'} rounded-xl font-medium transition-all border ${
                value === t
                  ? 'bg-[#4BC449] text-white border-[#4BC449]'
                  : disabled
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 cursor-pointer'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">Heure précise</span>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]"
        />
      </div>
    </div>
  );
}

/* -------------------------- debug calculations sidebar -------------------- */

function PricingDebugSidebar({
  pickupPlace,
  dropoffPlace,
  serviceType,
  direction,
  hours,
  selectedDate,
  selectedTime,
  returnDate,
  returnTime,
  quote,
  quoteLoading,
  quoteError,
  immobilisation,
  totalPrice,
  priceLabel,
}: {
  pickupPlace: Place | null;
  dropoffPlace: Place | null;
  serviceType: 'transfer' | 'hourly';
  direction: 'one-way' | 'round-trip';
  hours: number;
  selectedDate: Date | null;
  selectedTime: string;
  returnDate: Date | null;
  returnTime: string;
  quote: Estimation | null;
  quoteLoading: boolean;
  quoteError: string | null;
  immobilisation: { label: string; priceTTC: number } | null;
  totalPrice: number | null;
  priceLabel: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="bg-[#0b1320] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl text-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3.5 bg-emerald-500/10 hover:bg-emerald-500/15 border-b border-emerald-500/20 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#4BC449] animate-pulse shrink-0" />
          <span className="font-mono text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
            <IconCalculator size={14} className="text-[#4BC449]" />
            DEBUG CALCULS
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            {quoteLoading ? 'CALCUL…' : quote ? 'ACTIF' : 'ATTENTE'}
          </span>
        </div>
        {expanded ? <IconChevronUp size={16} className="text-gray-400" /> : <IconChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-3.5 space-y-3 font-mono text-[11px] leading-relaxed">
          {/* Statut */}
          {quoteLoading ? (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2 rounded-lg">
              <IconLoader2 size={13} className="animate-spin shrink-0" />
              <span>Calcul en cours via Mapbox & API...</span>
            </div>
          ) : quoteError ? (
            <div className="text-red-400 bg-red-500/10 p-2 rounded-lg text-[10px]">
              ⚠️ {quoteError}
            </div>
          ) : null}

          {/* Règle 1: Dépôt */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <IconMapPin size={12} className="text-[#4BC449]" /> Règle N°1 : Dépôt VTC
            </div>
            <div className="text-gray-300">Cluses : 4 rue des artisans</div>
            <div className="text-[10px] text-gray-500">[46.0624, 6.5813] • CA obligatoire</div>
          </div>

          {/* Segments kilométriques */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <IconRoute size={12} className="text-blue-400" /> Segments Distance (CA/TP)
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">1. CA Aller (Dépôt ➔ Départ) :</span>
              <span className="font-semibold text-white">{quote?.distances.ca_out ? `${quote.distances.ca_out.toFixed(1)} km` : '—'}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">2. TP Passager (Départ ➔ Fin) :</span>
              <span className="font-semibold text-emerald-400">{quote?.distances.tp ? `${quote.distances.tp.toFixed(1)} km` : '—'}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">3. CA Retour (Fin ➔ Dépôt) :</span>
              <span className="font-semibold text-white">{quote?.distances.ca_return ? `${quote.distances.ca_return.toFixed(1)} km` : '—'}</span>
            </div>
            <div className="border-t border-white/10 pt-1 flex justify-between font-bold">
              <span className="text-gray-300">Total trajet :</span>
              <span className="text-white">{quote?.distances.total ? `${quote.distances.total.toFixed(1)} km` : '—'}</span>
            </div>
            {quote?.distances.totalAR && (
              <div className="flex justify-between text-emerald-300 text-[10px]">
                <span>Total A/R (1-3 jours) :</span>
                <span>{quote.distances.totalAR.toFixed(1)} km</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400 text-[10px]">
              <span>Durée de route estimée :</span>
              <span className="text-white">{quote?.duration ? `${Math.round(quote.duration)} min` : '—'}</span>
            </div>
          </div>

          {/* Tarification & Régime */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <IconClock size={12} className="text-amber-400" /> Régime & Heures
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Régime horaire :</span>
              <span className={quote?.pricing.isNightRate ? 'text-amber-300 font-bold' : 'text-blue-300 font-bold'}>
                {quote?.pricing.isNightRate ? '🌙 Tarif Nuit / Dim' : '☀️ Tarif Jour'}
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Type de tarif :</span>
              <span className="text-white text-right break-words">{quote?.pricing.rateType || '—'}</span>
            </div>
            {serviceType === 'hourly' ? (
              <>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400">Forfait choisi :</span>
                  <span className="text-emerald-400 font-bold">{formatHours(hours)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="text-gray-400">Distance incluse :</span>
                  <span className="text-white">{hours * 90} km max</span>
                </div>
              </>
            ) : (
              <>
                {quote?.pricing.breakdown?.bracket && (
                  <div className="flex justify-between text-gray-300">
                    <span className="text-gray-400">Palier distance :</span>
                    <span className="text-white">{quote.pricing.breakdown.bracket}</span>
                  </div>
                )}
                {quote?.pricing.breakdown?.pricePerKmCA && (
                  <div className="flex justify-between text-gray-300 text-[10px]">
                    <span className="text-gray-400">Barème CA :</span>
                    <span className="text-white">{quote.pricing.breakdown.pricePerKmCA} €/km</span>
                  </div>
                )}
                {quote?.pricing.breakdown?.pricePerKmTP && (
                  <div className="flex justify-between text-gray-300 text-[10px]">
                    <span className="text-gray-400">Barème TP :</span>
                    <span className="text-white">{quote.pricing.breakdown.pricePerKmTP} €/km</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Détail du calcul financier */}
          {quote && (
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1.5">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <IconReceipt size={12} className="text-purple-400" /> Détail du Total
              </div>
              {serviceType === 'transfer' && quote.pricing.breakdown && (
                <>
                  {quote.pricing.breakdown.costCA_out !== undefined && (
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>Coût CA Aller :</span>
                      <span className="text-gray-200">{quote.pricing.breakdown.costCA_out.toFixed(2)} €</span>
                    </div>
                  )}
                  {quote.pricing.breakdown.costTP !== undefined && (
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>Coût TP :</span>
                      <span className="text-gray-200">{quote.pricing.breakdown.costTP.toFixed(2)} €</span>
                    </div>
                  )}
                  {quote.pricing.breakdown.costCA_return !== undefined && (
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>Coût CA Retour :</span>
                      <span className="text-gray-200">{quote.pricing.breakdown.costCA_return.toFixed(2)} €</span>
                    </div>
                  )}
                </>
              )}
              {quote.pricing.tollInfo?.detected && (
                <div className="flex justify-between text-amber-300 text-[10px]">
                  <span>Péages autoroute :</span>
                  <span>+{quote.pricing.tollInfo.totalIncluded.toFixed(2)} €</span>
                </div>
              )}
              {immobilisation && immobilisation.priceTTC > 0 && (
                <div className="flex justify-between text-amber-300 text-[10px]">
                  <span>Immobilisation retour :</span>
                  <span>+{immobilisation.priceTTC.toFixed(2)} €</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-1 flex justify-between text-gray-300">
                <span>Total HT :</span>
                <span className="font-semibold">{quote.pricing.totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>TVA (10%) :</span>
                <span>{quote.pricing.tva.toFixed(2)} €</span>
              </div>
              <div className="border-t border-white/10 pt-1 flex justify-between font-bold text-sm text-emerald-400">
                <span>Total TTC :</span>
                <span>{priceLabel}</span>
              </div>
            </div>
          )}

          {/* Raw JSON toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowJson(!showJson)}
              className="w-full text-center text-[10px] text-gray-400 hover:text-white py-1.5 px-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <IconCode size={12} />
              {showJson ? 'Masquer JSON brut' : 'Voir JSON brut'}
            </button>
            {showJson && (
              <pre className="mt-2 p-2 bg-black/60 rounded-lg text-[9px] text-emerald-300 overflow-x-auto max-h-48 overflow-y-auto font-mono">
                {JSON.stringify({
                  input: {
                    serviceType,
                    direction,
                    hours: serviceType === 'hourly' ? hours : undefined,
                    pickupPlace,
                    dropoffPlace,
                    selectedDate: selectedDate ? toISODate(selectedDate) : null,
                    selectedTime,
                    returnDate: returnDate ? toISODate(returnDate) : null,
                    returnTime,
                  },
                  quote,
                  immobilisation,
                  totalPrice,
                }, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- reservation flow --------------------------- */

function ReservationFlow() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'hourly' ? 'hourly' : 'transfer';
  const paramHours = parseFloat(searchParams.get('hours') || '2');

  const [step, setStep] = useState<Step>(1);

  const [pickupText, setPickupText] = useState('');
  const [pickupPlace, setPickupPlace] = useState<Place | null>(null);
  const [dropoffText, setDropoffText] = useState('');
  const [dropoffPlace, setDropoffPlace] = useState<Place | null>(null);
  const [serviceType, setServiceType] = useState<'transfer' | 'hourly'>(initialType);
  const [direction, setDirection] = useState<'one-way' | 'round-trip'>('one-way');
  const [hours, setHours] = useState<number>(!isNaN(paramHours) && paramHours >= 1 && paramHours <= 8 ? paramHours : 2);

  const [today] = useState(() => startOfDay(new Date()));
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [returnChoice, setReturnChoice] = useState<'' | 'same' | 'next' | 'custom'>('');
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [returnTime, setReturnTime] = useState('');
  const [returnViewMonth, setReturnViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [showReturnTime, setShowReturnTime] = useState(false);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [suitcases, setSuitcases] = useState(2);
  const [babySeat, setBabySeat] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [largeLuggage, setLargeLuggage] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Estimation temps réel
  const [quote, setQuote] = useState<Estimation | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Délai de réservation minimum (dépend du CA Aller dépôt → départ)
  const [earliestPickup, setEarliestPickup] = useState<Date | null>(null);

  // Soumission et OTP
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);

  const totalPassengers = adults + children + babies;

  /* ----------------------- timer de renvoi OTP ------------------------------- */

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /* ----------------------- délai minimum de réservation ---------------------- */

  useEffect(() => {
    if (!pickupPlace) {
      setEarliestPickup(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/booking/lead-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pickupLat: pickupPlace.lat, pickupLng: pickupPlace.lng }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success && data.earliestPickup) setEarliestPickup(new Date(data.earliestPickup));
      } catch {
        /* le délai minimum reste optionnel */
      }
    })();
    return () => controller.abort();
  }, [pickupPlace]);

  const minPickupDay = startOfDay(earliestPickup ?? today);

  // La date choisie devient invalide si le délai minimum la dépasse
  useEffect(() => {
    if (!earliestPickup) return;
    setSelectedDate((current) => {
      if (current && current < startOfDay(earliestPickup)) {
        setSelectedTime('');
        setShowTimePicker(false);
        return null;
      }
      return current;
    });
  }, [earliestPickup]);

  /* ------------------------------ estimation prix ---------------------------- */

  const returnDaysAfter: ReturnDaysAfter | null = useMemo(() => {
    if (direction !== 'round-trip' || !selectedDate || !returnDate) return null;
    const diff = Math.round((startOfDay(returnDate).getTime() - startOfDay(selectedDate).getTime()) / 86400000);
    return diff >= 1 && diff <= 3 ? (diff as ReturnDaysAfter) : null;
  }, [direction, selectedDate, returnDate]);

  useEffect(() => {
    if (!pickupPlace || !selectedDate || !selectedTime) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    if (serviceType === 'transfer' && !dropoffPlace) {
      setQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }

    const destination = dropoffPlace ?? pickupPlace;
    if (!destination) return;

    const controller = new AbortController();
    setQuoteLoading(true);
    setQuoteError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/pricing/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType,
            pickupAddress: pickupPlace.label,
            pickupLat: pickupPlace.lat,
            pickupLng: pickupPlace.lng,
            dropoffAddress: destination.label,
            dropoffLat: destination.lat,
            dropoffLng: destination.lng,
            pickupDate: toISODate(selectedDate),
            pickupTime: selectedTime,
            returnDate: serviceType === 'transfer' && direction === 'round-trip' && returnDate ? toISODate(returnDate) : undefined,
            returnTime: serviceType === 'transfer' && direction === 'round-trip' && returnTime ? returnTime : undefined,
            tripType: serviceType === 'hourly' ? 'one-way' : direction,
            hours: serviceType === 'hourly' ? hours : undefined,
            tollCost: 0,
            waitingMinutes: 0,
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || 'Estimation indisponible');
        }
        if (!controller.signal.aborted) setQuote(data.estimation as Estimation);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setQuote(null);
          setQuoteError((err as Error).message || 'Estimation indisponible');
        }
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [serviceType, pickupPlace, dropoffPlace, selectedDate, selectedTime, returnDate, returnTime, direction, hours]);

  // Immobilisation MAD pour un A/R avec retour 1 à 3 jours après l'aller
  const immobilisation = useMemo(() => {
    const totalAR = quote?.distances.totalAR;
    if (serviceType !== 'transfer' || !returnDaysAfter || typeof totalAR !== 'number') return null;
    return getImmobilisationMAD(totalAR, returnDaysAfter);
  }, [serviceType, quote, returnDaysAfter]);

  // A/R 1–3 jours interdit sous 25 km (forfait agglomération conseillé)
  const arTooShort = useMemo(() => {
    const totalAR = quote?.distances.totalAR;
    return serviceType === 'transfer' && !!returnDaysAfter && typeof totalAR === 'number' && !isAR13DaysAllowed(totalAR);
  }, [serviceType, quote, returnDaysAfter]);

  const totalPrice = quote ? quote.pricing.totalTTC + (immobilisation?.priceTTC ?? 0) : null;

  const priceLabel =
    totalPrice !== null
      ? `${totalPrice.toFixed(2).replace(/\.00$/, '')}€`
      : '—';

  /* -------------------------------- navigation ------------------------------- */

  const canContinue = (s: Step) => {
    if (s === 1) {
      if (!pickupPlace) return false;
      if (serviceType === 'transfer') return !!dropoffPlace;
      if (serviceType === 'hourly') return hours >= 0.5 && hours <= 8;
      return true;
    }
    if (s === 2) {
      if (!selectedDate || !selectedTime) return false;
      if (serviceType === 'transfer' && direction === 'round-trip') {
        if (!returnDate || !returnTime) return false;
        if (arTooShort) return false;
      }
      return !!quote && !quoteLoading && !quoteError;
    }
    if (s === 3) return adults >= 1 && totalPassengers <= 4;
    return (
      acceptTerms &&
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      phone.trim().replace(/\D/g, '').length >= 9 &&
      email.trim() !== '' &&
      email.includes('@')
    );
  };

  const goNext = () => {
    if (step < 4) setStep((step + 1) as Step);
  };
  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const passengersText = () => {
    const parts: string[] = [];
    if (adults > 0) parts.push(`${adults} adulte${adults > 1 ? 's' : ''}`);
    if (children > 0) parts.push(`${children} enfant${children > 1 ? 's' : ''}`);
    if (babies > 0) parts.push(`${babies} bébé${babies > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  /* -------------------------- soumission & OTP ------------------------------ */

  const handleBookingSubmit = async () => {
    if (!canContinue(4) || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const destination = dropoffPlace ?? pickupPlace!;

      const payload = {
        pickupAddress: pickupPlace!.label,
        pickupLat: pickupPlace!.lat,
        pickupLng: pickupPlace!.lng,
        dropoffAddress: destination.label,
        dropoffLat: destination.lat,
        dropoffLng: destination.lng,
        pickupDate: `${toISODate(selectedDate!)}T12:00:00.000Z`,
        pickupTime: selectedTime,
        ...(serviceType === 'transfer' && direction === 'round-trip' && returnDate ? {
          returnDate: `${toISODate(returnDate)}T12:00:00.000Z`,
          returnTime: returnTime,
        } : {}),
        passengers: totalPassengers,
        adults,
        children,
        babies,
        luggage: suitcases,
        serviceType,
        tripType: serviceType === 'hourly' ? 'one-way' : direction,
        ...(serviceType === 'hourly' ? {
          hours,
          isForfait: true,
          forfaitName: quote?.pricing.forfait?.name || `Forfait ${formatHours(hours)}`,
        } : {}),
        tollCost: quote?.pricing.tollInfo?.cost ?? 0,
        waitingMinutes: 0,
        distanceCA: quote?.distances.ca_out ?? 0,
        distanceTP: quote?.distances.tp ?? 0,
        distanceReturn: quote?.distances.ca_return ?? 0,
        distance: quote?.distances.tp ?? 0,
        duration: quote?.duration ?? 0,
        isNightRate: quote?.pricing.isNightRate ?? false,
        rateType: quote?.pricing.rateType ?? '',
        totalPriceHT: quote?.pricing.totalHT ?? 0,
        totalPriceTTC: totalPrice ?? 0,
        tvaAmount: quote?.pricing.tva ?? 0,
        basePrice: serviceType === 'hourly' ? (totalPrice ?? 0) : (quote?.pricing.totalHT ?? 0),
        totalPrice: totalPrice ?? 0,
        notes: [
          note.trim() ? `Note client : ${note.trim()}` : null,
          serviceType === 'hourly' ? `Mise à disposition ${formatHours(hours)} (${hours * 90} km inclus)` : null,
          babySeat ? 'Siège bébé demandé' : null,
          wheelchair ? 'Accessibilité PMR' : null,
          largeLuggage ? 'Bagage volumineux' : null,
          immobilisation?.label ? `Immobilisation : ${immobilisation.label}` : null,
        ].filter(Boolean).join(' | '),
        guestName: `${firstName.trim()} ${lastName.trim()}`,
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        cgvAccepted: true,
        paymentMethod: 'cash',
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.bookingId) {
        throw new Error(data.error || 'Impossible d’enregistrer votre demande.');
      }

      const bookingId = data.bookingId as number;
      setCreatedBookingId(bookingId);
      setShowOtp(true);

      const otpRes = await fetch('/api/bookings/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const otpData = await otpRes.json();
      if (otpData.success) {
        setOtpInfo('Un code à 6 chiffres vous a été envoyé par e-mail.');
        setResendIn(30);
      } else {
        setOtpError('Le code n’a pas pu être envoyé. Cliquez sur « Renvoyer le code ».');
      }
    } catch (err) {
      setSubmitError((err as Error).message || 'Erreur lors de l’enregistrement de votre demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpInput = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...otpCode];
      next[index] = '';
      setOtpCode(next);
      return;
    }
    const next = [...otpCode];
    clean.slice(0, 6 - index).split('').forEach((ch, i) => {
      if (index + i < 6) next[index + i] = ch;
    });
    setOtpCode(next);
    const nextIdx = Math.min(5, index + clean.length);
    document.getElementById(`otp-input-${nextIdx}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  const verifyOtp = async () => {
    if (!createdBookingId) return;
    const code = otpCode.join('');
    if (code.length !== 6) {
      setOtpError('Veuillez saisir le code à 6 chiffres.');
      return;
    }
    setSubmitting(true);
    setOtpError(null);
    try {
      const res = await fetch('/api/bookings/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: createdBookingId, otpCode: code }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setOtpError(data.error || 'Code invalide ou expiré.');
    } catch {
      setOtpError('Erreur de vérification. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (!createdBookingId || resendIn > 0) return;
    setOtpCode(['', '', '', '', '', '']);
    setOtpError(null);
    setOtpInfo(null);
    try {
      const res = await fetch('/api/bookings/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: createdBookingId }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpInfo('Un nouveau code vient de vous être envoyé.');
        setResendIn(30);
      } else {
        setOtpError('Le code n’a pas pu être envoyé. Réessayez dans un instant.');
      }
    } catch {
      setOtpError('Erreur lors de l’envoi. Réessayez.');
    }
  };

  /* ----------------------------------- page ---------------------------------- */

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 30%, #0f3060 50%, #0d2847 70%, #0a1628 100%)' }}>
      <HeroBg />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Step bar */}
        <div className="max-w-3xl mx-auto w-full px-6 pt-8 pb-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      done ? 'bg-[#4BC449] text-white' : active ? 'bg-white text-[#0d2847]' : 'bg-white/10 text-white/40'
                    }`}>
                      {done ? <IconCheck size={14} /> : num}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors ${done ? 'text-[#4BC449]' : active ? 'text-white' : 'text-white/30'}`}>{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-[2px] mx-3 mb-5 transition-colors duration-300 ${done ? 'bg-[#4BC449]' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 pb-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex gap-8 items-start">
              <div className="flex-1 min-w-0">

                {/* STEP 1: WHERE */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Où allez-vous ?</h2>
                      <p className="text-white/50 text-sm">Indiquez votre point de départ et le service souhaité.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                      <AddressField
                        label="Point de départ"
                        placeholder="Adresse de départ"
                        pinClass="text-[#4BC449]"
                        value={pickupText}
                        onTextChange={(t) => { setPickupText(t); setPickupPlace(null); }}
                        onSelect={(p) => { setPickupText(p.label); setPickupPlace(p); }}
                      />

                      {serviceType === 'transfer' ? (
                        <AddressField
                          label="Destination"
                          placeholder="Adresse d'arrivée"
                          pinClass="text-red-400"
                          value={dropoffText}
                          onTextChange={(t) => { setDropoffText(t); setDropoffPlace(null); }}
                          onSelect={(p) => { setDropoffText(p.label); setDropoffPlace(p); }}
                        />
                      ) : (
                        <AddressField
                          label="Arrêt final ou destination"
                          placeholder="Optionnel — par défaut retour au point de départ"
                          pinClass="text-blue-500"
                          value={dropoffText}
                          optional
                          onTextChange={(t) => { setDropoffText(t); setDropoffPlace(null); }}
                          onSelect={(p) => { setDropoffText(p.label); setDropoffPlace(p); }}
                        />
                      )}

                      <p className="text-xs text-gray-400">
                        Sélectionnez une adresse dans la liste pour lancer le calcul du tarif.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                      <label className="text-sm font-medium text-gray-700 block">Type de service</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'transfer' as const, label: 'Transfert', desc: 'Point A → Point B' },
                          { id: 'hourly' as const, label: 'Mise à disposition', desc: 'Chauffeur à l\'heure (forfaits)' },
                        ].map((t) => (
                          <button key={t.id} type="button" onClick={() => setServiceType(t.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              serviceType === t.id ? 'border-[#4BC449] bg-[#4BC449]/5' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <span className={`text-sm font-semibold block ${serviceType === t.id ? 'text-[#4BC449]' : 'text-gray-900'}`}>{t.label}</span>
                            <span className="text-xs text-gray-500">{t.desc}</span>
                          </button>
                        ))}
                      </div>

                      {serviceType === 'transfer' ? (
                        <>
                          <label className="text-sm font-medium text-gray-700 block pt-2">Direction</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { id: 'one-way' as const, label: 'Aller simple' },
                              { id: 'round-trip' as const, label: 'Aller-retour' },
                            ].map((d) => (
                              <button key={d.id} type="button" onClick={() => setDirection(d.id)}
                                className={`py-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                                  direction === d.id ? 'border-[#4BC449] bg-[#4BC449]/5 text-[#4BC449]' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}>
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 block">
                              Durée de mise à disposition (temps)
                            </label>
                            <span className="text-xs font-semibold text-[#4BC449] bg-[#4BC449]/10 px-2.5 py-1 rounded-full">
                              {formatHours(hours)} ({hours * 90} km inclus)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {HOURLY_FORFAITS.map((f) => (
                              <button
                                key={f.hours}
                                type="button"
                                onClick={() => setHours(f.hours)}
                                className={`py-2.5 px-2 rounded-xl border-2 text-center transition-all cursor-pointer ${
                                  hours === f.hours
                                    ? 'border-[#4BC449] bg-[#4BC449]/10 text-[#0d2847] font-bold shadow-sm'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                <span className="block text-sm font-semibold">{f.label}</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">{f.maxKm} km</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3 mt-3">
                            Chauffeur privé à disposition pour une durée de {formatHours(hours)}. Inclut jusqu&apos;à {hours * 90} km de trajet.
                          </p>
                        </div>
                      )}
                    </div>

                    <Nav step={step} ok={canContinue(1)} next={goNext} back={goBack} />
                  </div>
                )}

                {/* STEP 2: WHEN */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Quand partez-vous ?</h2>
                      <p className="text-white/50 text-sm">
                        {serviceType === 'hourly'
                          ? `Choisissez la date et l'heure de début de votre mise à disposition (${formatHours(hours)}).`
                          : 'Choisissez votre date et horaire de départ.'}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        {serviceType === 'hourly' ? 'Date de mise à disposition' : 'Date de départ'}
                      </h3>
                      <Calendar
                        viewMonth={viewMonth}
                        onMonthChange={setViewMonth}
                        selected={selectedDate}
                        minDate={minPickupDay}
                        onSelect={(d) => {
                          setSelectedDate(d);
                          setShowTimePicker(true);
                          if (returnDate && returnDate < d) {
                            setReturnDate(null);
                            setReturnTime('');
                            setReturnChoice('');
                            setShowReturnTime(false);
                          }
                        }}
                      />
                      {earliestPickup && (
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                          <IconClock size={13} />
                          Première prise en charge possible : {formatShortDate(earliestPickup)} à {pad(earliestPickup.getHours())}:{pad(earliestPickup.getMinutes())}
                        </p>
                      )}
                    </div>

                    {showTimePicker && selectedDate && (
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                          {serviceType === 'hourly' ? 'Heure de prise en charge' : 'Heure de départ'}
                        </h3>
                        <TimeGrid
                          value={selectedTime}
                          onChange={setSelectedTime}
                          minDateTime={earliestPickup}
                          day={selectedDate}
                        />
                      </div>
                    )}

                    {serviceType === 'transfer' && direction === 'round-trip' && selectedDate && selectedTime && (
                      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">Retour</h3>
                        <div className="space-y-2">
                          {[
                            { id: 'same' as const, label: 'Le même jour', detail: formatLongDate(selectedDate) },
                            { id: 'next' as const, label: 'Le lendemain', detail: formatLongDate(addDays(selectedDate, 1)) },
                            { id: 'custom' as const, label: 'Choisir une autre date', detail: '' },
                          ].map((opt) => (
                            <button key={opt.id} type="button"
                              onClick={() => {
                                setReturnChoice(opt.id);
                                if (opt.id === 'same') { setReturnDate(selectedDate); setShowReturnTime(true); setShowReturnCalendar(false); }
                                else if (opt.id === 'next') { setReturnDate(addDays(selectedDate, 1)); setShowReturnTime(true); setShowReturnCalendar(false); }
                                else {
                                  setReturnViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                                  setShowReturnCalendar(true);
                                  setShowReturnTime(false);
                                }
                              }}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                returnChoice === opt.id ? 'border-[#4BC449] bg-[#4BC449]/5' : 'border-gray-200 hover:border-gray-300'
                              }`}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${returnChoice === opt.id ? 'border-[#4BC449]' : 'border-gray-300'}`}>
                                {returnChoice === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#4BC449]" />}
                              </div>
                              <div>
                                <span className={`text-sm font-medium ${returnChoice === opt.id ? 'text-[#4BC449]' : 'text-gray-900'}`}>{opt.label}</span>
                                {opt.detail && <span className="text-xs text-gray-400 ml-2">{opt.detail}</span>}
                              </div>
                            </button>
                          ))}
                        </div>

                        {showReturnCalendar && (
                          <div className="pt-2">
                            <Calendar
                              compact
                              viewMonth={returnViewMonth}
                              onMonthChange={setReturnViewMonth}
                              selected={returnDate}
                              minDate={selectedDate}
                              onSelect={(d) => { setReturnDate(d); setShowReturnTime(true); }}
                            />
                          </div>
                        )}

                        {showReturnTime && returnDate && (
                          <div className="pt-2">
                            <h4 className="text-xs font-semibold text-gray-700 mb-3">Heure de retour</h4>
                            <TimeGrid
                              compact
                              value={returnTime}
                              onChange={setReturnTime}
                              minDateTime={sameDay(returnDate, selectedDate) ? combineDateTime(selectedDate, selectedTime) : null}
                              day={returnDate}
                            />
                          </div>
                        )}

                        {arTooShort && (
                          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                            <IconAlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                              Ce trajet fait moins de 25 km au total. Pour un aller-retour avec retour 1 à 3 jours après
                              l&apos;aller, nous vous conseillons le forfait agglomération (aller simple).
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Estimation */}
                    {quoteLoading ? (
                      <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center gap-3">
                        <IconLoader2 size={18} className="text-[#4BC449] animate-spin" />
                        <span className="text-sm text-gray-500">Calcul du tarif en cours…</span>
                      </div>
                    ) : quoteError ? (
                      <div className="bg-white rounded-2xl shadow-xl p-6 flex items-start gap-3">
                        <IconAlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Estimation indisponible</p>
                          <p className="text-xs text-gray-500 mt-0.5">{quoteError}</p>
                        </div>
                      </div>
                    ) : quote ? (
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Estimation du prix</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {serviceType === 'hourly'
                                ? `Mise à disposition ${formatHours(hours)} • ${quote.pricing.rateType}`
                                : `${direction === 'round-trip' ? 'Aller-retour' : 'Aller simple'} • ${quote.pricing.rateType}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-[#4BC449]">{priceLabel}</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">Prix forfaitaire TTC</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          {serviceType === 'hourly' ? (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1.5">
                                  <IconClock size={13} className="text-gray-400" />
                                  Durée du forfait
                                </span>
                                <span className="text-gray-900 font-medium">{formatHours(hours)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1.5">
                                  <IconRoute size={13} className="text-gray-400" />
                                  Distance incluse
                                </span>
                                <span className="text-gray-900 font-medium">Jusqu&apos;à {hours * 90} km</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1.5">
                                  <IconRoute size={13} className="text-gray-400" />
                                  Distance passager
                                </span>
                                <span className="text-gray-900 font-medium">{quote.distances.tp.toFixed(1)} km • {Math.round(quote.duration)} min</span>
                              </div>
                              {quote.pricing.tollInfo?.detected && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Péages inclus</span>
                                  <span className="text-gray-900 font-medium">{quote.pricing.tollInfo.totalIncluded.toFixed(2)}€</span>
                                </div>
                              )}
                              {immobilisation && immobilisation.priceTTC > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Immobilisation</span>
                                  <span className="text-gray-900 font-medium">{immobilisation.label}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Dont TVA (10%)</span>
                            <span className="text-gray-900 font-medium">{quote.pricing.tva.toFixed(2)}€</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                          {[
                            { icon: IconShieldCheck, text: 'Prix fixe garanti' },
                            { icon: IconClock, text: '60 min d\'annulation gratuite' },
                            ...(serviceType === 'hourly'
                              ? [{ icon: IconRoute, text: `${hours * 90} km inclus` }]
                              : [{ icon: IconClock, text: '10 min d\'attente gratuits' }]),
                            { icon: IconCalendar, text: 'Aucun paiement immédiat' },
                          ].map((chip) => (
                            <div key={chip.text} className="flex items-center gap-1.5 bg-[#4BC449]/5 border border-[#4BC449]/15 rounded-full px-3 py-1.5">
                              <chip.icon size={13} className="text-[#4BC449] shrink-0" />
                              <span className="text-xs font-medium text-[#4BC449]">{chip.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <Nav step={step} ok={canContinue(2)} next={goNext} back={goBack} />
                  </div>
                )}

                {/* STEP 3: PASSENGERS */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="mb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Qui voyage ?</h2>
                      <p className="text-white/50 text-sm">Indiquez le nombre de passagers et vos bagages.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Passagers</h3>
                      <div className="divide-y divide-gray-100">
                        {[
                          { label: 'Adultes', sub: '13 ans et +', value: adults, set: setAdults, min: 1, max: 4 },
                          { label: 'Enfants', sub: '2–12 ans', value: children, set: setChildren, min: 0, max: 3 },
                          { label: 'Bébés', sub: 'Moins de 2 ans', value: babies, set: setBabies, min: 0, max: 2 },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              <span className="text-xs text-gray-400 ml-2">{item.sub}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <button type="button" onClick={() => item.set(Math.max(item.min, item.value - 1))} disabled={item.value <= item.min}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <IconMinus size={14} />
                              </button>
                              <span className="text-lg font-bold text-gray-900 w-6 text-center">{item.value}</span>
                              <button type="button" onClick={() => item.set(Math.min(item.max, item.value + 1))} disabled={item.value >= item.max || totalPassengers >= 4}
                                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                                <IconPlus size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 mt-4 pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Bagages</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Valises</span>
                          <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setSuitcases(Math.max(0, suitcases - 1))} disabled={suitcases <= 0}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                              <IconMinus size={14} />
                            </button>
                            <span className="text-lg font-bold text-gray-900 w-6 text-center">{suitcases}</span>
                            <button type="button" onClick={() => setSuitcases(Math.min(6, suitcases + 1))} disabled={suitcases >= 6}
                              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                              <IconPlus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 mt-4 pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Besoins supplémentaires</h3>
                        <div className="space-y-2">
                          {[
                            { label: 'Siège bébé', active: babySeat, toggle: () => setBabySeat(!babySeat) },
                            { label: 'Accessibilité PMR', active: wheelchair, toggle: () => setWheelchair(!wheelchair) },
                            { label: 'Bagage volumineux', active: largeLuggage, toggle: () => setLargeLuggage(!largeLuggage) },
                          ].map((opt) => (
                            <label key={opt.label} className="flex items-center gap-3 cursor-pointer py-1">
                              <div onClick={opt.toggle}
                                className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors ${
                                  opt.active ? 'bg-[#4BC449] border-[#4BC449]' : 'border-gray-300'
                                }`}>
                                {opt.active && <IconCheck size={11} className="text-white" />}
                              </div>
                              <span className="text-sm text-gray-700">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Nav step={step} ok={canContinue(3)} next={goNext} back={goBack} />
                  </div>
                )}

                {/* STEP 4: CONFIRMATION OR OTP */}
                {step === 4 && (
                  showOtp ? (
                    <div className="space-y-5">
                      <div className="mb-2">
                        <h2 className="text-2xl font-bold text-white mb-1">Vérification de sécurité</h2>
                        <p className="text-white/50 text-sm">Confirmez votre demande avec le code reçu par e-mail.</p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-[#4BC449]/10 flex items-center justify-center mx-auto text-[#4BC449]">
                          <IconShieldCheck size={36} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Code de vérification</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Un code à 6 chiffres a été envoyé par e-mail à <strong className="text-gray-800 break-all">{email}</strong>.
                          </p>
                        </div>

                        <div className="flex justify-center gap-2">
                          {otpCode.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-input-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={digit}
                              onChange={(e) => handleOtpInput(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-[#4BC449] focus:outline-none transition-colors"
                            />
                          ))}
                        </div>

                        {otpError && (
                          <p className="text-xs text-red-600 font-medium">{otpError}</p>
                        )}
                        {otpInfo && (
                          <p className="text-xs text-[#4BC449] font-medium">{otpInfo}</p>
                        )}

                        <button
                          type="button"
                          onClick={verifyOtp}
                          disabled={submitting || otpCode.join('').length !== 6}
                          className="w-full py-3.5 bg-[#4BC449] hover:bg-[#3fb340] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-[#4BC449]/25 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {submitting ? (
                            <>
                              <IconLoader2 size={18} className="animate-spin" />
                              Vérification en cours…
                            </>
                          ) : (
                            <>
                              Confirmer ma réservation
                              <IconArrowRight size={18} />
                            </>
                          )}
                        </button>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setShowOtp(false)}
                            className="text-gray-600 hover:text-gray-900 underline cursor-pointer"
                          >
                            Modifier mes informations
                          </button>
                          <button
                            type="button"
                            onClick={resendOtp}
                            disabled={resendIn > 0}
                            className="text-[#4BC449] font-medium hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer"
                          >
                            {resendIn > 0 ? `Renvoyer (${resendIn}s)` : 'Renvoyer le code'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="mb-2">
                        <h2 className="text-2xl font-bold text-white mb-1">Confirmation</h2>
                        <p className="text-white/50 text-sm">Vérifiez votre réservation et finalisez.</p>
                      </div>

                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Récapitulatif</h3>
                        <div className="divide-y divide-gray-100">
                          {[
                            {
                              label: 'Service',
                              value: serviceType === 'hourly'
                                ? `Mise à disposition (${formatHours(hours)})`
                                : direction === 'round-trip'
                                  ? 'Transfert aller-retour'
                                  : 'Transfert aller simple',
                            },
                            { label: 'Départ', value: pickupText.split(',')[0] },
                            ...(serviceType === 'transfer' || dropoffText
                              ? [{ label: 'Destination', value: dropoffText.split(',')[0] || pickupText.split(',')[0] }]
                              : [{ label: 'Destination', value: 'Retour au point de départ' }]),
                            ...(serviceType === 'hourly'
                              ? [{ label: 'Durée & Distance', value: `${formatHours(hours)} • jusqu’à ${hours * 90} km inclus` }]
                              : []),
                            { label: 'Date', value: selectedDate ? formatLongDate(selectedDate) : '—' },
                            { label: 'Heure', value: selectedTime || '—' },
                            ...(serviceType === 'transfer' && direction === 'round-trip' && returnDate
                              ? [{ label: 'Retour', value: `${formatShortDate(returnDate)}${returnTime ? ` à ${returnTime}` : ''}` }]
                              : []),
                            ...(serviceType === 'transfer' && quote
                              ? [{ label: 'Distance', value: `${quote.distances.tp.toFixed(1)} km • ${Math.round(quote.duration)} min` }]
                              : []),
                            { label: 'Passagers', value: passengersText() || '1 adulte' },
                            { label: 'Bagages', value: `${suitcases} valise${suitcases > 1 ? 's' : ''}` },
                            { label: 'Prix estimé', value: priceLabel, highlight: true },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-3">
                              <span className="text-sm text-gray-500">{row.label}</span>
                              <span className={`text-sm font-medium ${(row as { highlight?: boolean }).highlight ? 'text-[#4BC449] text-lg font-bold' : 'text-gray-900'}`}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">Vos coordonnées</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Prénom</label>
                            <input type="text" placeholder="Votre prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Nom</label>
                            <input type="text" placeholder="Votre nom" value={lastName} onChange={(e) => setLastName(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Téléphone</label>
                            <input type="tel" placeholder="+33 6 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail</label>
                            <input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449]" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Note au chauffeur (optionnel)</label>
                          <textarea placeholder="Numéro de vol, accès particulier, itinéraire souhaité..." value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4BC449]/20 focus:border-[#4BC449] resize-none" />
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-xl p-5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div onClick={() => setAcceptTerms(!acceptTerms)}
                            className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                              acceptTerms ? 'bg-[#4BC449] border-[#4BC449]' : 'border-gray-300'
                            }`}>
                            {acceptTerms && <IconCheck size={11} className="text-white" />}
                          </div>
                          <span className="text-sm text-gray-700">
                            J&apos;accepte les <Link href="/cgv" target="_blank" className="text-[#4BC449] font-medium hover:underline">conditions générales</Link>
                          </span>
                        </label>
                      </div>

                      {submitError && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
                          <IconAlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <Nav
                        step={step}
                        ok={canContinue(4) && !submitting}
                        next={handleBookingSubmit}
                        back={goBack}
                        lastLabel={submitting ? 'Envoi en cours…' : 'Réserver maintenant'}
                      />

                      <div className="flex items-center justify-center gap-4 text-white/40 text-xs pb-2">
                        <span className="flex items-center gap-1"><IconShieldCheck size={14} /> Paiement sécurisé</span>
                        <span>•</span>
                        <span>Aucun paiement immédiat</span>
                        <span>•</span>
                        <span>Confirmation rapide</span>
                      </div>
                    </div>
                  )
                )}

                {/* Mobile Debug Inspector */}
                <div className="lg:hidden mt-8">
                  <PricingDebugSidebar
                    pickupPlace={pickupPlace}
                    dropoffPlace={dropoffPlace}
                    serviceType={serviceType}
                    direction={direction}
                    hours={hours}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    returnDate={returnDate}
                    returnTime={returnTime}
                    quote={quote}
                    quoteLoading={quoteLoading}
                    quoteError={quoteError}
                    immobilisation={immobilisation}
                    totalPrice={totalPrice}
                    priceLabel={priceLabel}
                  />
                </div>
              </div>

              {/* Sticky sidebar + Debug Inspector */}
              <div className="hidden lg:block w-[300px] shrink-0">
                <div className="sticky top-6 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1">
                  {/* Your Trip Card */}
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-5">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Votre trajet</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <IconMapPin size={14} className="text-[#4BC449] mt-0.5 shrink-0" />
                          <span className="text-sm leading-snug text-gray-900">{pickupText.split(',')[0] || <span className="text-gray-300">Départ</span>}</span>
                        </div>

                        {serviceType === 'transfer' ? (
                          <div className="flex items-start gap-2.5">
                            <IconMapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                            <span className="text-sm leading-snug text-gray-900">{dropoffText.split(',')[0] || <span className="text-gray-300">Destination</span>}</span>
                          </div>
                        ) : dropoffText ? (
                          <div className="flex items-start gap-2.5">
                            <IconMapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-sm leading-snug text-gray-900">{dropoffText.split(',')[0]}</span>
                          </div>
                        ) : null}

                        <div className="border-t border-gray-100 my-1" />

                        {serviceType === 'hourly' && (
                          <div className="flex items-center gap-2.5">
                            <IconClock size={14} className="text-[#4BC449] shrink-0" />
                            <span className="text-sm font-semibold text-gray-800">
                              {formatHours(hours)} ({hours * 90} km inclus)
                            </span>
                          </div>
                        )}

                        {selectedDate && (
                          <div className="flex items-center gap-2.5">
                            <IconCalendar size={14} className="text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700">{formatShortDate(selectedDate)}</span>
                          </div>
                        )}
                        {selectedTime && (
                          <div className="flex items-center gap-2.5">
                            <IconClock size={14} className="text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700">{selectedTime}</span>
                          </div>
                        )}
                        {serviceType === 'transfer' && quote && (
                          <div className="flex items-center gap-2.5">
                            <IconRoute size={14} className="text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700">{quote.distances.tp.toFixed(1)} km • {Math.round(quote.duration)} min</span>
                          </div>
                        )}
                        {step >= 3 && (
                          <>
                            <div className="flex items-center gap-2.5">
                              <IconUsers size={14} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700">{totalPassengers} passager{totalPassengers > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <IconLuggage size={14} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700">{suitcases} valise{suitcases > 1 ? 's' : ''}</span>
                            </div>
                          </>
                        )}
                        {(quote || quoteLoading) && (
                          <>
                            <div className="border-t border-gray-100 my-1" />
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-gray-400">Prix estimé</span>
                              {quoteLoading ? (
                                <IconLoader2 size={16} className="text-[#4BC449] animate-spin" />
                              ) : (
                                <span className="text-xl font-bold text-[#4BC449]">{priceLabel}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#4BC449]/5 border-t border-[#4BC449]/10 px-5 py-3">
                      <p className="text-[#4BC449] text-xs font-semibold flex items-center gap-1.5">
                        <IconPhone size={13} />
                        Besoin d&apos;aide ?
                      </p>
                      <a href={`tel:${CONTACT.whatsapp}`} className="text-gray-900 text-sm font-bold mt-0.5 block hover:underline">
                        {CONTACT.phone}
                      </a>
                    </div>
                  </div>

                  {/* Live Debug Calculations Section */}
                  <PricingDebugSidebar
                    pickupPlace={pickupPlace}
                    dropoffPlace={dropoffPlace}
                    serviceType={serviceType}
                    direction={direction}
                    hours={hours}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    returnDate={returnDate}
                    returnTime={returnTime}
                    quote={quote}
                    quoteLoading={quoteLoading}
                    quoteError={quoteError}
                    immobilisation={immobilisation}
                    totalPrice={totalPrice}
                    priceLabel={priceLabel}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Nav({
  step,
  ok,
  next,
  back,
  lastLabel,
}: {
  step: Step;
  ok: boolean;
  next: () => void;
  back: () => void;
  lastLabel?: string;
}) {
  return (
    <div className="flex items-center gap-4 pt-2">
      {step > 1 && (
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-sm font-medium text-white hover:bg-white/15 transition-colors cursor-pointer"
        >
          <IconArrowLeft size={16} />
          Retour
        </button>
      )}
      <button
        type="button"
        onClick={next}
        disabled={!ok}
        className={`flex items-center gap-2 ml-auto px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
          ok
            ? 'bg-[#4BC449] hover:bg-[#3fb340] text-white shadow-lg shadow-[#4BC449]/25 cursor-pointer'
            : 'bg-white/10 text-white/20 cursor-not-allowed'
        }`}
      >
        {step === 4 ? (lastLabel || 'Confirmer') : 'Continuer'}
        <IconArrowRight size={16} />
      </button>
    </div>
  );
}

function HeroBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#1a6090]/25 rounded-full blur-[150px]" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[300px] bg-[#145580]/20 rounded-full blur-[100px]" />
      <svg className="absolute top-[10%] left-[6%]" width="26" height="34" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="rgba(255,255,255,0.12)" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" />
      </svg>
      <svg className="absolute top-[6%] left-[3%] w-[250px] h-[600px]" viewBox="0 0 250 600" fill="none">
        <path d="M140 30 C 190 90, 40 140, 100 240 C 160 340, 30 380, 90 480 C 110 530, 70 570, 100 600" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="5 7" fill="none" />
      </svg>
      <div className="absolute top-[40%] left-[5.5%] w-3 h-3 rounded-full bg-[#4BC449] shadow-[0_0_16px_rgba(75,196,73,0.6)]" />
      <svg className="absolute bottom-[12%] left-[9%]" width="22" height="30" viewBox="0 0 24 32" fill="none">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="rgba(255,255,255,0.1)" />
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.15)" />
      </svg>
      <svg className="absolute bottom-0 left-[20%] w-[60%] h-[220px] opacity-[0.06]" viewBox="0 0 800 220" fill="none" preserveAspectRatio="xMidYMax meet">
        <path d="M0 220 L60 90 L100 140 L160 40 L220 130 L260 80 L320 150 L380 55 L440 135 L480 85 L540 155 L600 45 L660 125 L720 95 L800 220 Z" stroke="white" strokeWidth="1.2" fill="none" />
        <rect x="230" y="155" width="22" height="65" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="258" y="135" width="28" height="85" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="292" y="145" width="18" height="75" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="316" y="120" width="16" height="100" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="338" y="140" width="24" height="80" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="368" y="150" width="20" height="70" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="394" y="118" width="14" height="102" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="414" y="155" width="26" height="65" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <path d="M446 150 L455 90 L464 150" stroke="white" strokeWidth="0.8" fill="none" />
        <rect x="448" y="150" width="14" height="70" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="470" y="142" width="22" height="78" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <rect x="498" y="158" width="16" height="62" stroke="white" strokeWidth="0.8" fill="none" rx="1" />
        <path d="M180 220 C 300 195, 420 200, 560 220" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2847 30%, #0f3060 50%, #0d2847 70%, #0a1628 100%)' }} />}>
      <ReservationFlow />
    </Suspense>
  );
}
