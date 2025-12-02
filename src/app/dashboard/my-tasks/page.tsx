"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Suspense } from "react";
import MyTaskTable from "@/app/_components/tasks-table";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export default function MyTaskLeadPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* ✅ Sticky Header */}
        <header className="sticky top-0 z-50 bg-background flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>My Tasks</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <AnimatedThemeToggler />
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Suspense
            fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
          >
            <MyTaskTable />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
