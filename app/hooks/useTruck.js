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
      setTimeout(() => {
        queryClient.invalidateQueries(['myTruck']);
      }, 500);
    },
    onError: (error) => {
      console.error('Error adding truck:', error);
    },
  });
};


export const useFetchMyDrivers = () => {
  return useQuery({
    queryKey: ['myDrivers'],
    queryFn: async () => {
      const { data } = await api.get('/truck/my-drivers');
      return data.data;
    },
    onError: (error) => {
      console.error('Error fetching drivers:', error);
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

export const useUpdateTruck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, truckData }) => {
      const { data } = await api.put(`/truck/truck/${id}`, truckData);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['myTruck']);
    },
    onError: (error) => {
      console.error('Error updating truck:', error);
    },
  });
};

export const useFetchDriverDetails = (driverId) => {
  return useQuery({
    queryKey: ['driverDetails', driverId],
    queryFn: async () => {
      const { data } = await api.get(`/truck/driver/${driverId}`);
      return data;
    },
    enabled: !!driverId,
    onError: (error) => {
      console.error('Error fetching driver details:', error);
    },
  });
};