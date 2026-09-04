"use client";

import { toastManager } from "@/components/ui/toast";
import {
  getBoxItems,
  getProjectDetail,
  getProjectCutListPaginated,
  ProjectDetailData,
  ProjectCutListItem,
  ProjectCutListResponse,
  ProjectCutListMachineStatus,
  ProjectCutListPackingStatus,
  ProjectCutListPackingMethod,
  ProjectCutListSortBy,
  ProjectCutListSortOrder,
  downloadBoxPdf,
  downloadProjectFullReport,
} from "@/api/track-trace/track-trace-cutlist.api";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  Box,
  CheckCircle2,
  Clock,
  Cpu,
  MapPin,
  Package,
  TruckIcon,
  User,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Download,
  Loader2,
  Printer,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Link2,
  Phone,
  Calendar,
  PackageCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatWeight = (value: unknown) => {
  const weight = Number(value || 0);

  if (!Number.isFinite(weight) || weight <= 0) {
    return "0.00 kg";
  }

  return `${weight.toFixed(2)} kg`;
};

// ─── Received Quantity Stats ──────────────────────────────────────────────────

type ReceivedQuantityStats = {
  total_received_qty: number;
  total_pending_receipt_qty: number;
  item_receipt_progress_pct: number;

  scanned_received_qty: number;
  scanned_pending_receipt_qty: number;
  scanned_receipt_progress_pct: number;

  manual_received_qty: number;
  manual_pending_receipt_qty: number;
  manual_receipt_progress_pct: number;

  site_in_qty: number;
  site_in_received_qty: number;
  site_in_pending_verification_qty: number;
  site_item_verification_pct: number;
  not_at_site_qty: number;

  fully_received_boxes: number;
  partially_received_boxes: number;
  not_received_boxes: number;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "slate",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "purple" | "slate";
}) {
  const indicatorColor = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    purple: "bg-primary",
    slate: "bg-muted-foreground/40",
  }[color];

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col justify-between gap-1.5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold capitalize text-foreground truncate">
          {label}
        </p>
        <span className={cn("h-2 w-2 rounded-full shrink-0", indicatorColor)} />
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Machine Progress Bar ─────────────────────────────────────────────────────

function MachineBar({ m }: { m: ProjectDetailData["machines"][0] }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-44 shrink-0">
        <p className="text-xs font-bold text-foreground truncate">
          {m.machine_name}
        </p>
        {m.machine_type && (
          <p className="text-[10px] text-muted-foreground capitalize font-medium">{m.machine_type}</p>
        )}
      </div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-600/70 rounded-full transition-all"
          style={{ width: `${m.pct}%` }}
        />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-12 text-right">
          {m.pct}%
        </span>
        <span className="text-xs text-muted-foreground font-medium w-24 text-right">
          {m.scanned}/{m.total} scanned
        </span>
      </div>
    </div>
  );
}

// ─── Box Card ─────────────────────────────────────────────────────────────────

type BoxViewMode = "grid" | "compact";

function getBoxItemCount(box: ProjectDetailData["boxes"][0]) {
  return Number((box as any).items_count || 0);
}

function getBoxWeight(box: ProjectDetailData["boxes"][0]) {
  return Number((box as any).total_weight || 0);
}

function getBoxStatus(box: ProjectDetailData["boxes"][0]) {
  return String((box as any).box_status || "").toLowerCase();
}

function getBoxSequenceNumber(box: ProjectDetailData["boxes"][0]) {
  const rawName = String((box as any).box_name || "");
  const directNumber = Number(rawName);

  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  const matchedNumber = rawName.match(/\d+/)?.[0];
  const parsedNumber = Number(matchedNumber);

  return Number.isFinite(parsedNumber) ? parsedNumber : Number.MAX_SAFE_INTEGER;
}

