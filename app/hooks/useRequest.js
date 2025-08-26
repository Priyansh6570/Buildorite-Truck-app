import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { useRequestStore } from '../store/requestStore';

const MY_REQUESTS_QUERY_KEY = ['requests', 'my'];

export const useFetchMyRequests = () => {
  const { setMyRequests } = useRequestStore();

  return useQuery({
    queryKey: MY_REQUESTS_QUERY_KEY,
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
export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData) => {
      // The payload should contain the 'proposal' object
      const { data } = await api.post('/requests', requestData);
      return data.data;
    },
    onSuccess: () => {
      // Invalidate the list of requests to refetch with the new one
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Error creating request:', error.response?.data || error.message);
    }
  });
};
export const useSubmitProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, proposal }) => {
      const { data } = await api.patch(`/requests/${requestId}/proposal`, { proposal });
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      // When a proposal is updated, refetch both the list and the specific request details
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['request', updatedRequest._id] });
    },
    onError: (error) => {
      console.error('Error submitting proposal:', error.response?.data || error.message);
    }
  });
};
export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status, reason }) => {
      const { data } = await api.patch(`/requests/${requestId}/status`, { status, reason });
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      // Invalidate queries to reflect the status change everywhere
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['request', updatedRequest._id] });
    },
    onError: (error) => {
      console.error('Error updating request status:', error.response?.data || error.message);
    }
  });
};
export const useAssignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, driver_id }) => {
      const { data } = await api.patch(`/requests/${requestId}/assign-driver`, { driver_id });
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['request', updatedRequest._id] });
    },
    onError: (error) => {
      console.error('Error assigning driver:', error.response?.data || error.message);
    }
  });
};
export const useMarkAsCompleted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }) => {
      const { data } = await api.patch(`/requests/${requestId}/complete`);
      return data.data;
    },
    onSuccess: (updatedRequest) => {
      queryClient.invalidateQueries({ queryKey: MY_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['request', updatedRequest._id] });
    },
    onError: (error) => {
      console.error('Error completing request:', error.response?.data || error.message);
    }
  });
};
export const useFetchRequestCount = () => {
  return useQuery({
    queryKey: ['requests', 'count'],
    queryFn: async () => {
      const { data } = await api.get('/requests/count');
      return data.count;
    },
  });
};