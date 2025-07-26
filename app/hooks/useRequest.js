import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { useRequestStore } from '../store/requestStore';

// Create a new request
export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  const { addRequest } = useRequestStore();
  
  return useMutation({
    mutationFn: async (requestData) => {
      console.log("Creating request with data:", requestData);
      const { data } = await api.post('/request', requestData);
      return data.data;
    },
    onSuccess: (newRequest) => {
      addRequest(newRequest);
      queryClient.invalidateQueries(['requests']);
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error('Error creating request:', error);
    }
  });
};

// Fetch user's requests
export const useFetchMyRequests = () => {
  const { setMyRequests } = useRequestStore();
  
  return useQuery({
    queryKey: ['myRequests'],
    queryFn: async () => {
      const { data } = await api.get('/requests');
      setMyRequests(data.data || []);
      return data.data;
    },
    onError: (error) => {
      console.error('Failed to fetch requests:', error);
      setMyRequests([]);
    },
  });
};

// Cancel request (for both truck owner and mine owner)
export const useCancelRequest = () => {
  const queryClient = useQueryClient();
  const { updateRequest } = useRequestStore();
  
  return useMutation({
    mutationFn: async ({ requestId, rejection_reason }) => {
      const { data } = await api.patch(`/requests/${requestId}/cancel`, {
        rejection_reason
      });
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      updateRequest(updatedRequest._id, updatedRequest);
      queryClient.invalidateQueries(['requests']);
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error('Error canceling request:', error);
    }
  });
};

// Accept request (Mine Owner only)
export const useAcceptRequest = () => {
  const queryClient = useQueryClient();
  const { updateRequest } = useRequestStore();
  
  return useMutation({
    mutationFn: async ({ requestId, truck_id, pickup_schedule }) => {
      const { data } = await api.patch(`/requests/${requestId}/accept`, {
        truck_id,
        pickup_schedule
      });
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      updateRequest(updatedRequest._id, updatedRequest);
      queryClient.invalidateQueries(['requests']);
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error('Error accepting request:', error);
    }
  });
};

// Reject request (Mine Owner only)
export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  const { updateRequest } = useRequestStore();
  
  return useMutation({
    mutationFn: async ({ requestId, cancellation_reason }) => {
      const { data } = await api.patch(`/requests/${requestId}/reject`, {
        cancellation_reason
      });
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      updateRequest(updatedRequest._id, updatedRequest);
      queryClient.invalidateQueries(['requests']);
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error('Error rejecting request:', error);
    }
  });
};

// Edit request (Mine Owner only)
export const useEditRequest = () => {
  const queryClient = useQueryClient();
  const { updateRequest } = useRequestStore();
  
  return useMutation({
    mutationFn: async ({ requestId, ...updates }) => {
      const { data } = await api.patch(`/requests/${requestId}`, updates);
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      updateRequest(updatedRequest._id, updatedRequest);
      queryClient.invalidateQueries(['requests']);
      queryClient.invalidateQueries(['myRequests']);
    },
    onError: (error) => {
      console.error('Error editing request:', error);
    }
  });
};

// Get request by ID
export const useFetchRequestById = (requestId) => {
  return useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      const { data } = await api.get(`/requests/${requestId}`);
      return data.data;
    },
    enabled: !!requestId,
  });
};