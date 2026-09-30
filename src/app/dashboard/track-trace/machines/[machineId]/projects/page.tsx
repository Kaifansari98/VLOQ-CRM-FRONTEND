"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  Eye,
  PackageSearch,
  Search,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useActiveMachines } from "@/hooks/track-trace/useActiveMachines";
import { useTrackTraceProjects } from "@/hooks/track-trace/useTrackTraceProjects";
import { useAppSelector } from "@/redux/store";

const INACTIVE_PROJECT_STATUSES = new Set([
  "deactivated",
  "deleted",
  "deactive",
  "inactive",
]);

export default function PackagingProjectSelectionPage() {
  const router = useRouter();
  const { machineId: machineIdParam } = useParams<{ machineId: string }>();
  const machineId = Number(machineIdParam);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const {
    data: machines = [],
    isLoading: isLoadingMachines,
    isError: isMachineError,
  } = useActiveMachines(vendorId);
  const machine = machines.find((item) => item.id === machineId);
  const { data, isLoading: isLoadingProjects, isError: isProjectError } =
    useTrackTraceProjects(vendorId, {
      page,
      limit: 12,
      search: deferredSearch || undefined,
      deleted: "active",
      sort_by: "created_at",
      sort_order: "desc",
    });

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (machine && machine.machine_type_id !== 18) {
      router.replace(`/dashboard/track-trace/machines/${machine.id}`);
    }
  }, [machine, router]);

  const hasValidVendor = Number.isInteger(vendorId) && Number(vendorId) > 0;
  const hasValidMachineId = Number.isInteger(machineId) && machineId > 0;
  const projects = data?.projects ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track &amp; Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/dashboard/track-trace/machines">
                  Machines
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Select project</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link href="/dashboard/track-trace/machines">
              <ArrowLeft className="size-4" />
              Back to machines
            </Link>
          </Button>

          {isLoadingMachines && (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {(!hasValidVendor || !hasValidMachineId || isMachineError) && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
              <AlertCircle className="mb-3 size-9 text-destructive" />
              <h1 className="font-semibold">Unable to select a project</h1>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                The vendor or packaging machine information is invalid.
              </p>
            </div>
          )}

          {hasValidVendor &&
            hasValidMachineId &&
            !isLoadingMachines &&
            !isMachineError &&
            !machine && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
                <Cpu className="mb-3 size-10 text-muted-foreground" />
                <h1 className="font-semibold">Packaging machine not found</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This machine is unavailable or is no longer active.
                </p>
              </div>
            )}

          {machine?.machine_type_id === 18 && (
            <>
              <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm sm:p-7">
                <div className="absolute -right-10 -top-12 size-44 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
                      <PackageSearch className="size-7" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Packaging machine
                      </p>
                      <h1 className="mt-1 text-2xl font-semibold capitalize tracking-tight sm:text-3xl">
                        {machine.machine_name}
                      </h1>
                      <p className="mt-1 font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {machine.machine_code}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background/75 px-4 py-3 backdrop-blur-sm">
                    <p className="text-sm font-semibold">Choose a project</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      The scanner will load its item groups and boxes next.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      Active projects
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select the project whose items you want to pack.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search project, order or client"
                      className="pl-9"
                    />
                  </div>
                </div>

                {isLoadingProjects && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-48 rounded-xl" />
                    ))}
                  </div>
                )}

                {isProjectError && (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
                    <AlertCircle className="mb-3 size-8 text-destructive" />
                    <h3 className="font-semibold">Unable to load projects</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check your connection and try again.
                    </p>
                  </div>
                )}

                {!isLoadingProjects && !isProjectError && projects.length === 0 && (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
                    <ClipboardList className="mb-3 size-9 text-muted-foreground" />
                    <h3 className="font-semibold">No projects found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {deferredSearch
                        ? "Try a different search term."
                        : "There are no active projects available for packaging."}
                    </p>
                  </div>
                )}

                {!isLoadingProjects && !isProjectError && projects.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => {
                      const isInactive = INACTIVE_PROJECT_STATUSES.has(
                        String(project.project_status || "").toLowerCase(),
                      );

                      return (
                        <article
                          key={project.id}
                          className="group flex min-h-48 flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/35 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                              <Box className="size-5" />
                            </div>
                            <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                              {project.project_status || "Active"}
                            </span>
                          </div>
                          <h3 className="mt-4 line-clamp-2 text-lg font-semibold capitalize">
                            {project.project_name}
                          </h3>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            
                            {(project.order_no || project.client_name) && (
                              <p className="truncate">
                                {[project.order_no, project.client_name]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button
                              asChild
                              variant="outline"
                              className="gap-2"
                            >
                              <Link
                                href={`/dashboard/track-trace/manage-project/${project.unique_project_id}/details`}
                              >
                                <Eye className="size-4" />
                                View all boxes
                              </Link>
                            </Button>
                            <Button
                              asChild={!isInactive}
                              className="gap-2"
                              disabled={isInactive}
                            >
                              {isInactive ? (
                                <span>Unavailable</span>
                              ) : (
                                <Link
                                  href={`/dashboard/track-trace/machines/${machine.id}?projectId=${project.id}`}
                                >
                                  Start packaging
                                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              )}
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages} ·{" "}
                      {pagination.total} projects
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => current - 1)}
                        disabled={!pagination.hasPreviousPage}
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

    </>
  );
}
