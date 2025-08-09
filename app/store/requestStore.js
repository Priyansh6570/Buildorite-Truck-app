import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

const zustandStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => storage.delete(name),
};

export const useRequestStore = create(
  persist(
    (set, get) => ({
      myRequests: [],
      setMyRequests: (requests) => set({ myRequests: requests }),
      updateRequest: (requestId, updates) => set((state) => ({
        myRequests: state.myRequests.map(req =>
          req._id === requestId ? { ...req, ...updates } : req
        ),
      })),
      getRequestById: (requestId) => {
        return get().myRequests.find(req => req._id === requestId);
      },
      getRequestsByStatus: (status) => {
        return get().myRequests.filter(req => req.status === status);
      },
      clearRequests: () => set({ myRequests: [] }),
    }),
    {
      name: 'request-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);