"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "should-costing-state";
const DEBOUNCE_MS = 500;

/**
 * Custom hook that persists state to localStorage across page refreshes.
 * Handles SSR hydration by initializing from localStorage in useEffect.
 */
export function usePersistedState<T>(
  initialState: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate state from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        setState(parsed);
        console.log("[Cache] Restored state from localStorage");
      }
    } catch (e) {
      console.warn("[Cache] Failed to restore state:", e);
    }
    setIsHydrated(true);
  }, []);

  // Persist state to localStorage on changes (debounced)
  useEffect(() => {
    if (!isHydrated) return;

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the write to avoid performance issues
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("[Cache] Failed to persist state:", e);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state, isHydrated]);

  // Clear storage function
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setState(initialState);
      console.log("[Cache] Cleared localStorage");
    } catch (e) {
      console.warn("[Cache] Failed to clear storage:", e);
    }
  }, [initialState]);

  return [state, setState, clearStorage];
}
