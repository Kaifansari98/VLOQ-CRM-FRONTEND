// components/custom/CutListTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { getCutListColumns } from "./cutlist-columns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MachineAssignmentDialog } from "./machine-assignment-dialog";
import { toast } from "react-toastify";
import {
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ChevronDown,
  FileSpreadsheet,
  UploadCloudIcon,
} from "lucide-react";
import { useUploadMachineExcel } from "@/hooks/track-trace/useProjectCutList";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";

export type CutListRow = Record<string, any>;

interface Props {
  data: CutListRow[];
  machineColumns: string[];
  className?: string;
  onMachineAssign?: (
    cutListIds: number[],
    machineId: number,
    machineName: string,
    assigned: boolean,
  ) => Promise<void>;
  onDownloadLabels?: (cutListIds?: number[]) => Promise<string>;
  onDownloadExcel?: (cutListIds?: number[]) => Promise<string>;
  onDownloadBasicExcel?: (cutListIds?: number[]) => Promise<string>; // ✅ New prop
}

export default function CutListTable({
  data,
  machineColumns,
  className,
  onMachineAssign,
  onDownloadLabels,
  onDownloadExcel,
  onDownloadBasicExcel, // ✅ New prop
}: Props) {
  const { project_id } = useParams();
  const projectId = String(project_id);
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<{
    name: string;
    id: number;
  } | null>(null);

  const uploadMachineExcelMutation = useUploadMachineExcel(projectId);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const resolveFileUrl = (url?: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const base = apiClient.defaults.baseURL ?? "";
    const origin = base.replace(/\/api\/?$/i, "");
    if (!origin) return url;
    return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
  };
  const handleDownloadLabels = async () => {
    if (!onDownloadLabels) return;

    try {
      setIsDownloading(true);

      const selectedRowIds =
        selectedRows.length > 0
          ? selectedRows.map((row) => row.original.id)
          : undefined;

      const pdfUrl = resolveFileUrl(await onDownloadLabels(selectedRowIds));

      if (!pdfUrl) {
        throw new Error("No PDF URL received");
      }

      window.open(pdfUrl, "_blank");
      toast.success("Labels downloaded successfully");
    } catch (error) {
      console.error("Error downloading labels:", error);
      toast.error("Failed to download labels");
    } finally {
      setIsDownloading(false);
    }
  };

  // ✅ Advanced Excel download
  const handleDownloadAdvancedExcel = async () => {
    if (!onDownloadExcel) return;

    try {
      setIsDownloading(true);

      const selectedRowIds =
        selectedRows.length > 0
          ? selectedRows.map((row) => row.original.id)
          : undefined;

      const fileUrl = resolveFileUrl(await onDownloadExcel(selectedRowIds));

      if (!fileUrl) {
        throw new Error("No file URL received");
      }

      window.open(fileUrl, "_blank");
      toast.success("Advanced cut list downloaded successfully");
    } catch (error) {
      console.error("Error downloading advanced excel:", error);
      toast.error("Failed to download advanced cut list");
    } finally {
      setIsDownloading(false);
    }
  };

  // ✅ Basic Excel download
  const handleDownloadBasicExcel = async () => {
    if (!onDownloadBasicExcel) return;

    try {
      setIsDownloading(true);

      const selectedRowIds =
        selectedRows.length > 0
          ? selectedRows.map((row) => row.original.id)
          : undefined;

      const fileUrl = resolveFileUrl(await onDownloadBasicExcel(selectedRowIds));

      if (!fileUrl) {
        throw new Error("No file URL received");
      }

      window.open(fileUrl, "_blank");
      toast.success("Basic cut list downloaded successfully");
    } catch (error) {
      console.error("Error downloading basic excel:", error);
      toast.error("Failed to download basic cut list");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMachineCellClick = async (
    cutListId: number,
    machineId: number,
    machineName: string,
    currentlyAssigned: boolean,
  ) => {
    if (!onMachineAssign) return;

    try {
      await onMachineAssign(
        [cutListId],
        machineId,
        machineName,
        !currentlyAssigned,
      );

      toast.success(
        `${machineName} ${!currentlyAssigned ? "assigned to" : "unassigned from"} item`,
      );
    } catch (error) {
      toast.error("Failed to update machine assignment");
      console.error(error);
    }
  };

  function handleMachineHeaderClick(machineName: string) {
    const currentSelectedRows = table.getFilteredSelectedRowModel().rows;

    if (currentSelectedRows.length === 0) {
      toast.error("Please select at least one row before assigning machines");
      return;
    }

    let machineId: number | null = null;

    for (const row of data) {
      const machineData = row[machineName];
      if (machineData?.machineId) {
        machineId = machineData.machineId;
        break;
      }
    }

    if (!machineId) {
      toast.error("Machine ID not found. Please contact support.");
      console.error(`Machine ID not found for: ${machineName}`);
      return;
    }

    setSelectedMachine({
      name: machineName,
      id: machineId,
    });
    setDialogOpen(true);
  }

  const columns = useMemo(
    () =>
      getCutListColumns(
        machineColumns,
        handleMachineHeaderClick,
        handleMachineCellClick,
      ),
    [machineColumns, data, onMachineAssign],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row: any) => String(row.id ?? row.unique_code ?? Math.random()),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    state: {
      rowSelection,
      columnFilters,
      columnPinning: {
        left: ["select", "id", "description"],
      },
    },
    enableRowSelection: true,
    enableColumnPinning: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleAssign = async (
    machineId: number,
    machineName: string,
    assigned: boolean,
  ) => {
    const rowsToUpdate = selectedRows.map((row) => row.original.id);

    if (onMachineAssign) {
      try {
        await onMachineAssign(rowsToUpdate, machineId, machineName, assigned);
        toast.success(
          `Machine ${assigned ? "assigned" : "unassigned"} successfully`,
        );
      } catch (error) {
        toast.error("Failed to update machine assignment");
        console.error(error);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ✅ Reusable toolbar — rendered in both normal and fullscreen views
  const ToolbarButtons = () => (
    <div className="flex gap-2">
      {/* Download Labels button */}
      <>
        <input
          type="file"
          accept=".xlsx,.xls"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleMachineExcelUpload}
        />

        <Button
          variant="default"
          size="sm"
          className="gap-2"
          disabled={uploadMachineExcelMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMachineExcelMutation.isPending ? (
            <>
              <span className="animate-spin">⏳</span>
              Uploading...
            </>
          ) : (
            <>
              <UploadCloudIcon className="h-4 w-4" />
              Upload Cutlist
            </>
          )}
        </Button>
      </>
      {/* ✅ Download Cut List split button with Basic / Advanced options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Download Cut List
                <ChevronDown className="h-3 w-3 opacity-70" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Choose format
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDownloadBasicExcel}
            disabled={isDownloading || !onDownloadBasicExcel}
            className="gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <div>
              <div className="font-medium">Basic</div>
              <div className="text-xs text-muted-foreground">
                Standard cut list format
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDownloadAdvancedExcel}
            disabled={isDownloading || !onDownloadExcel}
            className="gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <div>
              <div className="font-medium">Advanced</div>
              <div className="text-xs text-muted-foreground">
                Full details with machine data
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Download Labels button */}
      <Button
        variant="default"
        size="sm"
        onClick={handleDownloadLabels}
        disabled={isDownloading}
        className="gap-2"
      >
        {isDownloading ? (
          <>
            <span className="animate-spin">⏳</span>
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download Labels
            {selectedRows.length > 0 && ` (${selectedRows.length})`}
          </>
        )}
      </Button>

      {selectedRows.length > 0 && (
        <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>
          Clear Selection ({selectedRows.length})
        </Button>
      )}
    </div>
  );

  const handleMachineExcelUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

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

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background"
          style={{ padding: "1rem" }}
        >
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-muted-foreground">
                {columnFilters.length > 0 && (
                  <span>
                    {columnFilters.length} filter
                    {columnFilters.length > 1 ? "s" : ""} active
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setColumnFilters([])}
                      className="ml-2 h-auto p-0 text-primary"
                    >
                      Clear all filters
                    </Button>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <ToolbarButtons />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="gap-2"
                >
                  <Minimize2 className="h-4 w-4" />
                  Exit Fullscreen
                </Button>
              </div>
            </div>

            <div className="cutlist-table-container-fullscreen flex-1">
              <DataTable
                table={table}
                showPagination={false}
                actionBar={
                  selectedRows.length > 0 ? (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">
                        {selectedRows.length} row(s) selected
                      </span>
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Normal view */}
      <div className={className}>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted-foreground">
            {columnFilters.length > 0 && (
              <span>
                {columnFilters.length} filter
                {columnFilters.length > 1 ? "s" : ""} active
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setColumnFilters([])}
                  className="ml-2 h-auto p-0 text-primary"
                >
                  Clear all filters
                </Button>
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <ToolbarButtons />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </Button>
          </div>
        </div>

        <div className="cutlist-table-container">
          <DataTable
            table={table}
            showPagination={false}
            actionBar={
              selectedRows.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {selectedRows.length} row(s) selected
                  </span>
                </div>
              ) : undefined
            }
          />
        </div>

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
    </>
  );
}
