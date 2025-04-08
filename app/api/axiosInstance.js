import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { reset } from "../navigation/navigationRef";

const api = axios.create({
  baseURL: 'https://buildorite-backend.onrender.com/api/v1',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { clearUser } = useAuthStore.getState();
    if (error.response?.status === 401) {
      clearUser();
      reset(0, [{ name: "Auth" }]);
    }
    return Promise.reject(error);
  }
);

export default api;
