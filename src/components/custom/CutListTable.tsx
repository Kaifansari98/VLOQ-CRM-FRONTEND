// components/custom/CutListTable.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  VisibilityState,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { getCutListColumns, RoutingLegend } from "./cutlist-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MachineAssignmentDialog } from "./machine-assignment-dialog";
import { toastManager } from "@/components/ui/toast";
import {
  ChevronDown,
  FileSpreadsheet,
  FilterX,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
  Tag,
  UploadCloud,
  X,
} from "lucide-react";
import { useUploadMachineExcel } from "@/hooks/track-trace/useProjectCutList";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

export type CutListRow = Record<string, any>;
export type Fabrication = "WOODWORK" | "METALWORK";

const LOCKED_MESSAGE =
  "Machine assignment is disabled for completed or dispatched projects.";

/** Columns that only carry data for woodwork (panel) cutlists. */
const WOODWORK_ONLY_COLUMNS = [
  "group_name",
  "category_name",
  "description",
  "thickness",
  "material_details",
  "elf",
  "elb",
  "esl",
  "esr",
];

const SEARCH_FIELDS = [
  "description",
  "item_name",
  "unique_code",
  "group_name",
  "category_name",
  "material_details",
];

const searchRows: FilterFn<CutListRow> = (row, _columnId, filterValue) => {
  const term = String(filterValue ?? "").trim().toLowerCase();
  if (!term) return true;
  return SEARCH_FIELDS.some((field) =>
    String(row.original[field] ?? "").toLowerCase().includes(term),
  );
};

type DownloadKind = "labels" | "basic" | "advanced";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

interface Props {
  data: CutListRow[];
  machineColumns: string[];
  className?: string;
  fabrication?: Fabrication;
  isAssignmentDisabled?: boolean;
  onMachineAssign?: (
    cutListIds: number[],
    machineId: number,
    machineName: string,
    assigned: boolean,
  ) => Promise<void>;
  onDownloadLabels?: (
    cutListIds?: number[],
    options?: {
      selectedMachines?: string[];
      includeMachineSequence?: boolean;
      targetMachine?: string;
    },
  ) => Promise<string>;
  onDownloadExcel?: (cutListIds?: number[]) => Promise<string>;
  onDownloadBasicExcel?: (cutListIds?: number[]) => Promise<string>;
  onQtyUpdate?: (cutListId: number, newQty: number) => Promise<void>;
  isQtyEditDisabled?: boolean;
  projectPackingType?: string;
}

