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
import { FeatureFlagsProvider } from "@/app/_components/feature-flags-provider";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import DispatchStageTable from "@/components/installation/dispatch/DispatchStageTable";

export default function DispatchStagePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* Header */}
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
            <AnimatedThemeToggler />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pt-0 overflow-x-hidden">
          <Suspense fallback={<p>Loading Dispatch Stage Leads...</p>}>
            <FeatureFlagsProvider>
              <DispatchStageTable />
            </FeatureFlagsProvider>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