function BoxCard({
  box,
  onClick,
  onDownload,
  downloading,
  viewMode = "grid",
}: {
  box: ProjectDetailData["boxes"][0];
  onClick: () => void;
  onDownload: () => void;
  downloading?: boolean;
  viewMode?: BoxViewMode;
}) {
  const isPacked = getBoxStatus(box) === "packed";
  const itemCount = getBoxItemCount(box);
  const boxWeight = getBoxWeight(box);
  const hasItems = itemCount > 0;
  const factoryOut = !!box.factory_out_at;
  const siteIn = !!box.site_in_at;

  const visibleBoxInfoValues =
    box.box_info_values?.filter(
      (item) => item.field_value && String(item.field_value).trim(),
    ) || [];

  if (viewMode === "compact") {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer group grid w-full grid-cols-1 gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-accent/40 md:grid-cols-[minmax(130px,1fr)_130px_130px_170px_44px]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
            <Box size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-foreground">
                Box {box.box_name}
              </p>

              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[10px] font-semibold",
                  isPacked
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {box.box_status}
              </Badge>
            </div>

            {visibleBoxInfoValues.length > 0 ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {visibleBoxInfoValues
                  .slice(0, 3)
                  .map((item) => `${item.field_label}: ${item.field_value}`)
                  .join(" · ")}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                No extra box info
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <span className="text-xs font-semibold text-foreground">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {formatWeight(boxWeight)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs md:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              factoryOut
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                : "bg-muted text-muted-foreground",
            )}
          >
            <TruckIcon size={11} />
            Factory
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              siteIn
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                : "bg-muted text-muted-foreground",
            )}
          >
            <MapPin size={11} />
            Site
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-background transition-all",
              "hover:border-primary/40 hover:bg-muted text-foreground",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            title="Print box label"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Printer size={14} />
            )}
          </button>

          <ChevronRight
            size={16}
            className="text-muted-foreground transition-colors group-hover:text-foreground"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group w-full cursor-pointer rounded-2xl border bg-card p-4 transition-all hover:border-primary/40"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
            <Box size={18} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              Box {box.box_name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold",
                  isPacked
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {box.box_status}
              </Badge>

              <span className="text-xs font-semibold text-foreground">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>

              <span className="text-xs font-semibold text-foreground tabular-nums">
                {formatWeight(boxWeight)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={downloading}
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background transition-all",
            "hover:border-primary/40 hover:bg-muted text-foreground",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          title="Print box label"
        >
          {downloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Printer size={14} />
          )}
        </button>
      </div>

      {visibleBoxInfoValues.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {visibleBoxInfoValues.slice(0, 4).map((item) => (
            <div
              key={`${box.id}-${item.field_id}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-muted/40 px-2 py-1"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {item.field_label}
              </span>

              <span className="max-w-32 truncate text-[11px] font-semibold text-foreground">
                {item.field_value}
              </span>
            </div>
          ))}

          {visibleBoxInfoValues.length > 4 && (
            <span className="rounded-lg border bg-muted/40 px-2 py-1 text-[11px] font-bold text-muted-foreground">
              +{visibleBoxInfoValues.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <DispatchStep
          label="Factory Out"
          done={factoryOut}
          by={box.factory_out_by}
          at={box.factory_out_at}
          Icon={TruckIcon}
        />

        <div className="h-px w-6 shrink-0 bg-border" />

        <DispatchStep
          label="Site In"
          done={siteIn}
          by={box.site_in_by}
          at={box.site_in_at}
          Icon={MapPin}
        />

        <ChevronRight
          size={16}
          className="ml-auto text-muted-foreground transition-colors group-hover:text-indigo-500"
        />
      </div>
    </div>
  );
}

function DispatchStep({
  label,
  done,
  by,
  at,
  Icon,
}: {
  label: string;
  done: boolean;
  by: string | null;
  at: string | null;
  Icon: any;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn("rounded-full p-1", done ? "bg-emerald-100" : "bg-muted")}
      >
        <Icon
          size={11}
          className={done ? "text-emerald-600" : "text-muted-foreground"}
        />
      </div>
      <div>
        <p
          className={cn(
            "text-[10px] font-bold",
            done ? "text-emerald-700" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {done && at && (
          <p className="text-[9px] text-muted-foreground">{fmtDateTime(at)}</p>
        )}
        {done && by && (
          <p className="text-[9px] text-muted-foreground">by {by}</p>
        )}
      </div>
    </div>
  );
}

// ─── Boxes Section ───────────────────────────────────────────────────────────

type BoxFilter =
  | "all"
  | "packed"
  | "unpacked"
  | "with_items"
  | "empty"
  | "factory_out"
  | "site_in";

type BoxSort =
  | "sequence_asc"
  | "sequence_desc"
  | "items_desc"
  | "items_asc"
  | "weight_desc"
  | "weight_asc"
  | "packed_first"
  | "unpacked_first"
  | "with_items_first"
  | "empty_first";

function BoxesSection({
  boxes,
  boxesPagination,
  filterOptions: serverFilterOptions,
  downloadingBoxId,
  downloadingAll,
  onSelectBox,
  onPrintBox,
  onDownloadAll,
  onFilterChange,
}: {
  boxes: ProjectDetailData["boxes"];
  boxesPagination?: ProjectDetailData["boxes_pagination"];
  filterOptions?: ProjectDetailData["filterOptions"];
  downloadingBoxId: number | null;
  downloadingAll: boolean;
  onSelectBox: (box: ProjectDetailData["boxes"][0]) => void;
  onPrintBox: (box: ProjectDetailData["boxes"][0]) => void;
  onDownloadAll: () => void;
  onFilterChange?: (params: {
    search?: string;
    group?: string;
    category?: string;
    machine_id?: string;
    box_status?: string;
    page?: number;
    limit?: number;
  }) => void;
}) {
  const [search, setSearch] = useState("");
  const [productGroup, setProductGroup] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedMachineId, setSelectedMachineId] = useState("all");
  const [boxFilter, setBoxFilter] = useState<BoxFilter>("all");
  const [boxSort, setBoxSort] = useState<BoxSort>("sequence_asc");
  const [viewMode, setViewMode] = useState<BoxViewMode>("compact");
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!onFilterChange) return;
    const timer = setTimeout(() => {
      onFilterChange({
        search: search.trim() || undefined,
        group: productGroup !== "all" ? productGroup : undefined,
        category: category !== "all" ? category : undefined,
        machine_id: selectedMachineId !== "all" ? selectedMachineId : undefined,
        box_status: boxFilter !== "all" ? boxFilter : undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [
    search,
    productGroup,
    category,
    selectedMachineId,
    boxFilter,
    onFilterChange,
  ]);

  const stats = useMemo(() => {
    const packed = boxes.filter((box) => getBoxStatus(box) === "packed").length;
    const unpacked = boxes.filter(
      (box) => getBoxStatus(box) !== "packed",
    ).length;
    const withItems = boxes.filter((box) => getBoxItemCount(box) > 0).length;
    const empty = boxes.filter((box) => getBoxItemCount(box) === 0).length;
    const factoryOut = boxes.filter((box) =>
      Boolean(box.factory_out_at),
    ).length;
    const siteIn = boxes.filter((box) => Boolean(box.site_in_at)).length;
    const totalWeight = boxes.reduce((sum, box) => sum + getBoxWeight(box), 0);

    return {
      total: boxes.length,
      packed,
      unpacked,
      withItems,
      empty,
      factoryOut,
      siteIn,
      totalWeight,
    };
  }, [boxes]);

  const filterOptionsList: {
    label: string;
    value: BoxFilter;
    count: number;
  }[] = [
    { label: "All", value: "all", count: stats.total },
    { label: "Packed", value: "packed", count: stats.packed },
    { label: "Unpacked", value: "unpacked", count: stats.unpacked },
    { label: "With Items", value: "with_items", count: stats.withItems },
    { label: "Empty", value: "empty", count: stats.empty },
    { label: "Factory Out", value: "factory_out", count: stats.factoryOut },
    { label: "Site In", value: "site_in", count: stats.siteIn },
  ];

  const filteredBoxes = useMemo(() => {
    const sortedBoxes = [...boxes].sort((a, b) => {
      const aSequence = getBoxSequenceNumber(a);
      const bSequence = getBoxSequenceNumber(b);
      const aItems = getBoxItemCount(a);
      const bItems = getBoxItemCount(b);
      const aWeight = getBoxWeight(a);
      const bWeight = getBoxWeight(b);
      const aPacked = getBoxStatus(a) === "packed" ? 1 : 0;
      const bPacked = getBoxStatus(b) === "packed" ? 1 : 0;
      const aHasItems = aItems > 0 ? 1 : 0;
      const bHasItems = bItems > 0 ? 1 : 0;

      switch (boxSort) {
        case "sequence_desc":
          return bSequence - aSequence;
        case "items_desc":
          return bItems - aItems || aSequence - bSequence;
        case "items_asc":
          return aItems - bItems || aSequence - bSequence;
        case "weight_desc":
          return bWeight - aWeight || aSequence - bSequence;
        case "weight_asc":
          return aWeight - bWeight || aSequence - bSequence;
        case "packed_first":
          return bPacked - aPacked || aSequence - bSequence;
        case "unpacked_first":
          return aPacked - bPacked || aSequence - bSequence;
        case "with_items_first":
          return bHasItems - aHasItems || aSequence - bSequence;
        case "empty_first":
          return aHasItems - bHasItems || aSequence - bSequence;
        default:
          return aSequence - bSequence;
      }
    });

    return sortedBoxes;
  }, [boxes, boxSort]);

  const resetBoxFilters = () => {
    setSearch("");
    setProductGroup("all");
    setCategory("all");
    setSelectedMachineId("all");
    setBoxFilter("all");
    setBoxSort("sequence_asc");
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="border-b bg-muted/30 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div
            onClick={() => setCollapsed((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
              <Box size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  Boxes ({filteredBoxes.length}/{boxes.length})
                </h2>
                <Badge variant="outline" className="text-[11px] font-semibold">
                  {formatWeight(stats.totalWeight)}
                </Badge>
              </div>

              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                Search, filter, sort and check box weight quickly.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCollapsed((value) => !value)}
              className="h-8 text-xs gap-1.5 rounded-lg"
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              {collapsed ? "Expand" : "Collapse"}
            </Button>

            {!collapsed && (
              <div className="inline-flex rounded-lg border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors",
                    viewMode === "compact"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <List size={13} />
                  Compact
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors",
                    viewMode === "grid"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Grid3X3 size={13} />
                  Grid
                </button>
              </div>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={downloadingAll}
              onClick={onDownloadAll}
              className="h-8 text-xs gap-1.5 rounded-lg"
            >
              {downloadingAll ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              Download All
            </Button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Filter Controls Row: Search, Product/Group, Category, Machine */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* SEARCH */}
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none"
                  />

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search box no, status, weight..."
                    className="h-9 w-full pl-9 pr-9 text-sm rounded-lg"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* PRODUCT / GROUP */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Product / Group
                </label>

                <Select value={productGroup} onValueChange={setProductGroup}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {(serverFilterOptions?.groups ?? []).map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CATEGORY */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Category
                </label>

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(serverFilterOptions?.categories ?? []).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MACHINE */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Machine
                </label>

                <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Machines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Machines</SelectItem>
                    {(serverFilterOptions?.machines ?? []).map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Controls Row 2: Sort By, Reset */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="w-full sm:w-64 space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground block">
                  Sort By
                </label>

                <Select value={boxSort} onValueChange={(val) => setBoxSort(val as BoxSort)}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="Sort: Box No. 1 → Last" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequence_asc">Sort: Box No. 1 → Last</SelectItem>
                    <SelectItem value="sequence_desc">Sort: Box No. Last → 1</SelectItem>
                    <SelectItem value="packed_first">Packed boxes first</SelectItem>
                    <SelectItem value="unpacked_first">Unpacked boxes first</SelectItem>
                    <SelectItem value="with_items_first">Boxes with items first</SelectItem>
                    <SelectItem value="empty_first">Empty boxes first</SelectItem>
                    <SelectItem value="items_desc">Items high → low</SelectItem>
                    <SelectItem value="items_asc">Items low → high</SelectItem>
                    <SelectItem value="weight_desc">Weight high → low</SelectItem>
                    <SelectItem value="weight_asc">Weight low → high</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetBoxFilters}
                  className="h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                  Reset
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {filterOptionsList.map((filter) => {
                const active = boxFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setBoxFilter(filter.value)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      active
                        ? "border-foreground bg-foreground text-background shadow-xs"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <SlidersHorizontal size={12} />
                    {filter.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        active
                          ? "bg-background/20 text-background"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="p-4">
          {filteredBoxes.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-4 py-10 text-center">
              <Package className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />

              <p className="text-sm font-bold text-foreground">
                No boxes found
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Try changing search, filter or sort option.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "compact"
                  ? "space-y-2"
                  : "grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4",
              )}
            >
              {filteredBoxes.map((box) => (
                <BoxCard
                  key={box.id}
                  box={box}
                  viewMode={viewMode}
                  downloading={downloadingBoxId === box.id}
                  onClick={() => onSelectBox(box)}
                  onDownload={() => onPrintBox(box)}
                />
              ))}
            </div>
          )}

          {/* Boxes Pagination UI */}
          {boxesPagination && boxesPagination.total > 0 && (
            <div className="mt-4 flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto border-t bg-muted/10 p-3 sm:flex-row sm:gap-8 rounded-b-xl">
              <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {boxesPagination.from}
                </span>
                {" - "}
                <span className="font-semibold text-foreground">
                  {boxesPagination.to}
                </span>
                {" of "}
                <span className="font-semibold text-foreground">
                  {boxesPagination.total}
                </span>
                {" boxes"}
              </div>

              <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                  <p className="whitespace-nowrap text-sm font-medium">
                    Rows per page
                  </p>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[4.5rem]">
                      <SelectValue placeholder={`${pageSize}`} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center text-sm font-medium">
                  Page {boxesPagination.page} of {boxesPagination.total_pages}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    aria-label="Go to first page"
                    variant="outline"
                    size="icon"
                    className="hidden h-8 w-8 lg:flex"
                    onClick={() => setPage(1)}
                    disabled={boxesPagination.page <= 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Go to previous page"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!boxesPagination.has_previous}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Go to next page"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(boxesPagination.total_pages, p + 1),
                      )
                    }
                    disabled={!boxesPagination.has_next}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Go to last page"
                    variant="outline"
                    size="icon"
                    className="hidden h-8 w-8 lg:flex"
                    onClick={() => setPage(boxesPagination.total_pages)}
                    disabled={
                      boxesPagination.page >= boxesPagination.total_pages
                    }
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Box Items Dialog ─────────────────────────────────────────────────────────

function BoxItemsDialog({
  open,
  onClose,
  vendorId,
  projectId,
  boxId,
  boxName,
}: {
  open: boolean;
  onClose: () => void;
  vendorId: number;
  projectId: string;
  boxId: number;
  boxName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getBoxItems>
  > | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getBoxItems(vendorId, projectId, boxId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, boxId]);

  const { totalQty, totalWeight } = useMemo(() => {
    if (!data?.items) return { totalQty: 0, totalWeight: 0 };

    let qtySum = 0;
    let weightSum = 0;

    for (const item of data.items) {
      const qty = Number((item as any).qty || 1);
      qtySum += qty;

      const itemWeight = Number((item as any).weight || 0);
      weightSum += itemWeight;
    }

    return { totalQty: qtySum, totalWeight: weightSum };
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-6xl md:max-w-7xl lg:max-w-[90vw] xl:max-w-[1300px] w-full max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
              <Box size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Box {boxName}</span>
              {data && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold"
                >
                  {data.items.length}{" "}
                  {data.items.length === 1 ? "Item" : "Items"}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-0 bg-background">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !data ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-destructive">
                Failed to load box items.
              </p>
            </div>
          ) : data.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No items packed in this box yet.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto border-0 bg-background">
              <Table className="w-full">
                <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs">
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-bold uppercase text-foreground py-3.5 whitespace-nowrap px-4">
                      Item
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Code
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Size (L×W×T)
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground text-center whitespace-nowrap px-4">
                      Qty
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Weight
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Machine
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Scanned At
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Scanned By
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Site In
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap px-4">
                      Site By
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item, idx) => {
                    const qty = Number((item as any).qty || 1);
                    const itemWeight = Number((item as any).weight || 0);

                    return (
                      <TableRow
                        key={item.id}
                        className={
                          idx % 2 === 0
                            ? "bg-background hover:bg-muted/30"
                            : "bg-muted/15 hover:bg-muted/30"
                        }
                      >
                        <TableCell className="font-semibold text-sm whitespace-nowrap px-4">
                          {item.cut_list.item_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap px-4">
                          {item.cut_list.unique_code}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap px-4">
                          {item.cut_list.length} × {item.cut_list.width} ×{" "}
                          {item.cut_list.thickness}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-center whitespace-nowrap px-4">
                          {qty}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap px-4 tabular-nums">
                          {formatWeight(itemWeight)}
                        </TableCell>
                        <TableCell className="text-xs text-foreground whitespace-nowrap px-4">
                          {item.cut_list.category_name}
                        </TableCell>
                        <TableCell className="text-xs text-foreground whitespace-nowrap px-4">
                          {item.machine.machine_name}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap px-4">
                          {item.actual_in_at ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              {fmtDateTime(item.actual_in_at)}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 text-[11px]">
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap px-4">
                          {item.inOperator ? (
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <User size={11} className="text-muted-foreground" />
                              {item.inOperator.name}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap px-4">
                          {item.site_in_at ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              {fmtDateTime(item.site_in_at)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap px-4">
                          {item.siteInByUser ? (
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <User size={11} className="text-muted-foreground" />
                              {item.siteInByUser.name}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter className="bg-muted/40 text-foreground font-bold sticky bottom-0 z-10 border-t">
                  <TableRow className="hover:bg-muted/40 border-0">
                    <TableCell
                      colSpan={3}
                      className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                    >
                      Total Box Summary ({data.items.length}{" "}
                      {data.items.length === 1 ? "Item" : "Items"})
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-sm font-bold text-center text-foreground tabular-nums">
                      {totalQty}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-sm font-bold text-foreground tabular-nums">
                      {formatWeight(totalWeight)}
                    </TableCell>
                    <TableCell
                      colSpan={6}
                      className="py-3.5 px-4 text-xs text-muted-foreground text-right pr-6"
                    >
                      Total Weight:{" "}
                      <Badge variant="outline" className="font-semibold text-xs ml-1.5">
                        {formatWeight(totalWeight)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cut List Table - SERVER PAGINATION ─────────────────────────────────────

function CutListSection({
  vendorId,
  projectId,
  machineIds,
}: {
  vendorId: number;
  projectId: string;
  machineIds: {
    id: number;
    name: string;
    sequence_no?: number;
  }[];
}) {
  /*
  |--------------------------------------------------------------------------
  | Filter state
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [productGroup, setProductGroup] = useState("all");

  const [category, setCategory] = useState("all");

  const [selectedMachineId, setSelectedMachineId] = useState("all");

  const [machineStatus, setMachineStatus] =
    useState<ProjectCutListMachineStatus>("all");

  const [packingStatus, setPackingStatus] =
    useState<ProjectCutListPackingStatus>("all");

  const [packingMethod, setPackingMethod] =
    useState<ProjectCutListPackingMethod>("all");

  const [selectedBoxId, setSelectedBoxId] = useState("all");

  const [minWeight, setMinWeight] = useState("");

  const [maxWeight, setMaxWeight] = useState("");

  const [sortBy, setSortBy] = useState<ProjectCutListSortBy>("row_number");

  const [sortOrder, setSortOrder] = useState<ProjectCutListSortOrder>("asc");

  /*
  |--------------------------------------------------------------------------
  | Pagination state
  |--------------------------------------------------------------------------
  */

  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(25);

  /*
  |--------------------------------------------------------------------------
  | UI state
  |--------------------------------------------------------------------------
  */

  const [collapsed, setCollapsed] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const [cutListData, setCutListData] = useState<ProjectCutListResponse | null>(
    null,
  );

  /*
  |--------------------------------------------------------------------------
  | Debounce search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  /*
  |--------------------------------------------------------------------------
  | Reset page when a server-side filter changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    productGroup,
    category,
    selectedMachineId,
    machineStatus,
    packingStatus,
    packingMethod,
    selectedBoxId,
    minWeight,
    maxWeight,
    sortBy,
    sortOrder,
    pageSize,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Server request
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!vendorId || !projectId) {
      return;
    }

    let active = true;

    const fetchCutList = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await getProjectCutListPaginated(vendorId, projectId, {
          page,
          limit: pageSize,

          search: debouncedSearch,

          group: productGroup,

          category,

          machine_id:
            selectedMachineId === "all" ? null : Number(selectedMachineId),

          machine_status: machineStatus,

          packing_status: packingStatus,

          packing_method: packingMethod,

          box_id: selectedBoxId === "all" ? null : Number(selectedBoxId),

          min_weight: minWeight.trim() === "" ? null : Number(minWeight),

          max_weight: maxWeight.trim() === "" ? null : Number(maxWeight),

          sort_by: sortBy,

          sort_order: sortOrder,
        });

        if (!active) {
          return;
        }

        setCutListData(response);

        /*
          |--------------------------------------------------------------------------
          | Service protects out-of-range pages.
          |--------------------------------------------------------------------------
          */

        if (response.pagination.page !== page) {
          setPage(response.pagination.page);
        }
      } catch (requestError) {
        console.error("Failed to fetch project cut list:", requestError);

        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCutList();

    return () => {
      active = false;
    };
  }, [
    vendorId,
    projectId,
    page,
    pageSize,
    debouncedSearch,
    productGroup,
    category,
    selectedMachineId,
    machineStatus,
    packingStatus,
    packingMethod,
    selectedBoxId,
    minWeight,
    maxWeight,
    sortBy,
    sortOrder,
    reloadKey,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Machines displayed as columns
  |--------------------------------------------------------------------------
  */

  const sortedMachineIds = useMemo(() => {
    const fromProject = [...machineIds];

    /*
      |--------------------------------------------------------------------------
      | The paginated endpoint can include machine-18 even when it has no DB
      | mapping yet for manual items. Merge it into the table columns.
      |--------------------------------------------------------------------------
      */

    const optionMachines = cutListData?.filter_options.machines ?? [];

    for (const machine of optionMachines) {
      if (
        !fromProject.some(
          (existing) => Number(existing.id) === Number(machine.id),
        )
      ) {
        fromProject.push({
          id: machine.id,

          name: machine.name,

          sequence_no: machine.sequence_no,
        });
      }
    }

    return fromProject.sort(
      (a, b) =>
        Number(a.sequence_no || 0) - Number(b.sequence_no || 0) ||
        Number(a.id) - Number(b.id),
    );
  }, [machineIds, cutListData?.filter_options.machines]);

  const items = cutListData?.items ?? [];

  const pagination = cutListData?.pagination;

  const summary = cutListData?.summary;

  const filterOptions = cutListData?.filter_options;

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");

    setProductGroup("all");

    setCategory("all");

    setSelectedMachineId("all");

    setMachineStatus("all");

    setPackingStatus("all");

    setPackingMethod("all");

    setSelectedBoxId("all");

    setMinWeight("");
    setMaxWeight("");

    setSortBy("row_number");

    setSortOrder("asc");

    setPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Compact page numbers
  |--------------------------------------------------------------------------
  */

  const pageNumbers = useMemo(() => {
    const totalPages = pagination?.total_pages ?? 0;

    const currentPage = pagination?.page ?? page;

    if (totalPages <= 0) {
      return [];
    }

    const values = new Set<number>();

    values.add(1);
    values.add(totalPages);

    for (let current = currentPage - 2; current <= currentPage + 2; current++) {
      if (current >= 1 && current <= totalPages) {
        values.add(current);
      }
    }

    return Array.from(values).sort((a, b) => a - b);
  }, [pagination?.page, pagination?.total_pages, page]);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            onClick={() => setCollapsed((value) => !value)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
              <Layers size={18} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-foreground">
                  Cut List ({summary?.filtered_qty ?? 0}/
                  {summary?.total_project_qty ?? 0} items)
                </h2>

                <Badge variant="outline" className="text-[11px] font-semibold">
                  {formatWeight(summary?.filtered_weight ?? 0)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Itemized cut list details and machine status tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCollapsed((value) => !value)}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              {collapsed ? "Expand" : "Collapse"}
            </Button>

            {!collapsed && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={resetFilters}
                className="h-8 gap-1.5 text-xs rounded-lg"
              >
                <X size={13} />
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Main filters */}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {/* Search */}
              <div className="space-y-1 xl:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none"
                  />

                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search item, code, description, category..."
                    className="h-9 w-full pl-9 pr-9 text-sm rounded-lg"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Group */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Product / Group
                </label>

                <Select value={productGroup} onValueChange={setProductGroup}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {(filterOptions?.groups ?? []).map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Category
                </label>

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(filterOptions?.categories ?? []).map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Machine */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Machine
                </label>

                <Select
                  value={selectedMachineId}
                  onValueChange={(val) => {
                    setSelectedMachineId(val);
                    if (val === "all") {
                      setMachineStatus("all");
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Machines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Machines</SelectItem>
                    {(
                      filterOptions?.machines ??
                      sortedMachineIds.map((machine) => ({
                        id: machine.id,
                        name: machine.name,
                        sequence_no: machine.sequence_no ?? 0,
                      }))
                    ).map((machine) => (
                      <SelectItem key={machine.id} value={String(machine.id)}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Machine Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Machine Status
                </label>

                <Select
                  value={machineStatus}
                  onValueChange={(val) =>
                    setMachineStatus(val as ProjectCutListMachineStatus)
                  }
                  disabled={selectedMachineId === "all"}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background disabled:cursor-not-allowed disabled:opacity-60">
                    <SelectValue placeholder="Both" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Both</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Packing Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Packing Status
                </label>

                <Select
                  value={packingStatus}
                  onValueChange={(val) =>
                    setPackingStatus(val as ProjectCutListPackingStatus)
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Packing Method */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Packing Method
                </label>

                <Select
                  value={packingMethod}
                  onValueChange={(val) =>
                    setPackingMethod(val as ProjectCutListPackingMethod)
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="scanned">Scanned</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Box */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Packing Box
                </label>

                <Select
                  value={selectedBoxId}
                  onValueChange={setSelectedBoxId}
                >
                  <SelectTrigger className="h-9 w-full rounded-lg text-sm bg-background">
                    <SelectValue placeholder="All Boxes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Boxes</SelectItem>
                    {(filterOptions?.boxes ?? []).map((box) => (
                      <SelectItem key={box.id} value={String(box.id)}>
                        Box {box.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Sort By
                </label>

                <div className="flex gap-2">
                  <Select
                    value={sortBy}
                    onValueChange={(val) =>
                      setSortBy(val as ProjectCutListSortBy)
                    }
                  >
                    <SelectTrigger className="h-9 min-w-0 flex-1 rounded-lg text-sm bg-background">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="row_number">Default</SelectItem>
                      <SelectItem value="item_name">Item Name</SelectItem>
                      <SelectItem value="unique_code">Code</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortOrder}
                    onValueChange={(val) =>
                      setSortOrder(val as ProjectCutListSortOrder)
                    }
                  >
                    <SelectTrigger className="h-9 w-24 rounded-lg text-sm bg-background">
                      <SelectValue placeholder="Asc" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Asc</SelectItem>
                      <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Summary row */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[11px] font-medium">
                Matching: {summary?.filtered_qty ?? 0}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                Packed: {summary?.packed_qty ?? 0}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10">
                Pending: {summary?.pending_qty ?? 0}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium">
                Weight: {formatWeight(summary?.filtered_weight ?? 0)}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10">
                Received: {summary?.received_qty ?? 0}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10">
                Pending Receipt: {summary?.pending_receipt_qty ?? 0}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10">
                Pending Verif.: {summary?.pending_verification_qty ?? 0}
              </Badge>

              <Badge variant="outline" className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                Site Verif.: {summary?.site_verification_pct ?? 0}%
              </Badge>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Loading */}
          {loading && (
            <div className="space-y-2 p-4">
              {Array.from({
                length: Math.min(pageSize, 8),
              }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-8 text-center">
              <p className="text-sm font-bold text-destructive">
                Failed to load Cut List.
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-8 text-xs font-black uppercase">
                      #
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Item
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Product
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Code
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Size (mm)
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Weight
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Packing
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Packing Box
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Qty
                    </TableHead>

                    <TableHead className="min-w-44 text-xs font-black uppercase">
                      Received
                    </TableHead>

                    <TableHead className="text-xs font-black uppercase">
                      Category
                    </TableHead>

                    {sortedMachineIds.map((machine) => (
                      <TableHead
                        key={machine.id}
                        className="min-w-36 text-center text-xs font-black uppercase"
                      >
                        {machine.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11 + sortedMachineIds.length}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item: ProjectCutListItem, index) => (
                      <TableRow
                        key={`${item.cut_list_id}-${item.unit_index}-${item.row_number}`}
                        className={cn(
                          "hover:bg-primary/5",

                          index % 2 === 0 ? "bg-background" : "bg-muted/20",
                        )}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.row_number}
                        </TableCell>

                        <TableCell className="text-sm font-semibold">
                          {item.item_name}
                        </TableCell>

                        <TableCell className="text-sm font-semibold">
                          {item.group || "Ungrouped"}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.unique_code || "—"}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {item.length ?? "—"}×{item.width ?? "—"}×
                          {item.thickness ?? "—"}
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-foreground tabular-nums">
                          {formatWeight(item.weight)}
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold"
                          >
                            {item.packing_method}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs">
                          {item.package_box_name ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold"
                            >
                              Box {item.package_box_name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs font-bold">
                          {item.qty}
                        </TableCell>

                        {/* Received Qty / Site Verification */}
                        <TableCell className="text-xs">
                          <div className="flex min-w-40 flex-col gap-1">
                            {/* Receipt status */}
                            <Badge
                              variant="outline"
                              className={cn(
                                "w-fit text-[10px] font-semibold gap-1",
                                item.receipt_status === "Received"
                                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                                  : item.receipt_status === "Pending Verification"
                                    ? "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/10"
                                    : item.receipt_status === "Not At Site"
                                      ? "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/10"
                                      : "text-muted-foreground",
                              )}
                            >
                              {item.receipt_status === "Received" ? (
                                <CheckCircle2 size={11} />
                              ) : item.receipt_status === "Pending Verification" ? (
                                <Clock size={11} />
                              ) : item.receipt_status === "Not At Site" ? (
                                <MapPin size={11} />
                              ) : (
                                <Package size={11} />
                              )}
                              {item.receipt_status}
                            </Badge>

                            {/* This Cut List row represents one physical unit */}
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              Received Qty{" "}
                              <span
                                className={cn(
                                  "font-bold",
                                  Number(item.received_qty || 0) > 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground",
                                )}
                              >
                                {Number(item.received_qty || 0)}
                              </span>
                              /1
                            </span>

                            {/* QR / Manual Verification */}
                            <span className="text-[9px] font-semibold text-muted-foreground">
                              {item.receipt_method}
                            </span>

                            {/* Manual mapping can contain qty > 1 */}
                            {item.packing_method === "Manual" &&
                              Number(item.mapping_packed_qty || 0) > 1 && (
                                <span className="text-[9px] font-semibold text-muted-foreground">
                                  Mapping{" "}
                                  {Number(item.mapping_received_qty || 0)}/
                                  {Number(item.mapping_packed_qty || 0)}{" "}
                                  received
                                </span>
                              )}

                            {/* Received operator */}
                            {item.received_by && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                                <User size={9} />
                                {item.received_by}
                              </span>
                            )}

                            {/* Received time */}
                            {item.received_at && (
                              <span className="text-[9px] text-muted-foreground">
                                {fmtDateTime(item.received_at)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          {item.category || "—"}
                        </TableCell>

                        {sortedMachineIds.map((machine) => {
                          const mapping = item.machines.find(
                            (machineMapping) =>
                              Number(machineMapping.machine_id) ===
                              Number(machine.id),
                          );

                          if (!mapping) {
                            return (
                              <TableCell
                                key={machine.id}
                                className="text-center text-xs text-muted-foreground"
                              >
                                —
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell key={machine.id} className="text-center">
                              {mapping.scanned ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                    <CheckCircle2 size={11} />
                                    Done
                                  </span>

                                  {mapping.scanned_by && (
                                    <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                      <User size={8} />
                                      {mapping.scanned_by}
                                    </span>
                                  )}

                                  {mapping.scanned_at && (
                                    <span className="text-[9px] text-muted-foreground">
                                      {fmtDateTime(mapping.scanned_at)}
                                    </span>
                                  )}

                                  {Number(mapping.weight || 0) > 0 && (
                                    <span className="text-[9px] font-black text-purple-700">
                                      {formatWeight(mapping.weight)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                                  <Clock size={11} />
                                  Pending
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination && pagination.total > 0 && (
            <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto border-t bg-muted/10 p-3 sm:flex-row sm:gap-8 rounded-b-xl">
              <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {pagination.from}
                </span>
                {" - "}
                <span className="font-semibold text-foreground">
                  {pagination.to}
                </span>
                {" of "}
                <span className="font-semibold text-foreground">
                  {pagination.total}
                </span>
                {" matching items"}
              </div>

              <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                  <p className="whitespace-nowrap text-sm font-medium">
                    Rows per page
                  </p>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[4.5rem]">
                      <SelectValue placeholder={`${pageSize}`} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center text-sm font-medium">
                  Page {pagination.page} of {pagination.total_pages}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    aria-label="Go to first page"
                    variant="outline"
                    size="icon"
                    className="hidden h-8 w-8 lg:flex"
                    onClick={() => setPage(1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Go to previous page"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.has_previous}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Go to next page"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(pagination.total_pages, p + 1),
                      )
                    }
                    disabled={!pagination.has_next}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label="Go to last page"
                    variant="outline"
                    size="icon"
                    className="hidden h-8 w-8 lg:flex"
                    onClick={() => setPage(pagination.total_pages)}
                    disabled={pagination.page >= pagination.total_pages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { uniqueProjectId } = useParams<{ uniqueProjectId: string }>();

  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedBox, setSelectedBox] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [downloadingBoxId, setDownloadingBoxId] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    if (!vendorId || !uniqueProjectId) return;
    setLoading(true);
    getProjectDetail(Number(vendorId), String(uniqueProjectId))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [vendorId, uniqueProjectId]);

  const handleBoxesFilterChange = useCallback(
    (params: {
      search?: string;
      group?: string;
      category?: string;
      machine_id?: string;
      box_status?: string;
    }) => {
      if (!vendorId || !uniqueProjectId) return;
      getProjectDetail(Number(vendorId), String(uniqueProjectId), params)
        .then(setData)
        .catch(console.error);
    },
    [vendorId, uniqueProjectId],
  );

  const receivedStats = data
    ? (data.stats as ProjectDetailData["stats"] & ReceivedQuantityStats)
    : null;

  const machineIds = data
    ? data.machines
        .map((m) => ({
          id: m.machine_id,
          name: m.machine_name,
          sequence_no: (m as any).sequence_no || 0,
        }))
        .sort((a, b) => Number(a.sequence_no || 0) - Number(b.sequence_no || 0))
    : [];

  const handleDownloadBoxPdf = async (box: ProjectDetailData["boxes"][0]) => {
    if (!vendorId || !uniqueProjectId) return;

    let printWindow: Window | null = null;

    try {
      setDownloadingBoxId(box.id);

      // Open immediately on user click to avoid popup blocker
      printWindow = window.open("", "_blank", "width=420,height=700");

      if (!printWindow) {
        throw new Error("Please allow popup to print box label");
      }

      printWindow.document.open();
      printWindow.document.write(`
      <html>
        <head>
          <title>Preparing Print...</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          Preparing label for print...
        </body>
      </html>
    `);
      printWindow.document.close();

      const response = await downloadBoxPdf(
        box.id,
        String(uniqueProjectId),
        Number(vendorId),
      );

      if (!response?.status && !response?.success) {
        throw new Error(response?.message || "Failed to generate print");
      }

      const printHtml = response?.data?.print_html || response?.print_html;

      if (!printHtml) {
        throw new Error("Print HTML not found in response");
      }

      printWindow.document.open();
      printWindow.document.write(printHtml);
      printWindow.document.close();

      toastManager.add({
        title: "Box label print opened successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error("Print box error:", error);

      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }

      alert(error?.message || "Failed to print box label");
    } finally {
      setDownloadingBoxId(null);
    }
  };

  const handleDownloadAllBoxes = async () => {
    if (!vendorId || !uniqueProjectId) return;

    try {
      setDownloadingAll(true);

      const response = await downloadProjectFullReport(
        String(uniqueProjectId),
        Number(vendorId),
      );

      if (!response?.status && !response?.success && response?.status !== 1) {
        throw new Error(response?.message || "Failed to generate full report");
      }

      const pdfUrl =
        response?.data?.download_url ||
        response?.data?.pdf_url ||
        response?.download_url ||
        response?.pdf_url;

      if (!pdfUrl) {
        throw new Error("Report URL not found in response");
      }

      const link = document.createElement("a");
      link.href = pdfUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${data?.project?.project_name || "project"}-full-report.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastManager.add({
        title: "Full report downloaded successfully",
        type: "success",
      });
    } catch (error: any) {
      console.error("Download all boxes error:", error);
      toastManager.add({
        title: error?.message || "Failed to download full report",
        type: "error",
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
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
                <BreadcrumbPage>
                  {data?.project.project_name ?? "Project Detail"}
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

      <div className="flex flex-col gap-6 p-6">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load project detail. Please refresh.
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── Integrated Project Header & Packing Overview Card ── */}
            <div className="rounded-2xl border bg-card p-5 space-y-5">
              {/* Top Row: Project Icon, Name & Lead on Left, Status Badges on Right */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b -mx-5 px-5">
                {/* Left Column: Icon + Project Name + Connected Lead */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background font-bold">
                    <FolderKanban size={20} />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <h1 className="text-base font-bold tracking-tight text-foreground truncate">
                      {data.project.project_name}
                    </h1>

                    {data.project.lead ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <User
                          size={13}
                          className="text-muted-foreground shrink-0"
                        />
                        <span>{data.project.lead.lead_name}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No lead connected
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Status Badges & Due Date */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                  {data.project.details?.estimated_completion_date && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
                      <Calendar
                        size={12}
                        className="text-muted-foreground shrink-0"
                      />
                      Due{" "}
                      <strong className="text-foreground font-semibold">
                        {fmtDate(
                          data.project.details.estimated_completion_date,
                        )}
                      </strong>
                    </span>
                  )}

                  <Badge
                    variant="outline"
                    className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                  >
                    {data.project.project_status}
                  </Badge>

                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-7 px-3 text-xs font-semibold rounded-lg border inline-flex items-center gap-1.5",
                      data.project.track_trace_status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-primary/10 text-primary border-primary/20",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        data.project.track_trace_status === "Completed"
                          ? "bg-emerald-500"
                          : "bg-primary",
                      )}
                    />
                    T&T: {data.project.track_trace_status}
                  </Badge>
                </div>
              </div>

              {/* Bottom Row: Metric Stat Cards */}
              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {/* Product Types */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Product Types
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-blue-600 dark:text-blue-400">
                        <Layers size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.product_types}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      Unique cut-list products
                    </p>
                  </div>

                  {/* Total Qty */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Total Qty
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-indigo-600 dark:text-indigo-400">
                        <Package size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.total_qty}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      Physical quantity
                    </p>
                  </div>

                  {/* Packed Qty */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Packed Qty
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.total_packed_qty}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      {data.stats.packing_progress_pct}% completed
                    </p>
                  </div>

                  {/* Pending Qty */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Pending Qty
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                        <Clock size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.total_pending_qty}
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
                      {data.stats.pending_at_packaging} pending at packing
                    </p>
                  </div>

                  {/* Packing Progress */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Packing Progress
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-primary">
                        <TrendingUp size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.packing_progress_pct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {data.stats.total_packed_qty}/{data.stats.total_qty} qty
                      packed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Packing method + product status ── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
              {/* Left Side: Packing Method */}
              <div className="xl:col-span-4 rounded-2xl border bg-card p-5 space-y-4 flex flex-col justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Packing Method
                    </h2>
                    <p className="text-xs text-muted-foreground truncate">
                      Split between scanning and manual selection.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Scanned Packed */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Scanned Packed
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={11} />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {data.stats.scanned_packed_qty}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {data.stats.scanned_packing_pct}%
                      </span>
                    </div>
                  </div>

                  {/* Manual Packed */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Manual Packed
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-indigo-600 dark:text-indigo-400">
                        <UserCheck size={11} />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-xl font-bold text-foreground tabular-nums">
                        {data.stats.manual_packed_qty}
                      </p>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {data.stats.manual_packing_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Product Packing Status (All 5 in 1 Row) */}
              <div className="xl:col-span-8 rounded-2xl border bg-card p-5 space-y-4 flex flex-col justify-between h-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
                    <PackageCheck size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Product Packing Status
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Unique products grouped by their current packing
                      completion.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* Fully Packed */}
                  <div className="rounded-xl border bg-card px-3 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Fully Packed
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={11} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.fully_packed_products}
                    </p>
                  </div>

                  {/* Partial */}
                  <div className="rounded-xl border bg-card px-3 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Partial
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                        <Clock size={11} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.partially_packed_products}
                    </p>
                  </div>

                  {/* Not Started */}
                  <div className="rounded-xl border bg-card px-3 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Not Started
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-muted-foreground">
                        <Layers size={11} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.not_started_products}
                    </p>
                  </div>

                  {/* Machine Completion */}
                  <div className="rounded-xl border bg-card px-3 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Machine Comp.
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-blue-600 dark:text-blue-400">
                        <TrendingUp size={11} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.machine_completion_pct}%
                    </p>
                  </div>

                  {/* Pending at Packaging */}
                  <div className="rounded-xl border bg-card px-3 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Pending Pkg.
                      </p>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                        <Box size={11} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.pending_at_packaging}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Box / weight statistics ── */}
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
                  <Box size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Box & Weight Summary
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Current box usage and packed material weight.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {/* Total Boxes */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Total Boxes
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-muted-foreground">
                      <Box size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.total_boxes}
                  </p>
                </div>

                {/* Boxes With Items */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Boxes With Items
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.boxes_with_items}
                  </p>
                </div>

                {/* Empty Boxes */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Empty Boxes
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                      <Clock size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.empty_boxes}
                  </p>
                </div>

                {/* Packed Weight */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Packed Weight
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-primary">
                      <Package size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {formatWeight(data.stats.total_weight)}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">
                    {formatWeight(data.stats.average_box_weight)} avg / used box
                  </p>
                </div>

                {/* Avg Qty / Box */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Avg Qty / Box
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-blue-600 dark:text-blue-400">
                      <Layers size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.average_qty_per_box}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">
                    Boxes containing items
                  </p>
                </div>
              </div>
            </div>

            {/* ── Boxes ── */}
            {data && (
              <BoxesSection
                boxes={data.boxes}
                boxesPagination={data.boxes_pagination}
                filterOptions={data.filterOptions}
                downloadingBoxId={downloadingBoxId}
                downloadingAll={downloadingAll}
                onSelectBox={(box) =>
                  setSelectedBox({
                    id: box.id,
                    name: box.box_name,
                  })
                }
                onPrintBox={handleDownloadBoxPdf}
                onDownloadAll={handleDownloadAllBoxes}
                onFilterChange={handleBoxesFilterChange}
              />
            )}

            {/* ── Dispatch / site progress ── */}
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
                    <TruckIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Dispatch & Site Progress
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Box movement from packing to factory dispatch and site
                      receipt.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[11px] font-medium">
                    Packed {data.stats.packed_boxes}/{data.stats.total_boxes}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    Factory Out {data.stats.factory_out_boxes}/
                    {data.stats.total_boxes}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-medium">
                    Site {data.stats.site_received_boxes}/
                    {data.stats.total_boxes}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {/* Packed Boxes */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Packed Boxes
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.packed_boxes}
                  </p>
                </div>

                {/* Unpacked Boxes */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Unpacked Boxes
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                      <Clock size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.unpacked_boxes}
                  </p>
                </div>

                {/* Factory Out */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Factory Out
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-indigo-600 dark:text-indigo-400">
                      <TruckIcon size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.factory_out_boxes}
                  </p>
                </div>

                {/* Site Received */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Site Received
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-blue-600 dark:text-blue-400">
                      <MapPin size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.site_received_boxes}
                  </p>
                </div>

                {/* Dispatch Progress */}
                <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold capitalize text-foreground truncate">
                      Dispatch Progress
                    </p>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-primary">
                      <TrendingUp size={12} />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.stats.dispatch_progress_pct}%
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">
                    Site receipt {data.stats.site_receipt_progress_pct}%
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                      <TruckIcon size={12} /> Factory Out
                    </span>
                    <span className="font-bold text-foreground">
                      {data.stats.dispatch_progress_pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, data.stats.dispatch_progress_pct)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                      <MapPin size={12} /> Site Received
                    </span>
                    <span className="font-bold text-foreground">
                      {data.stats.site_receipt_progress_pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(100, data.stats.site_receipt_progress_pct)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Site item receipt / verification ── */}
            {receivedStats && (
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">
                        Site Item Receipt & Verification
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Physical quantity received and verified at project site.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-semibold",
                        receivedStats.item_receipt_progress_pct >= 100
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-primary/30 bg-primary/10 text-primary",
                      )}
                    >
                      {receivedStats.item_receipt_progress_pct}% received
                    </Badge>

                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium"
                    >
                      At Site {receivedStats.site_in_qty}
                    </Badge>
                  </div>
                </div>

                {/* Top 6 Stat Cards in 1 Row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {/* Packed Qty */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Packed Qty
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-muted-foreground">
                        <Package size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {data.stats.total_packed_qty}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      Total quantity inside boxes
                    </p>
                  </div>

                  {/* At Site Qty */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        At Site Qty
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-blue-600 dark:text-blue-400">
                        <MapPin size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.site_in_qty}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {receivedStats.not_at_site_qty} qty not at site
                    </p>
                  </div>

                  {/* Received Qty */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Received Qty
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.total_received_qty}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                      {receivedStats.item_receipt_progress_pct}% of packed qty
                    </p>
                  </div>

                  {/* Pending Receipt */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Pending Receipt
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                        <Clock size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.total_pending_receipt_qty}
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate">
                      Packed but not received
                    </p>
                  </div>

                  {/* Pending Verification */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Pending Verif.
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                        <Clock size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.site_in_pending_verification_qty}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      At site but not verified
                    </p>
                  </div>

                  {/* Site Verification */}
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Site Verif.
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-primary">
                        <TrendingUp size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.site_item_verification_pct}%
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {receivedStats.site_in_received_qty}/{receivedStats.site_in_qty} site qty
                    </p>
                  </div>
                </div>

                {/* Middle Grid: Scanned vs Manual Site Receipt Breakdown */}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {/* Scanned receipt */}
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Scanned Item Receipt
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Confirmed through item QR site-in.
                        </p>
                      </div>

                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {receivedStats.scanned_receipt_progress_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Received
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
                          {receivedStats.scanned_received_qty}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Pending
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
                          {receivedStats.scanned_pending_receipt_qty}
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-600/70 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              receivedStats.scanned_receipt_progress_pct,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Manual receipt */}
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Manual Item Verification
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Actual received quantity from received_qty.
                        </p>
                      </div>

                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {receivedStats.manual_receipt_progress_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Received
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
                          {receivedStats.manual_received_qty}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Pending
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
                          {receivedStats.manual_pending_receipt_qty}
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-600/70 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              receivedStats.manual_receipt_progress_pct,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Box Receipt Status */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Fully Received Boxes
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.fully_received_boxes}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Partial Receipt Boxes
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-amber-600 dark:text-amber-400">
                        <Clock size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.partially_received_boxes}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold capitalize text-foreground truncate">
                        Not Received Boxes
                      </p>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-muted-foreground">
                        <Layers size={12} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground tabular-nums">
                      {receivedStats.not_received_boxes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Machine progress ── */}
            {data.machines.length > 0 && (
              <div className="rounded-2xl border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground border border-border/80 font-bold">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">
                        Machine Progress
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Individual machine packaging and scan completion rates.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Overall {data.stats.machine_completion_pct}%
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3">
                  {data.machines.map((m) => (
                    <div
                      key={m.machine_id}
                      className="flex-1 min-w-[220px] rounded-xl border bg-card px-3.5 py-2.5 transition-all hover:border-primary/40 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold capitalize text-foreground truncate" title={m.machine_name}>
                          {m.machine_name}
                        </p>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 border border-border text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={11} />
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {m.scanned}/{m.total} <span className="text-[10px] text-muted-foreground font-normal">scanned</span>
                        </p>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {m.pct}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-600/70 transition-all"
                          style={{ width: `${Math.min(100, m.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Cut list table ── */}
            <CutListSection
              vendorId={Number(vendorId)}
              projectId={String(uniqueProjectId)}
              machineIds={machineIds}
            />
          </>
        )}
      </div>

      {/* ── Box items dialog ── */}
      {selectedBox && (
        <BoxItemsDialog
          open={!!selectedBox}
          onClose={() => setSelectedBox(null)}
          vendorId={Number(vendorId)}
          projectId={String(uniqueProjectId)}
          boxId={selectedBox.id}
          boxName={selectedBox.name}
        />
      )}
    </>
  );
}
