import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface User {
  id: number
  vendor_id: number
  franchise_id?: number | null
  user_name: string
  user_contact: string
  user_email: string
  user_type_id: number
  user_role: string
  status: string
  vendor: {
    id?: number
    vendor_name?: string
    vendor_code?: string
    vendor_report_code?: string | null
    ["vendor-report-code"]?: string | null
    [key: string]: any
  }
  user_type: Record<string, any>
  is_ho_user: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  franchise_id: number | null
  is_ho_user: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  franchise_id: null,
  is_ho_user: false,
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
      state.franchise_id = action.payload.user.franchise_id ?? null
      state.is_ho_user = action.payload.user.is_ho_user ?? false
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token)
        localStorage.setItem("user", JSON.stringify(action.payload.user))
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.franchise_id = null
      state.is_ho_user = false
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("activeTheme")
      }
    },
    loadSession: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token")
        const user = localStorage.getItem("user")
        if (token && user) {
          state.token = token
          state.user = JSON.parse(user)
          state.franchise_id = state.user?.franchise_id ?? null
          state.is_ho_user = state.user?.is_ho_user ?? false
        }
      }
    },
    setFranchiseId: (state, action: PayloadAction<number | null>) => {
      state.franchise_id = action.payload
      if (state.user) {
        state.user.franchise_id = action.payload
      }
      if (typeof window !== "undefined") {
        const user = localStorage.getItem("user")
        if (user) {
          try {
            const parsed = JSON.parse(user)
            parsed.franchise_id = action.payload
            localStorage.setItem("user", JSON.stringify(parsed))
          } catch {
            // ignore storage parse failures
          }
        }
      }
    },
  },
})

export const { setCredentials, logout, loadSession, setFranchiseId } =
  authSlice.actions
export default authSlice.reducer
