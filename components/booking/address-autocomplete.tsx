'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconMapPin, IconLoader2, IconClock, IconStar, IconMap2 } from '@tabler/icons-react';
import { useRecentAddresses } from '@/hooks/use-local-storage';
import { POPULAR_LOCATIONS, HAUTE_SAVOIE_AUTOCOMPLETE_BIAS } from '@/lib/constants';

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  error?: string;
  /** Affiche un rappel pour les adresses en Haute-Savoie (74) */
  showHauteSavoieHint?: boolean;
}

interface MapboxSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  fullAddress: string;
  lat: number;
  lng: number;
}

interface MapboxFeature {
  id?: string;
  geometry: { coordinates: [number, number] };
  properties: {
    mapbox_id?: string;
    full_address?: string;
    place_formatted?: string;
    name?: string;
    name_preferred?: string;
    coordinates?: { longitude: number; latitude: number };
  };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

async function fetchMapboxSuggestions(query: string, signal: AbortSignal): Promise<MapboxSuggestion[]> {
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('country', 'fr,ch');
  url.searchParams.set('limit', '6');
  url.searchParams.set('autocomplete', 'true');
  url.searchParams.set(
    'proximity',
    `${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lng},${HAUTE_SAVOIE_AUTOCOMPLETE_BIAS.center.lat}`
  );

  const response = await fetch(url.toString(), { signal });

  if (!response.ok) {
    throw new Error(`Mapbox geocoding error: ${response.status}`);
  }

  const data = await response.json();
  const features: MapboxFeature[] = Array.isArray(data.features) ? data.features : [];

  return features.map((feature) => {
    const coords = feature.properties.coordinates ?? {
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    };
    const fullAddress = feature.properties.full_address || feature.properties.place_formatted || feature.properties.name || '';
    const mainText = feature.properties.name_preferred || feature.properties.name || fullAddress;
    const secondaryText = feature.properties.place_formatted && feature.properties.place_formatted !== mainText
      ? feature.properties.place_formatted
      : fullAddress;

    return {
      id: feature.properties.mapbox_id || feature.id || fullAddress,
      mainText,
      secondaryText,
      fullAddress,
      lat: coords.latitude,
      lng: coords.longitude,
    };
  });
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  error,
  showHauteSavoieHint = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError] = useState(!MAPBOX_TOKEN);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { recentAddresses, addAddress } = useRecentAddresses();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const runSearch = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 3 || tokenError) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const results = await fetchMapboxSuggestions(query, controller.signal);
        setSuggestions(results);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error fetching address suggestions:', err);
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelect = (suggestion: MapboxSuggestion) => {
    setInputValue(suggestion.fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    addAddress(suggestion.fullAddress);
    onChange(suggestion.fullAddress, suggestion.lat, suggestion.lng);
  };

  const handleSelectRecent = async (address: string) => {
    setInputValue(address);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      const controller = new AbortController();
      const results = await fetchMapboxSuggestions(address, controller.signal);
      const match = results[0];
      addAddress(address);
      onChange(address, match?.lat, match?.lng);
    } catch (err) {
      console.error('Error geocoding recent address:', err);
      onChange(address);
    }
  };

  const handleSelectPopular = (location: typeof POPULAR_LOCATIONS[0]) => {
    setInputValue(location.address);
    setShowSuggestions(false);
    setSuggestions([]);
    addAddress(location.address);
    onChange(location.address, location.lat, location.lng);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    const mapboxCount = suggestions.length;
    const popularCount = !inputValue ? POPULAR_LOCATIONS.length : 0;
    const recentCount = !inputValue ? Math.min(recentAddresses.length, 5) : 0;
    const totalSuggestions = popularCount + recentCount + mapboxCount;

    if (totalSuggestions === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < totalSuggestions - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();

      if (selectedIndex < popularCount) {
        handleSelectPopular(POPULAR_LOCATIONS[selectedIndex]);
      } else if (selectedIndex < popularCount + recentCount) {
        handleSelectRecent(recentAddresses[selectedIndex - popularCount]);
      } else {
        const mapboxIndex = selectedIndex - popularCount - recentCount;
        handleSelect(suggestions[mapboxIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative">
      <Label className="text-sm font-semibold text-slate-900">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            onChange(newValue);
            setShowSuggestions(true);
            setSelectedIndex(-1);
            runSearch(newValue);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowSuggestions(true);
          }}
          disabled={tokenError}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <IconLoader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <IconMap2 className="h-4 w-4 text-slate-300" />
          )}
        </div>
      </div>

      {tokenError && (
        <p className="text-sm text-red-500 mt-1">Erreur de configuration. Veuillez réessayer plus tard.</p>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      {showHauteSavoieHint && !error && !tokenError && (
        <p className="text-xs text-slate-500 mt-1">
          Précisez 74 ou le code postal pour prioriser la Haute-Savoie.
        </p>
      )}

      {showSuggestions && !tokenError && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 max-h-80 overflow-auto"
        >
          {!inputValue && POPULAR_LOCATIONS.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <IconStar className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                Lieux populaires
              </div>
              {POPULAR_LOCATIONS.map((location, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`popular-${index}`}
                    type="button"
                    onClick={() => handleSelectPopular(location)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-b-0 ${isSelected ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center mt-0.5 border border-amber-100">
                      <span className="text-sm">{location.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{location.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{location.address}</div>
                    </div>
                  </button>
                );
              })}
              <div className="border-t border-slate-100"></div>
            </>
          )}

          {!inputValue && recentAddresses.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <IconClock className="h-3.5 w-3.5" />
                Récents
              </div>
              {recentAddresses.slice(0, 5).map((address, index) => {
                const trueIndex = POPULAR_LOCATIONS.length + index;
                const isSelected = trueIndex === selectedIndex;

                return (
                  <button
                    key={`recent-${index}`}
                    type="button"
                    onClick={() => handleSelectRecent(address)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-b-0 ${isSelected ? 'bg-slate-50' : ''}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                      <IconClock className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm text-slate-700 mt-1.5">{address}</span>
                  </button>
                );
              })}
            </>
          )}

          {suggestions.map((suggestion, index) => {
            const trueIndex = (!inputValue ? POPULAR_LOCATIONS.length + Math.min(recentAddresses.length, 5) : 0) + index;
            const isSelected = trueIndex === selectedIndex;

            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-b-0 ${isSelected ? 'bg-slate-50' : ''}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mt-0.5 border border-blue-100">
                  <IconMapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {suggestion.mainText}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {suggestion.secondaryText}
                  </div>
                </div>
              </button>
            );
          })}

          {suggestions.length > 0 && (
            <div className="flex justify-end px-4 py-1.5 bg-slate-50 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Adresses via Mapbox</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
