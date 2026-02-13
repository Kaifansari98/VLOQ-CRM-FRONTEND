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
import { toast } from "react-toastify";

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
  const [assigned, setAssigned] = useState<boolean | null>(null); // ✅ No default selection

  const handleAssign = () => {
    // ✅ Validation: Check if user selected an option
    if (assigned === null) {
      toast.error("Please select either Assign or Unassign option");
      return;
    }

    onAssign(machineId, machineName, assigned);
    onOpenChange(false);
    
    // ✅ Reset selection when dialog closes
    setAssigned(null);
  };

  // ✅ Reset selection when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setAssigned(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {/* ✅ Assign Option */}
            <button
              onClick={() => setAssigned(true)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                assigned === true
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                assigned === true ? "border-primary" : "border-gray-300"
              }`}>
                {assigned === true && (
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

            {/* ✅ Unassign Option */}
            <button
              onClick={() => setAssigned(false)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                assigned === false
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                assigned === false ? "border-primary" : "border-gray-300"
              }`}>
                {assigned === false && (
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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