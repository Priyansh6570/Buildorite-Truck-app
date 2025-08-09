import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const useUserStore = create(
    persist(
      (set, get) => ({
        users: [],
        user_filters: {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          order: 'desc',
        },
        searchTerm: '',
        setUsers: (newUsers) => {
          set({ users: newUsers });
        },
        appendUsers: (newUsers) => set((state) => ({
          users: [...state.users, ...newUsers],
        })),
        setSearchTerm: (term) => set({ searchTerm: term }),
        setUserFilters: (newFilters) => set((state) => ({
          user_filters: { ...state.user_filters, ...newFilters },
        })),
        clearUsers: () => set({ users: [] }),
        resetStore: () => set({
          users: [],
          user_filters: {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            order: 'desc',
          },
          searchTerm: '',
        }),
      }),
      {
        name: "user-storage",
        storage: createJSONStorage(() => ({
          setItem: (name, value) => storage.set(name, value),
          getItem: (name) => storage.getString(name) || null,
          removeItem: (name) => storage.delete(name),
        })),
      }
    )
  );