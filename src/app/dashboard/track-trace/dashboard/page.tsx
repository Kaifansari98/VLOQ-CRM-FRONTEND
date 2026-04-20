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

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTraceTraceDashboard } from "@/hooks/track-trace/useTraceTraceDashboard";
import type {
  MachineScanStatus,
  ProjectScanStatus,
} from "@/api/track-trace/track-trace-dashboard.api";
import { useAppSelector } from "@/redux/store";
import {
  Activity,
  Archive,
  CheckCircle2,
  Clock,
  Layers,
  Maximize2,
  Minimize2,
  Package2,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";


// ─── Machine cell ─────────────────────────────────────────────────────────────

function MachineCell({ machine }: { machine: MachineScanStatus }) {
  const allDone = machine.all_scanned;
  const pct =
    machine.total > 0 ? Math.round((machine.scanned / machine.total) * 100) : 0;

  return (
    <>
    <div className="flex flex-col gap-2 min-w-[120px]">
       
      {allDone ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
          <CheckCircle2 className="size-2.5" />
          ALL DONE
        </span>
      ) : machine.pending > 0 ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-orange-600 ring-1 ring-orange-500/20 dark:text-orange-400">
          <Clock className="size-2.5" />
          {machine.pending} PENDING
        </span>
      ) : (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground">
          NOT STARTED
        </span>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
            allDone
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : pct > 0
              ? "bg-gradient-to-r from-orange-500 to-amber-400"
              : "w-0"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tabular-nums text-foreground">
          {machine.scanned}
          <span className="font-normal text-muted-foreground">/{machine.total}</span>
        </span>
        <span className={cn("text-[10px] font-bold tabular-nums", allDone ? "text-emerald-500" : "text-muted-foreground")}>
          {pct}%
        </span>
      </div>
    </div>
    </>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className={cn("rounded-lg p-2", color)}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-black tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Project table ────────────────────────────────────────────────────────────

function ProjectTable({ projects }: { projects: ProjectScanStatus[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center gap-4">
        <div className="rounded-2xl bg-muted p-5">
          <Package2 className="size-10 text-muted-foreground/50" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No projects found</p>
          <p className="text-sm text-muted-foreground mt-1">Projects will appear here once they are created</p>
        </div>
      </div>
    );
  }

  const machineMap = new Map<number, { id: number; name: string; seq: number }>();
  projects.forEach((p) =>
    p.machines.forEach((m) => {
      if (!machineMap.has(m.machine_id)) {
        machineMap.set(m.machine_id, { id: m.machine_id, name: m.machine_name, seq: m.sequence_no });
      }
    })
  );
  const allMachines = Array.from(machineMap.values()).sort((a, b) => a.seq - b.seq);

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="min-w-[220px] sticky left-0 z-10 bg-muted/60 border-r py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
                Project
              </TableHead>
              {allMachines.map((m, i) => (
                <TableHead key={m.id} className="min-w-[150px] py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[9px] font-black text-foreground">
                      {i + 1}
                    </span>
                    {m.name}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {projects.map((project, rowIdx) => {
              const machineById = new Map(project.machines.map((m) => [m.machine_id, m]));
              const totalPending = project.machines.reduce((s, m) => s + m.pending, 0);
              const allProjectDone = totalPending === 0 && project.machines.length > 0;

              return (
                <TableRow
                  key={project.project_id}
                  className={cn("group transition-colors", rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20", "hover:bg-primary/5")}
                >
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 border-r py-4 font-medium transition-colors",
                      rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "group-hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2.5 max-w-[200px]">
                      <div className={cn("h-2 w-2 shrink-0 rounded-full", allProjectDone ? "bg-emerald-500" : totalPending > 0 ? "bg-orange-400" : "bg-muted-foreground/30")} />
                      <div className="flex flex-col min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground" title={project.project_name}>
                          {project.project_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">{project.panels_scanned}</span>
                          /{project.total_panels} panels done
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {allMachines.map((m) => {
                    const machine = machineById.get(m.id);
                    return (
                      <TableCell key={m.id} className="py-4 align-top">
                        {machine ? <MachineCell machine={machine} /> : (
                          <div className="flex items-center justify-center">
                            <span className="text-lg text-muted-foreground/20">—</span>
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>

          <TableFooter>
            <TableRow className="border-t-2 bg-muted/80 hover:bg-muted/80">
              <TableCell className="sticky left-0 z-10 bg-muted/80 border-r py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Grand Total</span>
                  <span className="text-sm font-black text-foreground">
                    {projects.length}{" "}
                    <span className="font-normal text-muted-foreground">project{projects.length !== 1 ? "s" : ""}</span>
                  </span>
                </div>
              </TableCell>
              {allMachines.map((m) => {
                const totalScanned = projects.reduce((sum, p) => sum + (p.machines.find((pm) => pm.machine_id === m.id)?.scanned ?? 0), 0);
                const totalCount = projects.reduce((sum, p) => sum + (p.machines.find((pm) => pm.machine_id === m.id)?.total ?? 0), 0);
                const totalPending = projects.reduce((sum, p) => sum + (p.machines.find((pm) => pm.machine_id === m.id)?.pending ?? 0), 0);
                const allDone = totalCount > 0 && totalPending === 0;
                const pct = totalCount > 0 ? Math.round((totalScanned / totalCount) * 100) : 0;

                return (
                  <TableCell key={m.id} className="py-4 align-top">
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      {allDone ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                          <CheckCircle2 className="size-2.5" />ALL DONE
                        </span>
                      ) : totalPending > 0 ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-orange-600 ring-1 ring-orange-500/20 dark:text-orange-400">
                          <Clock className="size-2.5" />{totalPending} PENDING
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-background">
                        <div
                          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", allDone ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-orange-500 to-amber-400")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black tabular-nums text-foreground">
                          {totalScanned}<span className="font-normal text-muted-foreground">/{totalCount}</span>
                        </span>
                        <span className={cn("text-[10px] font-bold tabular-nums", allDone ? "text-emerald-500" : "text-muted-foreground")}>{pct}%</span>
                      </div>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className="flex gap-6 px-5 py-4 border-b bg-muted/60">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-28" />)}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn("flex gap-6 items-center px-5 py-5 border-b", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
          <Skeleton className="h-4 w-44" />
          {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-14 w-32 rounded-lg" />)}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TraceTraceDashboard() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError } = useTraceTraceDashboard(vendorId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Fullscreen logic ────────────────────────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Sync state with actual fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  // Keyboard shortcut: F key or F11 equivalent
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  const totalActive = data?.active_count ?? 0;
  const totalArchived = data?.archived_count ?? 0;
  const activePanelsScanned = data?.active.reduce((sum, p) => sum + p.panels_scanned, 0) ?? 0;
  const activeTotalPanels = data?.active.reduce((sum, p) => sum + p.total_panels, 0) ?? 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-8 transition-all",
        isFullscreen && "bg-background overflow-y-auto"
      )}
    >
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
                <BreadcrumbLink href="/dashboard">Track Trace</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Real Time</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="px-6 space-y-6">

      
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h1 className="text-2xl font-black tracking-tight text-foreground">Track & Trace</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-3">
            Real-time scan progress across all projects and machines
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
          )}

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen (Ctrl+Shift+F)" : "Enter fullscreen (Ctrl+Shift+F)"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              isFullscreen
                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="size-3.5" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5" />
                Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Active Projects" value={totalActive} icon={TrendingUp} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" />
          <StatCard label="Archived" value={totalArchived} icon={Archive} color="bg-muted text-muted-foreground" />
          <StatCard label="Panels Done" value={activePanelsScanned.toLocaleString()} icon={Layers} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
          <StatCard label="Total Panels" value={activeTotalPanels.toLocaleString()} icon={Layers} color="bg-muted text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          ⚠ Failed to load dashboard data. Please refresh and try again.
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="active">
        <TabsList className="mb-6 h-10 rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="active" className="gap-2 rounded-lg px-4 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Active
            {data && (
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 rounded-full px-1.5 text-[10px] font-black">
                {data.active_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2 rounded-lg px-4 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Archive className="size-3.5" />
            Archived
            {data && (
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 rounded-full px-1.5 text-[10px] font-black">
                {data.archived_count}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? <TableSkeleton /> : <ProjectTable projects={data?.active ?? []} />}
        </TabsContent>

        <TabsContent value="archived">
          {isLoading ? <TableSkeleton /> : <ProjectTable projects={data?.archived ?? []} />}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}