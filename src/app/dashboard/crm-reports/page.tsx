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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ReportCards } from "@/components/reports/ReportCards";
import { FadeInProvider } from "@/components/framer-motion/FadeInProvider";

export default function CrmReportsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>CRM Reports</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2 pr-4">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">CRM Reports</h1>
          <p className="text-xs text-muted-foreground">
            Apply filters to generate and download stage-wise lead reports.
          </p>
        </div>
        <FadeInProvider>
          <ReportCards />
        </FadeInProvider>
      </main>
    </>
  );
}
