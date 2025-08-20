import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';

// --- Query Keys ---
const MY_TRIPS_QUERY_KEY = ['trips', 'my'];

/**
 * Fetches all trips for the currently logged-in user.
 * The backend determines which trips to return based on the user's role.
 */
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

/**
 * Fetches a single trip by its ID, including populated details.
 * @param {string} tripId - The ID of the trip to fetch.
 */
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

/**
 * Hook for a driver to update a trip's milestone.
 */
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

/**
 * Hook for a Mine Owner or Truck Owner to verify a milestone.
 */
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

/**
 * Hook for a driver to report an issue with a trip.
 */
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