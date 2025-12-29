"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useEffect } from "react";
import { messaging } from "@/utils/firebase";
import { getToken } from "firebase/messaging";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Generate Token
      const token = await getToken(messaging, {
        vapidKey:
          "BAaKtj9LxyCjpNmS2R5fOZ866cQ320T1uGICWbNyvEsn0sBp26AzaXaOzMfU_b09VmstxTTIQ-Mot1QlG6g45r4",
      });
      console.log("Token Generated :- ", token);
    } else if (permission === "denied") {
      alert("you denied for the notification");
    }
  }

  useEffect(() => {
    // Req user for notification permission
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
