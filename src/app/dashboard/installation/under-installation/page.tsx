"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

import { UniversalTable } from "@/components/custom/UniversalTable";

// 🔵 Navigation for Under Installation Stage

type Row = {
  id: number;
  accountId: number;
};
const navigateUnderInstallation = (row: Row) =>
  `/dashboard/installation/under-installation/details/${row.id}?accountId=${row.accountId}`;

export default function UnderInstallationStagePage() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* ---------------- HEADER ---------------- */}
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
                  <BreadcrumbPage>Under Installation Stage</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <AnimatedThemeToggler />
          </div>
        </header>

        {/* ---------------- CONTENT ---------------- */}
        <main className="flex-1 overflow-x-hidden">
          <Suspense
            fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
          >
            <UniversalTable
              title="Under Installation Stage"
              description="Manage and track projects currently progressing through on-site installation workflows."
              type="Type 15"
              enableAdminTabs={true}
              onRowNavigate={navigateUnderInstallation}
            />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
