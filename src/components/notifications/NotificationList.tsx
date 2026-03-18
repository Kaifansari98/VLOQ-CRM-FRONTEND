"use client"

import { NotificationItem } from "@/types/notifications"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

interface NotificationListProps {
  notifications: NotificationItem[]
  isLoading?: boolean
  onNotificationClick: (notification: NotificationItem) => void
}

export const NotificationList = ({
  notifications,
  isLoading = false,
  onNotificationClick,
}: NotificationListProps) => {
  if (isLoading) {
    return (
      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
        Loading notifications...
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
        You're all caught up.
      </div>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => onNotificationClick(notification)}
          className={cn(
            "flex w-full flex-col gap-1 border-b border-border px-3 py-3 text-left transition hover:bg-accent",
            !notification.is_read && "bg-primary/5"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm",
                notification.is_read ? "text-foreground/80" : "font-medium"
              )}
            >
              {notification.title || "Notification"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {formatDate(notification.created_at, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        </button>
      ))}
    </div>
  )
}
