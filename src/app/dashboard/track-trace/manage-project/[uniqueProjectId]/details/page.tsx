"use client";

import { toastManager } from "@/components/ui/toast";
import { getBoxItems, getProjectDetail, ProjectDetailData, downloadBoxPdf, downloadProjectFullReport } from "@/api/track-trace/track-trace-cutlist.api";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  Box, CheckCircle2, Clock, MapPin, Package,
  TruckIcon, User, Layers, ChevronRight, X,
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
import { useEffect, useMemo, useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const formatWeight = (value: unknown) => {
  const weight = Number(value || 0);

  if (!Number.isFinite(weight) || weight <= 0) {
    return "0.00 kg";
  }

  return `${weight.toFixed(2)} kg`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = "blue" }: {
  label: string; value: string | number; sub?: string;
  color?: "blue" | "green" | "amber" | "purple" | "slate";
}) {
  const bg = { blue: "bg-blue-50", green: "bg-emerald-50", amber: "bg-amber-50", purple: "bg-indigo-50", slate: "bg-slate-50" }[color];
  const txt = { blue: "text-blue-600", green: "text-emerald-600", amber: "text-amber-600", purple: "text-indigo-600", slate: "text-slate-600" }[color];
  return (
    <div className={cn("rounded-xl border p-4 flex flex-col gap-1", bg)}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
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
        <p className="text-sm font-semibold text-foreground leading-tight">{m.machine_name}</p>
        {m.machine_type && <p className="text-[10px] text-muted-foreground">{m.machine_type}</p>}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${m.pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-indigo-600 w-10 text-right">{m.pct}%</span>
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
      (item) =>
        item.field_value &&
        String(item.field_value).trim()
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
              isPacked ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
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
                : "bg-slate-100 text-slate-600"
            )}
          >
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>

          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              hasItems
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {hasItems ? "With Items" : "Empty"}
          </span>
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
              factoryOut ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
            )}
          >
            <TruckIcon size={11} />
            Factory
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold",
              siteIn ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"
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
              "disabled:cursor-not-allowed disabled:opacity-60"
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
              isPacked ? "bg-emerald-50" : "bg-amber-50"
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
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>

              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  hasItems
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
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
            "disabled:cursor-not-allowed disabled:opacity-60"
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

