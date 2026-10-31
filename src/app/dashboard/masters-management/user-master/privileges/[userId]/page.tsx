"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import UserPrivilegesManagement from "@/components/custom/UserPrivilegesManagement";

export default function UserPrivilegesAlternatePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const userIdParam = params?.userId;
  const userId = Number(Array.isArray(userIdParam) ? userIdParam[0] : userIdParam);
  const vendorIdOverride =
    Number(searchParams.get("vendor_id") || "") || undefined;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/masters-management/user-master">
                  Masters Management
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/masters-management/user-master">
                  User Master
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>User Privileges</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Suspense
          fallback={
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground animate-pulse">
              Loading user privileges...
            </div>
          }
        >
          {userId ? (
            <UserPrivilegesManagement
              userId={userId}
              vendorIdOverride={vendorIdOverride}
            />
          ) : (
            <div className="p-8 text-center text-sm text-destructive">
              Invalid or missing User ID.
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
}
