// hooks/useUser.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import Toast from 'react-native-toast-message';

export const useUpdateUserProfile = () => {
  const { setUser, user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.put("/user/update", userData);
      return data;
    },
    onSuccess: (updatedUserData) => {
      setUser(updatedUserData.user, currentUser.accessToken);
      queryClient.invalidateQueries(["user"]);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully.',
      });
    },
    onError: (err) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.response?.data?.message || err.message,
      });
    },
  });
};

export const useFetchTruckOwners = (filters, searchTerm) => {
  const { appendUsers, setUsers } = useUserStore();

  return useQuery({
    queryKey: [searchTerm, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page || 1),
        limit: String(filters.limit || 10),
        sortBy: filters.sortBy || 'createdAt',
        order: filters.order || 'desc',
        roles: ['mine_owner', 'truck_owner'],
        ...(searchTerm ? { searchTerm: searchTerm } : {}),
      });
      const endpoint = searchTerm
        ? `/search?model=user&${params.toString()}`
        : `/user/admin/users?${params.toString()}`;
      const { data } = await api.get(endpoint);
      const userData = data.users || data.data || [];
      if (filters.page > 1) {
        appendUsers(userData);
      } else {
        setUsers(userData);
      }

      return {
        data: userData,
        totalPages: data.totalPages || 1,
      };
    },
    enabled: true,
    refetchOnMount: true,
    keepPreviousData: false,
  });
};