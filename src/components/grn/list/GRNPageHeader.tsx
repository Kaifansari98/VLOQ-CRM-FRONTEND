"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ClipboardList, Plus } from "lucide-react";

export function GRNPageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/90 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-2">
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
              <BreadcrumbPage>Goods Receipt Notes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onCreate}
          className="h-8 gap-1.5 rounded-xl bg-indigo-600 text-xs font-bold hover:bg-indigo-700"
        >
          <Plus size={14} />
          New GRN
        </Button>

        <NotificationBell />
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}