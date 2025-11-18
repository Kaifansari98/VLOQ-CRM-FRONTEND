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
import { ModeToggle } from "@/components/ModeToggle";
import { useAppSelector } from "@/redux/store";
import InitialSiteSkeleton from "@/components/sales-executive/siteMeasurement/measurement-skeleton";
import { Suspense, useEffect } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function InitialSiteMeasurement() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background">
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
        <main className="flex-1 p-4 pt-0 overflow-x-hidden">
          <Suspense fallback={<p>Loading...</p>}>
            <InitialSiteSkeleton />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
