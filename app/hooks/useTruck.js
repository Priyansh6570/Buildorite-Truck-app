// src/hooks/useTruck.js
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../api/axiosInstance';

export const useAddTruck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (truckData) => {
      const { data } = await api.post('/truck/create-truck', truckData);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['myTruck']); // Invalidate query for fetching single truck if you have one
      // Optionally, you might want to update user data in the auth store if it includes truck IDs
    },
    onError: (error) => {
      console.error('Error adding truck:', error);
    },
  });
};

export const useFetchMyTruck = () => {
  
  return useQuery({
    queryKey: ['myTruck'],
    queryFn: async () => {
      return api.get('/truck/my-truck')
        .then(response => {
          return response.data.data;
        })
        .catch(error => {
          throw error;
        });
    },
  });
};