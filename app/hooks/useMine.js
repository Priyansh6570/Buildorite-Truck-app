import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { useMineStore } from '../store/mineStore';
import { useUserMineStore } from '../store/useUserMineStore';

export const useFetchMines = (filters, searchTerm) => {
  const { appendMines, setMines } = useMineStore();
  return useQuery({
    queryKey: ['mines', filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page || 1),
        limit: String(filters.limit || 10),
        ...(searchTerm ? { searchTerm: searchTerm } : {}),
      });

      const endpoint = searchTerm
        ? `/search?model=mine&${params.toString()}`
        : `/mine/mine?${params.toString()}`;

      const { data } = await api.get(endpoint);
      
      if (filters.page > 1) {
        appendMines(data.data);
      } else {
        setMines(data.data);
      }

      return {
        data: data.data,
        totalPages: data.totalPages || 1
      };
    },
    keepPreviousData: true,
  });
};


// Fetch all mines by logged in user
export const useFetchUserMines = () => {
  const { setUserMines } = useUserMineStore();

  return useQuery({
    queryKey: ['userMines'],
    queryFn: async () => {
      const { data } = await api.get('/mine/my-mines');
      setUserMines(data.mines || []);
      return data.mines;
    },
    onError: (error) => {
      console.error('Failed to fetch user mines:', error);
      setUserMines([]);
    },
  });
};


// Fetch a single mine by ID
export const useFetchMineById = (id) => {
  return useQuery({
    queryKey: ['mine', id],
    queryFn: async () => {
      const { data } = await api.get(`/mine/mine/${id}`);
      return data.mine;
    },
    enabled: !!id,
  });
};

// Create a new mine
export const useCreateMine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mineData) => {
      const { data } = await api.post('/mine/mine', mineData);
      return data.mine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mines']);
    },
    onError: (error) => {
      console.log('Error:', error);
    }
  });
};

// Update a mine
export const useUpdateMine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...mineData }) => {
      const { data } = await api.put(`/mine/mine/${id}`, mineData);
      return data.mine;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['mine', id]);
      queryClient.invalidateQueries(['mines']);
    },
  });
};

// Delete a mine
export const useDeleteMine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/mine/mine/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mines']);
    },
  });
};