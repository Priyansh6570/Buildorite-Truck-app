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

/**
 * Hook for a driver to update their live location during a trip.
 * This is often called periodically in the background.
 */
export const useUpdateLiveLocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ tripId, coordinates }) => {
            const { data } = await api.patch(`/trips/${tripId}/location`, { coordinates });
            return data.data;
        },
        onSuccess: (updatedTrip) => {
            // Optionally update the specific trip query in the cache for real-time maps
            queryClient.setQueryData(['trip', updatedTrip._id], (oldData) => 
                oldData ? { ...oldData, ...updatedTrip } : oldData
            );
        },
        onError: (error) => {
            // Don't log every time, as this might be called frequently
            console.log('Live location update failed:', error.message);
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