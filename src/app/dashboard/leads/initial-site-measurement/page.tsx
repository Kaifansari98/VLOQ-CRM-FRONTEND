"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Suspense } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import SiteMeasurementTable from "@/app/_components/site-measurement-table";

export default function InitialSiteMeasurement() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* ---------------- HEADER ---------------- */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
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
                  <BreadcrumbPage>Initial Site Measurement</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2 pr-4">
            <AnimatedThemeToggler />
          </div>
        </header>

        {/* ---------------- MAIN CONTENT ---------------- */}
        <main className="flex-1  overflow-x-hidden">
          <Suspense
            fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
          >
            <SiteMeasurementTable />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
