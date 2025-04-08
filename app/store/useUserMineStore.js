import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const useUserMineStore = create(
  persist(
    (set) => ({
      userMines: [],

      setUserMines: (mines) => set({ userMines: mines }),
      clearUserMines: () => set({ userMines: [] }),
    }),
    {
      name: 'user-mine-storage',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) || null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);