import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { NotificationItem } from "@/types/notifications"

interface NotificationsState {
  items: NotificationItem[]
  unreadCount: number
  lastFetchedAt: number | null
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  lastFetchedAt: null,
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (
      state,
      action: PayloadAction<{
        items: NotificationItem[]
        unreadCount?: number
      }>
    ) => {
      state.items = action.payload.items
      state.unreadCount =
        action.payload.unreadCount ??
        action.payload.items.filter((item) => !item.is_read).length
      state.lastFetchedAt = Date.now()
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      const exists = state.items.some((item) => item.id === action.payload.id)
      if (exists) return
      state.items = [action.payload, ...state.items]
      if (!action.payload.is_read) {
        state.unreadCount += 1
      }
    },
    markNotificationRead: (state, action: PayloadAction<number>) => {
      const target = state.items.find((item) => item.id === action.payload)
      if (target && !target.is_read) {
        target.is_read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
  },
})

export const { setNotifications, addNotification, markNotificationRead } =
  notificationsSlice.actions
export default notificationsSlice.reducer
