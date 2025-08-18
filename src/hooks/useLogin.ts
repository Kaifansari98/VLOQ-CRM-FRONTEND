import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"
import { useDispatch } from "react-redux"
import { setCredentials } from "@/redux/slices/authSlice"

interface LoginPayload {
  user_contact: string
  password: string
}

export function useLogin() {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await apiClient.post("/auth/login", payload)
      return res.data
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
    },
  })
}