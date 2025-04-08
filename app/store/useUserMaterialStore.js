import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const useUserMaterialStore = create(
  persist(
    (set) => ({
      userMaterials: [],

      setUserMaterials: (materials) => set({ userMaterials: materials }),
      clearUserMaterials: () => set({ userMaterials: [] }),
    }),
    {
      name: "user-material-storage",
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) || null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);