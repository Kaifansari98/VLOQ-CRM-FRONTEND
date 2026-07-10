"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { useCheckUserStatus } from "@/hooks/useLogin";
import { useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/slices/authSlice";
import { useRouter } from "next/navigation";
import { registerPushToken } from "@/api/notifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const { data: userStatus } = useCheckUserStatus(userId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id || !user?.vendor_id) return;
  
    const requestPermission = async () => {
      if (!("Notification" in window)) return;

      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission !== "granted") return;

      try {
        if (
          !window.isSecureContext ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window)
        ) {
          return;
        }

        const { getToken } = await import("firebase/messaging");
        const { getFirebaseMessaging } = await import("@/utils/firebase");
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        const serviceWorkerRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );

        const token = await getToken(messaging, {
          vapidKey:
            "BAaKtj9LxyCjpNmS2R5fOZ866cQ320T1uGICWbNyvEsn0sBp26AzaXaOzMfU_b09VmstxTTIQ-Mot1QlG6g45r4",
          serviceWorkerRegistration,
        });

        if (!token) return;

        const storedToken = localStorage.getItem(`pushToken:${token}`);
        if (storedToken === token) return;

        let deviceId = localStorage.getItem("pushDeviceId");
        if (!deviceId) {
          deviceId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          localStorage.setItem("pushDeviceId", deviceId);
        }

        await registerPushToken({
          vendor_id: user.vendor_id,
          user_id: user.id,
          token,
          platform: "web",
          browser: navigator.userAgent,
          device_id: deviceId,
        });

        localStorage.setItem(`pushToken:${token}`, token);
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        const name = error instanceof Error ? error.name : "";

        if (
          name === "AbortError" ||
          message.includes("push service not available") ||
          message.includes("messaging is not supported")
        ) {
          return;
        }

        console.error("Failed to register push token", error);
      }
    };
  
    requestPermission();
  }, [user?.id, user?.vendor_id]);

  useEffect(() => {
    if (userStatus?.status !== "inactive") return;
    dispatch(logout());
    router.replace("/login");
  }, [dispatch, router, userStatus?.status]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="w-full flex flex-col">
        <main className="w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
