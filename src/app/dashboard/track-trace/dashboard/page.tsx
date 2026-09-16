"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTraceTraceDashboard } from "@/hooks/track-trace/useTraceTraceDashboard";
import type {
  MachineScanStatus,
  ProjectScanStatus,
} from "@/api/track-trace/track-trace-dashboard.api";
import { useAppSelector } from "@/redux/store";
import {
  Activity,
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Clock,
  Columns3,
  Layers,
  LayoutGrid,
  ListFilter,
  Maximize2,
  Minimize2,
  Package2,
  Search,
  SlidersHorizontal,
  Table2,
  TrendingUp,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "matrix" | "compact";
type StatusFilter = "all" | "not_started" | "pending" | "completed";

interface MachineMeta {
  id: number;
  name: string;
  seq: number;
}

// ─── Machine Cell: Comfortable / Detailed View (Memoized) ──────────────────────

const DetailedMachineCell = React.memo(function DetailedMachineCell({
  machine,
}: {
  machine?: MachineScanStatus;
}) {
  if (!machine) {
    return (
      <div className="flex items-center justify-center py-2 text-xs text-muted-foreground/40">
        —
      </div>
    );
  }

  const allDone = machine.all_scanned;
  const isStarted = machine.scanned > 0;
  const pct =
    machine.total > 0 ? Math.round((machine.scanned / machine.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1 min-w-[135px]">
      {allDone ? (
        <Badge
          variant="outline"
          className="w-fit text-[10px] font-semibold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0"
        >
          <CheckCircle2 size={10} />
          ALL DONE
        </Badge>
      ) : isStarted && machine.pending > 0 ? (
        <Badge
          variant="outline"
          className="w-fit text-[10px] font-semibold gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0"
        >
          <Clock size={10} />
          {machine.pending} PENDING
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="w-fit text-[10px] font-semibold text-muted-foreground/70 py-0"
        >
          NOT STARTED
        </Badge>
      )}

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            allDone ? "bg-emerald-500" : isStarted ? "bg-primary" : "w-0",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold tabular-nums text-foreground">
          {machine.scanned}
          <span className="font-normal text-muted-foreground">/{machine.total}</span>
        </span>
        <span
          className={cn(
            "text-[10px] font-bold tabular-nums",
            allDone
              ? "text-emerald-600 dark:text-emerald-400"
              : isStarted
              ? "text-primary font-semibold"
              : "text-muted-foreground",
          )}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
});

// ─── Machine Cell: Compact High-Density View (Memoized, Shared Tooltip Provider) ──

const CompactMachineCell = React.memo(function CompactMachineCell({
  machine,
  projectName,
}: {
  machine?: MachineScanStatus;
  projectName: string;
}) {
  if (!machine) {
    return (
      <div className="flex items-center justify-center py-1.5 text-xs text-muted-foreground/30">
        —
      </div>
    );
  }

  const allDone = machine.all_scanned;
  const isStarted = machine.scanned > 0;
  const pct =
    machine.total > 0 ? Math.round((machine.scanned / machine.total) * 100) : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "group flex flex-col items-center justify-center p-1.5 rounded-lg border transition-colors cursor-pointer select-none",
            allDone
              ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
              : isStarted && machine.pending > 0
              ? "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              : "border-border/40 bg-muted/20 hover:bg-muted/40",
          )}
        >
          <div className="flex items-center gap-1 w-full justify-between">
            <span
              className={cn(
                "text-[11px] font-bold tabular-nums",
                allDone
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isStarted && machine.pending > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {allDone ? "100%" : `${pct}%`}
            </span>
            {allDone ? (
              <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
            ) : isStarted && machine.pending > 0 ? (
              <Clock className="size-3 text-amber-500 shrink-0" />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/30" />
            )}
          </div>

          <div className="h-1 w-full overflow-hidden rounded-full bg-muted/60 mt-1">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-200",
                allDone ? "bg-emerald-500" : isStarted ? "bg-amber-500" : "w-0",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5 font-medium">
            {machine.scanned}/{machine.total}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="p-0 w-64 rounded-xl shadow-xl border bg-popover text-popover-foreground overflow-hidden"
      >
        <div className="text-left">
          {/* Header with Sequence, Machine Name and Progress Percentage (Full Edge-to-Edge Border) */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/80 bg-muted/20">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-background text-[10px] font-bold">
                {machine.sequence_no}
              </span>
              <p className="text-xs font-bold text-foreground truncate">
                {machine.machine_name}
              </p>
            </div>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums shrink-0",
                allDone
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isStarted
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {allDone ? "100%" : `${pct}%`}
            </span>
          </div>

          {/* Body Content */}
          <div className="p-3 space-y-2.5">
            {/* Project Name */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Project
              </span>
              <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                {projectName}
              </p>
            </div>

            {/* Metrics Grid: Scanned vs Pending Mini Tiles */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg bg-muted/50 p-2 border border-border/40">
                <span className="text-[10px] text-muted-foreground font-medium block">
                  Scanned
                </span>
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {machine.scanned}
                  <span className="font-normal text-muted-foreground">/{machine.total}</span>
                </span>
              </div>

              <div className="rounded-lg bg-muted/50 p-2 border border-border/40">
                <span className="text-[10px] text-muted-foreground font-medium block">
                  Pending
                </span>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums",
                    isStarted && machine.pending > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground",
                  )}
                >
                  {machine.pending}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Station Status Pill (Full Edge-to-Edge Border) */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/10 text-xs">
            <span className="text-[11px] text-muted-foreground font-medium">
              Status
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-semibold py-0 px-2 h-5",
                allDone
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : isStarted
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              {allDone
                ? "All Done"
                : isStarted
                ? `In Progress (${pct}%)`
                : "Not Started"}
            </Badge>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

// ─── Stat Card Component (Memoized) ───────────────────────────────────────────

const StatCard = React.memo(function StatCard({
  label,
  value,
  sub,
  Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 px-3.5 space-y-1.5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground truncate">
          {label}
        </p>
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-muted/70 border border-border/70 text-foreground">
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
          {value}
        </p>
      </div>
      {sub && (
        <p className="text-[11px] text-muted-foreground font-medium truncate">
          {sub}
        </p>
      )}
    </div>
  );
});

// ─── Single Project Table Row (Memoized for fast rendering) ───────────────────

interface ProjectRowProps {
  project: ProjectScanStatus;
  visibleMachines: MachineMeta[];
  isCompact: boolean;
}

const ProjectTableRow = React.memo(function ProjectTableRow({
  project,
  visibleMachines,
  isCompact,
}: ProjectRowProps) {
  const machineById = useMemo(
    () => new Map(project.machines.map((m) => [m.machine_id, m])),
    [project.machines],
  );

  const totalScanned = useMemo(
    () => project.machines.reduce((s, m) => s + m.scanned, 0),
    [project.machines],
  );
  const totalPending = useMemo(
    () => project.machines.reduce((s, m) => s + m.pending, 0),
    [project.machines],
  );
  const allProjectDone =
    (project.total_panels > 0 && project.panels_scanned >= project.total_panels) ||
    (totalPending === 0 && project.machines.length > 0 && totalScanned > 0);
  const isNotStarted = totalScanned === 0 && project.panels_scanned === 0;

  return (
    <TableRow className="transition-colors hover:bg-muted/40 border-b last:border-0 group">
      {/* Sticky Project Cell with Status Dot */}
      <TableCell
        className={cn(
          "sticky left-0 z-10 border-r bg-card group-hover:bg-muted/40 transition-colors",
          isCompact ? "py-2.5 px-3 min-w-[240px]" : "py-3.5 px-4 min-w-[280px]",
        )}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "h-2.5 w-2.5 shrink-0 rounded-full mt-1 transition-colors",
              allProjectDone
                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                : isNotStarted
                ? "bg-slate-400 dark:bg-slate-500"
                : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]",
            )}
            title={
              allProjectDone
                ? "Completed (100%)"
                : isNotStarted
                ? "Not Started (0 Scanned)"
                : "Pending / In Progress"
            }
          />
          <div className="flex flex-col min-w-0 space-y-1">
            <span className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors whitespace-normal">
              {project.project_name}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              <strong className="text-foreground">
                {project.panels_scanned}
              </strong>
              /{project.total_panels} panels done
            </span>
          </div>
        </div>
      </TableCell>

      {/* Machine Cells */}
      {visibleMachines.map((m) => {
        const machine = machineById.get(m.id);

        if (isCompact) {
          return (
            <TableCell key={m.id} className="py-2 px-1.5 text-center">
              <CompactMachineCell
                machine={machine}
                projectName={project.project_name}
              />
            </TableCell>
          );
        }

        return (
          <TableCell key={m.id} className="py-3.5 px-3.5 align-top">
            <DetailedMachineCell machine={machine} />
          </TableCell>
        );
      })}
    </TableRow>
  );
});

// ─── Project Table Component ──────────────────────────────────────────────────

function ProjectTable({
  projects,
  visibleMachines,
  viewMode,
  scrollContainerRef,
}: {
  projects: ProjectScanStatus[];
  visibleMachines: MachineMeta[];
  viewMode: ViewMode;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-16 text-center gap-3">
        <div className="rounded-2xl bg-muted p-4 border">
          <Package2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground">No projects found</p>
          <p className="text-xs text-muted-foreground">
            No projects match the selected filters.
          </p>
        </div>
      </div>
    );
  }

  const isCompact = viewMode === "compact";

  // Precompute grand totals in a single pass O(N * M)
  const grandTotals = useMemo(() => {
    const statsMap = new Map<number, { scanned: number; total: number; pending: number }>();
    visibleMachines.forEach((m) => {
      statsMap.set(m.id, { scanned: 0, total: 0, pending: 0 });
    });

    projects.forEach((p) => {
      p.machines.forEach((pm) => {
        const entry = statsMap.get(pm.machine_id);
        if (entry) {
          entry.scanned += pm.scanned;
          entry.total += pm.total;
          entry.pending += pm.pending;
        }
      });
    });

    return statsMap;
  }, [projects, visibleMachines]);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={100}>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
        >
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead
                  className={cn(
                    "sticky left-0 z-20 bg-card border-r py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground",
                    isCompact ? "min-w-[240px]" : "min-w-[280px]",
                  )}
                >
                  Project Name
                </TableHead>
                {visibleMachines.map((m) => (
                  <TableHead
                    key={m.id}
                    id={`machine-header-${m.id}`}
                    className={cn(
                      "py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground",
                      isCompact ? "min-w-[95px] max-w-[110px] px-2 text-center" : "min-w-[155px] px-3.5",
                    )}
                  >
                    <div className={cn("flex items-center gap-1.5", isCompact ? "justify-center" : "")}>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-[9px] font-bold">
                        {m.seq}
                      </span>
                      <span className="truncate" title={m.name}>
                        {m.name}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {projects.map((project) => (
                <ProjectTableRow
                  key={project.project_id}
                  project={project}
                  visibleMachines={visibleMachines}
                  isCompact={isCompact}
                />
              ))}
            </TableBody>

            {/* Grand Total Footer */}
            <TableFooter>
              <TableRow className="border-t-2 bg-muted/40 hover:bg-muted/40">
                <TableCell
                  className={cn(
                    "sticky left-0 z-10 bg-muted/40 border-r",
                    isCompact ? "py-2.5 px-3 min-w-[240px]" : "py-3.5 px-4 min-w-[280px]",
                  )}
                >
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Grand Total
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {projects.length}{" "}
                      <span className="font-normal text-muted-foreground">
                        project{projects.length !== 1 ? "s" : ""}
                      </span>
                    </span>
                  </div>
                </TableCell>

                {visibleMachines.map((m) => {
                  const stat = grandTotals.get(m.id) ?? { scanned: 0, total: 0, pending: 0 };
                  const allDone = stat.total > 0 && stat.pending === 0;
                  const isStarted = stat.scanned > 0;
                  const pct = stat.total > 0 ? Math.round((stat.scanned / stat.total) * 100) : 0;

                  if (isCompact) {
                    return (
                      <TableCell key={m.id} className="py-2 px-1.5 text-center">
                        <div
                          className={cn(
                            "flex flex-col items-center justify-center p-1.5 rounded-lg border font-bold text-[10px]",
                            allDone
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isStarted && stat.pending > 0
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          <span>{allDone ? "100%" : `${pct}%`}</span>
                          <span className="text-[9px] font-normal opacity-80">
                            {stat.scanned}/{stat.total}
                          </span>
                        </div>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={m.id} className="py-3.5 px-3.5 align-top">
                      <div className="flex flex-col gap-1.5 min-w-[135px]">
                        {allDone ? (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] font-semibold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0"
                          >
                            <CheckCircle2 size={10} />
                            ALL DONE
                          </Badge>
                        ) : isStarted && stat.pending > 0 ? (
                          <Badge
                            variant="outline"
                            className="w-fit text-[10px] font-semibold gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0"
                          >
                            <Clock size={10} />
                            {stat.pending} PENDING
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              allDone ? "bg-emerald-500" : isStarted ? "bg-primary" : "w-0",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold tabular-nums text-foreground">
                            {stat.scanned}
                            <span className="font-normal text-muted-foreground">
                              /{stat.total}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold tabular-nums",
                              allDone
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isStarted
                                ? "text-primary font-semibold"
                                : "text-muted-foreground",
                            )}
                          >
                            {pct}%
                          </span>
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
    </TooltipProvider>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ─── Main Trace & Trace Dashboard Component ───────────────────────────────────

export default function TraceTraceDashboard() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { data, isLoading, isError } = useTraceTraceDashboard(vendorId, statusFilter);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [hiddenMachineIds, setHiddenMachineIds] = useState<Set<number>>(new Set());

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [machineSearch, setMachineSearch] = useState("");

  // Reset pagination on filter / tab changes
  useEffect(() => {
    setPageIndex(0);
  }, [statusFilter, deferredSearchQuery, activeTab, pageSize]);

  // ── Fullscreen Handlers ─────────────────────────────────────────────────────
  const enterFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen)
      (el as any).webkitRequestFullscreen();
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any).webkitExitFullscreen)
      (document as any).webkitExitFullscreen();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

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

  // ── Horizontal Table Scroll Navigation ──────────────────────────────────────
  const scrollTable = useCallback((direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -350 : 350;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }, []);

  // ── Aggregate Data & Machine Extract ────────────────────────────────────────
  const allProjects = useMemo(() => {
    return [...(data?.active ?? []), ...(data?.archived ?? [])];
  }, [data]);

  const allMachines = useMemo(() => {
    const machineMap = new Map<number, MachineMeta>();
    allProjects.forEach((p) =>
      p.machines.forEach((m) => {
        if (!machineMap.has(m.machine_id)) {
          machineMap.set(m.machine_id, {
            id: m.machine_id,
            name: m.machine_name,
            seq: m.sequence_no,
          });
        }
      }),
    );
    return Array.from(machineMap.values()).sort((a, b) => a.seq - b.seq);
  }, [allProjects]);

  const visibleMachines = useMemo(() => {
    return allMachines.filter((m) => !hiddenMachineIds.has(m.id));
  }, [allMachines, hiddenMachineIds]);

  const filteredMachines = useMemo(() => {
    const q = machineSearch.toLowerCase().trim();
    if (!q) return allMachines;
    return allMachines.filter((m) => m.name.toLowerCase().includes(q));
  }, [allMachines, machineSearch]);

  const toggleMachineVisibility = useCallback((machineId: number) => {
    setHiddenMachineIds((prev) => {
      const next = new Set(prev);
      if (next.has(machineId)) next.delete(machineId);
      else next.add(machineId);
      return next;
    });
  }, []);

  const showAllMachines = useCallback(() => {
    setHiddenMachineIds(new Set());
  }, []);

  // ── Filtering Logic with deferred search ────────────────────────────────────
  const activeFiltered = useMemo(() => {
    const list = data?.active ?? [];
    const query = deferredSearchQuery.toLowerCase().trim();
    if (!query) return list;
    return list.filter((p) => p.project_name.toLowerCase().includes(query));
  }, [data?.active, deferredSearchQuery]);

  const archivedFiltered = useMemo(() => {
    const list = data?.archived ?? [];
    const query = deferredSearchQuery.toLowerCase().trim();
    if (!query) return list;
    return list.filter((p) => p.project_name.toLowerCase().includes(query));
  }, [data?.archived, deferredSearchQuery]);

  // ── Top Stats (Memoized) ────────────────────────────────────────────────────
  const totalActive = data?.active_count ?? 0;
  const totalArchived = data?.archived_count ?? 0;
  const activePanelsScanned = useMemo(
    () => data?.active.reduce((sum, p) => sum + p.panels_scanned, 0) ?? 0,
    [data?.active],
  );
  const activeTotalPanels = useMemo(
    () => data?.active.reduce((sum, p) => sum + p.total_panels, 0) ?? 0,
    [data?.active],
  );
  const activeProgressPct =
    activeTotalPanels > 0
      ? Math.round((activePanelsScanned / activeTotalPanels) * 100)
      : 0;

  const totalPendingPanels = useMemo(
    () =>
      data?.active.reduce(
        (sum, p) => sum + p.machines.reduce((ms, m) => ms + m.pending, 0),
        0,
      ) ?? 0,
    [data?.active],
  );

  // Pagination calculation
  const displayedProjects = activeTab === "active" ? activeFiltered : archivedFiltered;
  const totalItems = displayedProjects.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProjects = useMemo(() => {
    const start = pageIndex * pageSize;
    return displayedProjects.slice(start, start + pageSize);
  }, [displayedProjects, pageIndex, pageSize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-6 transition-all min-h-screen pb-12",
        isFullscreen && "bg-background overflow-y-auto p-6",
      )}
    >
      {/* Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-card/80 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track & Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Real Time Production</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="px-6 space-y-5 max-w-[1600px] mx-auto w-full">
        {/* ── Page Title Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Track & Trace Live Matrix
              </h1>
              {data && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 text-xs font-semibold h-7 rounded-lg"
                >
                  <Activity className="size-3 text-emerald-500 animate-pulse" />
                  Live Sync
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time machine scan progress and panel completion across all active projects.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Controls */}
            <div className="flex items-center rounded-lg border bg-muted/60 p-0.5">
              <Button
                type="button"
                variant={viewMode === "matrix" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("matrix")}
                className="h-7 px-2.5 text-xs rounded-md gap-1.5 font-semibold"
                title="Comfortable Matrix View"
              >
                <Table2 className="size-3.5" />
                <span>Comfortable</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compact")}
                className="h-7 px-2.5 text-xs rounded-md gap-1.5 font-semibold"
                title="Compact Grid (Fits 15+ machines on screen)"
              >
                <LayoutGrid className="size-3.5" />
                <span>Compact Grid</span>
              </Button>
            </div>

            {/* Fullscreen Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={
                isFullscreen
                  ? "Exit fullscreen (Ctrl+Shift+F)"
                  : "Enter fullscreen (Ctrl+Shift+F)"
              }
              className="h-8 gap-1.5 text-xs rounded-md"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="size-3.5" />
                  <span className="hidden md:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" />
                  <span className="hidden md:inline">Fullscreen</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── KPI Stat Cards ── */}
        {data && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Projects"
              value={totalActive}
              Icon={TrendingUp}
              iconColor="text-blue-600 dark:text-blue-400"
              sub={`${totalArchived} archived`}
            />
            <StatCard
              label="Total Panels"
              value={activeTotalPanels.toLocaleString()}
              Icon={Package2}
              iconColor="text-amber-600 dark:text-amber-400"
              sub="Across active projects"
            />
            <StatCard
              label="Panels Completed"
              value={activePanelsScanned.toLocaleString()}
              Icon={Layers}
              iconColor="text-emerald-600 dark:text-emerald-400"
              sub={`${activeProgressPct}% overall progress`}
            />
            <StatCard
              label="Overall Completion"
              value={`${activeProgressPct}%`}
              Icon={CheckCircle2}
              iconColor="text-primary"
              sub="Live production pace"
            />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Failed to load dashboard data. Please refresh and try again.</span>
          </div>
        )}

        {/* ── Single-Row Faceted Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 py-0.5">
          {/* Left Controls: Search, Active/Archived Tabs, Status Dropdown */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* 1. Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-xs rounded-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* 2. Active Projects / Archived Switcher */}
            <div className="inline-flex items-center rounded-lg border border-border/80 bg-muted/50 p-0.5 h-8">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-all select-none",
                  activeTab === "active"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40 font-medium",
                )}
              >
                <TrendingUp className="size-3.5 text-blue-500 shrink-0" />
                <span>Active Projects</span>
                {data && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold tabular-nums",
                      activeTab === "active"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {data.active_count}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("archived")}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-all select-none",
                  activeTab === "archived"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40 font-medium",
                )}
              >
                <Archive className="size-3.5 text-muted-foreground shrink-0" />
                <span>Archived</span>
                {data && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold tabular-nums",
                      activeTab === "archived"
                        ? "bg-muted text-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {data.archived_count}
                  </span>
                )}
              </button>
            </div>

            {/* 3. Status Dropdown Filter with Colored Dots */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-md font-medium"
                >
                  <ListFilter className="size-3.5 text-muted-foreground" />
                  <span>Status:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        statusFilter === "completed"
                          ? "bg-emerald-500"
                          : statusFilter === "pending"
                          ? "bg-amber-500"
                          : statusFilter === "not_started"
                          ? "bg-slate-400"
                          : "bg-blue-500",
                      )}
                    />
                    <span className="font-semibold capitalize">
                      {statusFilter === "not_started"
                        ? "Not Started"
                        : statusFilter === "pending"
                        ? "Pending"
                        : statusFilter === "completed"
                        ? "Completed"
                        : "All"}
                    </span>
                  </div>
                  <ChevronsUpDown className="size-3 text-muted-foreground opacity-60 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 p-1 rounded-lg shadow-lg">
                <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                  Filter by Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val as StatusFilter)}
                >
                  <DropdownMenuRadioItem value="all" className="text-xs cursor-pointer gap-2">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span>All Projects</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="not_started" className="text-xs cursor-pointer gap-2">
                    <span className="size-2 rounded-full bg-slate-400" />
                    <span>Not Started</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending" className="text-xs cursor-pointer gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="completed" className="text-xs cursor-pointer gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Completed</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Controls: Machines Popover (Exact DataTableViewOptions UI) */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label="Toggle machine columns"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-md font-medium"
                >
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span>Machines</span>
                  <ChevronsUpDown className="ml-auto size-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-0 shadow-lg">
                <Command>
                  <CommandInput placeholder="Search columns..." />
                  <CommandList>
                    <CommandEmpty>No machines found.</CommandEmpty>
                    <CommandGroup>
                      {allMachines.map((m) => {
                        const isVisible = !hiddenMachineIds.has(m.id);
                        return (
                          <CommandItem
                            key={m.id}
                            onSelect={() => toggleMachineVisibility(m.id)}
                            className="cursor-pointer text-xs"
                          >
                            <span className="truncate">{m.name}</span>
                            <Check
                              className={cn(
                                "ml-auto size-4 shrink-0",
                                isVisible ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ── Table Content ── */}
        <div className="space-y-3">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <ProjectTable
                projects={paginatedProjects}
                visibleMachines={visibleMachines}
                viewMode={viewMode}
                scrollContainerRef={scrollContainerRef}
              />

              {/* ── Proper Pagination Control Bar ── */}
              {/* ── Exact DataTablePagination Layout ── */}
              {totalItems > 0 && (
                <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8">
                  <div className="flex-1 whitespace-nowrap text-muted-foreground text-sm">
                    {totalItems} total project{totalItems !== 1 ? "s" : ""}
                  </div>
                  <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                    <div className="flex items-center space-x-2">
                      <p className="whitespace-nowrap font-medium text-sm">
                        Rows per page
                      </p>
                      <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setPageIndex(0);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[4.5rem]">
                          <SelectValue placeholder={`${pageSize}`} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-center font-medium text-sm">
                      Page {pageIndex + 1} of {pageCount}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        aria-label="Go to first page"
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => setPageIndex(0)}
                        disabled={pageIndex === 0}
                      >
                        <ChevronsLeft className="size-4" />
                      </Button>
                      <Button
                        aria-label="Go to previous page"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={pageIndex === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        aria-label="Go to next page"
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() =>
                          setPageIndex((p) => Math.min(pageCount - 1, p + 1))
                        }
                        disabled={pageIndex >= pageCount - 1}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      <Button
                        aria-label="Go to last page"
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => setPageIndex(pageCount - 1)}
                        disabled={pageIndex >= pageCount - 1}
                      >
                        <ChevronsRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}