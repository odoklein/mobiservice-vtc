'use client';

import { useEffect, useState } from 'react';

export function useMapbox() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      setError(new Error('Mapbox access token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file.'));
      return;
    }

    // Vérifier si Mapbox GL JS est déjà chargé
    if ((window as any).mapboxgl) {
      setIsLoaded(true);
      return;
    }

    // Charger Mapbox GL JS CSS
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Charger Mapbox GL JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      // Vérifier si Mapbox GL JS s'est chargé correctement
      setTimeout(() => {
        if ((window as any).mapboxgl) {
          (window as any).mapboxgl.accessToken = accessToken;
          setIsLoaded(true);
          setError(null);
        } else {
          setError(new Error('Mapbox GL JS failed to initialize. Check your access token and internet connection.'));
        }
      }, 500);
    };

    script.onerror = () => {
      setError(new Error('Failed to load Mapbox GL JS. Check your internet connection.'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);

  return { isLoaded, error };
}

export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance: number; duration: number }> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Mapbox access token not found');
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${accessToken}&geometries=geojson`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('Could not calculate route');
    }

    const route = data.routes[0];
    const distance = route.distance / 1000; // Convert meters to km
    const duration = route.duration / 60; // Convert seconds to minutes

    return { distance, duration };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Distance calculation failed');
  }
}

