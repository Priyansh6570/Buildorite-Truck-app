import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import Toast from "react-native-toast-message";

export const useNotifications = (cursor, limit = 20) => {
  return useQuery({
    queryKey: ["notifications", cursor],
    queryFn: async () => {
      const { data } = await api.get("/notifications", {
        params: { cursor, limit },
      });
      return data;
    },
    keepPreviousData: true,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/unread-count");
      return data.count;
    },
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/notifications/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["notifications-unread-count"]);
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Failed to mark as read",
        text2: err.response?.data?.message || err.message,
      });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/notifications/mark-all");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["notifications-unread-count"]);
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "Failed to mark all as read",
        text2: err.response?.data?.message || err.message,
      });
    },
  });
};