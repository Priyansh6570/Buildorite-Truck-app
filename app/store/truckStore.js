import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const useTruckStore = create(
  persist(
    (set) => ({
      truck: null,
      setTruck: (truck) => set({ truck }),
      clearTruck: () => set({ truck: null }),
    }),
    {
      name: "truck-storage",
      storage: createJSONStorage(() => storage),
    }
  )
);