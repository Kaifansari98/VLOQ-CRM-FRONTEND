"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import TrackTraceProjectForm from "@/components/track-trace/TrackTraceProjectForm";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "react-aria-components";

export default function CreateTrackTraceProjectPage() {
  return (
    <>
      <header className="flex h-16 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Manage Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
    <main className="flex-1 overflow-x-hidden py-4">
      <TrackTraceProjectForm mode="create" />
    </main>
    </>
  );
}