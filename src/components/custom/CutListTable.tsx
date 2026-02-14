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
import { MachineAssignmentDialog } from "./machine-assignment-dialog";
import { toast } from "react-toastify";
import { Download, Printer, Maximize2, Minimize2 } from "lucide-react";

export type CutListRow = Record<string, any>;

interface Props {
  data: CutListRow[];
  machineColumns: string[];
  className?: string;
  onMachineAssign?: (cutListIds: number[], machineId: number, machineName: string, assigned: boolean) => Promise<void>;
  onDownloadLabels?: (cutListIds?: number[]) => Promise<string>;
  onDownloadExcel?: (cutListIds?: number[]) => Promise<string>;
}

export default function CutListTable({ 
  data, 
  machineColumns, 
  className,
  onMachineAssign,
  onDownloadLabels,
  onDownloadExcel
}: Props) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // ✅ Add fullscreen state
  const [selectedMachine, setSelectedMachine] = useState<{
    name: string;
    id: number;
  } | null>(null);

  const handleDownloadLabels = async () => {
    if (!onDownloadLabels) return;

    try {
      setIsDownloading(true);
      
      const selectedRowIds = selectedRows.length > 0 
        ? selectedRows.map(row => row.original.id)
        : undefined;

      const pdfUrl = await onDownloadLabels(selectedRowIds);
      
      if (!pdfUrl) {
        throw new Error("No PDF URL received");
      }

      window.open(pdfUrl, '_blank');

      toast.success("Labels downloaded successfully");
    } catch (error) {
      console.error("Error downloading labels:", error);
      toast.error("Failed to download labels");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!onDownloadExcel) return;

    try {
      setIsDownloading(true);
      
      const selectedRowIds = selectedRows.length > 0 
        ? selectedRows.map(row => row.original.id)
        : undefined;

      const pdfUrl = await onDownloadExcel(selectedRowIds);
      
      if (!pdfUrl) {
        throw new Error("No PDF URL received");
      }

      window.open(pdfUrl, '_blank');

      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading excel:", error);
      toast.error("Failed to download excel");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMachineCellClick = async (
    cutListId: number,
    machineId: number,
    machineName: string,
    currentlyAssigned: boolean
  ) => {
    if (!onMachineAssign) return;

    try {
      await onMachineAssign([cutListId], machineId, machineName, !currentlyAssigned);
      
      toast.success(
        `${machineName} ${!currentlyAssigned ? 'assigned to' : 'unassigned from'} item`
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
      id: machineId
    });
    setDialogOpen(true);
  }

  const columns = useMemo(
    () => getCutListColumns(
      machineColumns, 
      handleMachineHeaderClick,
      handleMachineCellClick
    ),
    [machineColumns, data, onMachineAssign]
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
        left: ['select', 'id', 'description'],
      },
    },
    enableRowSelection: true,
    enableColumnPinning: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleAssign = async (machineId: number, machineName: string, assigned: boolean) => {
    const rowsToUpdate = selectedRows.map(row => row.original.id);

    if (onMachineAssign) {
      try {
        await onMachineAssign(rowsToUpdate, machineId, machineName, assigned);
        toast.success(`Machine ${assigned ? 'assigned' : 'unassigned'} successfully`);
      } catch (error) {
        toast.error("Failed to update machine assignment");
        console.error(error);
      }
    }
  };

  // ✅ Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* ✅ Fullscreen overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-background"
          style={{ padding: '1rem' }}
        >
          <div className="h-full flex flex-col">
            {/* Fullscreen header */}
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-muted-foreground">
                {columnFilters.length > 0 && (
                  <span>
                    {columnFilters.length} filter{columnFilters.length > 1 ? 's' : ''} active
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
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleDownloadExcel}
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
                      Download Cut List
                    </>
                  )}
                </Button>
              
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRowSelection({})}
                  >
                    Clear Selection ({selectedRows.length})
                  </Button>
                )}

                {/* ✅ Exit fullscreen button */}
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


            {/* ✅ Fullscreen table */}
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

      {/* ✅ Normal view */}
      <div className={className}>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-muted-foreground">
            {columnFilters.length > 0 && (
              <span>
                {columnFilters.length} filter{columnFilters.length > 1 ? 's' : ''} active
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
            <Button 
              variant="default" 
              size="sm"
              onClick={handleDownloadExcel}
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
                  Download Cut List
                </>
              )}
            </Button>
          
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRowSelection({})}
              >
                Clear Selection ({selectedRows.length})
              </Button>
            )}

            {/* ✅ Fullscreen button */}
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
            selectedRows={selectedRows.map(r => r.original)}
            onAssign={handleAssign}
          />
        )}
      </div>
    </>
  );
}