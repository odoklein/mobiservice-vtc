'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error saving to localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

// Hook for managing recent addresses
export function useRecentAddresses() {
  const [recentAddresses, setRecentAddresses] = useLocalStorage<string[]>('mobiservice_recent_addresses', []);

  const addAddress = useCallback(
    (address: string) => {
      if (!address || address.trim() === '') return;
      
      setRecentAddresses((prev) => {
        // Remove if already exists
        const filtered = prev.filter((addr) => addr.toLowerCase() !== address.toLowerCase());
        // Add to beginning and limit to 10
        return [address, ...filtered].slice(0, 10);
      });
    },
    [setRecentAddresses]
  );

  const clearAddresses = useCallback(() => {
    setRecentAddresses([]);
  }, [setRecentAddresses]);

  return { recentAddresses, addAddress, clearAddresses };
}

// Hook for managing booking data
export function useBookingStorage() {
  const [bookingData, setBookingData] = useLocalStorage<any>('mobiservice_booking_draft', null);
  const [bookingHistory, setBookingHistory] = useLocalStorage<any[]>('mobiservice_booking_history', []);

  const saveBookingDraft = useCallback(
    (data: any) => {
      setBookingData(data);
    },
    [setBookingData]
  );

  const clearBookingDraft = useCallback(() => {
    setBookingData(null);
  }, [setBookingData]);

  const addToHistory = useCallback(
    (booking: any) => {
      setBookingHistory((prev) => {
        // Remove if already exists (by some identifier)
        const filtered = prev.filter((b) => b.id !== booking.id);
        // Add to beginning and limit to 20
        return [booking, ...filtered].slice(0, 20);
      });
    },
    [setBookingHistory]
  );

  const clearHistory = useCallback(() => {
    setBookingHistory([]);
  }, [setBookingHistory]);

  return {
    bookingData,
    bookingHistory,
    saveBookingDraft,
    clearBookingDraft,
    addToHistory,
    clearHistory,
  };
}

