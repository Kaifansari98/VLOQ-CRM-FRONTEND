import { useMutation, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import { useDispatch } from "react-redux"
import { setCredentials } from "@/redux/slices/authSlice"
import { setCustomPrivileges } from "@/redux/slices/customPrivilegesSlice"
import { setActiveTheme } from "@/redux/slices/themeSlice"

interface LoginPayload {
  identifier: string,
  password: string
  device_id?: string
  device_name?: string
  platform?: string
}

export function useLogin() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      try {
        const res = await apiClient.post("/auth/login", payload);
        return res.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || "Login failed");
      }
    },
    onSuccess: async (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(
        setCustomPrivileges(
          Array.isArray(data.customPrivileges) ? data.customPrivileges : [],
        ),
      );

      // Fetch and store active theme for this vendor
      try {
        const vendorId = data.user?.vendor_id;
        if (vendorId) {
          const themeRes = await apiClient.get(`/themes/vendorId/${vendorId}/active`);
          dispatch(setActiveTheme(themeRes.data?.data ?? null));
        }
      } catch {
        // Theme fetch failure is non-blocking
      }
    },
  });
}

interface UserStatusResponse {
  message: string
  status: "active" | "inactive"
}

export function useCheckUserStatus(userId?: number) {
  return useQuery({
    queryKey: ["userStatus", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiClient.get<UserStatusResponse>(
        `/auth/user-status/${userId}`
      )
      return res.data
    },
  })
}
