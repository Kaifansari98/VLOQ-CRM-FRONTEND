"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
// 🔵 Navigation for Dispatch Stage
const navigateDispatchStage = (row: Row) =>
  `/dashboard/installation/dispatch-stage/details/${row.id}?accountId=${row.accountId}`;

export default function DispatchStagePage() {
  return (
    <>
      {/* HEADER */}
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
                <BreadcrumbPage>Dispatch Stage</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-x-hidden">
        <Suspense
          fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
        >
          <UniversalTable
            title="Dispatch Stage"
            description="Monitor and manage project dispatch workflows, ensuring seamless transition from warehouse to installation teams."
            type="Type 14"
            enableAdminTabs={true}
            onRowNavigate={navigateDispatchStage}
          />
        </Suspense>
      </main>
    </>
  );
}
