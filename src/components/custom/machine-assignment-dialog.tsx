// components/custom/machine-assignment-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MachineAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineName: string;
  machineId: number;
  selectedRows: any[];
  onAssign: (machineId: number, machineName: string, assigned: boolean) => void;
}

export function MachineAssignmentDialog({
  open,
  onOpenChange,
  machineName,
  machineId,
  selectedRows,
  onAssign,
}: MachineAssignmentDialogProps) {
  const [assigned, setAssigned] = useState<boolean>(true);

  const handleAssign = () => {
    onAssign(machineId, machineName, assigned);
    onOpenChange(false);    
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Machine: {machineName}</DialogTitle>
          <DialogDescription>
            {selectedRows.length > 0 
              ? `Update ${machineName} assignment for ${selectedRows.length} selected row(s)`
              : `Update ${machineName} assignment for all rows`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setAssigned(true)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                assigned
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                assigned ? "border-primary" : "border-gray-300"
              }`}>
                {assigned && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <Label className="font-semibold cursor-pointer">Assign</Label>
                <span className="text-sm text-muted-foreground">
                  Assign machine to selected items
                </span>
              </div>
            </button>

            <button
              onClick={() => setAssigned(false)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                !assigned
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                !assigned ? "border-primary" : "border-gray-300"
              }`}>
                {!assigned && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <Label className="font-semibold cursor-pointer">Unassign</Label>
                <span className="text-sm text-muted-foreground">
                  Remove machine from selected items
                </span>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}