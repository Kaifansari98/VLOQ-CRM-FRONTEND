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
  Truck,
  X,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useActiveMachines } from "@/hooks/track-trace/useActiveMachines";
import { useTrackTraceProjects } from "@/hooks/track-trace/useTrackTraceProjects";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";

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
  const {
    data,
    isLoading: isLoadingProjects,
    isError: isProjectError,
  } = useTrackTraceProjects(vendorId, {
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
      {/* ── Sticky Responsive Header Bar ── */}
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 border-b bg-card/85 px-3 sm:px-4 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="truncate">
            <BreadcrumbList className="text-xs sm:text-sm">
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
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate font-medium">
                  Select project
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
          {/* Back Action */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 w-fit gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link href="/dashboard/track-trace/machines">
              <ArrowLeft className="size-3.5" />
              <span>Back to machines</span>
            </Link>
          </Button>

          {/* Skeletons while machines load */}
          {isLoadingMachines && (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl sm:rounded-2xl" />
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <Skeleton className="h-9 w-48 rounded-lg" />
                <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-56 rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {/* Error: Invalid Vendor or Machine */}
          {(!hasValidVendor || !hasValidMachineId || isMachineError) && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertCircle className="mb-3 size-9 text-destructive" />
              <h1 className="text-base sm:text-lg font-semibold text-foreground">
                Unable to select a project
              </h1>
              <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
                The vendor or packaging machine information is invalid or could not be loaded.
              </p>
            </div>
          )}

          {/* Empty: Machine not found */}
          {hasValidVendor &&
            hasValidMachineId &&
            !isLoadingMachines &&
            !isMachineError &&
            !machine && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
                <Cpu className="mb-3 size-10 text-muted-foreground/60" />
                <h1 className="text-base sm:text-lg font-semibold text-foreground">
                  Packaging machine not found
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  This machine is unavailable or is no longer active for your vendor.
                </p>
              </div>
            )}

          {/* Machine Loaded (Packaging Machine Type 18) */}
          {machine?.machine_type_id === 18 && (
            <>
              {/* ── Responsive Hero Banner ── */}
              <section className="relative overflow-hidden rounded-xl sm:rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-6 lg:p-7 shadow-xs">
                <div className="pointer-events-none absolute -right-10 -top-12 size-40 sm:size-56 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="rounded-xl border border-primary/25 bg-primary/10 p-2.5 sm:p-3 text-primary shrink-0 shadow-2xs">
                      <PackageSearch className="size-6 sm:size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">
                          Packaging workstation
                        </span>
                        {machine.machine_code && (
                          <span className="font-mono text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-muted/80 border text-muted-foreground">
                            {machine.machine_code}
                          </span>
                        )}
                      </div>
                      <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate capitalize">
                        {machine.machine_name}
                      </h1>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background/80 px-3.5 py-2.5 sm:px-4 sm:py-3 backdrop-blur-sm shrink-0 w-full sm:w-auto">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      Choose a project
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">
                      Select a project below to load boxes and start scanning.
                    </p>
                  </div>
                </div>
              </section>

              {/* ── Active Projects Section ── */}
              <section className="space-y-4">
                {/* Section Header + Search Input */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        Active projects
                      </h2>
                      {pagination && typeof pagination.total === "number" && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs px-2 py-0.5 font-semibold"
                        >
                          {pagination.total}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                      Select the project whose items you want to pack.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72 md:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search project, order, client..."
                      className="h-9 pl-9 pr-8 text-xs sm:text-sm rounded-lg"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Skeletons while projects load */}
                {isLoadingProjects && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex flex-col justify-between rounded-xl border bg-card p-4 sm:p-5 min-h-[220px] space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Skeleton className="size-9 rounded-xl" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-6 w-3/4 rounded-md" />
                          <Skeleton className="h-4 w-1/2 rounded-md" />
                        </div>
                        <div className="space-y-2 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-2">
                            <Skeleton className="h-8 rounded-md" />
                            <Skeleton className="h-8 rounded-md" />
                          </div>
                          <Skeleton className="h-8 sm:h-9 w-full rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Project Load Error */}
                {isProjectError && (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <AlertCircle className="mb-3 size-8 text-destructive" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                      Unable to load projects
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      Please check your network connection and try again.
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingProjects && !isProjectError && projects.length === 0 && (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
                    <ClipboardList className="mb-3 size-9 text-muted-foreground/60" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">
                      No projects found
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                      {deferredSearch
                        ? `No projects matching "${deferredSearch}". Try another search term.`
                        : "There are no active projects currently available for packaging."}
                    </p>
                  </div>
                )}

                {/* ── Responsive Projects Grid (1 col mobile, 2 col tablet, 3 col desktop, 4 col widescreen) ── */}
                {!isLoadingProjects && !isProjectError && projects.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5">
                    {projects.map((project) => {
                      const isInactive = INACTIVE_PROJECT_STATUSES.has(
                        String(project.project_status || "").toLowerCase(),
                      );
                      const statusLower = String(
                        project.project_status || "active",
                      ).toLowerCase();
                      const isCompleted = statusLower === "completed";
                      const isInitiated =
                        statusLower === "initiated" || statusLower === "started";

                      return (
                        <article
                          key={project.id}
                          className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 min-h-[220px]"
                        >
                          {/* Card Top: Icon & Status */}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs shrink-0">
                                <Box className="size-4 sm:size-4.5" />
                              </div>

                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 gap-1.5 shrink-0 rounded-full capitalize select-none",
                                  isInactive
                                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                                    : isCompleted
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : isInitiated
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "border-border/80 bg-muted/50 text-muted-foreground",
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full shrink-0",
                                    isInactive
                                      ? "bg-destructive"
                                      : isCompleted
                                      ? "bg-emerald-500"
                                      : isInitiated
                                      ? "bg-primary"
                                      : "bg-muted-foreground",
                                  )}
                                />
                                {project.project_status || "Active"}
                              </Badge>
                            </div>

                            {/* Card Title */}
                            <h3 className="mt-3.5 line-clamp-2 text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                              {project.project_name}
                            </h3>

                            {/* Meta details: Order & Client */}
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {(project.order_no || project.client_name) && (
                                <div className="flex items-center gap-1.5 text-xs truncate">
                                  {project.order_no && (
                                    <span className="font-mono font-medium text-foreground/80 truncate">
                                      {project.order_no}
                                    </span>
                                  )}
                                  {project.order_no && project.client_name && (
                                    <span className="text-muted-foreground/50">
                                      ·
                                    </span>
                                  )}
                                  {project.client_name && (
                                    <span className="truncate text-muted-foreground font-medium">
                                      {project.client_name}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Bottom Actions (always pinned at bottom) */}
                          <div className="mt-5 pt-3 border-t border-border/60 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs gap-1.5 truncate justify-center hover:bg-muted font-medium"
                              >
                                <Link
                                  href={`/dashboard/track-trace/manage-project/${project.unique_project_id}/details`}
                                  title="View all boxes for this project"
                                >
                                  <Eye className="size-3.5 shrink-0 text-muted-foreground" />
                                  <span className="truncate">Boxes</span>
                                </Link>
                              </Button>

                              <Button
                                asChild={!isInactive}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs gap-1.5 truncate justify-center border-primary/25 hover:bg-primary/5 hover:text-primary font-medium"
                                disabled={isInactive}
                              >
                                {isInactive ? (
                                  <span>Unavailable</span>
                                ) : (
                                  <Link
                                    href={`/dashboard/track-trace/machines/${machine.id}/dispatch?projectId=${project.id}`}
                                    title="Dispatch boxes from this project"
                                  >
                                    <Truck className="size-3.5 shrink-0 text-primary" />
                                    <span className="truncate">Dispatch</span>
                                  </Link>
                                )}
                              </Button>
                            </div>

                            <Button
                              asChild={!isInactive}
                              size="sm"
                              className="w-full h-8 sm:h-9 text-xs sm:text-sm font-semibold gap-2 justify-center shadow-xs"
                              disabled={isInactive}
                            >
                              {isInactive ? (
                                <span>Unavailable</span>
                              ) : (
                                <Link
                                  href={`/dashboard/track-trace/machines/${machine.id}?projectId=${project.id}`}
                                >
                                  <span>Start packaging</span>
                                  <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              )}
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* ── Responsive Pagination Bar ── */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:px-4 sm:py-3 shadow-2xs">
                    <p className="text-xs text-muted-foreground text-center sm:text-left">
                      Page{" "}
                      <span className="font-semibold text-foreground">
                        {pagination.page}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-foreground">
                        {pagination.totalPages}
                      </span>{" "}
                      ·{" "}
                      <span className="font-semibold text-foreground">
                        {pagination.total}
                      </span>{" "}
                      projects
                    </p>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1.5 flex-1 sm:flex-initial"
                        onClick={() => setPage((current) => current - 1)}
                        disabled={!pagination.hasPreviousPage}
                      >
                        <ChevronLeft className="size-3.5 shrink-0" />
                        <span>Previous</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1.5 flex-1 sm:flex-initial"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        <span>Next</span>
                        <ChevronRight className="size-3.5 shrink-0" />
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
