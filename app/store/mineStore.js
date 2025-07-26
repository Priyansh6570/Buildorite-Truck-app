import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
export const useMineStore = create(
  persist(
    (set, get) => ({
      mines: [],
      totalCount: 0,
      totalPages: 0,
      filters: {
        page: 1,
        limit: 10,
        sortBy: 'price',
        order: 'asc',
      },
      searchTerm: '',

      setMinePagination: ({ totalCount, totalPages }) => set({ totalCount, totalPages }),
      setMines: (mines) => set({ mines }),
      appendMines: (newMines) => set((state) => ({ mines: [...state.mines, ...newMines] })),
      clearMines: () => set({ mines: [] }),
      resetStore: () => set({
        mines: [],
        totalCount: 0,
        totalPages: 0,
        filters: {
          page: 1,
          limit: 10,
          sortBy: 'price',
          order: 'asc',
        },
        searchTerm: '',
      }),
      setMineFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      setSearchTerm: (term) => set({ searchTerm: term }),
    }),
    {
      name: 'mine-storage',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) || null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);