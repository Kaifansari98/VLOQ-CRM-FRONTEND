"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import type { VisibilityState } from "@tanstack/react-table";

/**
 * Custom hook to sync and persist TanStack Table column visibility state with localStorage.
 * Handles SSR safety and keeps user preferences across page refreshes.
 */
export function usePersistedColumnVisibility(
  storageKey: string,
  initialVisibility: VisibilityState = {}
): [VisibilityState, Dispatch<SetStateAction<VisibilityState>>] {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined" || !storageKey) {
      return initialVisibility;
    }
    try {
      const saved = localStorage.getItem(`table_cols_${storageKey}`);
      if (saved) {
        return { ...initialVisibility, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to read column visibility from localStorage:", e);
    }
    return initialVisibility;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      localStorage.setItem(`table_cols_${storageKey}`, JSON.stringify(columnVisibility));
    } catch (e) {
      console.warn("Failed to save column visibility to localStorage:", e);
    }
  }, [storageKey, columnVisibility]);

  return [columnVisibility, setColumnVisibility];
}

