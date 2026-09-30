"use client"

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { logout } from "@/redux/slices/authSlice"

interface CustomPrivilegesState {
  codes: string[]
}

const STORAGE_KEY = "customPrivileges"

const initialState: CustomPrivilegesState = {
  codes: [],
}

const customPrivilegesSlice = createSlice({
  name: "customPrivileges",
  initialState,
  reducers: {
    setCustomPrivileges: (state, action: PayloadAction<string[]>) => {
      state.codes = [...new Set(action.payload)]
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.codes))
      }
    },
    loadCustomPrivileges: (state) => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            state.codes = Array.isArray(parsed)
              ? [...new Set(parsed.filter((value): value is string => typeof value === "string"))]
              : []
          } catch {
            state.codes = []
          }
        }
      }
    },
    clearCustomPrivileges: (state) => {
      state.codes = []
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.codes = []
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY)
      }
    })
  },
})

export const {
  setCustomPrivileges,
  loadCustomPrivileges,
  clearCustomPrivileges,
} = customPrivilegesSlice.actions

export default customPrivilegesSlice.reducer
