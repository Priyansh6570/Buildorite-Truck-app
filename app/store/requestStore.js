import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const useRequestStore = create(
  persist(
    (set, get) => ({
      requests: [],
      myRequests: [],
      
      // Set all requests
      setRequests: (requests) => set({ requests }),
      
      // Set user's requests
      setMyRequests: (requests) => set({ myRequests: requests }),
      
      // Add a new request
      addRequest: (request) => set((state) => ({
        requests: [request, ...state.requests],
        myRequests: [request, ...state.myRequests]
      })),
      
      // Update request status
      updateRequest: (requestId, updates) => set((state) => ({
        requests: state.requests.map(req => 
          req._id === requestId ? { ...req, ...updates } : req
        ),
        myRequests: state.myRequests.map(req => 
          req._id === requestId ? { ...req, ...updates } : req
        )
      })),
      
      // Remove request
      removeRequest: (requestId) => set((state) => ({
        requests: state.requests.filter(req => req._id !== requestId),
        myRequests: state.myRequests.filter(req => req._id !== requestId)
      })),
      
      // Get request by ID
      getRequestById: (requestId) => {
        const state = get();
        return state.requests.find(req => req._id === requestId) || 
               state.myRequests.find(req => req._id === requestId);
      },
      
      // Get requests by status
      getRequestsByStatus: (status) => {
        const state = get();
        return state.myRequests.filter(req => req.status === status);
      },
      
      // Clear all requests
      clearRequests: () => set({ requests: [], myRequests: [] }),
    }),
    {
      name: 'request-storage',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => storage.set(name, value),
        getItem: (name) => storage.getString(name) || null,
        removeItem: (name) => storage.delete(name),
      })),
    }
  )
);