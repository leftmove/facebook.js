"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark";

// Define the types for our preferences
export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";
export type Registry = "npm" | "jsr";

interface PreferencesState {
  packageManager: PackageManager;
  registry: Registry;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setPackageManager: (packageManager: PackageManager) => void;
  setRegistry: (registry: Registry) => void;
}

// Create a store with persistence to localStorage
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      packageManager: "npm",
      registry: "npm",
      theme: "light",
      setTheme: (theme) => set({ theme }),
      setPackageManager: (packageManager) => set({ packageManager }),
      setRegistry: (registry) => set({ registry }),
    }),
    {
      name: "user-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Create a context for SSR compatibility
type PreferencesContextType = {
  isHydrated: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
} & PreferencesState;

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

// Provider component to handle hydration
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = usePreferencesStore();

  // Hydration logic
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Combine store and hydration state
  const value = {
    ...store,
    isHydrated,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

// Custom hook to use preferences with hydration awareness
export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }

  return context;
}
