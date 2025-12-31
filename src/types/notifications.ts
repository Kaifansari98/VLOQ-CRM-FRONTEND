export interface NotificationItem {
  id: number
  title: string
  message: string
  type?: "LEAD_ASSIGNED" | "TASK_ASSIGNED" | "CHAT_MENTION" | "LEAD_MILESTONE"
  created_at: string
  is_read: boolean
  redirect_url?: string | null
  sender?: {
    user_name?: string | null
  } | null
}

export interface NotificationListResult {
  notifications: NotificationItem[]
  unreadCount: number
}
