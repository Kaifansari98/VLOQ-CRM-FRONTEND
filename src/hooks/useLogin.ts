import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import { useDispatch } from "react-redux"
import { setCredentials } from "@/redux/slices/authSlice"
import { toast } from "react-toastify"

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
        toast.error(error.response?.data?.message || "Login failed")
        throw new Error(error.response?.data?.message || "Login failed");
      }
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
    },
  });
}