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
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
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
  MapPin,
  Package,
  TruckIcon,
  User,
  Layers,
  ChevronRight,
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
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "purple" | "slate";
}) {
  const bg = {
    blue: "bg-blue-50",
    green: "bg-emerald-50",
    amber: "bg-amber-50",
    purple: "bg-indigo-50",
    slate: "bg-slate-50",
  }[color];
  const txt = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    purple: "text-indigo-600",
    slate: "text-slate-600",
  }[color];
  return (
    <div className={cn("rounded-xl border p-4 flex flex-col gap-1", bg)}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-2xl font-black tabular-nums", txt)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Machine Progress Bar ─────────────────────────────────────────────────────

function MachineBar({ m }: { m: ProjectDetailData["machines"][0] }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-36 shrink-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {m.machine_name}
        </p>
        {m.machine_type && (
          <p className="text-[10px] text-muted-foreground">{m.machine_type}</p>
        )}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${m.pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-indigo-600 w-10 text-right">
        {m.pct}%
      </span>
      <span className="text-xs text-muted-foreground w-24 text-right">
        {m.scanned}/{m.total} scanned
      </span>
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
      <button
        type="button"
        onClick={onClick}
        className="group grid w-full grid-cols-1 gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm md:grid-cols-[minmax(130px,1fr)_130px_130px_170px_44px]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              isPacked
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600",
            )}
          >
            <Package size={17} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-black text-foreground">
                Box {box.box_name}
              </p>

              <Badge
                variant={isPacked ? "default" : "secondary"}
                className="shrink-0 text-[10px]"
              >
                {box.box_status}
              </Badge>
            </div>

            {visibleBoxInfoValues.length > 0 ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {visibleBoxInfoValues
                  .slice(0, 3)
                  .map((item) => `${item.field_label}: ${item.field_value}`)
                  .join(" · ")}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                No extra box info
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              hasItems
                ? "bg-indigo-50 text-indigo-700"
                : "bg-slate-100 text-slate-600",
            )}
          >
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>

          {/* <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              hasItems
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {hasItems ? "With Items" : "Empty"}
          </span> */}
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-black text-purple-700">
            {formatWeight(boxWeight)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs md:justify-end">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold",
              factoryOut
                ? "bg-emerald-50 text-emerald-700"
                : "bg-muted text-muted-foreground",
            )}
          >
            <TruckIcon size={11} />
            Factory
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold",
              siteIn
                ? "bg-blue-50 text-blue-700"
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
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-all",
              "hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            title="Print box label"
          >
            {downloading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Printer size={15} />
            )}
          </button>

          <ChevronRight
            size={16}
            className="text-muted-foreground transition-colors group-hover:text-indigo-500"
          />
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group w-full cursor-pointer rounded-2xl border bg-card p-4 transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "rounded-xl p-2.5",
              isPacked ? "bg-emerald-50" : "bg-amber-50",
            )}
          >
            <Package
              size={18}
              className={isPacked ? "text-emerald-600" : "text-amber-500"}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-black text-foreground">
              Box {box.box_name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant={isPacked ? "default" : "secondary"}
                className="text-[10px]"
              >
                {box.box_status}
              </Badge>

              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  hasItems
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>

              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  hasItems
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {hasItems ? "With Items" : "Empty"}
              </span>

              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-700">
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
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background transition-all",
            "hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          title="Print box label"
        >
          {downloading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Printer size={15} />
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
  filterOptions: serverFilterOptions,
  downloadingBoxId,
  downloadingAll,
  onSelectBox,
  onPrintBox,
  onDownloadAll,
  onFilterChange,
}: {
  boxes: ProjectDetailData["boxes"];
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
  }, [search, productGroup, category, selectedMachineId, boxFilter, onFilterChange]);

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
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/30 p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            <div className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Box size={16} />
            </div>

            <div className="min-w-0">
              <h2 className="flex flex-wrap items-center gap-2 text-sm font-black text-foreground">
                Boxes ({filteredBoxes.length}/{boxes.length})
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-black text-purple-700">
                  {formatWeight(stats.totalWeight)}
                </span>
                {collapsed ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronUp size={15} />
                )}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Search, filter, sort and check box weight quickly when project
                has large number of boxes.
              </p>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((value) => !value)}
              className="h-9 gap-2 rounded-lg"
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              {collapsed ? "Expand" : "Collapse"}
            </Button>

            {!collapsed && (
              <div className="inline-flex rounded-lg border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-colors",
                    viewMode === "compact"
                      ? "bg-indigo-600 text-white"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <List size={14} />
                  Compact
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-colors",
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Grid3X3 size={14} />
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
              className="h-9 gap-2 rounded-lg"
            >
              {downloadingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search box no, status, item count, weight, floor, room..."
                    className="h-9 w-full rounded-lg border bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                <select
                  value={productGroup}
                  onChange={(event) => setProductGroup(event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Groups</option>
                  {(serverFilterOptions?.groups ?? []).map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* CATEGORY */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Categories</option>
                  {(serverFilterOptions?.categories ?? []).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* MACHINE */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Machine
                </label>

                <select
                  value={selectedMachineId}
                  onChange={(event) => setSelectedMachineId(event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Machines</option>
                  {(serverFilterOptions?.machines ?? []).map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controls Row 2: Sort By, Reset */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="w-full sm:w-64">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1 block">
                  Sort By
                </label>

                <select
                  value={boxSort}
                  onChange={(event) =>
                    setBoxSort(event.target.value as BoxSort)
                  }
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="sequence_asc">Sort: Box No. 1 → Last</option>
                  <option value="sequence_desc">Sort: Box No. Last → 1</option>
                  <option value="packed_first">Packed boxes first</option>
                  <option value="unpacked_first">Unpacked boxes first</option>
                  <option value="with_items_first">
                    Boxes with items first
                  </option>
                  <option value="empty_first">Empty boxes first</option>
                  <option value="items_desc">Items high → low</option>
                  <option value="items_asc">Items low → high</option>
                  <option value="weight_desc">Weight high → low</option>
                  <option value="weight_asc">Weight low → high</option>
                </select>
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
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "bg-background text-muted-foreground hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
                    )}
                  >
                    <SlidersHorizontal size={12} />
                    {filter.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        active
                          ? "bg-white/20 text-white"
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-6xl md:max-w-7xl lg:max-w-[90vw] xl:max-w-[1300px] w-full max-h-[88vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl border">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Box size={20} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{boxName}</span>
              {data && (
                <Badge
                  variant="outline"
                  className="font-mono text-xs font-semibold bg-indigo-50/80 text-indigo-700 border-indigo-200"
                >
                  {data.items.length}{" "}
                  {data.items.length === 1 ? "Item" : "Items"}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="space-y-3">
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
            <div className="w-full overflow-x-auto rounded-xl border bg-background shadow-xs">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="text-xs font-bold uppercase text-foreground py-3.5 whitespace-nowrap">
                      Item
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Code
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Size (L×W×T)
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground text-center whitespace-nowrap">
                      Qty
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Weight
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Machine
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Scanned At
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Scanned By
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Site In
                    </TableHead>
                    <TableHead className="text-xs font-bold uppercase text-foreground whitespace-nowrap">
                      Site By
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className={
                        idx % 2 === 0
                          ? "bg-background hover:bg-muted/30"
                          : "bg-muted/15 hover:bg-muted/30"
                      }
                    >
                      <TableCell className="font-semibold text-sm whitespace-nowrap">
                        {item.cut_list.item_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {item.cut_list.unique_code}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.cut_list.length} × {item.cut_list.width} ×{" "}
                        {item.cut_list.thickness}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-center whitespace-nowrap">
                        {Number((item as any).qty || 1)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-purple-700 whitespace-nowrap">
                        {formatWeight(
                          Number(
                            (item as any).weight ||
                              Number((item.cut_list as any).weight || 0) /
                                Math.max(1, Number(item.cut_list.qty || 1)) ||
                              0,
                          ) * Number((item as any).qty || 1),
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 whitespace-nowrap">
                        {item.cut_list.category_name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 whitespace-nowrap">
                        {item.machine.machine_name}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {item.actual_in_at ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {fmtDateTime(item.actual_in_at)}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {item.inOperator ? (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <User size={11} className="text-slate-400" />
                            {item.inOperator.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {item.site_in_at ? (
                          <span className="text-blue-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {fmtDateTime(item.site_in_at)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {item.siteInByUser ? (
                          <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <User size={11} className="text-slate-400" />
                            {item.siteInByUser.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
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
    <div className="overflow-hidden rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex items-center gap-2 text-left"
          >
            <Layers size={15} className="text-indigo-500" />

            <span className="font-bold text-sm text-foreground">
              Cut List ({summary?.filtered_qty ?? 0}/
              {summary?.total_project_qty ?? 0} items)
            </span>

            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-black text-purple-700">
              {formatWeight(summary?.filtered_weight ?? 0)}
            </span>

            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setCollapsed((value) => !value)}
              className="h-8 gap-1 text-xs"
            >
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}

              {collapsed ? "Expand" : "Collapse"}
            </Button>

            {!collapsed && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetFilters}
                className="h-8 gap-1 text-xs"
              >
                <X size={13} />
                Reset
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Item, code, description, category, group, material, procurement, box..."
                    className="h-9 w-full rounded-lg border bg-background pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                <select
                  value={productGroup}
                  onChange={(event) => setProductGroup(event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Groups</option>

                  {(filterOptions?.groups ?? []).map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Categories</option>

                  {(filterOptions?.categories ?? []).map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Machine
                </label>

                <select
                  value={selectedMachineId}
                  onChange={(event) => {
                    setSelectedMachineId(event.target.value);

                    if (event.target.value === "all") {
                      setMachineStatus("all");
                    }
                  }}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Machines</option>

                  {(
                    filterOptions?.machines ??
                    sortedMachineIds.map((machine) => ({
                      id: machine.id,

                      name: machine.name,

                      sequence_no: machine.sequence_no ?? 0,
                    }))
                  ).map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Machine Status
                </label>

                <select
                  value={machineStatus}
                  onChange={(event) =>
                    setMachineStatus(
                      event.target.value as ProjectCutListMachineStatus,
                    )
                  }
                  disabled={selectedMachineId === "all"}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="all">Both</option>
                  <option value="done">Done</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Packing Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Packing Status
                </label>

                <select
                  value={packingStatus}
                  onChange={(event) =>
                    setPackingStatus(
                      event.target.value as ProjectCutListPackingStatus,
                    )
                  }
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All</option>
                  <option value="packed">Packed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Packing Method */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Packing Method
                </label>

                <select
                  value={packingMethod}
                  onChange={(event) =>
                    setPackingMethod(
                      event.target.value as ProjectCutListPackingMethod,
                    )
                  }
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All</option>
                  <option value="scanned">Scanned</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Box */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Packing Box
                </label>

                <select
                  value={selectedBoxId}
                  onChange={(event) => setSelectedBoxId(event.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="all">All Boxes</option>

                  {(filterOptions?.boxes ?? []).map((box) => (
                    <option key={box.id} value={box.id}>
                      Box {box.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Weight */}
              {/* <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Min Weight
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    minWeight
                  }
                  onChange={(event) =>
                    setMinWeight(
                      event.target.value
                    )
                  }
                  placeholder="0.00 kg"
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div> */}

              {/* Maximum Weight */}
              {/* <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Max Weight
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    maxWeight
                  }
                  onChange={(event) =>
                    setMaxWeight(
                      event.target.value
                    )
                  }
                  placeholder="No maximum"
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div> */}

              {/* Sort */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Sort By
                </label>

                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value as ProjectCutListSortBy)
                    }
                    className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="row_number">Default</option>
                    <option value="item_name">Item Name</option>
                    <option value="unique_code">Code</option>
                    <option value="group">Group</option>
                    <option value="category">Category</option>
                    <option value="weight">Weight</option>
                    <option value="box">Box</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(
                        event.target.value as ProjectCutListSortOrder,
                      )
                    }
                    className="h-9 w-24 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary row */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                Matching: {summary?.filtered_qty ?? 0}
              </span>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Packed: {summary?.packed_qty ?? 0}
              </span>

              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                Pending: {summary?.pending_qty ?? 0}
              </span>

              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">
                Weight: {formatWeight(summary?.filtered_weight ?? 0)}
              </span>

              {/* Received Qty */}
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                Received: {summary?.received_qty ?? 0}
              </span>

              {/* Packed but not yet received */}
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">
                Pending Receipt: {summary?.pending_receipt_qty ?? 0}
              </span>

              {/* Qty inside site-in boxes but not yet verified */}
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700">
                Pending Verification: {summary?.pending_verification_qty ?? 0}
              </span>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Site Verification: {summary?.site_verification_pct ?? 0}%
              </span>
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

                        <TableCell className="text-xs font-black text-purple-700">
                          {formatWeight(item.weight)}
                        </TableCell>

                        <TableCell className="text-xs">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-1 text-[10px] font-black",

                              item.packing_method === "Manual"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-blue-50 text-blue-700",
                            )}
                          >
                            {item.packing_method}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs">
                          {item.package_box_name ? (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-black text-indigo-700">
                              Box {item.package_box_name}
                            </span>
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
                            <span
                              className={cn(
                                "inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black",

                                item.receipt_status === "Received"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : item.receipt_status ===
                                      "Pending Verification"
                                    ? "bg-amber-50 text-amber-700"
                                    : item.receipt_status === "Not At Site"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {item.receipt_status === "Received" ? (
                                <CheckCircle2 size={11} />
                              ) : item.receipt_status ===
                                "Pending Verification" ? (
                                <Clock size={11} />
                              ) : item.receipt_status === "Not At Site" ? (
                                <MapPin size={11} />
                              ) : (
                                <Package size={11} />
                              )}

                              {item.receipt_status}
                            </span>

                            {/* This Cut List row represents one physical unit */}
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              Received Qty{" "}
                              <span
                                className={cn(
                                  "font-black",
                                  Number(item.received_qty || 0) > 0
                                    ? "text-emerald-700"
                                    : "text-muted-foreground",
                                )}
                              >
                                {Number(item.received_qty || 0)}
                              </span>
                              /1
                            </span>

                            {/* QR / Manual Verification */}
                            <span
                              className={cn(
                                "text-[9px] font-bold",
                                item.receipt_method === "Manual Verification"
                                  ? "text-indigo-600"
                                  : "text-blue-600",
                              )}
                            >
                              {item.receipt_method}
                            </span>

                            {/* Manual mapping can contain qty > 1 */}
                            {item.packing_method === "Manual" &&
                              Number(item.mapping_packed_qty || 0) > 1 && (
                                <span className="text-[9px] font-semibold text-indigo-600">
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
            <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {pagination.from}
                  </span>
                  {" - "}
                  <span className="font-bold text-foreground">
                    {pagination.to}
                  </span>
                  {" of "}
                  <span className="font-bold text-foreground">
                    {pagination.total}
                  </span>
                  {" matching items"}
                </p>

                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));

                    setPage(1);
                  }}
                  className="h-8 rounded-lg border bg-background px-2 text-xs"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.has_previous}
                  onClick={() => setPage(Math.max(1, pagination.page - 1))}
                  className="h-8 px-3 text-xs"
                >
                  Previous
                </Button>

                {pageNumbers.map((pageNumber, index) => {
                  const previousPage = pageNumbers[index - 1];

                  return (
                    <div key={pageNumber} className="flex items-center gap-1">
                      {previousPage && pageNumber - previousPage > 1 && (
                        <span className="px-1 text-xs text-muted-foreground">
                          ...
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={cn(
                          "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold transition-colors",

                          pageNumber === pagination.page
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "bg-background text-muted-foreground hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700",
                        )}
                      >
                        {pageNumber}
                      </button>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.has_next}
                  onClick={() =>
                    setPage(
                      Math.min(pagination.total_pages, pagination.page + 1),
                    )
                  }
                  className="h-8 px-3 text-xs"
                >
                  Next
                </Button>
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
            {/* ── Lead info banner ── */}
            <div className="rounded-xl border bg-card px-5 py-4 flex flex-wrap gap-6 items-start shadow-sm">
              <div className="flex-1 min-w-48">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-1 rounded-full bg-indigo-500" />
                  <h1 className="text-xl font-black text-foreground">
                    {data.project.project_name}
                  </h1>
                </div>
                {data.project.lead && (
                  <div className="pl-3 flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <User size={13} className="text-muted-foreground" />{" "}
                      {data.project.lead.lead_name}
                    </p>
                    {data.project.lead.lead_phone && (
                      <p className="text-xs text-muted-foreground">
                        {data.project.lead.lead_phone}
                      </p>
                    )}
                    {data.project.lead.lead_address && (
                      <p className="text-xs text-muted-foreground">
                        {data.project.lead.lead_address}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="text-xs">
                  {data.project.project_status}
                </Badge>
                <Badge
                  className={cn(
                    "text-xs",
                    data.project.track_trace_status === "Completed"
                      ? "bg-emerald-500"
                      : "bg-indigo-500",
                  )}
                >
                  T&T: {data.project.track_trace_status}
                </Badge>
                {data.project.details?.estimated_completion_date && (
                  <span className="text-xs text-muted-foreground">
                    Due:{" "}
                    {fmtDate(data.project.details.estimated_completion_date)}
                  </span>
                )}
              </div>
            </div>

            {/* ── Packing overview ── */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    Packing Overview
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quantity-based status across scanned and manually selected
                    products.
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-black",
                    data.stats.packing_progress_pct >= 100
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-indigo-200 bg-indigo-50 text-indigo-700",
                  )}
                >
                  {data.stats.packing_progress_pct}% packed
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <StatCard
                  label="Product Types"
                  value={data.stats.product_types}
                  sub="Unique cut-list products"
                  color="blue"
                />
                <StatCard
                  label="Total Qty"
                  value={data.stats.total_qty}
                  sub="Physical quantity"
                  color="purple"
                />
                <StatCard
                  label="Packed Qty"
                  value={data.stats.total_packed_qty}
                  sub={`${data.stats.packing_progress_pct}% completed`}
                  color="green"
                />
                <StatCard
                  label="Pending Qty"
                  value={data.stats.total_pending_qty}
                  sub={`${data.stats.pending_at_packaging} pending at packing`}
                  color="amber"
                />
                <StatCard
                  label="Packing Progress"
                  value={`${data.stats.packing_progress_pct}%`}
                  sub={`${data.stats.total_packed_qty}/${data.stats.total_qty} qty`}
                  color="slate"
                />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, data.stats.packing_progress_pct))}%`,
                  }}
                />
              </div>
            </div>

            {/* ── Packing method + product status ── */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-sm font-black text-foreground">
                    Packing Method
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Split of packed quantity between barcode scanning and manual
                    selection.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Scanned Packed"
                    value={data.stats.scanned_packed_qty}
                    sub={`${data.stats.scanned_packing_pct}% of packed qty`}
                    color="green"
                  />
                  <StatCard
                    label="Manual Packed"
                    value={data.stats.manual_packed_qty}
                    sub={`${data.stats.manual_packing_pct}% of packed qty`}
                    color="purple"
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Scanned
                      </span>
                      <span className="font-black text-emerald-700">
                        {data.stats.scanned_packing_pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(100, data.stats.scanned_packing_pct)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Manual
                      </span>
                      <span className="font-black text-indigo-700">
                        {data.stats.manual_packing_pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(100, data.stats.manual_packing_pct)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-sm font-black text-foreground">
                    Product Packing Status
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Unique products grouped by their current packing completion.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Fully Packed"
                    value={data.stats.fully_packed_products}
                    color="green"
                  />
                  <StatCard
                    label="Partial"
                    value={data.stats.partially_packed_products}
                    color="amber"
                  />
                  <StatCard
                    label="Not Started"
                    value={data.stats.not_started_products}
                    color="slate"
                  />
                </div>

                <div className="mt-4 rounded-xl border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Machine Completion
                      </p>
                      <p className="mt-1 text-lg font-black text-indigo-700">
                        {data.stats.machine_completion_pct}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Pending at Packaging
                      </p>
                      <p className="mt-1 text-lg font-black text-amber-700">
                        {data.stats.pending_at_packaging}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Box / weight statistics ── */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4">
                <h2 className="text-sm font-black text-foreground">
                  Box & Weight Summary
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current box usage and packed material weight.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <StatCard
                  label="Total Boxes"
                  value={data.stats.total_boxes}
                  color="slate"
                />
                <StatCard
                  label="Boxes With Items"
                  value={data.stats.boxes_with_items}
                  color="green"
                />
                <StatCard
                  label="Empty Boxes"
                  value={data.stats.empty_boxes}
                  color="amber"
                />
                <StatCard
                  label="Packed Weight"
                  value={formatWeight(data.stats.total_weight)}
                  sub={`${formatWeight(data.stats.average_box_weight)} avg / used box`}
                  color="purple"
                />
                <StatCard
                  label="Avg Qty / Box"
                  value={data.stats.average_qty_per_box}
                  sub="Boxes containing items"
                  color="blue"
                />
              </div>
            </div>

            {/* ── Dispatch / site progress ── */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    Dispatch & Site Progress
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Box movement from packing to factory dispatch and site
                    receipt.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    Packed {data.stats.packed_boxes}/{data.stats.total_boxes}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    Factory Out {data.stats.factory_out_boxes}/
                    {data.stats.total_boxes}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    Site {data.stats.site_received_boxes}/
                    {data.stats.total_boxes}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <StatCard
                  label="Packed Boxes"
                  value={data.stats.packed_boxes}
                  color="green"
                />
                <StatCard
                  label="Unpacked Boxes"
                  value={data.stats.unpacked_boxes}
                  color="amber"
                />
                <StatCard
                  label="Factory Out"
                  value={data.stats.factory_out_boxes}
                  color="purple"
                />
                <StatCard
                  label="Site Received"
                  value={data.stats.site_received_boxes}
                  color="blue"
                />
                <StatCard
                  label="Dispatch Progress"
                  value={`${data.stats.dispatch_progress_pct}%`}
                  sub={`Site receipt ${data.stats.site_receipt_progress_pct}%`}
                  color="slate"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <TruckIcon size={12} /> Factory Out
                    </span>
                    <span className="font-black text-indigo-700">
                      {data.stats.dispatch_progress_pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(100, data.stats.dispatch_progress_pct)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <MapPin size={12} /> Site Received
                    </span>
                    <span className="font-black text-blue-700">
                      {data.stats.site_receipt_progress_pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-500"
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
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-foreground">
                      Site Item Receipt & Verification
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Physical quantity received at site. Scanned items use item
                      site-in; manual items use
                      CutListMachineMapping.received_qty.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-black",
                        receivedStats.item_receipt_progress_pct >= 100
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-blue-200 bg-blue-50 text-blue-700",
                      )}
                    >
                      {receivedStats.item_receipt_progress_pct}% received
                    </Badge>

                    <Badge variant="outline" className="text-[11px]">
                      At Site {receivedStats.site_in_qty}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  <StatCard
                    label="Packed Qty"
                    value={data.stats.total_packed_qty}
                    sub="Total quantity inside boxes"
                    color="purple"
                  />

                  <StatCard
                    label="At Site Qty"
                    value={receivedStats.site_in_qty}
                    sub={`${receivedStats.not_at_site_qty} qty not at site`}
                    color="blue"
                  />

                  <StatCard
                    label="Received Qty"
                    value={receivedStats.total_received_qty}
                    sub={`${receivedStats.item_receipt_progress_pct}% of packed qty`}
                    color="green"
                  />

                  <StatCard
                    label="Pending Receipt"
                    value={receivedStats.total_pending_receipt_qty}
                    sub="Packed but not received"
                    color="amber"
                  />

                  <StatCard
                    label="Pending Verification"
                    value={receivedStats.site_in_pending_verification_qty}
                    sub="At site but not verified"
                    color="amber"
                  />

                  <StatCard
                    label="Site Verification"
                    value={`${receivedStats.site_item_verification_pct}%`}
                    sub={`${receivedStats.site_in_received_qty}/${receivedStats.site_in_qty} site qty`}
                    color="slate"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {/* Scanned receipt */}
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-foreground">
                          Scanned Item Receipt
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Confirmed through item QR site-in.
                        </p>
                      </div>

                      <span className="text-sm font-black text-emerald-700">
                        {receivedStats.scanned_receipt_progress_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-emerald-50 p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Received
                        </p>
                        <p className="mt-1 text-lg font-black text-emerald-700">
                          {receivedStats.scanned_received_qty}
                        </p>
                      </div>

                      <div className="rounded-lg bg-amber-50 p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Pending
                        </p>
                        <p className="mt-1 text-lg font-black text-amber-700">
                          {receivedStats.scanned_pending_receipt_qty}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500"
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
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-foreground">
                          Manual Item Verification
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Actual received quantity from received_qty.
                        </p>
                      </div>

                      <span className="text-sm font-black text-indigo-700">
                        {receivedStats.manual_receipt_progress_pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                          Received
                        </p>
                        <p className="mt-1 text-lg font-black text-indigo-700">
                          {receivedStats.manual_received_qty}
                        </p>
                      </div>

                      <div className="rounded-lg bg-amber-50 p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Pending
                        </p>
                        <p className="mt-1 text-lg font-black text-amber-700">
                          {receivedStats.manual_pending_receipt_qty}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-500"
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

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <StatCard
                    label="Fully Received Boxes"
                    value={receivedStats.fully_received_boxes}
                    color="green"
                  />
                  <StatCard
                    label="Partial Receipt Boxes"
                    value={receivedStats.partially_received_boxes}
                    color="amber"
                  />
                  <StatCard
                    label="Not Received Boxes"
                    value={receivedStats.not_received_boxes}
                    color="slate"
                  />
                </div>
              </div>
            )}

            {/* ── Machine progress ── */}
            {data.machines.length > 0 && (
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-sm text-foreground">
                    Machine Progress
                  </h2>
                  <Badge variant="outline" className="text-[11px] font-black">
                    Overall {data.stats.machine_completion_pct}%
                  </Badge>
                </div>
                <div className="divide-y">
                  {data.machines.map((m) => (
                    <MachineBar key={m.machine_id} m={m} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Boxes ── */}
            {data.boxes.length > 0 && (
              <BoxesSection
                boxes={data.boxes}
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
