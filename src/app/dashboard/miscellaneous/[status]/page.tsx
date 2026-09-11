"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import {
  MiscellaneousStatusTable,
  STAGE_CONFIG,
} from "@/components/custom/miscellaneous-status-table";

export default function MiscellaneousStatusPage() {
  const params = useParams();
  const statusSlug =
    typeof params?.status === "string" ? params.status : "awaiting-approval";

  const stageTitle =
    STAGE_CONFIG[statusSlug]?.title ||
    statusSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <>
      {/* ── HEADER ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-4 mr-2" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Miscellaneous Module</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>{stageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 overflow-x-hidden">
        <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={8} />}>
          <MiscellaneousStatusTable status={statusSlug} />
        </Suspense>
      </main>
    </>
  );
}
