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

/**
 * Calculate distances for all three segments of a VTC journey:
 * 1. CA (Coût Additionnel): Depot → Pickup
 * 2. TP (Trajet Principal): Pickup → Dropoff
 * 3. Return: Dropoff → Depot
 * 
 * This uses 3 separate API calls to ensure accurate driving distance
 * for each segment (important in mountainous Haute-Savoie region).
 */
export async function calculateThreeSegments(
  depot: { lat: number; lng: number },
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): Promise<{
  distanceCA: number; // km
  distanceTP: number; // km
  distanceReturn: number; // km
  totalDistance: number; // km
  totalDuration: number; // minutes
  durationCA: number;
  durationTP: number;
  durationReturn: number;
}> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('Mapbox access token not found');
  }

  try {
    // Make 3 parallel API calls for accurate routing
    const [segmentCA, segmentTP, segmentReturn] = await Promise.all([
      calculateDistance(depot, pickup), // Depot → Pickup
      calculateDistance(pickup, dropoff), // Pickup → Dropoff
      calculateDistance(dropoff, depot), // Dropoff → Depot
    ]);

    return {
      distanceCA: Math.round(segmentCA.distance * 10) / 10,
      distanceTP: Math.round(segmentTP.distance * 10) / 10,
      distanceReturn: Math.round(segmentReturn.distance * 10) / 10,
      totalDistance: Math.round((segmentCA.distance + segmentTP.distance + segmentReturn.distance) * 10) / 10,
      totalDuration: Math.round(segmentCA.duration + segmentTP.duration + segmentReturn.duration),
      durationCA: Math.round(segmentCA.duration),
      durationTP: Math.round(segmentTP.duration),
      durationReturn: Math.round(segmentReturn.duration),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('3-segment distance calculation failed');
  }
}


