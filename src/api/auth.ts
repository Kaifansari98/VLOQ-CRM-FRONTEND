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

export const createVendorLoginLaunchApi = async (vendorId: number) => {
  const { data } = await apiClient.post(`/auth/vendor-login-launch/${vendorId}`);
  return data as {
    message: string;
    data: {
      vendor_id: number;
      vendor_name: string;
      subdomain_url: string;
      launch_url: string;
    };
  };
};

export const exchangeVendorLoginApi = async (token: string) => {
  const { data } = await apiClient.post("/auth/vendor-login-exchange", { token });
  return data as {
    message: string;
    token: string;
    session_id: number;
    franchise_id: number | null;
    customPrivileges?: string[];
    user: any;
  };
};

export const useCreateVendorLoginLaunch = () => {
  return useMutation({
    mutationFn: createVendorLoginLaunchApi,
  });
};
