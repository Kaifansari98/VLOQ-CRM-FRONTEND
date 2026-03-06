import axios from "axios";

const environment = (process.env.NEXT_PUBLIC_ENVIRONMENT ?? "PRODUCTION").toUpperCase();

const baseURL =
  environment === "STAGING"
    ? "https://staging-api.furnixcrm.com/api"
    : environment === "LOCAL"
      ? "http://localhost:7777/api"
      : "https://api.furnixcrm.com/api";

export const apiClient = axios.create({
  baseURL,
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
