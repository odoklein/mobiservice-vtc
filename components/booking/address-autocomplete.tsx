'use client';

import { useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconMapPin, IconLoader2, IconClock, IconStar, IconMap2 } from '@tabler/icons-react';
import { useRecentAddresses } from '@/hooks/use-local-storage';
import { POPULAR_LOCATIONS } from '@/lib/constants';

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  error?: string;
}

// Inner component that only renders after Google Maps is loaded
function PlacesAutocompleteInner({
  label,
  placeholder,
  value,
  onChange,
  error,
}: AddressAutocompleteProps) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: ['fr', 'ch'] },
      language: 'fr',
    },
    debounce: 300,
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentAddresses, addAddress } = useRecentAddresses();

  useEffect(() => {
    setValue(value, false);
  }, [value, setValue]);

  const handleSelect = async (placeId: string, description: string) => {
    setValue(description, false);
    clearSuggestions();
    setShowSuggestions(false);

    try {
      const results = await getGeocode({ placeId });
      const { lat, lng } = await getLatLng(results[0]);

      addAddress(description);
      onChange(description, lat, lng);
    } catch (error) {
      console.error('Error selecting address:', error);
      onChange(description);
    }
  };

  const handleSelectRecent = (address: string) => {
    setValue(address, false);
    setShowSuggestions(false);
    clearSuggestions();

    getGeocode({ address })
      .then((results) => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        addAddress(address);
        onChange(address, lat, lng);
      })
      .catch((error) => {
        console.error('Error geocoding recent address:', error);
        onChange(address);
      });
  };

  const handleSelectPopular = (location: typeof POPULAR_LOCATIONS[0]) => {
    setValue(location.address, false);
    setShowSuggestions(false);
    clearSuggestions();
    addAddress(location.address);
    onChange(location.address, location.lat, location.lng);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    const googleSuggestions = status === 'OK' ? data.length : 0;
    const popularCount = !inputValue ? POPULAR_LOCATIONS.length : 0;
    const recentCount = !inputValue ? Math.min(recentAddresses.length, 5) : 0;
    const totalSuggestions = popularCount + recentCount + googleSuggestions;

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
        const googleIndex = selectedIndex - popularCount - recentCount;
        const item = data[googleIndex];
        handleSelect(item.place_id, item.description);
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
            setValue(e.target.value);
            onChange(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowSuggestions(true);
          }}
          disabled={!ready}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {!ready ? (
            <IconLoader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <IconMap2 className="h-4 w-4 text-slate-300" />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {showSuggestions && (
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

          {status === 'OK' && data.map(({ place_id, description, structured_formatting }, index) => {
            const trueIndex = POPULAR_LOCATIONS.length + recentAddresses.length + index;
            const isSelected = trueIndex === selectedIndex;

            return (
              <button
                key={place_id}
                type="button"
                onClick={() => handleSelect(place_id, description)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-b-0 ${isSelected ? 'bg-slate-50' : ''}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mt-0.5 border border-blue-100">
                  <IconMapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            );
          })}

          {status === 'OK' && data.length > 0 && (
            <div className="flex justify-end p-2 bg-slate-50 border-t border-slate-100">
              <img src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png" alt="Powered by Google" className="h-4 object-contain opacity-75" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Outer component that handles loading Google Maps
export function AddressAutocomplete(props: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'fr',
  });

  if (loadError) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">{props.label}</Label>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Erreur de chargement. Veuillez réessayer.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-900">{props.label}</Label>
        <div className="relative">
          <Input
            type="text"
            placeholder={props.placeholder}
            disabled
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <IconLoader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        </div>
        {props.error && <p className="text-sm text-red-500 mt-1">{props.error}</p>}
      </div>
    );
  }

  // Only render the autocomplete component when Google Maps is fully loaded
  return <PlacesAutocompleteInner {...props} />;
}
