import type { AppDispatch } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";

export const clearClientSessionStorage = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("pushDeviceId");
  localStorage.removeItem("activeTheme");

  Object.keys(localStorage)
    .filter((key) => key.startsWith("pushToken:"))
    .forEach((key) => localStorage.removeItem(key));
};

export const forceClientLogout = (dispatch?: AppDispatch) => {
  dispatch?.(logout());
  clearClientSessionStorage();

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};
