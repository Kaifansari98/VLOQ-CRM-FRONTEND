import { apiClient } from "@/lib/apiClient";
import { useMutation } from "@tanstack/react-query";

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

const changePasswordApi = async (payload: ChangePasswordPayload) => {
  const { data } = await apiClient.post("/auth/change-password", payload);
  return data;
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePasswordApi,
  });
};

export const logoutActivityApi = async () => {
  const { data } = await apiClient.post("/auth/logout");
  return data;
};

export const logoutAllByVendorApi = async (vendorId: number) => {
  const { data } = await apiClient.post(`/auth/logout-all/vendor/${vendorId}`);
  return data;
};

export const validateSessionApi = async () => {
  const { data } = await apiClient.get("/auth/session");
  return data;
};
