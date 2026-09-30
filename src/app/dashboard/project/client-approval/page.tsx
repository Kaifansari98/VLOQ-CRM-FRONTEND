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

import { Suspense } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

import { UniversalTable } from "@/components/custom/UniversalTable";

type row = {
  id: number;
  accountId: number;
};
// 🔵 Row navigation for Client Approval
const navigateClientApproval = (row: row) =>
  `/dashboard/project/client-approval/details/${row.id}?accountId=${row.accountId}`;

export default function ClientApprovalPage() {
  return (
    <>
      {/* ---------------- HEADER ---------------- */}
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
                <BreadcrumbLink href="/dashboard">Project</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Client Approval</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1  overflow-x-hidden">
        <Suspense
          fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
        >
          <UniversalTable
            title="Client Approval"
            description="Review and track all client-approval submissions, including pending, revised, and approved documentation."
            type="Type 7"
            enableAdminTabs={true}
            onRowNavigate={navigateClientApproval}
          />
        </Suspense>
      </main>
    </>
  );
}
