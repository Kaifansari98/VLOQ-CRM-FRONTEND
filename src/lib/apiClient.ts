import axios from "axios";
import { clearClientSessionStorage } from "@/lib/sessionCleanup";

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

const shouldForceLogout = (message?: string) => {
  if (!message) return false;

  const normalized = message.toLowerCase();
  return (
    normalized.includes("access token missing") ||
    normalized.includes("invalid token") ||
    normalized.includes("session expired") ||
    normalized.includes("session is no longer active") ||
    normalized.includes("unauthorized") ||
    normalized.includes("user is inactive")
  );
};

// Optional: attach token from Redux/localStorage automatically
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const message = error?.response?.data?.message as string | undefined;
    const hasToken = !!localStorage.getItem("token");
    const requestUrl = String(error?.config?.url ?? "");
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (
      hasToken &&
      !isLoginRequest &&
      (status === 401 || status === 403) &&
      shouldForceLogout(message)
    ) {
      clearClientSessionStorage();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
