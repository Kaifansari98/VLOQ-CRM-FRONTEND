"use client";

import { NotificationItem } from "@/types/notifications";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bell, Briefcase, MessageCircle, Target, Circle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TYPE_STYLES: Record<
  NonNullable<NotificationItem["type"]>,
  { label: string; bg: string; text: string; Icon: typeof Bell }
> = {
  LEAD_ASSIGNED: {
    label: "Lead",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-500 dark:text-emerald-500",
    Icon: Target,
  },
  TASK_ASSIGNED: {
    label: "Task",
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-500 dark:text-blue-500",
    Icon: Briefcase,
  },
  CHAT_MENTION: {
    label: "Chat",
    bg: "bg-amber-50 dark:bg-amber-950",
    text: "text-amber-500 dark:text-amber-500",
    Icon: MessageCircle,
  },
  LEAD_MILESTONE: {
    label: "Milestone",
    bg: "bg-purple-50 dark:bg-purple-950",
    text: "text-purple-500 dark:text-purple-500",
    Icon: Bell,
  },
  LEAD_ACTION: {
    label: "Lead Action",
    bg: "bg-sky-50 dark:bg-sky-950",
    text: "text-sky-500 dark:text-sky-500",
    Icon: Bell,
  },
};

const getInitial = (name?: string | null) =>
  name?.trim()?.charAt(0)?.toUpperCase() || "";

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString, {
    month: "short",
    day: "numeric",
  });
};

interface NotificationDropdownListProps {
  notifications: NotificationItem[];
  isLoading?: boolean;
  onNotificationClick: (notification: NotificationItem) => void;
}

export const NotificationDropdownList = ({
  notifications,
  isLoading = false,
  onNotificationClick,
}: NotificationDropdownListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">
          Loading notifications...
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">All caught up!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No new notifications
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[480px] overflow-y-auto">
      <div className="divide-y divide-border">
        {notifications.map((notification) => {
          const style = notification.type
            ? TYPE_STYLES[notification.type]
            : undefined;
          const senderName = notification.sender?.user_name;
          const initial = getInitial(senderName);
          const Icon = style?.Icon ?? Bell;

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => onNotificationClick(notification)}
              className={cn(
                "group relative flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                !notification.is_read && "bg-primary/5 hover:bg-primary/10"
              )}
            >
              {/* Unread Indicator */}
              {!notification.is_read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                  <Circle className="h-2 w-2 fill-primary text-primary" />
                </div>
              )}

              {/* Avatar with Status */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn("text-sm font-semibold")}>
                    {initial || <Icon className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                
                {/* Type Icon Badge */}
                {style && (
                  <div className={cn("absolute bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background", style.bg)}>
                    <Icon className={cn("h-2.5 w-2.5", style.text)} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[13px] leading-tight", !notification.is_read && "font-semibold")}>
                      {notification.title || "Notification"}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                    {getRelativeTime(notification.created_at)}
                  </span>
                </div>

                {/* Message */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-2 mt-0.5">
                  {senderName && (
                    <span className="text-xs text-muted-foreground">
                      {senderName}
                    </span>
                  )}
                  {style && (
                    <>
                      {senderName && <span className="text-muted-foreground">•</span>}
                      <span className={cn("text-xs font-medium", style.text)}>
                        {style.label}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
