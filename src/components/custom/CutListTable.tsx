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

export type CutListRow = Record<string, any>;

interface Props {
  data: CutListRow[];
  machineColumns: string[];
  className?: string;
  onMachineAssign?: (cutListIds: number[], machineId: number, machineName: string, assigned: boolean) => Promise<void>;
}

export default function CutListTable({ 
  data, 
  machineColumns, 
  className,
  onMachineAssign 
}: Props) {
  const [rowSelection, setRowSelection] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<{
    name: string;
    id: number;
  } | null>(null);

  // ✅ Handle individual cell click (toggle assignment)
  const handleMachineCellClick = async (
    cutListId: number,
    machineId: number,
    machineName: string,
    currentlyAssigned: boolean
  ) => {
    if (!onMachineAssign) return;

    try {
      // Toggle the assignment (if currently assigned, unassign; if not assigned, assign)
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
      handleMachineCellClick // ✅ Pass cell click handler
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

    setRowSelection({});
  };

  return (
    <div className={className}>
      <DataTable 
        table={table} 
        showPagination={false}
        actionBar={
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {selectedRows.length} row(s) selected
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRowSelection({})}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        }
      />

      {/* ✅ Dialog for bulk assignment (still available when clicking headers with selected rows) */}
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