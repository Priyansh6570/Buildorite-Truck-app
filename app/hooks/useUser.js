// hooks/useUser.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { useAuthStore } from "../store/authStore";
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