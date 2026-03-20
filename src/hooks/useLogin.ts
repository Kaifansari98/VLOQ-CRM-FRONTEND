import { useMutation, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import { useDispatch } from "react-redux"
import { setCredentials } from "@/redux/slices/authSlice"
import { setActiveTheme } from "@/redux/slices/themeSlice"
import { toastManager } from "@/components/ui/toast";

interface LoginPayload {
  identifier: string,
  // user_contact: string
  password: string
}

export function useLogin() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      try {
        const res = await apiClient.post("/auth/login", payload);
        return res.data;
      } catch (error: any) {
        // ✅ Throw actual backend error message
        toastManager.add({ title: error.response?.data?.message || "Login failed", type: "error" })
        throw new Error(error.response?.data?.message || "Login failed");
      }
    },
    onSuccess: async (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));

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