const resolveFileUrl = (url?: string) => {
  if (!url) return "";
  const forceHttps = (value: string) =>
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? value.replace(/^http:\/\//i, "https://")
      : value;

  if (/^https?:\/\//i.test(url)) return forceHttps(url);

  const origin = (apiClient.defaults.baseURL ?? "").replace(/\/api\/?$/i, "");
  if (!origin) return url;
  return forceHttps(url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`);
};

export default function CutListTable({
  data,
  machineColumns,
  className,
  fabrication = "WOODWORK",
  isAssignmentDisabled = false,
  isQtyEditDisabled = false,
  onQtyUpdate,
  onMachineAssign,
  onDownloadLabels,
  onDownloadExcel,
  onDownloadBasicExcel,
  projectPackingType,
}: Props) {
  const params = useParams();
  // This table is mounted under /manage-project/[uniqueProjectId].
  const projectId = String(params.uniqueProjectId ?? params.project_id);
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  // Filters change the row count, so jump back to the first page.
  const resetPage = () => setPagination((current) => ({ ...current, pageIndex: 0 }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState<DownloadKind | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<{
    name: string;
    id: number;
  } | null>(null);

  const uploadMachineExcelMutation = useUploadMachineExcel(projectId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !dialogOpen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, dialogOpen]);

  const notifyLocked = () =>
    toastManager.add({ title: LOCKED_MESSAGE, type: "error" });

  const selectedIds = () => {
    const rows = table.getFilteredSelectedRowModel().rows;
    return rows.length > 0 ? [...new Set(rows.map((row) => Number(row.original.cut_list_id ?? row.original.id)))] : undefined;
  };

  const runDownload = async (
    kind: DownloadKind,
    request: () => Promise<string>,
    successTitle: string,
    failureTitle: string,
  ) => {
    try {
      setDownloading(kind);
      const fileUrl = resolveFileUrl(await request());
      if (!fileUrl) throw new Error("No file URL received");
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      toastManager.add({ title: successTitle, type: "success" });
    } catch (error) {
      console.error(`[CutList] ${kind} download failed`, error);
      toastManager.add({ title: failureTitle, type: "error" });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadLabels = () => {
    if (!onDownloadLabels) return;
    void runDownload(
      "labels",
      () => onDownloadLabels(selectedIds()),
      "Labels downloaded successfully",
      "Failed to download labels",
    );
  };

  const handleDownloadAdvancedExcel = () => {
    if (!onDownloadExcel) return;
    void runDownload(
      "advanced",
      () => onDownloadExcel(selectedIds()),
      "Advanced cut list downloaded successfully",
      "Failed to download advanced cut list",
    );
  };

  const handleDownloadBasicExcel = () => {
    if (!onDownloadBasicExcel) return;
    void runDownload(
      "basic",
      () => onDownloadBasicExcel(selectedIds()),
      "Basic cut list downloaded successfully",
      "Failed to download basic cut list",
    );
  };

  const handleMachineCellClick = async (
    cutListId: number,
    machineId: number,
    machineName: string,
    currentlyAssigned: boolean,
  ) => {
    if (isAssignmentDisabled) return notifyLocked();
    if (currentlyAssigned) {
      const row = (data ?? []).find(
        (r) => Number(r.cut_list_id ?? r.id) === cutListId,
      );
      const machineData = row?.[machineName];
      if (machineData?.scanned) {
        toastManager.add({
          title: `Cannot uncheck ${machineName}: item is already scanned`,
          type: "error",
        });
        return;
      }
    }

    if (!onMachineAssign) return;

    try {
      await onMachineAssign([cutListId], machineId, machineName, !currentlyAssigned);
      toastManager.add({
        title: `${machineName} ${!currentlyAssigned ? "assigned to" : "unassigned from"} item`,
        type: "success",
      });
    } catch (error) {
      toastManager.add({ title: "Failed to update machine assignment", type: "error" });
      console.error(error);
    }
  };

  function handleMachineHeaderClick(machineName: string) {
    if (isAssignmentDisabled) return notifyLocked();

    if (table.getFilteredSelectedRowModel().rows.length === 0) {
      toastManager.add({
        title: "Please select at least one row before assigning machines",
        type: "error",
      });
      return;
    }

    const machineId = data.find((row) => row[machineName]?.machineId)?.[machineName]
      ?.machineId as number | undefined;

    if (!machineId) {
      toastManager.add({
        title: "Machine ID not found. Please contact support.",
        type: "error",
      });
      console.error(`Machine ID not found for: ${machineName}`);
      return;
    }

    setSelectedMachine({ name: machineName, id: machineId });
    setDialogOpen(true);
  }

  const columns = useMemo(
    () =>
      getCutListColumns(
        machineColumns,
        handleMachineHeaderClick,
        handleMachineCellClick,
        data,
        isAssignmentDisabled,
        onQtyUpdate,
        isQtyEditDisabled,
        projectPackingType,
      ),
    [
      machineColumns,
      data,
      onMachineAssign,
      isAssignmentDisabled,
      onQtyUpdate,
      isQtyEditDisabled,
      projectPackingType,
    ],
  );

  const isMetalwork = fabrication === "METALWORK";
  const columnVisibility = useMemo<VisibilityState>(
    () =>
      isMetalwork
        ? Object.fromEntries(WOODWORK_ONLY_COLUMNS.map((id) => [id, false]))
        : { image: false },
    [isMetalwork],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    // Page resets are done explicitly in resetPage; avoid queued resets during render.
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowId: (row: any) => String(row.id ?? row.unique_code ?? Math.random()),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      resetPage();
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      resetPage();
    },
    globalFilterFn: searchRows,
    getColumnCanGlobalFilter: () => true,
    state: {
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
      columnVisibility,
      columnPinning: {
        left: isMetalwork
          ? ["select", "image", "item_name"]
          : ["select", "group_name"],
      },
    },
    enableRowSelection: true,
    enableColumnPinning: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasFilters = columnFilters.length > 0 || !!globalFilter;

  const handleAssign = async (
    machineId: number,
    machineName: string,
    assigned: boolean,
  ) => {
    if (isAssignmentDisabled) return notifyLocked();

    // When unassigning, filter out rows that are already scanned at this machine
    const rowsToProcess = assigned
      ? selectedRows
      : selectedRows.filter((row) => !row.original[machineName]?.scanned);

    if (!assigned && rowsToProcess.length === 0 && selectedRows.length > 0) {
      toastManager.add({
        title: `Cannot unassign ${machineName}: all selected items are already scanned at this machine`,
        type: "error",
      });
      return;
    }

    // Use cut_list_id (numeric) and deduplicate — multiple unit rows of the
    // same item share the same cut_list_id.
    const cutListIds = [
      ...new Set(
        rowsToProcess.map((row) => Number(row.original.cut_list_id ?? row.original.id)),
      ),
    ];

    if (cutListIds.length === 0) return;

    if (onMachineAssign) {
      try {
        await onMachineAssign(cutListIds, machineId, machineName, assigned);
        toastManager.add({
          title: `Machine ${assigned ? "assigned" : "unassigned"} successfully`,
          type: "success",
        });
      } catch (error) {
        toastManager.add({
          title: "Failed to update machine assignment",
          type: "error",
        });
        console.error(error);
      }
    }
  };

  const handleMachineExcelUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      await uploadMachineExcelMutation.mutateAsync({
        vendorId: vendorId!,
        projectToken: projectId,
        file,
        userId: userId!,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const clearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter("");
    resetPage();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : className,
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              placeholder={isMetalwork ? "Search part name or code…" : "Search item, group, material, code…"}
              aria-label="Search cutlist"
              className="h-9 pr-8 pl-8"
            />
            {globalFilter && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => table.setGlobalFilter("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {columnFilters.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {columnFilters.length} column filter{columnFilters.length > 1 ? "s" : ""}
            </span>
          )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-muted-foreground">
              <FilterX className="size-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            className="hidden"
            onChange={handleMachineExcelUpload}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={uploadMachineExcelMutation.isPending}
            title={isAssignmentDisabled ? LOCKED_MESSAGE : "Upload a machine assignment sheet"}
            onClick={() => (isAssignmentDisabled ? notifyLocked() : fileInputRef.current?.click())}
          >
            {uploadMachineExcelMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {uploadMachineExcelMutation.isPending ? "Uploading…" : "Upload Cutlist"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!!downloading} className="gap-2">
                {downloading === "basic" || downloading === "advanced" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="size-4" />
                )}
                Export
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Download cut list as Excel
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDownloadBasicExcel}
                disabled={!onDownloadBasicExcel}
                className="cursor-pointer items-start gap-2 py-2"
              >
                <FileSpreadsheet className="mt-0.5 size-4" />
                <div>
                  <div className="font-medium">Basic</div>
                  <div className="text-xs text-muted-foreground">Standard cut list format</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDownloadAdvancedExcel}
                disabled={!onDownloadExcel}
                className="cursor-pointer items-start gap-2 py-2"
              >
                <FileSpreadsheet className="mt-0.5 size-4" />
                <div>
                  <div className="font-medium">Advanced</div>
                  <div className="text-xs text-muted-foreground">Full details with machine data</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={handleDownloadLabels} disabled={!!downloading} className="gap-2">
            {downloading === "labels" ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
            {downloading === "labels" ? "Generating…" : "Download Labels"}
            {selectedRows.length > 0 && downloading !== "labels" && (
              <span className="rounded bg-primary-foreground/20 px-1.5 text-xs tabular-nums">
                {selectedRows.length}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setIsFullscreen((value) => !value)}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Selection bar */}
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-sm">
            <span className="font-semibold tabular-nums">{selectedRows.length}</span>{" "}
            {selectedRows.length === 1 ? "row" : "rows"} selected
            {!isAssignmentDisabled && (
              <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                Click a machine header to assign it to the selection.
              </span>
            )}
          </p>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={() => setRowSelection({})}>
            <X className="size-3.5" />
            Clear selection
          </Button>
        </div>
      )}

      {machineColumns.length > 0 && <RoutingLegend className="px-0.5" />}

      {/* Table */}
      <div
        className={cn(
          "cutlist-table-container rounded-lg border bg-background",
          isFullscreen && "cutlist-table-container--fullscreen flex-1",
        )}
      >
        <DataTable table={table} showPagination={false} />
      </div>

      <DataTablePagination table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} />

      {selectedMachine && (
        <MachineAssignmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          machineName={selectedMachine.name}
          machineId={selectedMachine.id}
          selectedRows={selectedRows.map((r) => r.original)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}
