"use client";

import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";

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

import TrackTraceProjectTable from "@/components/custom/TrackTraceProjectTable";
import { useTrackTraceProjects } from "@/hooks/track-trace/useTrackTraceProjects";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

export default function TrackTraceProjectsPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const router = useRouter();

  // ✅ React Query Hook
  const {
    data: projects,
    isLoading,
    isError,
  } = useTrackTraceProjects(vendorId);

  const navigateTrackTraceProject = (row: TrackTraceProject) =>
    `/dashboard/track-trace/manage-project/${row.unique_project_id}`;

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />

          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  Master
                </BreadcrumbLink>
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
        <div className="px-4">
          <h1 className="text-lg font-semibold">
            Manage Track & Trace Projects
          </h1>
        </div>

        {/* ✅ Loading State */}
        {isLoading && (
          <div className="px-4 pt-6 text-sm text-muted-foreground">
            Loading projects...
          </div>
        )}

        {/* ❌ Error State */}
        {isError && (
          <div className="px-4 pt-6 text-sm text-red-500">
            Failed to load projects.
          </div>
        )}

        {/* ✅ Data Table */}
        {!isLoading && !isError && (
          <TrackTraceProjectTable
            table={projects ?? []}
            onRowDoubleClick={navigateTrackTraceProject}
            className="pt-3 px-4"
          />
        )}
      </main>
    </>
  );
}
