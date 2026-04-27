import axios from "axios";
import { useAuthStore } from "@/store";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post("/auth/register", { username, email, password }),

  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  getCurrentUser: () => api.get("/auth/me"),
};

export const boardApi = {
  getUserBoards: () => api.get("/boards"),

  getBoard: (id: string) => api.get(`/boards/${id}`),

  getBoardElements: (id: string) => api.get(`/boards/${id}/elements`),

  createBoard: (name: string, description?: string) =>
    api.post("/boards", { name, description }),

  updateBoard: (id: string, name?: string, description?: string) =>
    api.put(`/boards/${id}`, { name, description }),

  deleteBoard: (id: string) => api.delete(`/boards/${id}`),

  generateInviteLink: (id: string) => api.post(`/boards/${id}/invite`),

  joinBoard: (inviteCode: string) => api.post("/boards/join", { inviteCode }),

  saveElements: (boardId: string, elements: any[]) =>
    api.put(`/boards/${boardId}/elements`, elements),
};
