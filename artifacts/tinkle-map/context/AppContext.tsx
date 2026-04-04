import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Toilet, SavedPlace, ToiletFilter, SortOption } from "@/types";
import { initializeStorage, getAllToilets, getSavedPlaces, saveToilet, unsaveToilet, isToiletSaved } from "@/services/storage";

interface AppContextValue {
  toilets: Toilet[];
  savedPlaces: SavedPlace[];
  isLoading: boolean;
  filters: ToiletFilter;
  sortOption: SortOption;
  userCity: string;
  setFilters: (f: ToiletFilter) => void;
  setSortOption: (s: SortOption) => void;
  setUserCity: (c: string) => void;
  toggleSave: (toiletId: string) => Promise<void>;
  isSaved: (toiletId: string) => boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ToiletFilter>({});
  const [sortOption, setSortOption] = useState<SortOption>("distance");
  const [userCity, setUserCity] = useState("London");

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await initializeStorage();
      const [allToilets, saved] = await Promise.all([getAllToilets(), getSavedPlaces()]);
      setToilets(allToilets);
      setSavedPlaces(saved);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const toggleSave = useCallback(async (toiletId: string) => {
    const saved = await isToiletSaved(toiletId);
    if (saved) {
      await unsaveToilet(toiletId);
    } else {
      await saveToilet(toiletId);
    }
    const updated = await getSavedPlaces();
    setSavedPlaces(updated);
  }, []);

  const isSaved = useCallback((toiletId: string) => {
    return savedPlaces.some((s) => s.toilet_id === toiletId);
  }, [savedPlaces]);

  return (
    <AppContext.Provider value={{
      toilets, savedPlaces, isLoading, filters, sortOption, userCity,
      setFilters, setSortOption, setUserCity, toggleSave, isSaved, refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
