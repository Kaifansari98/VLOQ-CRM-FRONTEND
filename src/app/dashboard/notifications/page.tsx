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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { markNotificationRead } from "@/redux/slices/notificationsSlice";
import { markNotificationRead as markReadApi } from "@/api/notifications";
import { NotificationItem } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

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

      <main className="flex-1 overflow-x-hidden p-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base font-semibold">
              Latest notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onNotificationClick={handleNotificationClick}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
