"use client";

import { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { UniversalTable } from "@/components/custom/UniversalTable";

const navigateOrderLogin = (row: any) =>
  `/dashboard/production/order-login/details/${row.id}?accountId=${row.accountId}${
    row.instanceId ? `&instance_id=${row.instanceId}` : ""
  }&source=material-issue`;

export default function MaterialIssueProjectsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/inventory">
                  Inventory Management
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Material Issue - Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <Suspense fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}>
          <UniversalTable
            title="Material Issue Projects"
            description="View order-login projects available for material issue."
            type="Type 9"
            enableAdminTabs={false}
            enableOverallData={false}
            allVendorLeads
            strictStatusTag
            ignoreFranchiseScope
            onRowNavigate={navigateOrderLogin}
          />
        </Suspense>
      </main>
    </>
  );
}
