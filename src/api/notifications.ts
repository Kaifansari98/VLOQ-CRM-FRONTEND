import { apiClient } from "@/lib/apiClient"
import { NotificationItem, NotificationListResult } from "@/types/notifications"

interface FetchNotificationsOptions {
  isRead?: boolean
  take?: number
  skip?: number
}

export const fetchNotifications = async (
  vendorId: number,
  userId: number,
  options: FetchNotificationsOptions = {}
): Promise<NotificationListResult> => {
  const { data } = await apiClient.get(
    `/notifications/vendor/${vendorId}/user/${userId}`,
    {
      params: {
        take: options.take ?? 20,
        skip: options.skip ?? 0,
        ...(options.isRead !== undefined ? { is_read: options.isRead } : {}),
      },
    }
  )

  const notifications = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.notifications)
        ? data.notifications
        : []
  const unreadCount =
    typeof data?.unread_count === "number"
      ? data.unread_count
      : notifications.filter((item: NotificationItem) => !item.is_read).length

  return { notifications, unreadCount }
}

export const markNotificationRead = async (id: number, userId: number) => {
  const { data } = await apiClient.patch(`/notifications/${id}/read`, {
    user_id: userId,
  })
  return data
}

interface PushTokenPayload {
  vendor_id: number
  user_id: number
  token: string
  platform: string
  browser?: string
}

export const registerPushToken = async (payload: PushTokenPayload) => {
  const { data } = await apiClient.post("/notifications/push-token", payload)
  return data
}
