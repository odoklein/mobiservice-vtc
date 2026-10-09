'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
import { IconChevronLeft, IconChevronRight, IconMoon } from '@tabler/icons-react';
import {
  TIME_SLOTS,
  WEEKDAY_HEADERS,
  buildMonthGrid,
  combineDateTime,
  formatLongDate,
  isNightDay,
  isNightSlot,
  monthTitle,
  parseTime,
  sameDay,
  startOfDay,
  toISODate,
} from './utils';

/* --------------------------------- calendar ------------------------------- */

interface CalendarProps {
  viewMonth: Date;
  onMonthChange: (d: Date) => void;
  selected: Date | null;
  minDate: Date;
  onSelect: (d: Date) => void;
  label: string;
}

export function Calendar({ viewMonth, onMonthChange, selected, minDate, onSelect, label }: CalendarProps) {
  const weeks = useMemo(() => buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth()), [viewMonth]);
  const min = startOfDay(minDate);
  const firstOfView = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const canGoPrev = firstOfView > new Date(min.getFullYear(), min.getMonth(), 1);
  const today = startOfDay(new Date());
  const titleId = useId();

  const navBtn =
    'w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4BC449]';

  return (
    <div role="group" aria-labelledby={titleId}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          disabled={!canGoPrev}
          aria-label="Mois précédent"
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className={navBtn}
        >
          <IconChevronLeft size={20} />
        </button>
        <span id={titleId} aria-live="polite" className="font-semibold text-gray-900 text-sm">
          <span className="sr-only">{label} — </span>
          {monthTitle(viewMonth)}
        </span>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => onMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className={navBtn}
        >
          <IconChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1" aria-hidden>
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[11px] sm:text-xs font-medium text-gray-500 py-1.5">
            {d}
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={toISODate(week[0])} className="grid grid-cols-7">
          {week.map((day) => {
            const inMonth = day.getMonth() === viewMonth.getMonth();
            if (!inMonth) return <div key={toISODate(day)} className="h-11 sm:h-10" aria-hidden />;
            const disabled = day < min;
            const isSel = sameDay(day, selected);
            const night = isNightDay(day);
            return (
              <button
                key={toISODate(day)}
                type="button"
                disabled={disabled}
                aria-pressed={isSel}
                aria-label={`${formatLongDate(day)}${night ? ' — tarif de nuit toute la journée' : ''}${
                  sameDay(day, today) ? ' (aujourd’hui)' : ''
                }`}
                onClick={() => onSelect(day)}
                className={`relative h-11 sm:h-10 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4BC449] ${
                  isSel
                    ? 'bg-[#4BC449] text-[#0a1628] font-bold'
                    : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : `hover:bg-gray-100 ${sameDay(day, today) ? 'font-bold text-[#27802a] ring-1 ring-[#4BC449]/40' : 'text-gray-700'}`
                }`}
              >
                {day.getDate()}
                {night && !disabled && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-indigo-400'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      ))}

      <p className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5">
        <span aria-hidden className="inline-block w-1 h-1 rounded-full bg-indigo-400" />
        Dimanches et jours fériés : tarif de nuit toute la journée
      </p>
    </div>
  );
}

/* --------------------------------- time grid ------------------------------ */

/** Vrai si l'heure choisie est antérieure au délai minimum de prise en charge. */
export const isBeforeMin = (day: Date | null, time: string, min: Date | null) => {
  if (!day || !min || !parseTime(time)) return false;
  return combineDateTime(day, time) < min;
};

interface TimeGridProps {
  value: string;
  onChange: (t: string) => void;
  minDateTime: Date | null;
  day: Date | null;
  label: string;
  /** Message affiché si l'heure précise est trop proche. */
  minHint?: string;
}

export function TimeGrid({ value, onChange, minDateTime, day, label, minHint }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const preciseId = useId();
  const tooEarly = isBeforeMin(day, value, minDateTime);
  const dayKey = day ? toISODate(day) : '';

  // Fait défiler la grille vers l'heure sélectionnée, sinon vers le premier créneau disponible (ou 08:00)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const target =
      container.querySelector<HTMLElement>('[aria-pressed="true"]') ??
      container.querySelector<HTMLElement>('[data-slot="08:00"]:not(:disabled)') ??
      container.querySelector<HTMLElement>('button:not(:disabled)');
    if (target) container.scrollTop = Math.max(0, target.offsetTop - container.offsetTop - 8);
    // uniquement quand le jour change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  return (
    <div>
      <div
        ref={scrollRef}
        role="group"
        aria-label={label}
        className="relative grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1"
      >
        {TIME_SLOTS.map((t) => {
          const disabled = !!day && !!minDateTime && combineDateTime(day, t) < minDateTime;
          const night = !!day && isNightSlot(day, t);
          const selected = value === t;
          return (
            <button
              key={t}
              type="button"
              data-slot={t}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${Number(t.slice(0, 2))} h ${t.slice(3)}${night ? ', tarif de nuit' : ''}`}
              onClick={() => onChange(t)}
              className={`py-3 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4BC449] ${
                selected
                  ? 'bg-[#4BC449] text-[#0a1628] border-[#4BC449]'
                  : disabled
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                    : night
                      ? 'border-indigo-100 bg-indigo-50/60 text-indigo-900 hover:border-indigo-300'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              {t}
              {night && !disabled && <IconMoon size={11} aria-hidden className={selected ? 'text-[#0a1628]' : 'text-indigo-400'} />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor={preciseId} className="text-xs text-gray-500">
          Heure précise
        </label>
        <input
          id={preciseId}
          type="time"
          value={value}
          aria-invalid={tooEarly}
          onChange={(e) => onChange(e.target.value)}
          className={`px-3 py-2 rounded-lg bg-gray-50 border text-base sm:text-sm text-gray-900 focus:outline-none focus:ring-2 ${
            tooEarly ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#4BC449]/25 focus:border-[#4BC449]'
          }`}
        />
        <span className="text-[11px] text-gray-500 flex items-center gap-1">
          <IconMoon size={11} aria-hidden className="text-indigo-400" /> Tarif de nuit (20h–7h)
        </span>
      </div>
      {tooEarly && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {minHint || 'Cette heure est trop proche : choisissez un créneau plus tardif.'}
        </p>
      )}
    </div>
  );
}
