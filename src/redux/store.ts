// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import authReducer from "@/redux/slices/authSlice"
import notificationsReducer from "@/redux/slices/notificationsSlice"
import themeReducer from "@/redux/slices/themeSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    theme: themeReducer,
  },
})

// ✅ Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// ✅ Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
