"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense } from "react";
import MyTaskTable from "../../_components/tasks-table";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { FadeInProvider } from "@/components/framer-motion/FadeInProvider";

export default function MyTaskLeadPage() {
  return (
    <>
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

        <NotificationBell />
          <AnimatedThemeToggler />
      </header>

      <main className="flex-1 overflow-x-hidden">
        <FadeInProvider>
          <Suspense
            fallback={<DataTableSkeleton columnCount={10} rowCount={8} />}
          >
            <MyTaskTable />
          </Suspense>
        </FadeInProvider>
      </main>
    </>
  );
}
