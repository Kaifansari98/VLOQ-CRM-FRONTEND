"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { markNotificationRead } from "@/redux/slices/notificationsSlice";
import { markNotificationRead as markReadApi } from "@/api/notifications";
import { NotificationItem } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Bell, Briefcase, MessageCircle, Target, CheckCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG: Record<
  NonNullable<NotificationItem["type"]>,
  { 
    label: string; 
    Icon: typeof Bell;
    color: string;
    bgColor: string;
  }
> = {
  LEAD_ASSIGNED: {
    label: "Lead",
    Icon: Target,
    color: "text-emerald-500 dark:text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  TASK_ASSIGNED: {
    label: "Task",
    Icon: Briefcase,
    color: "text-blue-500 dark:text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  CHAT_MENTION: {
    label: "Mention",
    Icon: MessageCircle,
    color: "text-amber-500 dark:text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
  LEAD_MILESTONE: {
    label: "Milestone",
    Icon: Bell,
    color: "text-purple-500 dark:text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
};

const getInitial = (name?: string | null) =>
  name?.trim()?.charAt(0)?.toUpperCase() || "";

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const groupNotificationsByDate = (notifications: NotificationItem[]) => {
  const groups: Record<string, NotificationItem[]> = {};
  
  notifications.forEach((notif) => {
    const date = new Date(notif.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = "Yesterday";
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      groupKey = "This Week";
    } else {
      groupKey = "Earlier";
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notif);
  });
  
  return groups;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { notifications, isLoading, refresh } = useNotifications();
  const hasMarkedRef = useRef(false);

  const handleNavigate = (redirectUrl: string) => {
    if (/^https?:\/\//i.test(redirectUrl)) {
      window.location.assign(redirectUrl);
      return;
    }
    router.push(redirectUrl);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (user?.id && !notification.is_read) {
      dispatch(markNotificationRead(notification.id));
      try {
        await markReadApi(notification.id, user.id);
      } catch {
        refresh({ silent: true });
      }
    }

    if (notification.redirect_url) {
      handleNavigate(notification.redirect_url);
    }
  };

  useEffect(() => {
    if (hasMarkedRef.current) return;
    if (!user?.id) return;
    if (notifications.length === 0) return;

    const unreadItems = notifications.filter((item) => !item.is_read);
    if (unreadItems.length === 0) {
      hasMarkedRef.current = true;
      return;
    }

    hasMarkedRef.current = true;
    unreadItems.forEach((item) => dispatch(markNotificationRead(item.id)));
    Promise.all(unreadItems.map((item) => markReadApi(item.id, user.id))).catch(
      () => refresh({ silent: true })
    );
  }, [dispatch, notifications, refresh, user?.id]);

  const groupedNotifications = groupNotificationsByDate(notifications);
  const hasNotifications = notifications.length > 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Notifications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2 pr-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
        <div className="w-full">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated with your latest activities and updates
            </p>
          </motion.div>

          {/* Loading State */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
                <p className="text-sm text-muted-foreground">Loading notifications</p>
              </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && !hasNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <CheckCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">You're all caught up</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No new notifications to show
                </p>
              </motion.div>
            )}

            {/* Notifications Timeline */}
            {!isLoading && hasNotifications && (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
              >
                {Object.entries(groupedNotifications).map(([dateGroup, groupNotifs]) => (
                  <motion.div key={dateGroup} variants={item} className="space-y-3">
                    {/* Date Divider */}
                    <div className="flex items-center gap-3">
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {dateGroup}
                      </h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Notification Items */}
                    <div className="space-y-2">
                      {groupNotifs.map((notification) => {
                        const config = notification.type ? TYPE_CONFIG[notification.type] : null;
                        const Icon = config?.Icon ?? Bell;
                        const senderName = notification.sender?.user_name;
                        const initial = getInitial(senderName);

                        return (
                          <motion.button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.998 }}
                            className={cn(
                              "group relative w-full rounded-lg border bg-card p-4 text-left transition-colors",
                              "hover:bg-accent/50",
                              !notification.is_read && "border-foreground/10 bg-accent/30"
                            )}
                          >
                            <div className="flex gap-3">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarFallback className="text-xs font-medium bg-muted">
                                    {initial || <Icon className="h-4 w-4" />}
                                  </AvatarFallback>
                                </Avatar>
                                {config && (
                                  <div className="absolute bottom-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-muted">
                                    <Icon className={cn("h-2.5 w-2.5", config.color)}/>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                {/* Title & Time */}
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className={cn(
                                    "text-sm leading-tight",
                                    !notification.is_read ? "font-medium" : "font-normal"
                                  )}>
                                    {notification.title || "Notification"}
                                  </h3>
                                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                                    {getRelativeTime(notification.created_at)}
                                  </span>
                                </div>

                                {/* Message */}
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {notification.message}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center gap-2 mt-0.5">
                                  {senderName && (
                                    <span className="text-xs text-muted-foreground">
                                      {senderName}
                                    </span>
                                  )}
                                  {config && (
                                    <>
                                      {senderName && <span className="text-muted-foreground/40">•</span>}
                                      <span className={cn("text-xs font-medium", config.color)}>
                                        {config.label}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Unread Indicator */}
                              {!notification.is_read && (
                                <div className="absolute right-3 top-3">
                                  <Circle className="h-2 w-2 fill-foreground text-foreground" />
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}