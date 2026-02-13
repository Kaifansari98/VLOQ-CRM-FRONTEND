// components/custom/CutListTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { getCutListColumns } from "./cutlist-columns";
import { Button } from "@/components/ui/button";
import { MachineAssignmentDialog } from "./machine-assignment-dialog";
import { toast } from "react-toastify";
import { Download,Printer } from "lucide-react";

export type CutListRow = Record<string, any>;

interface Props {
  data: CutListRow[];
  machineColumns: string[];
  className?: string;
  onMachineAssign?: (cutListIds: number[], machineId: number, machineName: string, assigned: boolean) => Promise<void>;
  onDownloadLabels?: (cutListIds?: number[]) => Promise<string>;
}

export default function CutListTable({ 
  data, 
  machineColumns, 
  className,
  onMachineAssign,
  onDownloadLabels
}: Props) {
  const [rowSelection, setRowSelection] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<{
    name: string;
    id: number;
  } | null>(null);

  // ✅ Handle download/print labels
 // ✅ Handle download labels
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

    // // ✅ Download only
    // const link = document.createElement('a');
    // link.href = pdfUrl;
    // link.download = `qr-labels-${Date.now()}.pdf`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    toast.success("Labels downloaded successfully");
  } catch (error) {
    console.error("Error downloading labels:", error);
    toast.error("Failed to download labels");
  } finally {
    setIsDownloading(false);
  }
};

// ✅ Handle print labels
const handlePrintLabels = async () => {
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

    // ✅ Print only - open in new tab
    window.open(pdfUrl, '_blank');

    toast.success("Labels opened for printing");
  } catch (error) {
    console.error("Error printing labels:", error);
    toast.error("Failed to print labels");
  } finally {
    setIsDownloading(false);
  }
};

  // ✅ Handle individual cell click (toggle assignment)
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

  // ✅ Handle header click (bulk assignment via dialog)
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
    getRowId: (row: any) => String(row.id ?? row.unique_code ?? Math.random()),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      columnPinning: {
        left: ['select', 'id', 'description'],
      },
    },
    enableRowSelection: true,
    enableColumnPinning: true,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  // ✅ Handle bulk assignment from dialog
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

  return (
    <div className={className}>
      {/* ✅ Buttons section above the table */}
      <div className="flex justify-end gap-2 mb-3">
        {/* Download Labels Button */}

        {/* <Button 
        variant="default" 
        size="sm"
        onClick={handlePrintLabels}
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
            <Printer className="h-4 w-4" />
            Print Labels
            {selectedRows.length > 0 && ` (${selectedRows.length})`}
          </>
        )}
      </Button> */}
      
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
        
        {/* Clear Selection Button - only show when rows are selected */}
        {selectedRows.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Clear Selection ({selectedRows.length})
          </Button>
        )}
      </div>

      {/* DataTable */}
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

      {/* ✅ Dialog for bulk assignment */}
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
  );
}