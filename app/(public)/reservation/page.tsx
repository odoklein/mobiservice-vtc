'use client';

import { Suspense, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Instrument_Serif } from 'next/font/google';
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
  IconUser,
  IconLuggage,
  IconPhone,
  IconShieldCheck,
  IconLoader2,
  IconAlertTriangle,
  IconRoute,
  IconCalculator,
  IconStar,
  IconArrowsUpDown,
  IconArrowsExchange,
  IconClockHour4,
  IconMoon,
  IconMoonStars,
  IconSun,
  IconSunrise,
  IconSunset2,
  IconBabyCarriage,
  IconWheelchair,
  IconBriefcase,
  IconX,
} from '@tabler/icons-react';
import { CONTACT, POPULAR_LOCATIONS } from '@/lib/constants';
import { isFrenchHoliday } from '@/lib/holidays';
import { getImmobilisationMAD, isAR13DaysAllowed, type ReturnDaysAfter } from '@/lib/booking/immobilisation-mad';
import { TVA_RATE_MDA, TVA_RATE_TOLL, TVA_RATE_TRANSPORT } from '@/lib/pricing/tariffs-2026';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Trajet', 'Quand', 'Voyageurs', 'Confirmation'];
// Sur mobile, l'étape en cours prend plus de place pour afficher son nom en entier
const MOBILE_STEP_COLS = [
  'grid-cols-[3fr_1fr_1fr_1fr]',
  'grid-cols-[1fr_3fr_1fr_1fr]',
  'grid-cols-[1fr_1fr_3fr_1fr]',
  'grid-cols-[1fr_1fr_1fr_3fr]',
];

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Forfaits horaires par défaut : remplacés par ceux de l'admin (GET /api/pricing/forfaits)
const DEFAULT_HOURLY_FORFAITS = [
  { hours: 1, maxKm: 90 },
  { hours: 1.5, maxKm: 135 },
  { hours: 2, maxKm: 180 },
  { hours: 2.5, maxKm: 225 },
  { hours: 3, maxKm: 270 },
  { hours: 3.5, maxKm: 315 },
  { hours: 4, maxKm: 360 },
  { hours: 5, maxKm: 450 },
  { hours: 6, maxKm: 540 },
  { hours: 7, maxKm: 630 },
  { hours: 8, maxKm: 720 },
];

/* --------------------------------- design --------------------------------- */

// Titres en serif éditorial (chargée pour cette page seulement)
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const DISPLAY = 'font-[family-name:var(--font-display)] font-normal';
const GOLD = '#d9b36a';

/** Carte « papier » posée sur le fond nuit. */
const PANEL =
  'rounded-[28px] bg-[#fbf9f4] text-stone-900 ring-1 ring-black/5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] p-5 sm:p-8';
const OVERLINE = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500';
const FIELD_LABEL = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500';
const INPUT =
  'h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 transition focus:border-[#4BC449] focus:outline-none focus:ring-4 focus:ring-[#4BC449]/15';
const RISE = 'motion-safe:animate-[rise_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both]';

/** Courbes de niveau (relief alpin) : calculées une fois, arrondies pour un rendu identique serveur/client. */
const CONTOUR_PATHS: string[] = (() => {
  const paths: string[] = [];
  const cx = 640;
  const cy = 360;
  const n = 56;
  const f = (v: number) => v.toFixed(1);
  for (let k = 1; k <= 16; k++) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob =
        1 + 0.17 * Math.sin(3 * a + k * 0.31) + 0.09 * Math.sin(5 * a - k * 0.23 + 1) + 0.05 * Math.sin(2 * a + k * 0.1);
      const r = 30 * k * wob;
      pts.push([cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.95]);
    }
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    paths.push(`${d}Z`);
  }
  return paths;
})();

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 620px at 6% -8%, rgba(75,196,73,0.20), transparent 62%), radial-gradient(900px 560px at 100% 6%, rgba(217,179,106,0.14), transparent 58%), linear-gradient(180deg, #06101d 0%, #0a1b31 52%, #06101d 100%)',
        }}
      />
      <svg
        className="absolute -right-48 -top-10 h-[900px] w-[1500px] opacity-[0.17]"
        viewBox="0 0 1280 720"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {CONTOUR_PATHS.map((d, i) => (
          <path key={i} d={d} stroke={i % 4 === 0 ? GOLD : '#9fb8d4'} strokeWidth={i % 4 === 0 ? 1.4 : 0.8} />
        ))}
      </svg>
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

function StepHeader({ step, title, subtitle }: { step: Step; title: ReactNode; subtitle: ReactNode }) {
  return (
    <header className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: GOLD }}>
        Étape {pad(step)} <span className="text-white/30">/ 04</span>
      </p>
      <h1
        className={`${DISPLAY} text-[42px] leading-[1.02] tracking-[-0.02em] text-white sm:text-[58px] [&_em]:italic [&_em]:text-[#d9b36a]`}
      >
        {title}
      </h1>
      <p className="max-w-xl text-[15px] leading-relaxed text-white/65 sm:text-base">{subtitle}</p>
    </header>
  );
}

/** Intertitre d'une carte : petit libellé en capitales. */
function PanelTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className={OVERLINE}>{children}</h2>
      {hint && <p className="mt-1.5 text-sm text-stone-500">{hint}</p>}
    </div>
  );
}

/** Heure de nuit : avant 7h, à partir de 20h, ou toute la journée le dimanche et les jours fériés. */
const isNightSlot = (day: Date | null, time: string) => {
  const h = Number(time.slice(0, 2));
  return h < 7 || h >= 20 || (!!day && (day.getDay() === 0 || isFrenchHoliday(day)));
};

interface Place {
  label: string;
  lat: number;
  lng: number;
}

interface Estimation {
  kind?: 'transfer' | 'hourly';
  distances: { ca_out: number; tp: number; ca_return: number; total: number; totalAR?: number };
  duration: number;
  totalDuration?: number;
  durations?: { ca_out: number; tp: number; ca_return: number; total: number };
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
    mad?: { minutes: number; freeMinutes: number; chargeableMinutes: number; cost: number };
  };
  depot?: { address: string; coordinates: { lat: number; lng: number } };
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
const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const formatShortDate = (d: Date) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;

const formatHours = (h: number) => {
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  return minutes > 0 ? `${whole}h${minutes}` : `${whole}h`;
};

/** Grille du mois, semaines commençant le lundi. */
interface TvaSettings {
  tvaApplicable: boolean;
  tvaRate: number;
  tvaDisplayClient: boolean;
  tvaLegalMention: string;
}

/** Réglages TVA gérés par l'admin (Paramètres > Factures). */
function useTvaSettings(): TvaSettings {
  const [tva, setTva] = useState<TvaSettings>({
    tvaApplicable: true,
    tvaRate: 10,
    tvaDisplayClient: true,
    tvaLegalMention: '',
  });
  useEffect(() => {
    fetch('/api/settings/tva')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setTva(d))
      .catch(() => {});
  }, []);
  return tva;
}

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

/** Tarif unitaire au millième (les barèmes de l'admin se saisissent au millième, en HT). */
const round2 = (n: number) => Math.round(n * 100) / 100;
const formatEuro2 = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const formatPercent = (rate: number) => `${Math.round(rate * 100)} %`;
const formatKm = (n: number) => `${n.toFixed(1).replace('.', ',')} km`;

/** Une ligne du devis, découpée en HT + TVA = TTC (debug). */
interface TvaLine {
  label: string;
  detail?: string;
  ht: number;
  rate: number;
  tva: number;
  ttc: number;
}

function tvaLine(label: string, ttc: number, rate: number, detail?: string): TvaLine {
  const ht = round2(ttc / (1 + rate));
  return { label, detail, ht, rate, tva: round2(ttc - ht), ttc: round2(ttc) };
}

/**
 * Reconstitue chaque coût du devis en HT / TVA / TTC.
 * Le moteur (lib/pricing/tariffs-2026.ts) calcule en TTC : transport à 10 %, péages et attente à 20 %.
 */
