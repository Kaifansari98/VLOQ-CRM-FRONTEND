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
import { LeadColumn } from "@/components/utils/column/column-type";

const STAGE_PATH_BY_TAG: Record<string, string> = {
  "Type 1": "/dashboard/leads/leadstable/details",
  "Type 2": "/dashboard/leads/initial-site-measurement/details",
  "Type 3": "/dashboard/leads/designing-stage/details",
  "Type 4": "/dashboard/leads/booking-stage/details",
  "Type 5": "/dashboard/project/final-measurement/details",
  "Type 6": "/dashboard/project/client-documentation/details",
  "Type 7": "/dashboard/project/client-approval/details",
  "Type 8": "/dashboard/production/tech-check/details",
  "Type 9": "/dashboard/production/order-login/details",
  "Type 10": "/dashboard/production/pre-post-prod/details",
  "Type 11": "/dashboard/production/ready-to-dispatch/details",
  "Type 12": "/dashboard/installation/site-readiness/details",
  "Type 13": "/dashboard/installation/dispatch-planning/details",
  "Type 14": "/dashboard/installation/dispatch-stage/details",
  "Type 15": "/dashboard/installation/under-installation/details",
  "Type 16": "/dashboard/installation/final-handover/details",
  "Type 17": "/dashboard/installation/final-handover/details",
};

const STAGE_PATH_BY_NAME: Record<string, string> = {
  Open: "/dashboard/leads/leadstable/details",
  "Initial Site Measurement":
    "/dashboard/leads/initial-site-measurement/details",
  Designing: "/dashboard/leads/designing-stage/details",
  Booking: "/dashboard/leads/booking-stage/details",
  "Final Site Measurement": "/dashboard/project/final-measurement/details",
  "Client Documentation": "/dashboard/project/client-documentation/details",
  "Client Approval": "/dashboard/project/client-approval/details",
  "Tech Check": "/dashboard/production/tech-check/details",
  "Order Login": "/dashboard/production/order-login/details",
  Production: "/dashboard/production/pre-post-prod/details",
  "Ready to Dispatch": "/dashboard/production/ready-to-dispatch/details",
  "Site Readiness": "/dashboard/installation/site-readiness/details",
  "Dispatch Planning": "/dashboard/installation/dispatch-planning/details",
  Dispatch: "/dashboard/installation/dispatch-stage/details",
  "Under Installation": "/dashboard/installation/under-installation/details",
  "Final Handover": "/dashboard/installation/final-handover/details",
  "Project Completed": "/dashboard/installation/final-handover/details",
};

const navigateOverallLeads = (row: LeadColumn) => {
  const basePath =
    (row.statusTag && STAGE_PATH_BY_TAG[row.statusTag]) ||
    (row.status && STAGE_PATH_BY_NAME[row.status]);

  if (!basePath) {
    return "/dashboard/overall-leads";
  }

  return `${basePath}/${row.id}?accountId=${row.accountId}`;
};

export default function OverallLeadsPage() {
  return (
    <>
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
                <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Overall Leads</BreadcrumbPage>
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
            title="Overall Leads"
            description="All active leads across stages for quick tracking and navigation."
            type="ALL"
            enableAdminTabs={false}
            enableOverallData={false}
            showStageColumn
            defaultViewType="my"
            onRowNavigate={navigateOverallLeads}
          />
        </Suspense>
      </main>
    </>
  );
}
