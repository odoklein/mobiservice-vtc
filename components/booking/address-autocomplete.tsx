'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconMapPin, IconLoader2, IconClock, IconStar, IconAlertTriangle } from '@tabler/icons-react';
import { useRecentAddresses } from '@/hooks/use-local-storage';
import { POPULAR_LOCATIONS } from '@/lib/constants';

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  error?: string;
}

interface GeocodingResult {
  label: string;
  latitude: number;
  longitude: number;
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  error,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { recentAddresses, addAddress } = useRecentAddresses();
  
  // Track if an address was just selected to prevent re-searching
  const justSelectedRef = useRef(false);

  const searchAddresses = useCallback(
    async (query: string) => {
      if (!query || query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchError(null);
        return;
      }

      setIsLoading(true);
      setSearchError(null);

      try {
        const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error('Recherche d\'adresse temporairement indisponible');
        }

        const data = await response.json();

        if (data.error) {
          setSearchError(data.message || 'Erreur lors de la recherche');
          setSuggestions([]);
        } else {
          setSuggestions(data.results || []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setSearchError('Recherche d\'adresse temporairement indisponible');
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounce function
  useEffect(() => {
    if (!value) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      return;
    }

    // Skip search if an address was just selected
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      searchAddresses(value);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [value, searchAddresses]);

  const handleSelect = (result: GeocodingResult) => {
    const address = result.label;
    justSelectedRef.current = true; // Prevent re-searching
    addAddress(address);
    onChange(address, result.latitude, result.longitude);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchError(null);
  };

  const handleSelectRecent = (address: string) => {
    justSelectedRef.current = true; // Prevent re-searching
    addAddress(address);
    onChange(address);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
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

  const handleSelectPopular = (location: typeof POPULAR_LOCATIONS[0]) => {
    justSelectedRef.current = true; // Prevent re-searching
    addAddress(location.address);
    onChange(location.address, location.lat, location.lng);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-2 relative">
      <Label className="text-sm font-semibold text-slate-900">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || recentAddresses.length > 0 || !value) {
              setShowSuggestions(true);
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <IconLoader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {/* Search Error Message */}
      {searchError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <IconAlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-800">{searchError}</span>
        </div>
      )}

      {showSuggestions && (suggestions.length > 0 || recentAddresses.length > 0 || (!value && POPULAR_LOCATIONS.length > 0)) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-auto"
        >
          {/* Popular Locations - Show when input is empty */}
          {!value && POPULAR_LOCATIONS.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-700 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 flex items-center gap-2">
                <IconStar className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
                Départs populaires
              </div>
              {POPULAR_LOCATIONS.map((location, index) => (
                <button
                  key={`popular-${index}`}
                  type="button"
                  onClick={() => handleSelectPopular(location)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-sm">{location.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{location.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{location.address}</div>
                  </div>
                </button>
              ))}
              {(recentAddresses.length > 0 || suggestions.length > 0) && (
                <div className="border-t border-slate-200 my-1"></div>
              )}
            </>
          )}

          {/* Recent Addresses - Show when input is empty or focused */}
          {!value && recentAddresses.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <IconClock className="h-3.5 w-3.5 text-slate-500" />
                Adresses récentes
              </div>
              {recentAddresses.slice(0, 5).map((address, index) => (
                <button
                  key={`recent-${index}`}
                  type="button"
                  onClick={() => handleSelectRecent(address)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-2"
                >
                  <IconClock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-900">{address}</span>
                </button>
              ))}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border-t border-b border-slate-200">
                  Suggestions
                </div>
              )}
            </>
          )}

          {/* ORS Geocoding Suggestions */}
          {suggestions.map((result, index) => (
            <button
              key={`result-${index}`}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-2 ${index === selectedIndex ? 'bg-slate-50' : ''
                }`}
            >
              <IconMapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-900">{result.label}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