function DispatchStep({ label, done, by, at, Icon }: {
  label: string; done: boolean; by: string | null; at: string | null; Icon: any;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("rounded-full p-1", done ? "bg-emerald-100" : "bg-muted")}>
        <Icon size={11} className={done ? "text-emerald-600" : "text-muted-foreground"} />
      </div>
      <div>
        <p className={cn("text-[10px] font-bold", done ? "text-emerald-700" : "text-muted-foreground")}>{label}</p>
        {done && at && <p className="text-[9px] text-muted-foreground">{fmtDateTime(at)}</p>}
        {done && by && <p className="text-[9px] text-muted-foreground">by {by}</p>}
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
  downloadingBoxId,
  downloadingAll,
  onSelectBox,
  onPrintBox,
  onDownloadAll,
}: {
  boxes: ProjectDetailData["boxes"];
  downloadingBoxId: number | null;
  downloadingAll: boolean;
  onSelectBox: (box: ProjectDetailData["boxes"][0]) => void;
  onPrintBox: (box: ProjectDetailData["boxes"][0]) => void;
  onDownloadAll: () => void;
}) {
  const [search, setSearch] = useState("");
  const [boxFilter, setBoxFilter] = useState<BoxFilter>("all");
  const [boxSort, setBoxSort] = useState<BoxSort>("sequence_asc");
  const [viewMode, setViewMode] = useState<BoxViewMode>("compact");
  const [collapsed, setCollapsed] = useState(false);

  const stats = useMemo(() => {
    const packed = boxes.filter((box) => getBoxStatus(box) === "packed").length;
    const unpacked = boxes.filter((box) => getBoxStatus(box) !== "packed").length;
    const withItems = boxes.filter((box) => getBoxItemCount(box) > 0).length;
    const empty = boxes.filter((box) => getBoxItemCount(box) === 0).length;
    const factoryOut = boxes.filter((box) => Boolean(box.factory_out_at)).length;
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

  const filterOptions: {
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
    const searchText = search.trim().toLowerCase();

    const matchesSearch = (box: ProjectDetailData["boxes"][0]) => {
      if (!searchText) {
        return true;
      }

      const boxInfoSearchText =
        box.box_info_values
          ?.map((item) => `${item.field_label || ""} ${item.field_value || ""}`)
          .join(" ")
          .toLowerCase() || "";

      return (
        String(box.box_name || "").toLowerCase().includes(searchText) ||
        String(box.box_status || "").toLowerCase().includes(searchText) ||
        String(getBoxItemCount(box)).includes(searchText) ||
        String(getBoxWeight(box)).includes(searchText) ||
        boxInfoSearchText.includes(searchText)
      );
    };

    const matchesFilter = (box: ProjectDetailData["boxes"][0]) => {
      const status = getBoxStatus(box);
      const itemCount = getBoxItemCount(box);

      switch (boxFilter) {
        case "packed":
          return status === "packed";
        case "unpacked":
          return status !== "packed";
        case "with_items":
          return itemCount > 0;
        case "empty":
          return itemCount === 0;
        case "factory_out":
          return Boolean(box.factory_out_at);
        case "site_in":
          return Boolean(box.site_in_at);
        default:
          return true;
      }
    };

    const sortedBoxes = boxes
      .filter((box) => matchesSearch(box) && matchesFilter(box))
      .sort((a, b) => {
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
  }, [boxes, search, boxFilter, boxSort]);

  const resetBoxFilters = () => {
    setSearch("");
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
                {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Search, filter, sort and check box weight quickly when project has large number of boxes.
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
                      : "text-muted-foreground hover:bg-muted"
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
                      : "text-muted-foreground hover:bg-muted"
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
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_240px_140px]">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search box no, status, item count, weight, floor, room..."
                  className="h-10 w-full rounded-xl border bg-background pl-9 pr-9 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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

              <div className="relative">
                <ArrowUpDown
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                <select
                  value={boxSort}
                  onChange={(event) => setBoxSort(event.target.value as BoxSort)}
                  className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="sequence_asc">Sort: Box No. 1 → Last</option>
                  <option value="sequence_desc">Sort: Box No. Last → 1</option>
                  <option value="packed_first">Packed boxes first</option>
                  <option value="unpacked_first">Unpacked boxes first</option>
                  <option value="with_items_first">Boxes with items first</option>
                  <option value="empty_first">Empty boxes first</option>
                  <option value="items_desc">Items high → low</option>
                  <option value="items_asc">Items low → high</option>
                  <option value="weight_desc">Weight high → low</option>
                  <option value="weight_asc">Weight low → high</option>
                </select>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={resetBoxFilters}
                className="h-10 justify-center gap-2 rounded-xl"
              >
                <X size={14} />
                Reset
              </Button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((filter) => {
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
                        : "bg-background text-muted-foreground hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    )}
                  >
                    <SlidersHorizontal size={12} />
                    {filter.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
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
                  : "grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4"
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
  open, onClose, vendorId, projectId, boxId, boxName,
}: {
  open: boolean; onClose: () => void;
  vendorId: number; projectId: string; boxId: number; boxName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof getBoxItems>> | null>(null);

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
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Box size={18} className="text-indigo-500" />
            {boxName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="space-y-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !data ? (
            <p className="pt-6 text-sm text-muted-foreground">Failed to load items.</p>
          ) : data.items.length === 0 ? (
            <p className="pt-6 text-sm text-muted-foreground">No items in this box.</p>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-black uppercase">Item</TableHead>
                  <TableHead className="text-xs font-black uppercase">Code</TableHead>
                  <TableHead className="text-xs font-black uppercase">Size (L×W×T)</TableHead>
                  <TableHead className="text-xs font-black uppercase">Weight</TableHead>
                  <TableHead className="text-xs font-black uppercase">Category</TableHead>
                  <TableHead className="text-xs font-black uppercase">Machine</TableHead>
                  <TableHead className="text-xs font-black uppercase">Scanned At</TableHead>
                  <TableHead className="text-xs font-black uppercase">Scanned By</TableHead>
                  <TableHead className="text-xs font-black uppercase">Site In</TableHead>
                  <TableHead className="text-xs font-black uppercase">Site By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, idx) => (
                  <TableRow key={item.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <TableCell className="font-semibold text-sm">{item.cut_list.item_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.cut_list.unique_code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.cut_list.length}×{item.cut_list.width}×{item.cut_list.thickness}
                    </TableCell>
                    <TableCell className="text-xs font-black text-purple-700">
                      {formatWeight((item as any).weight || (item.cut_list as any).weight)}
                    </TableCell>
                    <TableCell className="text-xs">{item.cut_list.category_name}</TableCell>
                    <TableCell className="text-xs">{item.machine.machine_name}</TableCell>
                    <TableCell className="text-xs">
                      {item.actual_in_at
                        ? <span className="text-emerald-700 font-medium">{fmtDateTime(item.actual_in_at)}</span>
                        : <span className="text-amber-500">Pending</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.inOperator
                        ? <span className="flex items-center gap-1"><User size={10} />{item.inOperator.name}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.site_in_at
                        ? <span className="text-blue-700 font-medium">{fmtDateTime(item.site_in_at)}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.siteInByUser
                        ? <span className="flex items-center gap-1"><User size={10} />{item.siteInByUser.name}</span>
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cut List Table ───────────────────────────────────────────────────────────

function CutListSection({ cutlist, machineIds }: {
  cutlist: ProjectDetailData["cutlist"];
  machineIds: { id: number; name: string; sequence_no?: number }[];
}) {
  const [search, setSearch] = useState("");
  const [productGroup, setProductGroup] = useState("all");
  const [selectedMachineId, setSelectedMachineId] = useState("all");
  const [machineStatus, setMachineStatus] = useState<"both" | "done" | "pending">("both");
  const [collapsed, setCollapsed] = useState(false);

  const sortedMachineIds = useMemo(() => {
    return [...machineIds].sort((a, b) => {
      return Number(a.sequence_no || 0) - Number(b.sequence_no || 0);
    });
  }, [machineIds]);

  const getProductGroup = (item: any) => {
    return (
      item.group ||
      item.group_name ||
      item.groupName ||
      item.product_group ||
      item.productGroup ||
      "Ungrouped"
    );
  };

  const productGroups = Array.from(
    new Set(cutlist.map((item: any) => getProductGroup(item)).filter(Boolean))
  ).sort();

  const totalWeight = cutlist.reduce((sum: number, item: any) => {
    return sum + Number(item.weight || 0);
  }, 0);

  const filtered = cutlist.filter((item: any) => {
    const searchText = search.trim().toLowerCase();
    const itemName = String(item.item_name || "").toLowerCase();
    const uniqueCode = String(item.unique_code || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const group = String(getProductGroup(item) || "").toLowerCase();
    const packageBoxName = String(item.package_box_name || "").toLowerCase();
    const weight = String(item.weight || "").toLowerCase();

    const matchesSearch =
      !searchText ||
      itemName.includes(searchText) ||
      uniqueCode.includes(searchText) ||
      category.includes(searchText) ||
      group.includes(searchText) ||
      packageBoxName.includes(searchText) ||
      weight.includes(searchText);

    const matchesProductGroup =
      productGroup === "all" || getProductGroup(item) === productGroup;

    let matchesMachine = true;

    if (selectedMachineId !== "all") {
      const machineId = Number(selectedMachineId);
      const mapping = item.machines.find(
        (machineMapping: any) => Number(machineMapping.machine_id) === machineId
      );

      if (!mapping) {
        matchesMachine = false;
      } else if (machineStatus === "done") {
        matchesMachine = mapping.scanned === true;
      } else if (machineStatus === "pending") {
        matchesMachine = mapping.scanned !== true;
      } else {
        matchesMachine = true;
      }
    }

    return matchesSearch && matchesProductGroup && matchesMachine;
  });

  const resetFilters = () => {
    setSearch("");
    setProductGroup("all");
    setSelectedMachineId("all");
    setMachineStatus("both");
  };

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex items-center gap-2 text-left"
          >
            <Layers size={15} className="text-indigo-500" />
            <span className="font-bold text-sm text-foreground">
              Cut List ({filtered.length}/{cutlist.length} items)
            </span>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-black text-purple-700">
              {formatWeight(totalWeight)}
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
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Search
              </label>
              <input
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Search items, code, product, box, weight…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Product / Group
              </label>
              <select
                value={productGroup}
                onChange={(e) => setProductGroup(e.target.value)}
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="all">All Products / Groups</option>
                {productGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Machine
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="all">All Machines</option>
                {sortedMachineIds.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Status
              </label>
              <select
                value={machineStatus}
                onChange={(e) => setMachineStatus(e.target.value as "both" | "done" | "pending")}
                disabled={selectedMachineId === "all"}
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="both">Both</option>
                <option value="done">Done</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-xs font-black uppercase w-8">#</TableHead>
                <TableHead className="text-xs font-black uppercase">Item</TableHead>
                <TableHead className="text-xs font-black uppercase">Product</TableHead>
                <TableHead className="text-xs font-black uppercase">Code</TableHead>
                <TableHead className="text-xs font-black uppercase">Size (mm)</TableHead>
                <TableHead className="text-xs font-black uppercase">Weight</TableHead>
                <TableHead className="text-xs font-black uppercase">Packing Box</TableHead>
                <TableHead className="text-xs font-black uppercase">Qty</TableHead>
                <TableHead className="text-xs font-black uppercase">Category</TableHead>
                {sortedMachineIds.map(m => (
                  <TableHead key={m.id} className="text-xs font-black uppercase text-center min-w-36">{m.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9 + sortedMachineIds.length} className="text-center py-10 text-muted-foreground text-sm">
                    No items found
                  </TableCell>
                </TableRow>
              ) : filtered.map((item: any, idx) => (
                <TableRow key={`${item.cut_list_id}-${item.unit_index}-${idx}`} className={cn("hover:bg-primary/5", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                  <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                  <TableCell className="font-semibold text-sm">{item.item_name}</TableCell>
                  <TableCell className="font-semibold text-sm">{getProductGroup(item)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.unique_code}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.length}×{item.width}×{item.thickness}
                  </TableCell>
                  <TableCell className="text-xs font-black text-purple-700">
                    {formatWeight(item.weight)}
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
                  <TableCell className="text-xs font-bold">1</TableCell>
                  <TableCell className="text-xs">{item.category}</TableCell>

                  {sortedMachineIds.map(m => {
                    const mapping = item.machines.find((mm: any) => Number(mm.machine_id) === Number(m.id));
                    if (!mapping) {
                      return <TableCell key={m.id} className="text-center text-xs text-muted-foreground">—</TableCell>;
                    }
                    return (
                      <TableCell key={m.id} className="text-center">
                        {mapping.scanned ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                              <CheckCircle2 size={11} /> Done
                            </span>
                            {mapping.scanned_by && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <User size={8} />{mapping.scanned_by}
                              </span>
                            )}
                            {mapping.scanned_at && (
                              <span className="text-[9px] text-muted-foreground">{fmtDateTime(mapping.scanned_at)}</span>
                            )}
                            {Number(mapping.weight || 0) > 0 && (
                              <span className="text-[9px] font-black text-purple-700">{formatWeight(mapping.weight)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-medium">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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

  const [selectedBox, setSelectedBox] = useState<{ id: number; name: string } | null>(null);
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

  const machineIds = data
    ? data.machines
        .map(m => ({
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
      Number(vendorId)
    );

    if (!response?.status && !response?.success) {
      throw new Error(response?.message || "Failed to generate print");
    }

    const printHtml =
      response?.data?.print_html ||
      response?.print_html;

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
        Number(vendorId)
      );

      if (!response?.status && !response?.success) {
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
    } catch (error: any) {
      console.error("Download all boxes error:", error);
      alert(error?.message || "Failed to download full report");
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
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace">Track & Trace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{data?.project.project_name ?? "Project Detail"}</BreadcrumbPage>
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
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load project detail. Please refresh.
          </div>
        )}

        {!loading && !error && data && (<>

          {/* ── Lead info banner ── */}
          <div className="rounded-xl border bg-card px-5 py-4 flex flex-wrap gap-6 items-start shadow-sm">
            <div className="flex-1 min-w-48">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-1 rounded-full bg-indigo-500" />
                <h1 className="text-xl font-black text-foreground">{data.project.project_name}</h1>
              </div>
              {data.project.lead && (
                <div className="pl-3 flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <User size={13} className="text-muted-foreground" /> {data.project.lead.lead_name}
                  </p>
                  {data.project.lead.lead_phone && (
                    <p className="text-xs text-muted-foreground">{data.project.lead.lead_phone}</p>
                  )}
                  {data.project.lead.lead_address && (
                    <p className="text-xs text-muted-foreground">{data.project.lead.lead_address}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-xs">{data.project.project_status}</Badge>
              <Badge
                className={cn("text-xs", data.project.track_trace_status === "Completed" ? "bg-emerald-500" : "bg-indigo-500")}
              >
                T&T: {data.project.track_trace_status}
              </Badge>
              {data.project.details?.estimated_completion_date && (
                <span className="text-xs text-muted-foreground">
                  Due: {fmtDate(data.project.details.estimated_completion_date)}
                </span>
              )}
            </div>
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Items" value={data.stats.total_items} color="blue" />
            <StatCard label="Total Panels" value={data.stats.total_panels} color="purple" />
            <StatCard label="Total Boxes" value={data.stats.total_boxes} color="slate" />
            <StatCard label="Packed Boxes" value={data.stats.packed_boxes} color="green" />
            <StatCard label="Unpacked" value={data.stats.unpacked_boxes} color="amber" />
          </div>

          {/* ── Machine progress ── */}
          {data.machines.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="font-bold text-sm mb-3 text-foreground">Machine Progress</h2>
              <div className="divide-y">
                {data.machines.map(m => <MachineBar key={m.machine_id} m={m} />)}
              </div>
            </div>
          )}

          {/* ── Boxes ── */}
          {data.boxes.length > 0 && (
            <BoxesSection
              boxes={data.boxes}
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
            />
          )}

          {/* ── Cut list table ── */}
          <CutListSection cutlist={data.cutlist} machineIds={machineIds} />

        </>)}
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