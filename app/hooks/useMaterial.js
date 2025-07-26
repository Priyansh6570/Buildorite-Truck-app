import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { useMaterialStore } from "../store/materialStore";

export const useFetchMaterials = (filters, searchTerm) => {
  const { appendMaterials, setMaterials, setMaterialPagination } = useMaterialStore();
  
  return useQuery({
    queryKey: ['materials', filters, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page || 1),
        limit: String(filters.limit || 10),
        sortBy: filters.sortBy || 'createdAt',
        order: filters.order || 'desc',
        ...(searchTerm ? { searchTerm: searchTerm } : {}),
      });
      
      const endpoint = searchTerm
        ? `/search?model=material&${params.toString()}`
        : `/search?model=material&${params.toString()}`
      
      const { data } = await api.get(endpoint);

      setMaterialPagination({
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
      
      if (filters.page > 1) {
        appendMaterials(data.materials || data.data);
      } else {
        setMaterials(data.materials || data.data);
      }
      
      return {
        data: data.materials || data.data,
        pagination: data.pagination,
        totalPages: data.pagination?.pages || data.totalPages || 1,
        totalCount: data.totalCount || totalCount,
      };
    },
    keepPreviousData: true,
  });
};

export const useFetchMaterialsByMine = (mineId) => {
  return useQuery({
    queryKey: ["materials", "mine", mineId],
    queryFn: async () => {
      const { data } = await api.get(`/material/mine/${mineId}`);
      return data.materials;
    },
    enabled: !!mineId,
  });
};

export const useFetchMaterialById = (id) => {
  return useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data } = await api.get(`/material/${id}`);
      return data.material;
    },
    enabled: !!id,
  });
};

export const useFetchAllUnits = () => {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await api.get('/material/units/d');
      return data.units;
    },
  });
};
export const useFetchMyUnits = () => {
  return useQuery({
    queryKey: ['my-units'],
    queryFn: async () => {
      const { data } = await api.get('/material/units/my-units');
      return data.units;
    },
  });
};
