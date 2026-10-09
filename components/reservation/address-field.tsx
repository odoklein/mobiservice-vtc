'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { IconCheck, IconClock, IconLoader2, IconMapPin, IconStar, IconX } from '@tabler/icons-react';
import { POPULAR_LOCATIONS } from '@/lib/constants';
import type { Place } from './use-quote';

const RECENT_KEY = 'mobiservice_recent_places';
const MAX_RECENT = 5;

function readRecent(): Place[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((p) => p && typeof p.label === 'string' && typeof p.lat === 'number' && typeof p.lng === 'number')
      : [];
  } catch {
    return [];
  }
}

function rememberPlace(place: Place) {
  try {
    const next = [place, ...readRecent().filter((p) => p.label !== place.label)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

type Item =
  | { kind: 'popular'; icon: string; place: Place; title: string; subtitle: string }
  | { kind: 'recent' | 'result'; place: Place; title: string; subtitle: string };

const splitLabel = (label: string): { title: string; subtitle: string } => {
  const idx = label.indexOf(',');
  return idx === -1 ? { title: label, subtitle: '' } : { title: label.slice(0, idx), subtitle: label.slice(idx + 1).trim() };
};

interface AddressFieldProps {
  label: string;
  placeholder: string;
  /** Couleur du repère (classe Tailwind de texte). */
  pinClass: string;
  value: string;
  confirmed: boolean;
  error?: string | null;
  hint?: string;
  onTextChange: (text: string) => void;
  onSelect: (place: Place) => void;
}

export function AddressField({
  label,
  placeholder,
  pinClass,
  value,
  confirmed,
  error,
  hint,
  onTextChange,
  onSelect,
}: AddressFieldProps) {
  const uid = useId();
  const inputId = `${uid}-input`;
  const listId = `${uid}-list`;
  const hintId = `${uid}-hint`;

  const [results, setResults] = useState<Place[]>([]);
  const [recent, setRecent] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = value.trim();
  const showShortcuts = trimmed.length === 0;

  const items: Item[] = useMemo(() => {
    if (showShortcuts) {
      const popular: Item[] = POPULAR_LOCATIONS.map((p) => ({
        kind: 'popular',
        icon: p.icon,
        place: { label: p.address, lat: p.lat, lng: p.lng },
        title: p.name,
        subtitle: p.address,
      }));
      const recents: Item[] = recent.map((place) => ({ kind: 'recent', place, ...splitLabel(place.label) }));
      return [...recents, ...popular];
    }
    return results.map((place) => ({ kind: 'result', place, ...splitLabel(place.label) }));
  }, [showShortcuts, results, recent]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setSearchFailed(false);

    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error('search failed');
        const mapped: Place[] = Array.isArray(data.results)
          ? data.results.map((r: { label: string; latitude: number; longitude: number }) => ({
              label: r.label,
              lat: r.latitude,
              lng: r.longitude,
            }))
          : [];
        setResults(mapped);
        setHighlight(-1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
          setSearchFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
  }, []);

  const choose = (item: Item) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    rememberPlace(item.place);
    onSelect(item.place);
    setOpen(false);
    setResults([]);
    setHighlight(-1);
    setLoading(false);
  };

  const openList = () => {
    if (showShortcuts) setRecent(readRecent());
    setOpen(true);
  };

  const noResults = open && !showShortcuts && !loading && !searchFailed && trimmed.length >= 3 && items.length === 0;
  const listVisible = open && (items.length > 0 || noResults || searchFailed);

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <IconMapPin size={18} aria-hidden className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${pinClass}`} />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={listVisible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={!!error}
          aria-describedby={error || hint ? hintId : undefined}
          aria-activedescendant={highlight >= 0 ? `${uid}-opt-${highlight}` : undefined}
          value={value}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => {
            onTextChange(e.target.value);
            search(e.target.value);
            if (e.target.value.trim().length === 0) setRecent(readRecent());
            setHighlight(-1);
            setOpen(true);
          }}
          onFocus={openList}
          onClick={openList}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) return openList();
              setHighlight((i) => Math.min(i + 1, items.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlight((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && open && highlight >= 0 && items[highlight]) {
              e.preventDefault();
              choose(items[highlight]);
            } else if (e.key === 'Escape' && open) {
              e.stopPropagation();
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3.5 rounded-xl bg-gray-50 border text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 text-base sm:text-sm ${
            error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
              : 'border-gray-200 focus:ring-[#4BC449]/25 focus:border-[#4BC449]'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <IconLoader2 size={16} aria-label="Recherche en cours" className="text-gray-500 animate-spin" />
          ) : confirmed ? (
            <IconCheck size={16} aria-label="Adresse confirmée" className="text-[#4BC449]" />
          ) : value ? (
            <button
              type="button"
              aria-label="Effacer l'adresse"
              onClick={() => {
                onTextChange('');
                setResults([]);
                setRecent(readRecent());
                setOpen(true);
              }}
              className="text-gray-500 hover:text-gray-600 p-1 -m-1 rounded focus-visible:outline-2 focus-visible:outline-[#4BC449]"
            >
              <IconX size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {(error || hint) && (
        <p id={hintId} role={error ? 'alert' : undefined} className={`text-xs mt-1.5 ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || hint}
        </p>
      )}

      <div aria-live="polite" className="sr-only">
        {open && !showShortcuts && !loading ? `${items.length} suggestion${items.length > 1 ? 's' : ''}` : ''}
      </div>

      {listVisible && (
        <div
          id={listId}
          role="listbox"
          aria-label={`Suggestions — ${label}`}
          className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
        >
          {searchFailed && (
            <p className="px-4 py-3 text-sm text-red-600">La recherche d&apos;adresse est temporairement indisponible. Réessayez dans un instant.</p>
          )}
          {noResults && (
            <p className="px-4 py-3 text-sm text-gray-500">Aucune adresse trouvée. Ajoutez la ville ou le code postal (ex. « 74 »).</p>
          )}
          {items.map((item, i) => {
            const prev = items[i - 1];
            const sectionLabel =
              showShortcuts && (!prev || prev.kind !== item.kind)
                ? item.kind === 'recent'
                  ? 'Récents'
                  : 'Lieux populaires'
                : null;
            return (
              <div key={`${item.kind}-${item.place.label}-${i}`}>
                {sectionLabel && (
                  <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 flex items-center gap-1.5">
                    {item.kind === 'recent' ? <IconClock size={12} /> : <IconStar size={12} />}
                    {sectionLabel}
                  </div>
                )}
                <div
                  id={`${uid}-opt-${i}`}
                  role="option"
                  aria-selected={highlight === i}
                  tabIndex={-1}
                  onMouseEnter={() => setHighlight(i)}
                  // pointerdown : évite que le blur de l'input ferme la liste avant le clic
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(item)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors ${
                    highlight === i ? 'bg-[#4BC449]/10' : 'hover:bg-gray-50'
                  }`}
                >
                  {item.kind === 'popular' ? (
                    <span aria-hidden className="text-base leading-5 mt-0.5 shrink-0">
                      {item.icon}
                    </span>
                  ) : item.kind === 'recent' ? (
                    <IconClock size={16} aria-hidden className="text-gray-500 mt-0.5 shrink-0" />
                  ) : (
                    <IconMapPin size={16} aria-hidden className="text-gray-500 mt-0.5 shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900 leading-snug">{item.title}</span>
                    {item.subtitle && <span className="block text-xs text-gray-500 leading-snug truncate">{item.subtitle}</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
