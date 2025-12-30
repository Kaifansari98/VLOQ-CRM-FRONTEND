export interface NotificationItem {
  id: number
  title: string
  message: string
  created_at: string
  is_read: boolean
  redirect_url?: string | null
}

export interface NotificationListResult {
  notifications: NotificationItem[]
  unreadCount: number
}
