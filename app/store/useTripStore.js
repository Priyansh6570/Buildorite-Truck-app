import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "trip-storage" });

const zustandStorage = {
  hasShownTrackingToast: false,
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => storage.delete(name),
};

export const useTripStore = create(
  persist(
    (set) => ({
      activeTripId: null,
      setActiveTripId: (tripId) => set({ activeTripId: tripId, hasShownTrackingToast: false }),
      setToastHasBeenShown: () => set({ hasShownTrackingToast: true }),
      clearActiveTripId: () => set({ activeTripId: null, hasShownTrackingToast: false  }),
    }),
    {
      name: "trip-storage",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
