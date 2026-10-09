"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppSelector } from "@/redux/store";
import { useProjectItemTracking } from "@/hooks/track-trace/useProjectItemTracking";
import type { ProjectTrackedItem } from "@/api/track-trace/track-trace-items.api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Cpu,
  FolderTree,
  Layers,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  RotateCcw,
  Ruler,
  Search,
  Sparkles,
  Truck,
  User,
  Weight,
  X,
} from "lucide-react";

type ScanTab = "all" | "scanned" | "pending";

const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(iso);
  }
};

export default function ProjectMachineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const uniqueProjectId = String(params.uniqueProjectId || "");
  const rawMachineId = String(params.machineId || "");
  const isDispatch = rawMachineId.toLowerCase() === "dispatch";
  const machineIdParam = isDispatch ? null : Number(params.machineId);

  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;

  const [activeTab, setActiveTab] = useState<ScanTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput.trim());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [
    activeTab,
    deferredSearch,
    selectedCategory,
    selectedGroup,
    pageSize,
    machineIdParam,
    isDispatch,
  ]);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useProjectItemTracking(Number(vendorId), uniqueProjectId, {
    page,
    limit: pageSize,
    search: deferredSearch || undefined,
    scanStatus: activeTab,
    machineId: isDispatch ? "dispatch" : (machineIdParam || undefined),
    stage: isDispatch ? "dispatch" : undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    group: selectedGroup !== "all" ? selectedGroup : undefined,
  });

  const project = response?.project;
  const items = response?.data || [];
  const pagination = response?.pagination;
  const counts = response?.counts || { all: 0, scanned: 0, pending: 0 };
  const availableMachines = response?.filterOptions?.machines || [];

  // Stable category & group filter options
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>([]);

  useEffect(() => {
    if (response?.filterOptions?.categories?.length) {
      setCategoryOptions(response.filterOptions.categories);
    } else if (items.length) {
      setCategoryOptions((prev) => {
        const set = new Set([
          ...prev,
          ...(items.map((i) => i.category_name?.trim()).filter(Boolean) as string[]),
        ]);
        return Array.from(set).sort((a, b) => a.localeCompare(b));
      });
    }
  }, [response?.filterOptions?.categories, items]);

  useEffect(() => {
    if (response?.filterOptions?.groups?.length) {
      setGroupOptions(response.filterOptions.groups);
    } else if (items.length) {
      setGroupOptions((prev) => {
        const set = new Set([
          ...prev,
          ...(items.map((i) => i.group_name?.trim()).filter(Boolean) as string[]),
        ]);
        return Array.from(set).sort((a, b) => a.localeCompare(b));
      });
    }
  }, [response?.filterOptions?.groups, items]);

  const hasActiveFilters = Boolean(
    searchInput.trim() || selectedCategory !== "all" || selectedGroup !== "all",
  );

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategory("all");
    setSelectedGroup("all");
    setPage(1);
  };

  const currentMachine = useMemo(() => {
    if (isDispatch) return null;
    return availableMachines.find((m) => m.id === machineIdParam);
  }, [availableMachines, machineIdParam, isDispatch]);

  const currentMachineName = isDispatch
    ? "Dispatch"
    : currentMachine?.machine_name || "Panel Saw";
  const isPackagingMachine =
    !isDispatch && currentMachineName.toLowerCase().includes("pack");

  const completionPct = useMemo(() => {
    if (!counts.all || counts.all === 0) return 0;
    return Math.round((counts.scanned / counts.all) * 100);
  }, [counts.all, counts.scanned]);

  const handleMachineChange = (newMachineId: string) => {
    router.push(
      `/dashboard/track-trace/manage-project/${uniqueProjectId}/machines/${newMachineId}`,
    );
  };

  const tabs: { id: ScanTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    {
      id: "scanned",
      label: isDispatch ? "Dispatched" : "Scan",
      count: counts.scanned,
    },
    { id: "pending", label: "Pending", count: counts.pending },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen flex-col bg-background/50">
        {/* ── Top Header Navigation ── */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md transition-all">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <BreadcrumbLink href="/dashboard/track-trace/dashboard">
                    Track &amp; Trace
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem className="hidden md:inline-flex">
                  <BreadcrumbLink href="/dashboard/track-trace/manage-project">
                    Projects
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:inline-flex" />
                <BreadcrumbItem className="hidden lg:inline-flex">
                  <BreadcrumbLink
                    href={`/dashboard/track-trace/manage-project/${uniqueProjectId}/details`}
                    className="max-w-[180px] truncate"
                  >
                    {project?.project_name || "Project Details"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden lg:inline-flex" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {currentMachineName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 gap-1.5 rounded-lg text-xs font-medium border-border/80 shadow-2xs hover:bg-muted"
            >
              <RefreshCw
                className={cn("size-3.5", isFetching && "animate-spin text-primary")}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <AnimatedThemeToggler />
            <NotificationBell />
          </div>
        </header>

        {/* ── Main Content Container ── */}
        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* ── Machine & Project Identity Hero Header ── */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/20 p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
                className="size-10 shrink-0 rounded-xl border-border/80 shadow-2xs hover:bg-muted transition-transform active:scale-95 mt-0.5"
                title="Go back"
              >
                <ArrowLeft className="size-4" />
              </Button>

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    <Link
                      href={`/dashboard/track-trace/manage-project/${uniqueProjectId}/details`}
                      className="hover:text-primary transition-colors underline-offset-4 hover:underline"
                      title="View Project Details"
                    >
                      {project?.project_name || "Project Details"}
                    </Link>
                  </h1>
                  {project?.track_trace_status && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold capitalize py-0.5 px-2.5 shadow-2xs"
                    >
                      {project.track_trace_status}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/40 rounded-lg px-2.5 py-1 border border-border/60">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-black shadow-2xs">
                      {isDispatch ? (
                        <Truck className="size-3" />
                      ) : (
                        currentMachine?.sequence_no || "2"
                      )}
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {currentMachineName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold py-0 px-1.5 ml-0.5",
                        isDispatch
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-primary/30 bg-primary/10 text-primary",
                      )}
                    >
                      {isDispatch ? "Dispatch Stage" : "Station Detail"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                  <Link
                    href={`/dashboard/track-trace/manage-project/${uniqueProjectId}/details`}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                  >
                    View Project Overview →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Controls: Machine Switcher Dropdown */}
            {(availableMachines.length > 0 || isDispatch) && (
              <div className="flex items-center gap-2.5 sm:self-center">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">
                  Switch Machine:
                </span>
                <Select
                  value={isDispatch ? "dispatch" : String(machineIdParam || "")}
                  onValueChange={handleMachineChange}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[220px] rounded-xl text-xs font-semibold bg-background border-border/80 shadow-2xs">
                    <SelectValue placeholder="Select Machine" />
                  </SelectTrigger>
                  <SelectContent align="end" className="rounded-xl shadow-xl">
                    {availableMachines.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={String(m.id)}
                        className="text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-md bg-foreground text-background text-[9px] font-bold">
                            {m.sequence_no}
                          </span>
                          <span className="truncate">{m.machine_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <Separator className="my-1" />
                    <SelectItem
                      value="dispatch"
                      className="text-xs cursor-pointer font-semibold text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                          <Truck className="size-2.5" />
                        </span>
                        <span className="truncate">Dispatch</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ── KPI Stat Summary Cards ── */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Panels */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4.5 shadow-xs transition-all hover:border-blue-500/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Panels
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Package className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : counts.all}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  assigned
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isDispatch
                  ? "All project cutlist items in dispatch"
                  : `All cutlist items assigned to ${currentMachineName}`}
              </p>
            </div>

            {/* Scanned / Dispatched Panels */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4.5 shadow-xs transition-all hover:border-emerald-500/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isDispatch ? "Dispatched Panels" : "Scanned Panels"}
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : counts.scanned}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {completionPct}% {isDispatch ? "dispatched" : "done"}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            {/* Pending Panels */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4.5 shadow-xs transition-all hover:border-amber-500/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isDispatch ? "Pending Dispatch" : "Pending Panels"}
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-amber-600 dark:text-amber-400">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : counts.pending}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {isDispatch ? "awaiting dispatch" : "awaiting scan"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isDispatch
                  ? "Remaining to dispatch from factory"
                  : "Remaining to process at this machine"}
              </p>
            </div>

            {/* Station Specs */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4.5 shadow-xs transition-all hover:border-purple-500/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Workstation Info
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Cpu className="size-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-bold text-foreground font-mono">
                    {isDispatch ? "DISPATCH" : currentMachine?.machine_code || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Scan Type:</span>
                  <Badge variant="outline" className="text-[10px] font-semibold py-0">
                    {isDispatch ? "FACTORY OUT & SITE IN" : currentMachine?.scan_type || "QR SCAN"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* ── Table Card Container with 3 Tabs & Filter Bar ── */}
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
            {/* Header Control Toolbar */}
            <div className="flex flex-col gap-4 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              {/* ── The 3 Tabs: All | Scan | Pending (Black & White with Smooth Animation) ── */}
              <div className="relative inline-flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900 border border-border/50 shadow-xs">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold select-none cursor-pointer transition-colors duration-200 z-10",
                        isActive
                          ? "text-white dark:text-zinc-950 font-bold"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                      )}
                    >
                      {/* Animated Black/White Active Sliding Background */}
                      {isActive && (
                        <motion.div
                          layoutId="activeScanTabPill"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          className="absolute inset-0 rounded-lg bg-zinc-950 shadow-sm dark:bg-zinc-50 -z-10"
                        />
                      )}

                      <span>{tab.label}</span>

                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors",
                          isActive
                            ? "bg-white/20 text-white dark:bg-zinc-900/15 dark:text-zinc-900"
                            : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Controls: Category, Group, Search & Reset */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={(val) => {
                    setSelectedCategory(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs bg-background shadow-2xs border-border/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <FolderTree className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">
                        {selectedCategory === "all" ? "All Categories" : selectedCategory}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px]">
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Categories
                    </SelectItem>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs font-medium">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Group Filter */}
                <Select
                  value={selectedGroup}
                  onValueChange={(val) => {
                    setSelectedGroup(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs bg-background shadow-2xs border-border/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">
                        {selectedGroup === "all" ? "All Groups" : selectedGroup}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px]">
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Groups
                    </SelectItem>
                    {groupOptions.map((grp) => (
                      <SelectItem key={grp} value={grp} className="text-xs font-medium">
                        {grp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search Bar */}
                <div className="relative flex-1 sm:w-60 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search panels, code, box..."
                    className="h-9 w-full rounded-xl pl-9 pr-9 text-xs bg-background shadow-2xs border-border/80 focus-visible:ring-1"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 px-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 border-border/80 shadow-2xs shrink-0"
                    title="Reset all filters"
                  >
                    <RotateCcw className="size-3" />
                    <span className="hidden md:inline">Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {/* ── Data Table ── */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b hover:bg-transparent">
                    {isDispatch ? (
                      <>
                        <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          #
                        </TableHead>
                        <TableHead className="min-w-[200px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Panel / Item Details
                        </TableHead>
                        <TableHead className="min-w-[140px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Dimensions &amp; Specs
                        </TableHead>
                        <TableHead className="min-w-[120px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Category &amp; Group
                        </TableHead>
                        <TableHead className="w-16 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Qty
                        </TableHead>
                        <TableHead className="min-w-[120px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Packing / Box
                        </TableHead>
                        <TableHead className="min-w-[130px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Packed By
                        </TableHead>
                        <TableHead className="min-w-[140px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Factory Out By
                        </TableHead>
                        <TableHead className="min-w-[150px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Factory Out At
                        </TableHead>
                        <TableHead className="min-w-[140px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Site By
                        </TableHead>
                        <TableHead className="min-w-[150px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Site At
                        </TableHead>
                        <TableHead className="min-w-[120px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Status
                        </TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="w-12 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          #
                        </TableHead>
                        <TableHead className="min-w-[220px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Panel / Item Details
                        </TableHead>
                        <TableHead className="min-w-[150px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Dimensions &amp; Specs
                        </TableHead>
                        <TableHead className="min-w-[120px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Category &amp; Group
                        </TableHead>
                        <TableHead className="w-16 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Qty
                        </TableHead>
                        <TableHead className="min-w-[150px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Status at {currentMachineName}
                        </TableHead>
                        <TableHead className="min-w-[160px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Packing / Box
                        </TableHead>
                        <TableHead className="min-w-[130px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Packed By
                        </TableHead>
                        <TableHead className="min-w-[240px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Machine Production Flow
                        </TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    // Skeleton Rows
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="border-b">
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="mx-auto h-4 w-6" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-lg" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24 rounded-lg" />
                        </TableCell>
                        {isDispatch && (
                          <>
                            <TableCell>
                              <Skeleton className="h-6 w-24 rounded-full" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-24 rounded-lg" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-20 rounded-full" />
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    // Empty State
                    <TableRow>
                      <TableCell
                        colSpan={isDispatch ? 12 : 9}
                        className="py-16 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted border">
                            <Package className="size-6 text-muted-foreground/50" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">
                              No panels found
                            </p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                              {hasActiveFilters
                                ? "No panels match the selected filters or search criteria."
                                : activeTab === "scanned"
                                ? `No panels have been ${isDispatch ? "dispatched" : `scanned at ${currentMachineName}`} yet.`
                                : activeTab === "pending"
                                ? `All panels are completed ${isDispatch ? "for dispatch" : `at ${currentMachineName}`}!`
                                : `No items found.`}
                            </p>
                          </div>
                          {hasActiveFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
                              className="h-8 text-xs rounded-lg mt-1 gap-1.5"
                            >
                              <RotateCcw className="size-3" />
                              Reset Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Items List
                    items.map((item, index) => {
                      const rowNum = (page - 1) * pageSize + index + 1;
                      const isScannedAtThisMachine =
                        item.scan_status === "scanned";

                      // Find machine summary for current machine
                      const machineSummary = item.machines.find(
                        (m) => m.machine_id === machineIdParam,
                      );

                      const packedBy =
                        item.packed_by || item.boxes?.[0]?.packed_by;
                      const packedAt =
                        item.packed_at || item.boxes?.[0]?.packed_at;
                      const factoryOutBy =
                        item.factory_out_by || item.boxes?.[0]?.factory_out_by;
                      const factoryOutAt =
                        item.factory_out_at || item.boxes?.[0]?.factory_out_at;
                      const siteVerifyBy =
                        item.site_verify_by ||
                        item.site_in_by ||
                        item.boxes?.[0]?.site_verify_by ||
                        item.boxes?.[0]?.site_in_by;
                      const siteVerifyAt =
                        item.site_verify_at ||
                        item.site_in_at ||
                        item.boxes?.[0]?.site_verify_at ||
                        item.boxes?.[0]?.site_in_at;
                      const boxSiteInAt =
                        item.box_site_in_at || item.boxes?.[0]?.box_site_in_at;
                      const boxSiteInBy =
                        item.box_site_in_by || item.boxes?.[0]?.box_site_in_by;

                      return (
                        <TableRow
                          key={item.id}
                          className="border-b transition-colors hover:bg-muted/30"
                        >
                          {/* Row # */}
                          <TableCell className="text-center text-xs font-bold tabular-nums text-muted-foreground">
                            {rowNum}
                          </TableCell>

                          {/* Panel / Item Details */}
                          <TableCell className="py-3.5">
                            <div className="flex flex-col space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-foreground leading-snug">
                                  {item.item_name}
                                </span>
                                {item.total_qty && item.total_qty > 1 ? (
                                  <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted border border-border/60 shrink-0">
                                    Piece {item.unit_index || 1} of {item.total_qty}
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.unique_code && (
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded text-foreground border border-border/60">
                                    <QrCode className="size-3 text-muted-foreground" />
                                    {item.unique_code}
                                  </span>
                                )}
                                {item.unique_code_2 && (
                                  <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-1 rounded">
                                    {item.unique_code_2}
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Dimensions & Specs */}
                          <TableCell className="py-3.5 text-xs">
                            <div className="space-y-1">
                              {item.length || item.width || item.thickness ? (
                                <div className="flex items-center gap-1.5 font-medium tabular-nums text-foreground">
                                  <Ruler className="size-3 text-muted-foreground shrink-0" />
                                  <span>
                                    {item.length ?? "—"} × {item.width ?? "—"} ×{" "}
                                    {item.thickness ?? "—"} mm
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}

                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                {item.weight > 0 && (
                                  <span className="inline-flex items-center gap-1 tabular-nums font-semibold text-foreground/80">
                                    <Weight className="size-3" />
                                    {item.weight} kg
                                  </span>
                                )}
                                {item.material_details && (
                                  <span className="truncate max-w-[120px]" title={item.material_details}>
                                    {item.material_details}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Category & Group */}
                          <TableCell className="py-3.5 text-xs">
                            <div className="space-y-1">
                              {item.category_name && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-semibold py-0 truncate max-w-[120px]"
                                >
                                  {item.category_name}
                                </Badge>
                              )}
                              {item.group_name && (
                                <p className="text-[11px] font-medium text-muted-foreground truncate max-w-[120px]">
                                  {item.group_name}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell className="text-center font-bold text-xs tabular-nums text-foreground">
                            {item.qty}
                          </TableCell>

                          {isDispatch ? (
                            <>
                              {/* Packing / Box */}
                              <TableCell className="py-3.5">
                                {item.boxes && item.boxes.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {item.boxes.map((b) => (
                                      <Badge
                                        key={b.box_id}
                                        variant="outline"
                                        className="w-fit text-[11px] font-bold gap-1.5 py-0.5 border-zinc-300/80 bg-zinc-100/90 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100 shadow-2xs"
                                      >
                                        <Package className="size-3 text-primary shrink-0" />
                                        <span>{b.box_name}</span>
                                        <span className="rounded-full bg-zinc-200/90 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-extrabold text-foreground tabular-nums">
                                          {b.quantity} {b.quantity === 1 ? "pc" : "pcs"}
                                        </span>
                                      </Badge>
                                    ))}
                                  </div>
                                ) : item.box_name || item.package_box_name ? (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[11px] font-bold gap-1.5 py-0.5 border-zinc-300/80 bg-zinc-100/90 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100 shadow-2xs"
                                  >
                                    <Package className="size-3 text-primary shrink-0" />
                                    <span>{item.box_name || item.package_box_name}</span>
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                                    <Package className="size-3 opacity-30 shrink-0" />
                                    <span className="italic">Not Packed</span>
                                  </div>
                                )}
                              </TableCell>

                              {/* Packed By */}
                              <TableCell className="py-3.5 text-xs">
                                {packedBy ? (
                                  packedAt ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 font-medium text-foreground cursor-default">
                                          <User className="size-3 text-muted-foreground shrink-0" />
                                          <span className="truncate max-w-[130px] font-semibold">{packedBy}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs">
                                        <p className="font-semibold text-white">Packed by: {packedBy}</p>
                                        <p className="text-[11px] text-white/90">
                                          Packed at: {fmtDateTime(packedAt)}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                      <User className="size-3 text-muted-foreground shrink-0" />
                                      <span className="truncate max-w-[130px] font-semibold">{packedBy}</span>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-muted-foreground/50 text-xs">—</span>
                                )}
                              </TableCell>

                              {/* Factory Out By */}
                              <TableCell className="py-3.5 text-xs">
                                {factoryOutBy ? (
                                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <User className="size-3 text-muted-foreground shrink-0" />
                                    <span className="truncate max-w-[130px] font-semibold">{factoryOutBy}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/50 text-xs">—</span>
                                )}
                              </TableCell>

                              {/* Factory Out At */}
                              <TableCell className="py-3.5 text-xs">
                                {factoryOutAt ? (
                                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <Calendar className="size-3 text-muted-foreground shrink-0" />
                                    <span className="tabular-nums font-medium text-[11px]">
                                      {fmtDateTime(factoryOutAt)}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[10px] font-semibold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0.5 px-1.5"
                                  >
                                    Pending Out
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Site By */}
                              <TableCell className="py-3.5 text-xs">
                                {siteVerifyBy ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 font-medium text-foreground cursor-default">
                                        <User className="size-3 text-muted-foreground shrink-0" />
                                        <span className="truncate max-w-[130px] font-semibold">
                                          {siteVerifyBy}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p className="font-semibold text-white">Verified by: {siteVerifyBy}</p>
                                      {boxSiteInBy && boxSiteInBy !== siteVerifyBy && (
                                        <p className="text-[11px] text-white font-medium">
                                          Box received by: {boxSiteInBy}
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : boxSiteInBy ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                                        <User className="size-3 opacity-60 shrink-0" />
                                        <span className="truncate max-w-[120px] italic text-[11px]">
                                          {boxSiteInBy} (Box)
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p className="font-semibold text-white">Box received by: {boxSiteInBy}</p>
                                      <p className="text-[11px] text-amber-400 font-medium">
                                        Item pending site verification
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-muted-foreground/50 text-xs">—</span>
                                )}
                              </TableCell>

                              {/* Site At (Item Site Verify Time) */}
                              <TableCell className="py-3.5 text-xs">
                                {siteVerifyAt ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 font-medium text-foreground cursor-default">
                                        <Calendar className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="tabular-nums font-semibold text-[11px] text-emerald-700 dark:text-emerald-300">
                                          {fmtDateTime(siteVerifyAt)}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-1">
                                        <p className="font-bold text-emerald-400">
                                          Item Verified: {fmtDateTime(siteVerifyAt)}
                                        </p>
                                        {boxSiteInAt && (
                                          <p className="text-[11px] text-white font-medium">
                                            Box Arrived at Site: {fmtDateTime(boxSiteInAt)}
                                          </p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : boxSiteInAt ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="w-fit text-[10px] font-semibold border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0.5 px-1.5 cursor-default"
                                      >
                                        <Clock size={10} className="mr-1" />
                                        Pending Verify
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-1">
                                        <p className="font-semibold text-amber-400">
                                          Item pending verification
                                        </p>
                                        <p className="text-[11px] text-white font-medium">
                                          Box arrived at site: {fmtDateTime(boxSiteInAt)}
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[10px] font-semibold border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 py-0.5 px-1.5"
                                  >
                                    Not Received
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Status */}
                              <TableCell className="py-3.5">
                                {siteVerifyAt ? (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[10px] font-bold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 px-2"
                                  >
                                    <CheckCircle2 size={10} />
                                    VERIFIED
                                  </Badge>
                                ) : boxSiteInAt ? (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[10px] font-bold gap-1 border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 py-0.5 px-2"
                                  >
                                    <MapPin size={10} />
                                    AT SITE
                                  </Badge>
                                ) : factoryOutAt ? (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[10px] font-bold gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 py-0.5 px-2"
                                  >
                                    <Truck size={10} />
                                    IN TRANSIT
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="w-fit text-[10px] font-bold gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0.5 px-2"
                                  >
                                    <Clock size={10} />
                                    PENDING
                                  </Badge>
                                )}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              {/* Status at this machine */}
                          <TableCell className="py-3.5">
                            {isPackagingMachine && item.boxes && item.boxes.length > 1 ? (
                              <div className="flex flex-col gap-1.5 items-start">
                                {item.boxes.map((b) => (
                                  <Tooltip key={b.box_id}>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 cursor-default">
                                        <span className="text-[11px] font-bold text-foreground/80 whitespace-nowrap">
                                          {b.box_name}:
                                        </span>
                                        {b.is_scanned ? (
                                          <Badge
                                            variant="outline"
                                            className="w-fit text-[10px] font-bold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 px-1.5"
                                          >
                                            <CheckCircle2 size={10} />
                                            SCANNED
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="w-fit text-[10px] font-bold gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0.5 px-1.5"
                                          >
                                            <Clock size={10} />
                                            PENDING
                                          </Badge>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-0.5">
                                        <p className="font-bold">
                                          {b.box_name} ({b.quantity} {b.quantity === 1 ? "pc" : "pcs"})
                                        </p>
                                        <p
                                          className={cn(
                                            "text-[11px] font-semibold",
                                            b.is_scanned
                                              ? "text-emerald-500"
                                              : "text-amber-500",
                                          )}
                                        >
                                          Status: {b.is_scanned ? "Scanned" : "Pending scan"}
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : isPackagingMachine && item.boxes && item.boxes.length === 1 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "w-fit text-[10px] font-bold gap-1 py-0.5 cursor-default",
                                      item.boxes[0].is_scanned
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                    )}
                                  >
                                    {item.boxes[0].is_scanned ? (
                                      <>
                                        <CheckCircle2 size={11} />
                                        SCANNED
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={11} />
                                        PENDING
                                      </>
                                    )}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <div className="space-y-0.5">
                                    <p className="font-bold">{item.boxes[0].box_name}</p>
                                    <p
                                      className={cn(
                                        "text-[11px] font-semibold",
                                        item.boxes[0].is_scanned
                                          ? "text-emerald-500"
                                          : "text-amber-500",
                                      )}
                                    >
                                      Status: {item.boxes[0].is_scanned ? "Scanned" : "Pending scan"}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : isScannedAtThisMachine ? (
                              machineSummary?.scanned_at ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="w-fit text-[10px] font-bold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 cursor-default"
                                    >
                                      <CheckCircle2 size={11} />
                                      SCANNED
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-semibold">
                                      Scanned: {fmtDateTime(machineSummary.scanned_at)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-[10px] font-bold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5"
                                >
                                  <CheckCircle2 size={11} />
                                  SCANNED
                                </Badge>
                              )
                            ) : (
                              <Badge
                                variant="outline"
                                className="w-fit text-[10px] font-bold gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 py-0.5"
                              >
                                <Clock size={11} />
                                PENDING
                              </Badge>
                            )}
                          </TableCell>

                          {/* Packing / Box Details */}
                          <TableCell className="py-3.5">
                            {item.boxes && item.boxes.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.boxes.map((b) => (
                                  <Tooltip key={b.box_id}>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="w-fit text-[11px] font-bold gap-1.5 py-0.5 border-zinc-300/80 bg-zinc-100/90 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100 shadow-2xs hover:bg-zinc-200/90 dark:hover:bg-zinc-750 cursor-default transition-colors"
                                      >
                                        <Package className="size-3 text-primary shrink-0" />
                                        <span>{b.box_name}</span>
                                        <span className="rounded-full bg-zinc-200/90 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-extrabold text-foreground tabular-nums">
                                          {b.quantity} {b.quantity === 1 ? "pc" : "pcs"}
                                        </span>
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-0.5">
                                        <p className="font-bold">{b.box_name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                          Quantity packed: <strong>{b.quantity} pcs</strong>
                                        </p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : item.box_name || item.package_box_name ? (
                              <Badge
                                variant="outline"
                                className="w-fit text-[11px] font-bold gap-1.5 py-0.5 border-zinc-300/80 bg-zinc-100/90 text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100 shadow-2xs"
                              >
                                <Package className="size-3 text-primary shrink-0" />
                                <span>{item.box_name || item.package_box_name}</span>
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                                <Package className="size-3 opacity-30 shrink-0" />
                                <span className="italic">Not Packed</span>
                              </div>
                            )}
                          </TableCell>

                          {/* Packed By */}
                          <TableCell className="py-3.5 text-xs">
                            {packedBy ? (
                              packedAt ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 font-medium text-foreground cursor-default">
                                      <User className="size-3 text-muted-foreground shrink-0" />
                                      <span className="truncate max-w-[130px] font-semibold">{packedBy}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-semibold text-white">Packed by: {packedBy}</p>
                                    <p className="text-[11px] text-white/90">
                                      Packed at: {fmtDateTime(packedAt)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                  <User className="size-3 text-muted-foreground shrink-0" />
                                  <span className="truncate max-w-[130px] font-semibold">{packedBy}</span>
                                </div>
                              )
                            ) : (
                              <span className="text-muted-foreground/50 text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Machine Production Flow Timeline (WITHOUT HARSH BLACK BORDER) */}
                          <TableCell className="py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.machines.map((m) => {
                                const isCurrent = m.machine_id === machineIdParam;
                                const isDone = m.status === "scanned";

                                return (
                                  <Tooltip key={m.machine_id}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-default select-none",
                                          isDone
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : isCurrent
                                            ? "bg-primary/10 text-primary border border-primary/25 font-bold"
                                            : "bg-muted/40 text-muted-foreground border border-border/40",
                                        )}
                                      >
                                        <span className="font-mono text-[10px] font-bold opacity-75">
                                          {m.sequence_no}
                                        </span>
                                        <span className="truncate max-w-[85px]">
                                          {m.machine_name}
                                        </span>
                                        {isDone ? (
                                          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                        ) : isCurrent ? (
                                          <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                                        ) : (
                                          <span className="size-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-0.5">
                                        <p className="font-bold">
                                          #{m.sequence_no} {m.machine_name}
                                          {isCurrent && " (Current Station)"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                          Status:{" "}
                                          <strong
                                            className={
                                              isDone
                                                ? "text-emerald-500"
                                                : isCurrent
                                                ? "text-primary"
                                                : "text-amber-500"
                                            }
                                          >
                                            {isDone ? "Scanned" : "Pending"}
                                          </strong>
                                        </p>
                                        {m.scanned_at && !/pack/i.test(m.machine_name) && (
                                          <p className="text-[10px] text-muted-foreground">
                                            {fmtDateTime(m.scanned_at)}
                                          </p>
                                        )}
                                        {item.boxes && item.boxes.length > 0 && /pack/i.test(m.machine_name) ? (
                                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-0.5 border-t border-border/50">
                                            <Package size={10} /> Packed in:{" "}
                                            {item.boxes.map((b) => `${b.box_name} (${b.quantity} pcs)`).join(", ")}
                                          </p>
                                        ) : m.box_name ? (
                                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-0.5 border-t border-border/50">
                                            <Package size={10} /> Packed in: {m.box_name}
                                          </p>
                                        ) : item.box_name && /pack/i.test(m.machine_name) ? (
                                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-0.5 border-t border-border/50">
                                            <Package size={10} /> Packed in: {item.box_name}
                                          </p>
                                        ) : null}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Proper Pagination Control Bar ── */}
            {pagination && pagination.total > 0 && (
              <div className="flex w-full flex-col-reverse items-center justify-between gap-4 border-t bg-muted/10 p-3.5 sm:flex-row sm:gap-8">
                <div className="flex-1 whitespace-nowrap text-muted-foreground text-xs font-medium">
                  Showing{" "}
                  <strong className="text-foreground">
                    {(page - 1) * pageSize + 1}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-foreground">
                    {Math.min(page * pageSize, pagination.total)}
                  </strong>{" "}
                  of <strong className="text-foreground">{pagination.total}</strong>{" "}
                  panels
                </div>

                <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                  {/* Rows per page selector */}
                  <div className="flex items-center space-x-2">
                    <p className="whitespace-nowrap font-medium text-xs text-muted-foreground">
                      Rows per page
                    </p>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[4.5rem] text-xs rounded-lg bg-background">
                        <SelectValue placeholder={`${pageSize}`} />
                      </SelectTrigger>
                      <SelectContent side="top" className="rounded-lg">
                        {[10, 20, 30, 50].map((size) => (
                          <SelectItem key={size} value={`${size}`} className="text-xs">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page indicator */}
                  <div className="flex items-center justify-center font-medium text-xs text-foreground tabular-nums">
                    Page {page} of {pagination.totalPages || 1}
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <Button
                      aria-label="Go to first page"
                      variant="outline"
                      size="icon"
                      className="hidden size-8 lg:flex rounded-lg"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      aria-label="Go to previous page"
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-lg"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      aria-label="Go to next page"
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-lg"
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages || 1, p + 1))
                      }
                      disabled={page >= (pagination.totalPages || 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      aria-label="Go to last page"
                      variant="outline"
                      size="icon"
                      className="hidden size-8 lg:flex rounded-lg"
                      onClick={() => setPage(pagination.totalPages || 1)}
                      disabled={page >= (pagination.totalPages || 1)}
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
