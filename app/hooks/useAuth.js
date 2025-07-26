import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import { useAuthStore } from "../store/authStore";

export const useCheckUser = () => {
  return useMutation({
    mutationFn: async (phone) => {
      const { data } = await api.post("/auth/check-user", { phone });
      return data;
    },
  });
};

export const useLoginUser = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (phone) => {
      const { data } = await api.post("/auth/login", { phone });
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      return data;
    },
    onSuccess: (loginData) => {
      setUser(loginData.user, loginData.accessToken);
    },
    onError: (err) => {
      console.error("Login error:", err.response?.data?.message || err.message);
    },
  });
};

export const useRegisterUser = () => {
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: async ({ name, email, phone, role }) => {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        phone,
        role,
      });
      api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      return data;
    },
    onSuccess: (registerData) => {
      setUser(registerData.user, registerData.accessToken);
    },
    onError: (err) => {
      console.error("Register error:", err.response?.data?.message || err.message);
    },
  });
};

export const useRegisterDriver = () => {
  return useMutation({
    mutationFn: async ({ phone, name }) => {
      const { data } = await api.post("/auth/register-driver", { phone, name });
      return data;
    },
    onSuccess: (registerData) => {
      console.log("Driver registered successfully:", registerData);
    },
    onError: (err) => {
      console.error("Register Driver error:", err.response?.data?.message || err.message);
    },
  });
};

export const useLogoutUser = () => {
  const { clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      delete api.defaults.headers.common['Authorization'];
      clearUser();
      queryClient.clear();
    },
    onError: (err) => {
      console.error('Logout error:', err.response?.data?.message || err.message);
    },
  });
};