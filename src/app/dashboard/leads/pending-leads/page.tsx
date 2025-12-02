"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import PendingLeadsTable from "./pending-leads-table";
import PendingLeadsSkeleton from "./PendingLeadsSkeleton";
import { Suspense } from "react";
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function PendingLeadsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/leads/leadstable">
                    Open Leads
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Pending Leads</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <AnimatedThemeToggler />
        </header>

        {/* Table */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <FeatureFlagsProvider>
            <Suspense fallback={<PendingLeadsSkeleton />}>
              <PendingLeadsTable
                tab="onHold"
                stageTitle="On Hold Leads"
                stageDescription="Leads currently on hold."
              />
            </Suspense>
          </FeatureFlagsProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
