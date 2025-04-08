import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const useMaterialStore = create(
  persist(
    (set, get) => ({
      materials: [],
      material_filters: { 
        page: 1, 
        limit: 10, 
        sortBy: "price", 
        order: "asc", 
      },
      searchTerm: '',
      setMaterials: (materials) => set({ materials }),
      appendMaterials: (newMaterials) => set((state) => ({ 
        materials: [...state.materials, ...newMaterials] 
      })),
      clearMaterials: () => set({ materials: [] }),
      resetStore: () => set({
        materials: [],
        material_filters: { 
          page: 1, 
          limit: 10, 
          sortBy: "price", 
          order: "asc", 
        },
        searchTerm: '',
      }),
      setMaterialFilters: (newFilters) => set((state) => ({ 
        material_filters: { ...state.material_filters, ...newFilters } 
      })),
      setSearchTerm: (term) => set({ searchTerm: term }),
    }),
    {
      name: "material-storage",
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) || null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);