function buildTvaLines(
  quote: Estimation,
  serviceType: 'transfer' | 'hourly',
  direction: 'one-way' | 'round-trip',
  immobilisation: { label: string; priceTTC: number } | null
): TvaLine[] {
  const lines: TvaLine[] = [];
  const { pricing, distances } = quote;
  const b = pricing.breakdown ?? {};

  if (serviceType === 'hourly' || quote.kind === 'hourly') {
    // Forfait mise à disposition : le moteur donne directement HT et TTC
    const rate = pricing.totalHT > 0 ? Math.round((pricing.totalTTC / pricing.totalHT - 1) * 100) / 100 : 0;
    lines.push({
      label: pricing.forfait?.name || b.forfaitName || 'Forfait mise à disposition',
      ht: pricing.totalHT,
      rate,
      tva: pricing.tva,
      ttc: pricing.totalTTC,
    });
  } else {
    const toll = pricing.tollInfo?.totalIncluded ?? b.tollCost ?? 0;
    const mad = b.madCost ?? 0;
    const transportTTC = round2(pricing.totalTTC - toll - mad);
    const perKm = (ttc: number, km: number) =>
      km > 0 ? `${formatKm(km)} à ${formatEuro2(ttc / (1 + TVA_RATE_TRANSPORT) / km)} HT le km` : undefined;

    if (b.isForfaitAgglomeration) {
      lines.push(tvaLine('Forfait courte distance', transportTTC, TVA_RATE_TRANSPORT, `${formatKm(distances.total)} au total`));
    } else {
      const caOut = b.costCA_out ?? 0;
      const tp = b.costTP ?? 0;
      const caReturn = b.costCA_return ?? 0;
      const tpKm = direction === 'round-trip' ? distances.tp * 2 : distances.tp;
      lines.push(tvaLine('Le chauffeur vient vous chercher', caOut, TVA_RATE_TRANSPORT, perKm(caOut, distances.ca_out)));
      lines.push(tvaLine(direction === 'round-trip' ? 'Votre trajet aller et retour' : 'Votre trajet', tp, TVA_RATE_TRANSPORT, perKm(tp, tpKm)));
      lines.push(tvaLine('Le chauffeur rentre au dépôt', caReturn, TVA_RATE_TRANSPORT, perKm(caReturn, distances.ca_return)));
      // Transport remonté au prix minimum de course (écart de quelques centimes = simple arrondi)
      const minimumAdjustment = round2(transportTTC - (caOut + tp + caReturn));
      if (minimumAdjustment > 0.02) {
        lines.push(tvaLine('Complément prix minimum de course', minimumAdjustment, TVA_RATE_TRANSPORT));
      }
    }
    if (toll > 0) {
      lines.push(tvaLine("Péages d'autoroute", toll, TVA_RATE_TOLL, direction === 'round-trip' ? 'aller et retour' : undefined));
    }
    if (mad > 0) {
      const minutes = pricing.mad?.chargeableMinutes;
      lines.push(tvaLine("Temps d'attente", mad, TVA_RATE_MDA, minutes ? `${minutes} min facturées` : undefined));
    }
  }

  if (immobilisation && immobilisation.priceTTC > 0) {
    lines.push(tvaLine('Attente avant le retour', immobilisation.priceTTC, TVA_RATE_MDA, immobilisation.label));
  }
  return lines;
}

/* ----------------------------- address field ------------------------------ */

const DOT: Record<'origin' | 'destination' | 'stop', string> = {
  origin: 'h-3 w-3 rounded-full bg-[#4BC449] ring-4 ring-[#4BC449]/20',
  destination: 'h-3 w-3 rounded-[3px] bg-stone-900 ring-4 ring-stone-900/10',
  stop: 'h-3 w-3 rotate-45 rounded-[2px] bg-[#d9b36a] ring-4 ring-[#d9b36a]/25',
};

