import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import Toast from "react-native-toast-message";

export const useUpdatePushToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token) => {
      if (!token) {
        throw new Error("Push token is required.");
      }
      console.log("Updating push token:", token);
      const data = await api.patch("/user/me/pushtoken", { pushToken: token.pushToken });
      console.log("Push token updated:", data._response);
    },
    onSuccess: () => {
      console.log("Successfully saved push token to server.");
    },
    onError: (err) => {
      console.error("Failed to save push token:", err);
    },
  });
};

export const useUpdateUserProfile = () => {
  const { setUser, user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.put("/user/update", userData);
      return data;
    },
    onSuccess: (updatedUserData) => {
      setUser(updatedUserData.user, user.accessToken);
      console.log("User profile updated:", updatedUserData);
      queryClient.invalidateQueries(["user"]);
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been updated successfully.",
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: err.response?.data?.message || err.message,
      });
    },
  });
};

export const usePopulateOwnerId = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get("/user/me/populate-owner");
      return data;
    },
    onSuccess: (data) => {
      console.log("Owner information populated:", data);
      queryClient.invalidateQueries(["user"]);
    },
    onError: (err) => {
      console.error("Failed to populate owner information:", err);
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
        sortBy: filters.sortBy || "createdAt",
        order: filters.order || "desc",
        roles: ["mine_owner", "truck_owner"],
        ...(searchTerm ? { searchTerm: searchTerm } : {}),
      });
      const endpoint = searchTerm ? `/search?model=user&${params.toString()}` : `/user/admin/users?${params.toString()}`;
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
