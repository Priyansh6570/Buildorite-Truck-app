import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosInstance';
import { useMineStore } from '../store/mineStore';
import { useUserMineStore } from '../store/useUserMineStore';

export const useFetchMines = (filters, searchTerm) => {
  const { appendMines, setMines, setMinePagination } = useMineStore();
  return useQuery({
    queryKey: ['mines', filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page || 1),
        limit: String(filters.limit || 10),
        sortBy: filters.sortBy || 'createdAt',
        order: filters.order || 'desc',
        ...(searchTerm ? { searchTerm: searchTerm } : {}),
      });

      const endpoint = searchTerm
        ? `/search?model=mine&${params.toString()}`
        : `/mine/mine?${params.toString()}`;

      const { data } = await api.get(endpoint);

      setMinePagination({ totalCount: data.totalCount, totalPages: data.totalPages });
      
      if (filters.page > 1) {
        appendMines(data.data);
      } else {
        setMines(data.data);
      }

 
      return {
        totalCount: data.totalCount,
        data: data.data,
        totalPages: data.totalPages || 1,
      };
    },
    keepPreviousData: true,
  });
};

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

export const useFetchGlobalMineAndMaterialCount = () => {
  return useQuery({
    queryKey: ['globalMineAndMaterialCount'],
    queryFn: async () => {
      const { data } = await api.get('/mine/global-count');
      return data;
    },
  });
};