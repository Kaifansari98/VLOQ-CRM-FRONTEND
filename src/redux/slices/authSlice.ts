import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface User {
  id: number
  vendor_id: number
  user_name: string
  user_contact: string
  user_email: string
  user_type_id: number
  status: string
  vendor: Record<string, any>
  user_type: Record<string, any>
}

interface AuthState {
  user: User | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user
      state.token = action.payload.token
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token)
        localStorage.setItem("user", JSON.stringify(action.payload.user))
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    },
    loadSession: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token")
        const user = localStorage.getItem("user")
        if (token && user) {
          state.token = token
          state.user = JSON.parse(user)
        }
      }
    },
  },
})

export const { setCredentials, logout, loadSession } = authSlice.actions
export default authSlice.reducer