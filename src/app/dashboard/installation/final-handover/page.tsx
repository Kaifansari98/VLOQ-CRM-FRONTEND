"use client";

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
import { Suspense } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

import { UniversalTable } from "@/components/custom/UniversalTable";
type Row = {
  id: number;
  accountId: number;
};
// 🔵 Navigation for Final Handover Stage
const navigateFinalHandover = (row: Row) =>
  `/dashboard/installation/final-handover/details/${row.id}?accountId=${row.accountId}`;

export default function FinalHandoverStagePage() {
  return (
    <>
      {/* 🔹 Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-4 mr-2" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Project</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Final Handover Stage</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* 🔹 Content */}
      <main className="flex-1 overflow-x-hidden">
        <Suspense
          fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
        >
          <UniversalTable
            title="Final Handover Stage"
            description="Review, manage, and close handover-ready projects with complete documentation and field validation."
            type="Type 16"
            enableAdminTabs={true}
            onRowNavigate={navigateFinalHandover}
          />
        </Suspense>
      </main>
    </>
  );
}
