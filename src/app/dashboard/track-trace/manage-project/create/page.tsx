"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import TrackTraceProjectForm from "@/components/track-trace/TrackTraceProjectForm";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

function CreateProjectPageContent() {
  const searchParams = useSearchParams();
  const fabrication =
    searchParams.get("fabrication")?.toUpperCase() === "METALWORK"
      ? "METALWORK"
      : "WOODWORK";

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
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={
                    fabrication === "METALWORK"
                      ? "/dashboard/track-trace/metalwork-projects"
                      : "/dashboard/track-trace/manage-project"
                  }
                >
                  {fabrication === "METALWORK"
                    ? "Metalwork Projects"
                    : "Woodwork Projects"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Create {fabrication === "METALWORK" ? "Metalwork" : "Woodwork"}{" "}
                  Project
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-6 w-full">
        <TrackTraceProjectForm mode="create" initialFabrication={fabrication} />
      </div>
    </>
  );
}

export default function CreateTrackTraceProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading form...</div>
      }
    >
      <CreateProjectPageContent />
    </Suspense>
  );
}