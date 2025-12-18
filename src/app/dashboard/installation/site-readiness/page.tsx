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
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

import { UniversalTable } from "@/components/custom/UniversalTable";

// 🔵 Navigation for Site Readiness
const navigateSiteReadiness = (row: any) =>
  `/dashboard/installation/site-readiness/details/${row.id}?accountId=${row.accountId}`;

export default function SiteReadinessPage() {
  return (
    <>
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
                <BreadcrumbPage>Site Readiness</BreadcrumbPage>
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
            title="Site Readiness"
            description="Monitor and validate all installation-site readiness tasks before scheduling field deployment."
            type="Type 12"
            enableAdminTabs={true}
            onRowNavigate={navigateSiteReadiness}
          />
        </Suspense>
      </main>
    </>
  );
}
