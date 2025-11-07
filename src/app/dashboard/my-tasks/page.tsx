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
import { ModeToggle } from "@/components/ModeToggle";
import { Suspense, useState } from "react";
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import MyTaskTable from "@/app/_components/tasks-table";
import { Shell } from "@/components/ui/shell";
import { TableLoader } from "@/components/utils/table-skeleton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function MyTaskLeadPage() {
  const [openCreateLead, setOpenCreateLead] = useState(false);

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

        <Shell className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 gap-2">
          <FeatureFlagsProvider>
            <Suspense fallback={<TableLoader isLoading={true} />}>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[800px]">
                  <Suspense fallback={<TableLoader isLoading={true} />}>
                    <MyTaskTable />
                  </Suspense>
                </div>
              </div>
            </Suspense>
          </FeatureFlagsProvider>
        </Shell>
      </SidebarInset>
    </SidebarProvider>
  );
}