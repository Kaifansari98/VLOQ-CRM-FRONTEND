"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="w-full overflow-x-hidden flex flex-col">
        <main className="w-full">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