/** Une ligne de l'itinéraire : le repère (rond, carré…) est relié à la ligne suivante par le rail du parent. */
function AddressField({
  label,
  placeholder,
  dot,
  value,
  confirmed,
  optional = false,
  onTextChange,
  onSelect,
}: {
  label: string;
  placeholder: string;
  dot: 'origin' | 'destination' | 'stop';
  value: string;
  confirmed: boolean;
  optional?: boolean;
  onTextChange: (text: string) => void;
  onSelect: (place: Place) => void;
}) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const listId = `${uid}-list`;
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      setOpen(true);
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
        setOpen(true);
        setHighlight(-1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);
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

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    onTextChange('');
    setSuggestions([]);
    setLoading(false);
    setOpen(true);
    inputRef.current?.focus();
  };

  const isShortcuts = value.trim().length < 3;
  const itemsToRender = isShortcuts
    ? POPULAR_LOCATIONS.map((p) => ({
        label: p.address,
        lat: p.lat,
        lng: p.lng,
        title: p.name,
        subtitle: p.address,
        category: p.category,
      }))
    : suggestions.map((s) => {
        const commaIdx = s.label.indexOf(',');
        const title = commaIdx === -1 ? s.label : s.label.slice(0, commaIdx).trim();
        const subtitle = commaIdx === -1 ? '' : s.label.slice(commaIdx + 1).trim();
        const isAir = /a[ée]roport|airport|terminal/i.test(s.label);
        const isTrain = /gare/i.test(s.label);
        return {
          ...s,
          title,
          subtitle,
          category: isAir ? 'airport' : isTrain ? 'train' : 'address',
        };
      });
  const listVisible = open && itemsToRender.length > 0;
  const noResult = open && !isShortcuts && !loading && suggestions.length === 0;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative rounded-2xl transition-colors focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_rgba(75,196,73,0.9)]">
        <span aria-hidden className={`absolute left-[22px] top-1/2 z-10 -translate-y-1/2 ${DOT[dot]}`} />
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute left-[56px] top-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
        >
          {label}
          {optional && <span className="ml-2 font-normal normal-case tracking-normal text-stone-400">optionnel</span>}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={listVisible}
          aria-controls={listId}
          aria-autocomplete="list"
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onTextChange(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || itemsToRender.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlight((i) => Math.min(i + 1, itemsToRender.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && highlight >= 0 && itemsToRender[highlight]) {
              e.preventDefault();
              choose(itemsToRender[highlight]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="h-[68px] w-full bg-transparent pb-0 pl-[56px] pr-24 pt-5 text-[17px] font-medium text-stone-900 placeholder:font-normal placeholder:text-stone-400 focus:outline-none"
        />
        <div className="absolute right-14 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {loading ? (
            <IconLoader2 size={18} aria-label="Recherche en cours" className="animate-spin text-stone-400" />
          ) : (
            value && (
              <>
                {confirmed && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4BC449]" title="Adresse confirmée">
                    <IconCheck size={13} strokeWidth={3} className="text-[#06210a]" aria-label="Adresse confirmée" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={clear}
                  aria-label={`Effacer — ${label}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-[#4BC449]"
                >
                  <IconX size={15} />
                </button>
              </>
            )
          )}
        </div>
      </div>

      {(listVisible || noResult) && (
        <div
          id={listId}
          role="listbox"
          aria-label={`Suggestions — ${label}`}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-black/10"
        >
          {isShortcuts && (
            <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              <IconStar size={12} className="fill-amber-400 text-amber-500" />
              Lieux populaires
            </div>
          )}
          {noResult && (
            <p className="px-3 py-3 text-sm text-stone-500">
              Aucune adresse trouvée. Ajoutez la ville ou le code postal (ex. « 74 »).
            </p>
          )}
          {itemsToRender.map((s, i) => (
            <div
              key={`${s.label}-${i}`}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={highlight === i}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                highlight === i ? 'bg-stone-100' : 'hover:bg-stone-50'
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-base">
                {s.category === 'airport' ? '✈️' : s.category === 'train' ? '🚂' : <IconMapPin size={16} className="text-stone-500" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-snug text-stone-900">{s.title}</span>
                {s.subtitle && s.subtitle !== s.title && (
                  <span className="block truncate text-xs leading-snug text-stone-500">{s.subtitle}</span>
                )}
              </span>
            </div>
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
  const today = startOfDay(new Date());
  const canGoPrev =
    new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1) >
    new Date(min.getFullYear(), min.getMonth(), 1);
  const navBtn =
    'flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]';

  return (
    <div>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-5'}`}>
        <button
          type="button"
          aria-label="Mois précédent"
          disabled={!canGoPrev}
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className={navBtn}
        >
          <IconChevronLeft size={18} />
        </button>
        <span className={`${DISPLAY} capitalize text-stone-900 ${compact ? 'text-xl' : 'text-[26px]'}`}>
          {MONTH_NAMES[viewMonth.getMonth()]} <span className="text-stone-400">{viewMonth.getFullYear()}</span>
        </span>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className={navBtn}
        >
          <IconChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
          <div key={d} className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth();
              const disabled = !inMonth || day < min;
              const isSel = sameDay(day, selected);
              const isToday = sameDay(day, today);
              const nightDay = day.getDay() === 0 || isFrenchHoliday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => !disabled && onSelect(day)}
                  disabled={disabled}
                  aria-pressed={isSel}
                  aria-label={formatLongDate(day)}
                  className={`relative ${compact ? 'h-9 text-xs' : 'h-11 text-[15px]'} rounded-xl font-medium tabular-nums transition ${
                    !inMonth
                      ? 'invisible'
                      : isSel
                        ? 'bg-[#07111f] text-white shadow-[0_8px_20px_-6px_rgba(7,17,31,0.6)]'
                        : disabled
                          ? 'cursor-not-allowed text-stone-300'
                          : 'cursor-pointer text-stone-800 hover:bg-stone-200/70'
                  }`}
                >
                  {day.getDate()}
                  {inMonth && isToday && !isSel && (
                    <span aria-hidden className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#4BC449]" />
                  )}
                  {inMonth && nightDay && !disabled && (
                    <span
                      aria-hidden
                      className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${isSel ? 'bg-[#d9b36a]' : 'bg-indigo-400'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-stone-500">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
        Dimanche et jours fériés : tarif de nuit toute la journée
      </p>
    </div>
  );
}

/* --------------------------------- time grid ------------------------------ */

const TIME_GROUPS: Array<{ label: string; icon: typeof IconSun; from: number; to: number }> = [
  { label: 'Matin', icon: IconSunrise, from: 6, to: 12 },
  { label: 'Après-midi', icon: IconSun, from: 12, to: 18 },
  { label: 'Soirée', icon: IconSunset2, from: 18, to: 24 },
  { label: 'Nuit', icon: IconMoonStars, from: 0, to: 6 },
];

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
      <div className="relative">
      <div className={`${compact ? 'max-h-60' : 'max-h-[26rem]'} space-y-5 overflow-y-auto pb-6 pr-1 [scrollbar-width:thin]`}>
        {TIME_GROUPS.map((group) => {
          const slots = TIME_SLOTS.filter((t) => {
            const h = Number(t.slice(0, 2));
            return h >= group.from && h < group.to;
          });
          return (
            <div key={group.label}>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                <group.icon size={14} aria-hidden />
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {slots.map((t) => {
                  const disabled = isDisabled(t);
                  const night = isNightSlot(day, t);
                  const selected = value === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(t)}
                      aria-pressed={selected}
                      className={`relative ${compact ? 'h-9 text-xs' : 'h-11 text-sm'} rounded-xl border font-medium tabular-nums transition ${
                        selected
                          ? 'border-[#07111f] bg-[#07111f] text-white shadow-[0_8px_20px_-6px_rgba(7,17,31,0.6)]'
                          : disabled
                            ? 'cursor-not-allowed border-stone-100 text-stone-300'
                            : 'cursor-pointer border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                      }`}
                    >
                      {t}
                      {night && !disabled && (
                        <IconMoon
                          size={10}
                          aria-hidden
                          className={`absolute right-1 top-1 ${selected ? 'text-[#d9b36a]' : 'text-indigo-400'}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#fbf9f4] to-transparent" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-stone-500">
          <IconMoon size={12} className="text-indigo-400" aria-hidden />
          Tarif de nuit : 20h – 7h
        </span>
        <label className="flex items-center gap-2 text-xs text-stone-500">
          Heure précise
          <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:border-[#4BC449] focus:outline-none focus:ring-4 focus:ring-[#4BC449]/15"
          />
        </label>
      </div>
    </div>
  );
}

/* ------------------------------ trip ticket ------------------------------- */

/** Encoches de perforation à la hauteur `y` (un seul masque : pas de joint entre le haut et le bas du billet). */
const notchStyle = (y: number | null): CSSProperties => {
  if (y === null) return {};
  const mask = `radial-gradient(circle 12px at 0 ${y}px, #0000 11px, #000 12px), radial-gradient(circle 12px at 100% ${y}px, #0000 11px, #000 12px)`;
  return { WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' };
};

/** Récapitulatif façon billet : trajet en haut, prix sous la perforation. */
function TripTicket({
  pickupText,
  dropoffText,
  serviceType,
  direction,
  hours,
  selectedDate,
  selectedTime,
  returnDate,
  returnTime,
  quote,
  quoteLoading,
  totalPrice,
  step,
  totalPassengers,
  suitcases,
  tvaSettings,
}: {
  pickupText: string;
  dropoffText: string;
  serviceType: 'transfer' | 'hourly';
  direction: 'one-way' | 'round-trip';
  hours: number;
  selectedDate: Date | null;
  selectedTime: string;
  returnDate: Date | null;
  returnTime: string;
  quote: Estimation | null;
  quoteLoading: boolean;
  totalPrice: number | null;
  step: Step;
  totalPassengers: number;
  suitcases: number;
  tvaSettings: TvaSettings;
}) {
  const split = (text: string) => {
    const idx = text.indexOf(',');
    return idx === -1 ? { name: text.trim(), sub: '' } : { name: text.slice(0, idx).trim(), sub: text.slice(idx + 1).trim() };
  };
  const from = split(pickupText);
  const to = split(dropoffText);
  const isRound = serviceType === 'transfer' && direction === 'round-trip';
  const topRef = useRef<HTMLDivElement>(null);
  const [notchY, setNotchY] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const measure = () => setNotchY(el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [whole, cents] = totalPrice !== null ? totalPrice.toFixed(2).split('.') : ['', ''];

  const stats: Array<{ label: string; value: string }> = [];
  if (selectedDate) stats.push({ label: 'Départ', value: `${formatShortDate(selectedDate)}${selectedTime ? ` · ${selectedTime}` : ''}` });
  if (isRound && returnDate) stats.push({ label: 'Retour', value: `${formatShortDate(returnDate)}${returnTime ? ` · ${returnTime}` : ''}` });
  if (serviceType === 'transfer' && quote) {
    stats.push({ label: 'Distance', value: `${quote.distances.tp.toFixed(1).replace('.', ',')} km` });
    stats.push({ label: 'Durée', value: `${Math.round(quote.duration)} min` });
  }
  if (step >= 3) {
    stats.push({ label: 'Passagers', value: String(totalPassengers) });
    stats.push({ label: 'Valises', value: String(suitcases) });
  }

  return (
    <div className="drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]">
     <div className="rounded-[28px] bg-[#fbf9f4] text-stone-900" style={notchStyle(notchY)}>
      <div ref={topRef} className="px-6 pb-7 pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className={OVERLINE}>Votre trajet</p>
          <span className="rounded-full bg-[#07111f] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            {serviceType === 'hourly' ? `À disposition · ${formatHours(hours)}` : isRound ? 'Aller-retour' : 'Aller simple'}
          </span>
        </div>

        <div className="relative mt-6 flex flex-col gap-6 pl-8">
          <span aria-hidden className="absolute bottom-3 left-[5px] top-3 border-l-2 border-dashed border-stone-300" />
          <div className="relative">
            <span aria-hidden className={`absolute -left-8 top-[7px] ${DOT.origin}`} />
            <p className="text-[17px] font-semibold leading-tight">
              {from.name || <span className="font-normal text-stone-300">Départ</span>}
            </p>
            {from.sub && <p className="mt-0.5 truncate text-xs text-stone-500">{from.sub}</p>}
          </div>
          {(serviceType === 'transfer' || to.name) && (
            <div className="relative">
              <span aria-hidden className={`absolute -left-8 top-[7px] ${serviceType === 'transfer' ? DOT.destination : DOT.stop}`} />
              <p className="text-[17px] font-semibold leading-tight">
                {to.name || <span className="font-normal text-stone-300">Destination</span>}
              </p>
              {to.sub && <p className="mt-0.5 truncate text-xs text-stone-500">{to.sub}</p>}
            </div>
          )}
        </div>

        {stats.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-stone-200 pt-5">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{s.label}</dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="relative px-6 pb-6 pt-7">
        <div aria-hidden className="absolute inset-x-6 top-0 border-t-2 border-dashed border-stone-300" />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={OVERLINE}>Prix estimé</p>
            {quoteLoading ? (
              <div
                aria-label="Calcul du prix en cours"
                className="mt-3 h-14 w-44 rounded-xl bg-[linear-gradient(90deg,#e7e5e4_25%,#f5f5f4_50%,#e7e5e4_75%)] bg-[length:200%_100%] motion-safe:animate-[shimmer_1.4s_linear_infinite]"
              />
            ) : totalPrice !== null ? (
              <p className="mt-1 flex items-baseline" aria-label={`${totalPrice.toFixed(2)} euros`}>
                <span className={`${DISPLAY} text-[68px] leading-none tracking-tight tabular-nums`}>{whole}</span>
                <span className="ml-1 text-2xl font-medium text-stone-500">
                  {cents !== '00' ? `,${cents}` : ''} €
                </span>
              </p>
            ) : (
              <p className={`${DISPLAY} mt-1 text-[68px] leading-none text-stone-300`}>—</p>
            )}
            <p className="mt-2 text-xs text-stone-500">
              {tvaSettings.tvaApplicable ? 'Prix forfaitaire TTC' : 'Prix forfaitaire'}
              {!tvaSettings.tvaApplicable && tvaSettings.tvaLegalMention ? ` — ${tvaSettings.tvaLegalMention}` : ''}
            </p>
          </div>
          {quote && !quoteLoading && (
            <span
              className={`mb-1 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                quote.pricing.isNightRate ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {quote.pricing.isNightRate ? <IconMoon size={13} /> : <IconSun size={13} />}
              {quote.pricing.breakdown?.isMixedRate ? 'Jour & nuit' : quote.pricing.isNightRate ? 'Tarif nuit' : 'Tarif jour'}
            </span>
          )}
        </div>

        {!quote && !quoteLoading && (
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            Renseignez le trajet, la date et l&apos;heure : le prix s&apos;affiche ici.
          </p>
        )}

        <ul className="mt-5 space-y-2 text-sm text-stone-700">
          <li className="flex items-center gap-2.5">
            <IconShieldCheck size={16} className="shrink-0 text-[#1f7a24]" /> Prix fixe garanti
          </li>
          <li className="flex items-center gap-2.5">
            <IconCalendar size={16} className="shrink-0 text-[#1f7a24]" /> Aucun paiement immédiat
          </li>
        </ul>

        <a
          href={`tel:${CONTACT.whatsapp}`}
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-stone-100 px-4 py-3 transition-colors hover:bg-stone-200/80 focus-visible:outline-2 focus-visible:outline-[#4BC449]"
        >
          <span className="flex items-center gap-2.5 text-xs font-medium text-stone-600">
            <IconPhone size={16} className="text-[#1f7a24]" />
            Besoin d&apos;aide ?
          </span>
          <span className="text-sm font-bold tabular-nums text-stone-900">{CONTACT.phone}</span>
        </a>
      </div>
     </div>
    </div>
  );
}

/* -------------------------- debug calculations sidebar -------------------- */

function PricingDebugSidebar({
  serviceType,
  direction,
  hours,
  quote,
  quoteLoading,
  quoteError,
  immobilisation,
  totalPrice,
  priceLabel,
  includedKm,
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
  includedKm: number;
}) {
  const [expanded, setExpanded] = useState(true);

  const tvaLines = quote ? buildTvaLines(quote, serviceType, direction, immobilisation) : null;
  const totals = tvaLines
    ? {
        ht: round2(tvaLines.reduce((sum, l) => sum + l.ht, 0)),
        tva: round2(tvaLines.reduce((sum, l) => sum + l.tva, 0)),
        ttc: round2(tvaLines.reduce((sum, l) => sum + l.ttc, 0)),
      }
    : null;
  const matchesPrice = totals !== null && totalPrice !== null && Math.abs(round2(totals.ttc - totalPrice)) < 0.01;
  const isRoundTrip = direction === 'round-trip';

  const row = (label: ReactNode, value: ReactNode, strong = false) => (
    <div className={`flex justify-between gap-3 ${strong ? 'font-semibold text-white' : 'text-white/70'}`}>
      <span>{label}</span>
      <span className="text-right whitespace-nowrap tabular-nums text-white">{value}</span>
    </div>
  );

  return (
    <div className="rounded-[28px] bg-white/[0.06] ring-1 ring-white/12 backdrop-blur-md text-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/5 border-b border-white/10 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4BC449]"
      >
        <span className="flex items-center gap-2.5 font-semibold text-sm">
          <span className="w-9 h-9 rounded-xl bg-[#4BC449]/15 flex items-center justify-center shrink-0">
            <IconCalculator size={16} className="text-[#4BC449]" />
          </span>
          Comment est calculé votre prix
        </span>
        {expanded ? <IconChevronUp size={16} className="text-white/45" /> : <IconChevronDown size={16} className="text-white/45" />}
      </button>

      {expanded && (
        <div className="p-5 space-y-5 text-[15px] leading-relaxed">
          {quoteLoading ? (
            <div className="flex items-center gap-2 text-white/70">
              <IconLoader2 size={15} className="animate-spin shrink-0 text-[#4BC449]" />
              <span>Calcul du prix en cours…</span>
            </div>
          ) : quoteError ? (
            <div className="text-red-200 bg-red-500/10 border border-red-400/30 p-3 rounded-xl">{quoteError}</div>
          ) : !quote ? (
            <p className="text-white/55">
              Indiquez le départ, l&apos;arrivée, la date et l&apos;heure : le détail du prix s&apos;affichera ici.
            </p>
          ) : null}

          {quote && (
            <>
              {/* Le trajet */}
              <section className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  <IconRoute size={15} className="text-[#4BC449]" /> Le trajet
                </h3>
                {serviceType === 'hourly' ? (
                  <>
                    {row('Forfait choisi', formatHours(hours))}
                    {row('Kilomètres inclus', `${includedKm} km maximum`)}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-white/55">
                      Le chauffeur part de son dépôt à Cluses, vient vous chercher, vous conduit, puis rentre au dépôt.
                    </p>
                    {row('Le chauffeur vient vous chercher', formatKm(quote.distances.ca_out))}
                    {row(isRoundTrip ? 'Votre trajet (un sens)' : 'Votre trajet', formatKm(quote.distances.tp))}
                    {row('Le chauffeur rentre au dépôt', formatKm(quote.distances.ca_return))}
                    <div className="border-t border-white/10 pt-1.5">{row('Distance totale', formatKm(quote.distances.total), true)}</div>
                    {quote.duration > 0 && row('Durée de votre trajet', `environ ${Math.round(quote.duration)} min`)}
                  </>
                )}
              </section>

              {/* Tarif */}
              <section className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                  <IconClock size={15} className="text-[#4BC449]" /> Tarif appliqué
                </h3>
                <p className="text-white/70">
                  {quote.pricing.breakdown?.isMixedRate
                    ? quote.pricing.rateType
                    : quote.pricing.isNightRate
                      ? '🌙 Tarif de nuit (20h–7h), dimanche ou jour férié'
                      : '☀️ Tarif de jour (7h–20h, hors dimanche et jours fériés)'}
                </p>
              </section>

              {tvaLines && totals && (
                <>
                  {/* 1. Prix hors taxes */}
                  <section className="bg-white/[0.06] rounded-2xl p-4 space-y-2">
                    <h3 className="text-base font-semibold text-white">1. Prix hors taxes (HT)</h3>
                    {tvaLines.map((line) => (
                      <div key={line.label} className="flex justify-between gap-3">
                        <span className="text-white/70">
                          {line.label}
                          {line.detail && <span className="block text-xs text-white/45">{line.detail}</span>}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">{formatEuro2(line.ht)}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/15 pt-2">{row('Total hors taxes', formatEuro2(totals.ht), true)}</div>
                  </section>

                  {/* 2. TVA */}
                  <section className="bg-white/[0.06] rounded-2xl p-4 space-y-2">
                    <h3 className="text-base font-semibold text-white">2. TVA ajoutée</h3>
                    <p className="text-xs text-white/55">
                      TVA de 10 % sur le transport, 20 % sur les péages et le temps d&apos;attente.
                    </p>
                    {tvaLines.map((line) => (
                      <div key={line.label} className="flex justify-between gap-3">
                        <span className="text-white/70">
                          {line.label}
                          <span className="block text-xs text-white/45">
                            {formatPercent(line.rate)} de {formatEuro2(line.ht)}
                          </span>
                        </span>
                        <span className="whitespace-nowrap tabular-nums">+ {formatEuro2(line.tva)}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/15 pt-2">{row('Total TVA', formatEuro2(totals.tva), true)}</div>
                  </section>

                  {/* 3. Prix TTC */}
                  <section className="bg-[#4BC449]/12 border border-[#4BC449]/30 rounded-2xl p-4 space-y-2">
                    <h3 className="text-base font-semibold text-white">3. Prix toutes taxes comprises (TTC)</h3>
                    {tvaLines.map((line) => (
                      <div key={line.label} className="flex justify-between gap-3">
                        <span className="text-white/70">
                          {line.label}
                          <span className="block text-xs text-white/45">
                            {formatEuro2(line.ht)} + {formatEuro2(line.tva)} de TVA
                          </span>
                        </span>
                        <span className="whitespace-nowrap tabular-nums">{formatEuro2(line.ttc)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#4BC449]/30 pt-2 flex justify-between items-end gap-3">
                      <span>
                        <span className="block font-semibold text-white">Prix total</span>
                        <span className="block text-xs text-white/55">
                          {formatEuro2(totals.ht)} HT + {formatEuro2(totals.tva)} de TVA
                        </span>
                      </span>
                      <span className="text-2xl font-bold text-white whitespace-nowrap tabular-nums">{formatEuro2(totals.ttc)}</span>
                    </div>
                    {!matchesPrice && (
                      <p className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 p-2 rounded-lg">
                        Ce détail diffère du prix affiché ({priceLabel}). Merci de nous contacter pour vérification.
                      </p>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- reservation flow --------------------------- */

function ReservationFlow() {
  const tvaSettings = useTvaSettings();
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
  const [hours, setHours] = useState<number>(!isNaN(paramHours) && paramHours >= 0.5 && paramHours <= 24 ? paramHours : 2);
  const [hourlyForfaits, setHourlyForfaits] = useState(DEFAULT_HOURLY_FORFAITS);
  const includedKm = hourlyForfaits.find((f) => f.hours === hours)?.maxKm ?? Math.round(hours * 90);

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

  /* ----------------------- forfaits horaires (admin) ------------------------- */

  useEffect(() => {
    fetch('/api/pricing/forfaits')
      .then((res) => res.json())
      .then((data) => {
        const list: Array<{ hours: number; maxKm: number }> = data?.forfaits ?? [];
        if (!data?.success || list.length === 0) return;
        setHourlyForfaits(list);
        // Durée choisie absente de la liste : forfait le plus proche au-dessus (sinon le plus long)
        setHours((h) => (list.some((f) => f.hours === h) ? h : (list.find((f) => f.hours >= h) ?? list[list.length - 1]).hours));
      })
      .catch(() => {
        // Garde la liste par défaut
      });
  }, []);

  /* ----------------------- retour en haut à chaque changement d'étape --------- */

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [step, showOtp]);

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
      ? `${totalPrice.toFixed(2).replace(/\.00$/, '').replace('.', ',')} €`
      : '—';

  /* -------------------------------- navigation ------------------------------- */

  const canContinue = (s: Step) => {
    if (s === 1) {
      if (!pickupPlace) return false;
      if (serviceType === 'transfer') return !!dropoffPlace;
      if (serviceType === 'hourly') return hourlyForfaits.some((f) => f.hours === hours);
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
          serviceType === 'hourly' ? `Mise à disposition ${formatHours(hours)} (${includedKm} km inclus)` : null,
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

  /** Ce qui manque pour continuer (affiché sous le bouton quand il est grisé). */
  const nextHint = (): string | null => {
    if (step === 1) {
      if (!pickupPlace) return pickupText.trim() ? 'Choisissez votre adresse de départ dans la liste' : 'Indiquez votre adresse de départ';
      if (serviceType === 'transfer' && !dropoffPlace) {
        return dropoffText.trim() ? 'Choisissez votre destination dans la liste' : 'Indiquez votre destination';
      }
      return null;
    }
    if (step === 2) {
      if (!selectedDate) return 'Choisissez une date';
      if (!selectedTime) return 'Choisissez une heure';
      if (serviceType === 'transfer' && direction === 'round-trip') {
        if (!returnDate) return 'Choisissez la date du retour';
        if (!returnTime) return 'Choisissez l’heure du retour';
        if (arTooShort) return 'Retour trop proche : voir l’avertissement ci-dessus';
      }
      if (quoteLoading) return 'Calcul du tarif en cours…';
      if (quoteError) return 'Estimation indisponible pour le moment';
      return null;
    }
    if (step === 4 && !showOtp) {
      if (!firstName.trim() || !lastName.trim()) return 'Indiquez votre prénom et votre nom';
      if (phone.trim().replace(/\D/g, '').length < 9) return 'Indiquez un numéro de téléphone valide';
      if (!email.trim() || !email.includes('@')) return 'Indiquez une adresse e-mail valide';
      if (!acceptTerms) return 'Acceptez les conditions générales pour réserver';
    }
    return null;
  };

  const fillFromShortcut = (p: (typeof POPULAR_LOCATIONS)[number]) => {
    const place: Place = { label: p.address, lat: p.lat, lng: p.lng };
    if (!pickupPlace) {
      setPickupText(place.label);
      setPickupPlace(place);
    } else {
      setDropoffText(place.label);
      setDropoffPlace(place);
    }
  };

  const swapAddresses = () => {
    setPickupText(dropoffText);
    setPickupPlace(dropoffPlace);
    setDropoffText(pickupText);
    setDropoffPlace(pickupPlace);
  };

  const ticket = (
    <TripTicket
      pickupText={pickupText}
      dropoffText={dropoffText}
      serviceType={serviceType}
      direction={direction}
      hours={hours}
      selectedDate={selectedDate}
      selectedTime={selectedTime}
      returnDate={returnDate}
      returnTime={returnTime}
      quote={quote}
      quoteLoading={quoteLoading}
      totalPrice={totalPrice}
      step={step}
      totalPassengers={totalPassengers}
      suitcases={suitcases}
      tvaSettings={tvaSettings}
    />
  );

  const breakdown = (
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
      includedKm={includedKm}
    />
  );

  const navProps = {
    step,
    next: goNext,
    back: goBack,
    hint: nextHint(),
    price: totalPrice !== null ? priceLabel : null,
  };

  return (
    <div className={`${display.variable} relative min-h-screen overflow-hidden bg-[#06101d] text-white`}>
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Progression */}
        <nav aria-label="Progression de la réservation" className="mx-auto w-full max-w-[1320px] px-5 pt-8 sm:px-8 sm:pt-12">
          <ol className={`grid gap-2 transition-[grid-template-columns] duration-500 sm:grid-cols-4 sm:gap-6 ${MOBILE_STEP_COLS[step - 1]}`}>
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={!done}
                    aria-current={active ? 'step' : undefined}
                    onClick={() => {
                      setShowOtp(false);
                      setStep(num as Step);
                    }}
                    className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4BC449] disabled:cursor-default"
                  >
                    <span className="block h-[3px] overflow-hidden rounded-full bg-white/12">
                      <span
                        className={`block h-full rounded-full transition-all duration-700 ${
                          active ? 'bg-[#4BC449] shadow-[0_0_14px_rgba(75,196,73,0.8)]' : done ? 'bg-[#d9b36a]' : ''
                        }`}
                        style={{ width: active || done ? '100%' : '0%' }}
                      />
                    </span>
                    <span className="mt-3 flex items-baseline gap-2">
                      <span
                        className={`text-[11px] font-semibold tabular-nums tracking-[0.2em] ${
                          active ? 'text-[#4BC449]' : done ? 'text-[#d9b36a]' : 'text-white/30'
                        }`}
                      >
                        {pad(num)}
                      </span>
                      <span
                        className={`truncate text-[13px] font-medium transition-colors sm:text-sm ${
                          active ? 'text-white' : 'hidden sm:inline'
                        } ${done ? 'text-white/80 group-hover:text-white' : !active ? 'text-white/35' : ''}`}
                      >
                        {label}
                      </span>
                      {done && <IconCheck size={13} className="hidden shrink-0 text-[#d9b36a] sm:block" aria-label="terminée" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <main className="flex-1 pb-12 pt-10 sm:pt-14">
          <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
            <div className="flex flex-col items-start gap-10 lg:flex-row xl:gap-14">
              <div className="w-full min-w-0 max-w-[780px] flex-1">
                <div key={`${step}-${showOtp ? 'otp' : 'form'}`} className={`${RISE} space-y-7`}>
                  {/* ============================ STEP 1 : OÙ ============================ */}
                  {step === 1 && (
                    <>
                      <StepHeader
                        step={1}
                        title={
                          <>
                            Où <em>allez-vous</em> ?
                          </>
                        }
                        subtitle="Indiquez votre départ, votre destination et le type de service."
                      />

                      <div>
                        <div className={`${PANEL} !p-2 sm:!p-2.5`}>
                          <div className="relative">
                            <AddressField
                              dot="origin"
                              label="Départ"
                              placeholder="Adresse, gare, aéroport, hôpital…"
                              value={pickupText}
                              confirmed={!!pickupPlace}
                              onTextChange={(t) => {
                                setPickupText(t);
                                setPickupPlace(null);
                              }}
                              onSelect={(p) => {
                                setPickupText(p.label);
                                setPickupPlace(p);
                              }}
                            />
                            <div aria-hidden className="mx-5 border-t border-stone-200" />
                            <span
                              aria-hidden
                              className="pointer-events-none absolute left-[27px] top-[34px] z-[5] h-[69px] border-l-2 border-dashed border-stone-300"
                            />
                            {serviceType === 'transfer' ? (
                              <AddressField
                                dot="destination"
                                label="Destination"
                                placeholder="Où allez-vous ?"
                                value={dropoffText}
                                confirmed={!!dropoffPlace}
                                onTextChange={(t) => {
                                  setDropoffText(t);
                                  setDropoffPlace(null);
                                }}
                                onSelect={(p) => {
                                  setDropoffText(p.label);
                                  setDropoffPlace(p);
                                }}
                              />
                            ) : (
                              <AddressField
                                dot="stop"
                                label="Arrêt final"
                                placeholder="Par défaut : retour au point de départ"
                                value={dropoffText}
                                confirmed={!!dropoffPlace}
                                optional
                                onTextChange={(t) => {
                                  setDropoffText(t);
                                  setDropoffPlace(null);
                                }}
                                onSelect={(p) => {
                                  setDropoffText(p.label);
                                  setDropoffPlace(p);
                                }}
                              />
                            )}
                            {serviceType === 'transfer' && (
                              <button
                                type="button"
                                onClick={swapAddresses}
                                aria-label="Inverser départ et destination"
                                className="absolute right-4 top-[50px] z-20 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-stone-400 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
                              >
                                <IconArrowsUpDown size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 px-2 text-sm text-white/55">
                          Choisissez une adresse dans la liste pour lancer le calcul du tarif.
                        </p>
                      </div>

                      <div>
                        <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Raccourcis</p>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_LOCATIONS.map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => fillFromShortcut(p)}
                              className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2.5 text-sm text-white/85 ring-1 ring-white/12 transition hover:bg-white/[0.13] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
                            >
                              <span aria-hidden>{p.icon}</span>
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={`${PANEL} space-y-7`}>
                        <div>
                          <PanelTitle>Type de service</PanelTitle>
                          <div role="radiogroup" aria-label="Type de service" className="grid gap-3 sm:grid-cols-2">
                            {[
                              { id: 'transfer' as const, label: 'Transfert', desc: 'De A à B, au prix fixe', Icon: IconRoute },
                              { id: 'hourly' as const, label: 'Mise à disposition', desc: 'Un chauffeur à l’heure, au forfait', Icon: IconClockHour4 },
                            ].map((t) => {
                              const on = serviceType === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  onClick={() => setServiceType(t.id)}
                                  className={`relative flex items-start gap-4 rounded-2xl border p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
                                    on
                                      ? 'border-transparent bg-[#07111f] text-white shadow-[0_20px_40px_-18px_rgba(7,17,31,0.7)]'
                                      : 'border-stone-200 bg-white hover:border-stone-400'
                                  }`}
                                >
                                  <span
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                      on ? 'bg-white/10 text-[#d9b36a]' : 'bg-stone-100 text-stone-600'
                                    }`}
                                  >
                                    <t.Icon size={22} />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-base font-semibold">{t.label}</span>
                                    <span className={`mt-0.5 block text-sm ${on ? 'text-white/65' : 'text-stone-500'}`}>{t.desc}</span>
                                  </span>
                                  {on && (
                                    <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#4BC449]">
                                      <IconCheck size={13} strokeWidth={3} className="text-[#06210a]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {serviceType === 'transfer' ? (
                          <div>
                            <PanelTitle>Direction</PanelTitle>
                            <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-200/70 p-1">
                              {[
                                { id: 'one-way' as const, label: 'Aller simple', Icon: IconArrowRight },
                                { id: 'round-trip' as const, label: 'Aller-retour', Icon: IconArrowsExchange },
                              ].map((d) => (
                                <button
                                  key={d.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={direction === d.id}
                                  onClick={() => setDirection(d.id)}
                                  className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
                                    direction === d.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
                                  }`}
                                >
                                  <d.Icon size={17} />
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                              <h2 className={OVERLINE}>Durée de mise à disposition</h2>
                              <span className="rounded-full bg-[#4BC449]/12 px-3 py-1 text-xs font-semibold text-[#1f7a24]">
                                {formatHours(hours)} · {includedKm} km inclus
                              </span>
                            </div>
                            <div role="radiogroup" aria-label="Durée" className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                              {hourlyForfaits.map((f) => (
                                <button
                                  key={f.hours}
                                  type="button"
                                  role="radio"
                                  aria-checked={hours === f.hours}
                                  onClick={() => setHours(f.hours)}
                                  className={`rounded-2xl border px-2 py-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
                                    hours === f.hours
                                      ? 'border-transparent bg-[#07111f] text-white shadow-[0_14px_30px_-14px_rgba(7,17,31,0.7)]'
                                      : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                                  }`}
                                >
                                  <span className="block text-base font-semibold tabular-nums">{formatHours(f.hours)}</span>
                                  <span className={`mt-0.5 block text-[11px] ${hours === f.hours ? 'text-white/60' : 'text-stone-500'}`}>
                                    {f.maxKm} km
                                  </span>
                                </button>
                              ))}
                            </div>
                            <p className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm leading-relaxed text-stone-600">
                              Chauffeur privé à disposition pendant {formatHours(hours)}, jusqu&apos;à {includedKm} km de trajet inclus.
                            </p>
                          </div>
                        )}
                      </div>

                      <Nav {...navProps} ok={canContinue(1)} />
                    </>
                  )}

                  {/* =========================== STEP 2 : QUAND =========================== */}
                  {step === 2 && (
                    <>
                      <StepHeader
                        step={2}
                        title={
                          <>
                            Quand <em>partez-vous</em> ?
                          </>
                        }
                        subtitle={
                          serviceType === 'hourly'
                            ? `Choisissez la date et l'heure de début de votre mise à disposition (${formatHours(hours)}).`
                            : 'Choisissez votre date et votre heure de départ.'
                        }
                      />

                      <div className={PANEL}>
                        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
                          <div>
                            <PanelTitle>{serviceType === 'hourly' ? 'Date de mise à disposition' : 'Date de départ'}</PanelTitle>
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
                              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-stone-100 p-3.5 text-xs leading-relaxed text-stone-600">
                                <IconClock size={14} className="mt-0.5 shrink-0" />
                                Première prise en charge possible : {formatShortDate(earliestPickup)} à {pad(earliestPickup.getHours())}:
                                {pad(earliestPickup.getMinutes())}
                              </p>
                            )}
                          </div>

                          <div>
                            <PanelTitle>{serviceType === 'hourly' ? 'Heure de prise en charge' : 'Heure de départ'}</PanelTitle>
                            {showTimePicker && selectedDate ? (
                              <TimeGrid value={selectedTime} onChange={setSelectedTime} minDateTime={earliestPickup} day={selectedDate} />
                            ) : (
                              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 p-6 text-center">
                                <IconCalendar size={26} className="text-stone-400" />
                                <p className="text-sm text-stone-500">Choisissez d&apos;abord une date : les horaires s&apos;affichent ici.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {serviceType === 'transfer' && direction === 'round-trip' && selectedDate && selectedTime && (
                        <div className={`${PANEL} space-y-5`}>
                          <PanelTitle>Retour</PanelTitle>
                          <div role="radiogroup" aria-label="Date de retour" className="space-y-2">
                            {[
                              { id: 'same' as const, label: 'Le même jour', detail: formatLongDate(selectedDate) },
                              { id: 'next' as const, label: 'Le lendemain', detail: formatLongDate(addDays(selectedDate, 1)) },
                              { id: 'custom' as const, label: 'Choisir une autre date', detail: '' },
                            ].map((opt) => {
                              const on = returnChoice === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  onClick={() => {
                                    setReturnChoice(opt.id);
                                    if (opt.id === 'same') {
                                      setReturnDate(selectedDate);
                                      setShowReturnTime(true);
                                      setShowReturnCalendar(false);
                                    } else if (opt.id === 'next') {
                                      setReturnDate(addDays(selectedDate, 1));
                                      setShowReturnTime(true);
                                      setShowReturnCalendar(false);
                                    } else {
                                      setReturnViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
                                      setShowReturnCalendar(true);
                                      setShowReturnTime(false);
                                    }
                                  }}
                                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
                                    on ? 'border-transparent bg-[#07111f] text-white' : 'border-stone-200 bg-white hover:border-stone-400'
                                  }`}
                                >
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                      on ? 'border-[#4BC449]' : 'border-stone-300'
                                    }`}
                                  >
                                    {on && <span className="h-2.5 w-2.5 rounded-full bg-[#4BC449]" />}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[15px] font-semibold">{opt.label}</span>
                                    {opt.detail && (
                                      <span className={`block text-xs ${on ? 'text-white/60' : 'text-stone-500'}`}>{opt.detail}</span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {showReturnCalendar && (
                            <div className="rounded-2xl bg-stone-100/70 p-4">
                              <Calendar
                                compact
                                viewMonth={returnViewMonth}
                                onMonthChange={setReturnViewMonth}
                                selected={returnDate}
                                minDate={selectedDate}
                                onSelect={(d) => {
                                  setReturnDate(d);
                                  setShowReturnTime(true);
                                }}
                              />
                            </div>
                          )}

                          {showReturnTime && returnDate && (
                            <div>
                              <h3 className={`${OVERLINE} mb-3`}>Heure de retour</h3>
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
                            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                              <p className="text-sm leading-relaxed text-amber-900">
                                Ce trajet fait moins de 25 km au total. Pour un aller-retour avec retour 1 à 3 jours après
                                l&apos;aller, nous vous conseillons le forfait agglomération (aller simple).
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Estimation */}
                      {quoteLoading ? (
                        <div className="flex items-center gap-3 rounded-[28px] bg-white/[0.07] p-6 ring-1 ring-white/12">
                          <IconLoader2 size={20} className="animate-spin text-[#4BC449]" />
                          <span className="text-sm text-white/70">Calcul du tarif en cours…</span>
                        </div>
                      ) : quoteError ? (
                        <div className="flex items-start gap-3 rounded-[28px] bg-red-500/10 p-6 ring-1 ring-red-400/30">
                          <IconAlertTriangle size={20} className="mt-0.5 shrink-0 text-red-300" />
                          <div>
                            <p className="text-sm font-semibold text-white">Estimation indisponible</p>
                            <p className="mt-0.5 text-sm text-white/65">{quoteError}</p>
                          </div>
                        </div>
                      ) : quote ? (
                        <div className="overflow-hidden rounded-[28px] bg-[#0b1f3a] ring-1 ring-white/12">
                          <div className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Estimation du prix</p>
                              <p className="mt-1.5 text-sm text-white/65">
                                {serviceType === 'hourly'
                                  ? `Mise à disposition ${formatHours(hours)} • ${quote.pricing.rateType}`
                                  : `${direction === 'round-trip' ? 'Aller-retour' : 'Aller simple'} • ${quote.pricing.rateType}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`${DISPLAY} text-[56px] leading-none tabular-nums`} style={{ color: GOLD }}>
                                {priceLabel}
                              </span>
                              <p className="mt-1 text-[11px] text-white/45">
                                {tvaSettings.tvaApplicable ? 'Prix forfaitaire TTC' : 'Prix forfaitaire'}
                                {!tvaSettings.tvaApplicable && tvaSettings.tvaLegalMention ? ` — ${tvaSettings.tvaLegalMention}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5 border-t border-white/10 px-6 py-5 text-sm sm:px-8">
                            {serviceType === 'hourly' ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-2 text-white/60">
                                    <IconClock size={15} /> Durée du forfait
                                  </span>
                                  <span className="font-medium tabular-nums">{formatHours(hours)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-2 text-white/60">
                                    <IconRoute size={15} /> Distance incluse
                                  </span>
                                  <span className="font-medium tabular-nums">Jusqu&apos;à {includedKm} km</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-2 text-white/60">
                                    <IconRoute size={15} /> Distance passager
                                  </span>
                                  <span className="font-medium tabular-nums">
                                    {quote.distances.tp.toFixed(1)} km • {Math.round(quote.duration)} min
                                  </span>
                                </div>
                                {quote.pricing.tollInfo?.detected && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/60">Péages inclus</span>
                                    <span className="font-medium tabular-nums">{formatEuro2(quote.pricing.tollInfo.totalIncluded)}</span>
                                  </div>
                                )}
                                {immobilisation && immobilisation.priceTTC > 0 && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/60">Immobilisation</span>
                                    <span className="font-medium">{immobilisation.label}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {tvaSettings.tvaApplicable && tvaSettings.tvaDisplayClient && (
                              <div className="flex items-center justify-between">
                                <span className="text-white/60">Dont TVA ({tvaSettings.tvaRate}%)</span>
                                <span className="font-medium tabular-nums">{formatEuro2(quote.pricing.tva)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 border-t border-white/10 px-6 py-5 sm:px-8">
                            {[
                              { icon: IconShieldCheck, text: 'Prix fixe garanti' },
                              { icon: IconClock, text: "60 min d'annulation gratuite" },
                              ...(serviceType === 'hourly'
                                ? [{ icon: IconRoute, text: `${includedKm} km inclus` }]
                                : [{ icon: IconClock, text: "10 min d'attente gratuits" }]),
                              { icon: IconCalendar, text: 'Aucun paiement immédiat' },
                            ].map((chip) => (
                              <span
                                key={chip.text}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#4BC449]/12 px-3 py-1.5 text-xs font-medium text-[#8fe08d] ring-1 ring-[#4BC449]/25"
                              >
                                <chip.icon size={13} className="shrink-0" />
                                {chip.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <Nav {...navProps} ok={canContinue(2)} />
                    </>
                  )}

                  {/* ========================== STEP 3 : VOYAGEURS ========================== */}
                  {step === 3 && (
                    <>
                      <StepHeader
                        step={3}
                        title={
                          <>
                            Qui <em>voyage</em> ?
                          </>
                        }
                        subtitle="Indiquez le nombre de passagers et vos bagages."
                      />

                      <div className={PANEL}>
                        <PanelTitle hint={`${totalPassengers} passager${totalPassengers > 1 ? 's' : ''} sur 4 maximum`}>Passagers</PanelTitle>
                        <div className="divide-y divide-stone-200">
                          <CountRow icon={IconUser} label="Adultes" sub="13 ans et +" value={adults} min={1} max={4} blocked={totalPassengers >= 4} onChange={setAdults} />
                          <CountRow icon={IconUsers} label="Enfants" sub="2 à 12 ans" value={children} min={0} max={3} blocked={totalPassengers >= 4} onChange={setChildren} />
                          <CountRow icon={IconBabyCarriage} label="Bébés" sub="Moins de 2 ans" value={babies} min={0} max={2} blocked={totalPassengers >= 4} onChange={setBabies} />
                        </div>
                      </div>

                      <div className={PANEL}>
                        <PanelTitle>Bagages</PanelTitle>
                        <CountRow icon={IconLuggage} label="Valises" value={suitcases} min={0} max={6} onChange={setSuitcases} />
                      </div>

                      <div className={PANEL}>
                        <PanelTitle hint="Indiquez-nous ce qui peut faciliter votre trajet.">Besoins supplémentaires</PanelTitle>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { label: 'Siège bébé', icon: IconBabyCarriage, active: babySeat, toggle: () => setBabySeat(!babySeat) },
                            { label: 'Accessibilité PMR', icon: IconWheelchair, active: wheelchair, toggle: () => setWheelchair(!wheelchair) },
                            { label: 'Bagage volumineux', icon: IconBriefcase, active: largeLuggage, toggle: () => setLargeLuggage(!largeLuggage) },
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              aria-pressed={opt.active}
                              onClick={opt.toggle}
                              className={`relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
                                opt.active ? 'border-transparent bg-[#07111f] text-white' : 'border-stone-200 bg-white hover:border-stone-400'
                              }`}
                            >
                              <span
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                  opt.active ? 'bg-white/10 text-[#d9b36a]' : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                <opt.icon size={20} />
                              </span>
                              <span className="text-sm font-semibold leading-snug">{opt.label}</span>
                              {opt.active && (
                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#4BC449]">
                                  <IconCheck size={13} strokeWidth={3} className="text-[#06210a]" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Nav {...navProps} ok={canContinue(3)} />
                    </>
                  )}

                  {/* ========================= STEP 4 : CONFIRMATION ========================= */}
                  {step === 4 &&
                    (showOtp ? (
                      <>
                        <StepHeader
                          step={4}
                          title={
                            <>
                              Un dernier <em>code</em>
                            </>
                          }
                          subtitle="Confirmez votre demande avec le code reçu par e-mail."
                        />

                        <div className={`${PANEL} mx-auto max-w-md space-y-6 text-center`}>
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4BC449]/12 text-[#1f7a24]">
                            <IconShieldCheck size={34} />
                          </div>
                          <div>
                            <h2 className={`${DISPLAY} text-3xl`}>Code de vérification</h2>
                            <p className="mt-2 text-sm leading-relaxed text-stone-500">
                              Un code à 6 chiffres a été envoyé par e-mail à{' '}
                              <strong className="break-all text-stone-800">{email}</strong>.
                            </p>
                          </div>

                          <div className="flex justify-center gap-2">
                            {otpCode.map((digit, idx) => (
                              <input
                                key={idx}
                                id={`otp-input-${idx}`}
                                type="text"
                                inputMode="numeric"
                                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                                maxLength={6}
                                aria-label={`Chiffre ${idx + 1} sur 6`}
                                value={digit}
                                onChange={(e) => handleOtpInput(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="h-14 w-11 rounded-2xl border border-stone-200 bg-white text-center text-2xl font-semibold tabular-nums transition focus:border-[#4BC449] focus:outline-none focus:ring-4 focus:ring-[#4BC449]/15 sm:h-16 sm:w-12"
                              />
                            ))}
                          </div>

                          {otpError && <p role="alert" className="text-sm font-medium text-red-600">{otpError}</p>}
                          {otpInfo && <p role="status" className="text-sm font-medium text-[#1f7a24]">{otpInfo}</p>}

                          <button
                            type="button"
                            onClick={verifyOtp}
                            disabled={submitting || otpCode.join('').length !== 6}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#4BC449] text-[15px] font-semibold text-[#06210a] shadow-[0_12px_32px_-8px_rgba(75,196,73,0.65)] transition hover:bg-[#5fd45d] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
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

                          <div className="flex items-center justify-between border-t border-stone-200 pt-4 text-sm">
                            <button
                              type="button"
                              onClick={() => setShowOtp(false)}
                              className="text-stone-600 underline underline-offset-4 hover:text-stone-900"
                            >
                              Modifier mes informations
                            </button>
                            <button
                              type="button"
                              onClick={resendOtp}
                              disabled={resendIn > 0}
                              className="font-medium text-[#1f7a24] underline-offset-4 hover:underline disabled:text-stone-400 disabled:no-underline"
                            >
                              {resendIn > 0 ? `Renvoyer (${resendIn}s)` : 'Renvoyer le code'}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <StepHeader
                          step={4}
                          title={
                            <>
                              Votre <em>réservation</em>
                            </>
                          }
                          subtitle="Vérifiez les détails, renseignez vos coordonnées et finalisez."
                        />

                        <div className={PANEL}>
                          <PanelTitle>Récapitulatif</PanelTitle>
                          <div className="relative flex flex-col gap-5 pl-8">
                            <span aria-hidden className="absolute bottom-3 left-[5px] top-3 border-l-2 border-dashed border-stone-300" />
                            <div className="relative">
                              <span aria-hidden className={`absolute -left-8 top-[11px] ${DOT.origin}`} />
                              <p className={`${DISPLAY} text-[28px] leading-tight`}>{pickupText.split(',')[0]}</p>
                              {pickupText.includes(',') && (
                                <p className="mt-0.5 text-sm text-stone-500">{pickupText.slice(pickupText.indexOf(',') + 1).trim()}</p>
                              )}
                            </div>
                            <div className="relative">
                              <span aria-hidden className={`absolute -left-8 top-[11px] ${serviceType === 'transfer' ? DOT.destination : DOT.stop}`} />
                              <p className={`${DISPLAY} text-[28px] leading-tight`}>
                                {serviceType === 'transfer' || dropoffText
                                  ? dropoffText.split(',')[0] || pickupText.split(',')[0]
                                  : 'Retour au point de départ'}
                              </p>
                              {dropoffText.includes(',') && (
                                <p className="mt-0.5 text-sm text-stone-500">{dropoffText.slice(dropoffText.indexOf(',') + 1).trim()}</p>
                              )}
                            </div>
                          </div>

                          <dl className="mt-7 grid gap-x-10 sm:grid-cols-2">
                            {[
                              {
                                label: 'Service',
                                value:
                                  serviceType === 'hourly'
                                    ? `Mise à disposition (${formatHours(hours)})`
                                    : direction === 'round-trip'
                                      ? 'Transfert aller-retour'
                                      : 'Transfert aller simple',
                              },
                              ...(serviceType === 'hourly'
                                ? [{ label: 'Durée & distance', value: `${formatHours(hours)} • jusqu’à ${includedKm} km inclus` }]
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
                            ].map((row) => (
                              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-stone-200 py-3.5">
                                <dt className="text-sm text-stone-500">{row.label}</dt>
                                <dd className="text-right text-sm font-semibold">{row.value}</dd>
                              </div>
                            ))}
                          </dl>

                          <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#07111f] px-6 py-5 text-white">
                            <span className="text-sm text-white/65">Prix estimé</span>
                            <span className={`${DISPLAY} text-[44px] leading-none tabular-nums`} style={{ color: GOLD }}>
                              {priceLabel}
                            </span>
                          </div>
                        </div>

                        <div className={`${PANEL} space-y-5`}>
                          <PanelTitle hint="Pour vous envoyer la confirmation et joindre votre chauffeur.">Vos coordonnées</PanelTitle>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <label htmlFor="rf-first" className={FIELD_LABEL}>Prénom</label>
                              <input id="rf-first" name="given-name" type="text" autoComplete="given-name" placeholder="Votre prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={INPUT} />
                            </div>
                            <div>
                              <label htmlFor="rf-last" className={FIELD_LABEL}>Nom</label>
                              <input id="rf-last" name="family-name" type="text" autoComplete="family-name" placeholder="Votre nom" value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT} />
                            </div>
                            <div>
                              <label htmlFor="rf-phone" className={FIELD_LABEL}>Téléphone</label>
                              <input id="rf-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="+33 6 00 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} />
                            </div>
                            <div>
                              <label htmlFor="rf-email" className={FIELD_LABEL}>E-mail</label>
                              <input id="rf-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="rf-note" className={FIELD_LABEL}>
                              Note au chauffeur <span className="font-normal normal-case tracking-normal text-stone-400">(optionnel)</span>
                            </label>
                            <textarea
                              id="rf-note"
                              placeholder="Numéro de vol, accès particulier, itinéraire souhaité…"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              rows={3}
                              className={`${INPUT} h-auto resize-none py-3.5`}
                            />
                          </div>
                        </div>

                        <label className={`${PANEL} flex cursor-pointer items-start gap-4 !p-5 sm:!p-6`}>
                          <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="peer sr-only"
                          />
                          <span
                            aria-hidden
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4BC449] ${
                              acceptTerms ? 'border-[#1f7a24] bg-[#1f7a24]' : 'border-stone-300 bg-white'
                            }`}
                          >
                            {acceptTerms && <IconCheck size={15} strokeWidth={3} className="text-white" />}
                          </span>
                          <span className="text-[15px] leading-snug text-stone-700">
                            J&apos;accepte les{' '}
                            <Link href="/cgv" target="_blank" className="font-semibold text-[#1f7a24] underline underline-offset-4">
                              conditions générales
                            </Link>
                          </span>
                        </label>

                        {submitError && (
                          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-100">
                            <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        <Nav
                          {...navProps}
                          ok={canContinue(4) && !submitting}
                          next={handleBookingSubmit}
                          lastLabel={submitting ? 'Envoi en cours…' : 'Réserver maintenant'}
                        />

                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-2 text-xs text-white/45">
                          <span className="flex items-center gap-1.5"><IconShieldCheck size={14} /> Paiement sécurisé</span>
                          <span className="flex items-center gap-1.5"><IconCalendar size={14} /> Aucun paiement immédiat</span>
                          <span className="flex items-center gap-1.5"><IconClock size={14} /> Confirmation rapide</span>
                        </div>
                      </>
                    ))}
                </div>

                {/* Mobile : billet + détail du prix sous le formulaire */}
                <div className="mt-12 space-y-5 lg:hidden">
                  {ticket}
                  {breakdown}
                </div>
              </div>

              {/* Desktop : billet + détail du prix, toujours visibles */}
              <aside aria-label="Résumé et détail du prix" className="hidden w-[400px] shrink-0 lg:block xl:w-[460px]">
                <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pb-2 pr-1 [scrollbar-width:thin]">
                  {ticket}
                  {breakdown}
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* --------------------------------- controls ------------------------------- */

function CountRow({
  icon: Icon,
  label,
  sub,
  value,
  min,
  max,
  blocked = false,
  onChange,
}: {
  icon: typeof IconUser;
  label: string;
  sub?: string;
  value: number;
  min: number;
  max: number;
  /** Bloque le « + » (ex. total de passagers atteint). */
  blocked?: boolean;
  onChange: (value: number) => void;
}) {
  const btn =
    'flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/80 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-[#4BC449]';
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
          <Icon size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold">{label}</span>
          {sub && <span className="block text-xs text-stone-500">{sub}</span>}
        </span>
      </div>
      <div role="group" aria-label={label} className="flex shrink-0 items-center rounded-full border border-stone-200 bg-white p-1">
        <button
          type="button"
          aria-label={`Moins — ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={btn}
        >
          <IconMinus size={16} />
        </button>
        <span aria-live="polite" className="w-9 text-center text-base font-semibold tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Plus — ${label}`}
          disabled={value >= max || blocked}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={btn}
        >
          <IconPlus size={16} />
        </button>
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
  hint,
  price,
}: {
  step: Step;
  ok: boolean;
  next: () => void;
  back: () => void;
  lastLabel?: string;
  hint?: string | null;
  price?: string | null;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-5 bg-gradient-to-t from-[#06101d] via-[#06101d]/90 to-transparent px-5 pb-4 pt-8 sm:static sm:mx-0 sm:bg-none sm:p-0 sm:pt-1">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={back}
            className="inline-flex h-14 items-center gap-2 rounded-full px-5 text-sm font-medium text-white/75 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]"
          >
            <IconArrowLeft size={16} />
            Retour
          </button>
        )}
        <div className="ml-auto flex items-center gap-4">
          {price && (
            <div className="text-right leading-tight lg:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Estimé</p>
              <p className="text-base font-semibold tabular-nums">{price}</p>
            </div>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!ok}
            className={`group inline-flex h-14 items-center gap-2.5 rounded-full px-7 text-[15px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449] ${
              ok
                ? 'bg-[#4BC449] text-[#06210a] shadow-[0_12px_32px_-8px_rgba(75,196,73,0.65)] hover:bg-[#5fd45d] active:scale-[0.98]'
                : 'cursor-not-allowed bg-white/[0.08] text-white/35'
            }`}
          >
            {step === 4 ? lastLabel || 'Confirmer' : 'Continuer'}
            <IconArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
      {!ok && hint && (
        <p role="status" className="mt-3 text-right text-sm text-white/55">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06101d]" />}>
      <ReservationFlow />
    </Suspense>
  );
}
