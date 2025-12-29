"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
  
    const requestPermission = async () => {
      if (!("Notification" in window)) return;
  
      const permission = await Notification.requestPermission();
  
      if (permission === "granted") {
        const { getToken } = await import("firebase/messaging");
        const { messaging } = await import("@/utils/firebase");
  
        const token = await getToken(messaging, {
          vapidKey: "BAaKtj9LxyCjpNmS2R5fOZ866cQ320T1uGICWbNyvEsn0sBp26AzaXaOzMfU_b09VmstxTTIQ-Mot1QlG6g45r4",
        });
  
        console.log("Token Generated:", token);
      }
    };
  
    requestPermission();
  }, []);  

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="w-full overflow-x-hidden flex flex-col">
        <main className="w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
