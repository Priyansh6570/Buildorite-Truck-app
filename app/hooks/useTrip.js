import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';

const MY_TRIPS_QUERY_KEY = ['trips', 'my'];

export const useFetchMyTrips = () => {
    return useQuery({
        queryKey: MY_TRIPS_QUERY_KEY,
        queryFn: async () => {
            const { data } = await api.get('/trips');
            return data.data;
        },
        onError: (error) => {
            console.error('Failed to fetch trips:', error);
        },
    });
};

export const useFetchUserTripCounts = () => {
    return useQuery({
        queryKey: ['stats', 'trip-count'],
        queryFn: async () => {
            const { data } = await api.get('/trips/stats/trip-count');
            return data.data;
        },
        onError: (error) => {
            console.error('Failed to fetch trip counts:', error);
        },
    });
};

export const useFetchTripById = (tripId) => {
    return useQuery({
        queryKey: ['trip', tripId],
        queryFn: async () => {
            const { data } = await api.get(`/trips/${tripId}`);
            return data.data;
        },
        enabled: !!tripId,
    });
};

export const useUpdateMilestone = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tripId, status, location }) => {
            const { data } = await api.patch(`/trips/${tripId}/milestone`, { status, location });
            return data.data;
        },
        onSuccess: (updatedTrip) => {
            queryClient.invalidateQueries({ queryKey: MY_TRIPS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['trip', updatedTrip._id] });
        },
        onError: (error) => {
            console.error('Error updating milestone:', error.response?.data || error.message);
        }
    });
};

export const useVerifyMilestone = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tripId, status }) => {
            const { data } = await api.patch(`/trips/${tripId}/verify`, { status });
            return data.data;
        },
        onSuccess: (updatedTrip) => {
            queryClient.invalidateQueries({ queryKey: MY_TRIPS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['trip', updatedTrip._id] });
        },
        onError: (error) => {
            console.error('Error verifying milestone:', error.response?.data || error.message);
        }
    });
};

export const useUpdateLiveLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ driverId, coordinates }) => {
      const { data } = await api.patch(`/trips/location/live`, { driverId, coordinates });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error) => {
      console.error('Live location update failed:', error.message);
    }
  });
};

export const useReportIssue = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tripId, reason, notes }) => {
            const { data } = await api.patch(`/trips/${tripId}/report-issue`, { reason, notes });
            return data.data;
        },
        onSuccess: (updatedTrip) => {
            queryClient.invalidateQueries({ queryKey: MY_TRIPS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['trip', updatedTrip._id] });
        },
        onError: (error) => {
            console.error('Error reporting issue:', error.response?.data || error.message);
        }
    });
};

export const useFetchTruckStat = () => {
  return useQuery({
    queryKey: ['statsData'],
    queryFn: async () => {
      const { data } = await api.get('/mine/truckstats');
      return data;
    },
  });
};

export const useFetchTruckOwnerAnalytics = (startDate, endDate) => {
  return useQuery({
    queryKey: ['analytics', 'truck', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.post('/trips/analytics/truck', { startDate, endDate });
      return data;
    },
    enabled: !!startDate && !!endDate,
  });
};
