import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { useMaterialStore } from "../store/materialStore";

// Fetch all materials
export const useFetchMaterials = (filters, searchTerm) => {
  const { appendMaterials, setMaterials } = useMaterialStore();
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
        : `/material?${params.toString()}`;

      const { data } = await api.get(endpoint);
      if (filters.page > 1) {
        appendMaterials(data.data);
      } else {
        setMaterials(data.data);
      }

      return {
        data: data.data,
        totalPages: data.totalPages || 1
      };
    },
    keepPreviousData: true,
  });
};

// Fetch materials by mine ID
export const useFetchMaterialsByMine = (mineId) => {
  return useQuery({
    queryKey: ["materials", mineId],
    queryFn: async () => {
      const { data } = await api.get(`/material/mine/${mineId}`);
      return data.materials;
    },
    enabled: !!mineId,
  });
};

// Fetch a single material by ID
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

// Create a new material
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (materialData) => {
      const { data } = await api.post("/material", materialData);
      return data.material;
    },
    onSuccess: (_, { mine_id }) => {
      queryClient.invalidateQueries(["materials", mine_id]);
    },
    onError: (error) => {
      console.log("Error creating material:", error);
    },
  });
};

// Update a material
export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...materialData }) => {
      const { data } = await api.put(`/material/${id}`, materialData);
      return data.material;
    },
    onSuccess: (_, { id, mine_id }) => {
      queryClient.invalidateQueries(["material", id]);
      queryClient.invalidateQueries(["materials", mine_id]);
    },
  });
};

// Delete a material
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/material/${id}`);
    },
    onSuccess: (_, { mine_id }) => {
      queryClient.invalidateQueries(["materials", mine_id]);
    },
  });
};
