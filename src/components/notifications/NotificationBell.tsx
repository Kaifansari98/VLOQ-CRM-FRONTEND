"use client";

import { useCallback, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountBadge } from "@/components/count-badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/redux/store";
import { markNotificationRead } from "@/redux/slices/notificationsSlice";
import {
  markNotificationRead as markReadApi,
  markNotificationsReadBulk,
} from "@/api/notifications";
import { NotificationItem } from "@/types/notifications";
import { NotificationDropdownList } from "@/components/notifications/NotificationDropdownList";
import ApprovalRequestActionModal from "@/components/tasks/ApprovalRequestActionModal";

interface NotificationBellProps {
  linkTo?: string;
}

export const NotificationBell = ({ linkTo }: NotificationBellProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { notifications, unreadCount, isLoading, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [approvalModalData, setApprovalModalData] = useState<{
    leadId: number;
    taskId: number;
  } | null>(null);
  const latestNotifications = notifications.slice(0, 5);

  const userType = user?.user_type?.user_type as string | undefined;
  const isAuditor = userType?.trim().toLowerCase() === "auditor";

  if (isAuditor) {
    return null;
  }

  if (linkTo) {
    return (
      <Button
        size={"icon"}
        variant="ghost"
        className="relative bg-accent p-1.5 rounded-sm"
        onClick={() => router.push(linkTo)}
      >
        <Bell />
        <CountBadge count={unreadCount} className="absolute -right-1 -top-1" />
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  const handleNavigate = (redirectUrl: string) => {
    if (/^https?:\/\//i.test(redirectUrl)) {
      window.location.assign(redirectUrl);
      return;
    }
    router.push(redirectUrl);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    setOpen(false);

    if (user?.id && !notification.is_read) {
      dispatch(markNotificationRead(notification.id));
      try {
        await markReadApi(notification.id, user.id);
      } catch {
        refresh({ silent: true });
      }
    }

    // For APPROVAL notifications: open the modal directly instead of navigating to My Tasks
    if (notification.type === "APPROVAL" && notification.redirect_url) {
      const url = new URL(notification.redirect_url, window.location.origin);
      const taskId = Number(url.searchParams.get("taskId"));
      const leadId = Number(url.searchParams.get("leadId"));
      if (taskId && leadId) {
        setApprovalModalData({ leadId, taskId });
        return;
      }
    }

    // Handle Broadcast / Announcement notifications redirection
    const isBroadcast =
      notification.title?.toLowerCase().includes("announcement") ||
      notification.title?.toLowerCase().includes("broadcast") ||
      (notification.redirect_url && notification.redirect_url.toLowerCase().includes("broadcast"));

    if (isBroadcast) {
      let targetId = "";
      if (notification.redirect_url) {
        const matchParam = notification.redirect_url.match(/(?:id|broadcastId)=([^&]+)/i);
        if (matchParam && matchParam[1]) {
          targetId = matchParam[1];
        } else {
          const matchPath = notification.redirect_url.match(/\/broadcasts?\/([^?/#]+)/i);
          if (matchPath && matchPath[1]) {
            targetId = matchPath[1];
          }
        }
      }

      if (targetId) {
        router.push(`/dashboard/broadcast?id=${targetId}`);
      } else {
        router.push(`/dashboard/broadcast`);
      }
      return;
    }

    if (notification.redirect_url) {
      handleNavigate(notification.redirect_url);
    }
  };

  const markVisibleAsRead = useCallback(async () => {
    if (!user?.id) return;
    const unreadItems = latestNotifications.filter((item) => !item.is_read);
    if (unreadItems.length === 0) return;

    unreadItems.forEach((item) => dispatch(markNotificationRead(item.id)));
    try {
      await markNotificationsReadBulk(
        unreadItems.map((item) => item.id),
        user.id
      );
    } catch {
      refresh({ silent: true });
    }
  }, [dispatch, latestNotifications, refresh, user?.id]);

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) {
            refresh({ silent: true });
            markVisibleAsRead();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            size={"icon"}
            variant="ghost"
            className="relative bg-accent rounded-sm"
          >
            <Bell />
            <CountBadge
              count={unreadCount}
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
            />
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-90 rounded-lg p-0"
          sideOffset={8}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <DropdownMenuLabel className="p-0 text-sm font-semibold">
              Notifications
            </DropdownMenuLabel>
            <Link
              href="/dashboard/notifications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <DropdownMenuSeparator />
          <NotificationDropdownList
            notifications={latestNotifications}
            isLoading={isLoading}
            onNotificationClick={handleNotificationClick}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ApprovalRequestActionModal
        open={!!approvalModalData}
        onOpenChange={(open) => {
          if (!open) setApprovalModalData(null);
        }}
        data={approvalModalData || undefined}
      />
    </>
  );
};
