import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user, token) => set({ user, accessToken: token }),
      clearUser: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) || null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);