import axios from "axios";

export const apiClient = axios.create({
  // baseURL: "https://api.vloq.com/api",
  baseURL: "http://localhost:7777/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: attach token from Redux/localStorage automatically
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
