"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useGenerateDefaultRules } from "@/hooks/track-trace-hooks/useCutListRulesHooks";
import { useMachinesByVendor } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { toastManager } from "@/components/ui/toast";
import {
  Sparkles,
  Loader2,
  Wand2,
} from "lucide-react";
import type { MachineData } from "@/types/track-trace";

interface GenerateDefaultRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number;
  userId?: number;
  onSuccess?: () => void;
}

export function getMachineDefaultRuleInfo(machine: MachineData | {
  id: number;
  machine_name: string;
  machine_type_id?: number | null;
  machine_type?: string | null;
}) {
  const typeId = Number(machine.machine_type_id);
  const typeName = (
    machine.machine_type ||
    machine.machine_name ||
    ""
  ).toLowerCase();

  const isEdgeBander =
    typeId === 11 ||
    typeName.includes("edge");

  const isCncOrDrill =
    typeId === 6 ||
    typeId === 7 ||
    typeId === 8 ||
    typeName.includes("cnc") ||
    typeName.includes("router") ||
    typeName.includes("drill");

  const isQc =
    typeId === 17 ||
    typeName.includes("qc") ||
    typeName.includes("quality");

  const isPackaging =
    typeId === 18 ||
    typeName.includes("pack");

  const isPanelSaw =
    typeId === 3 ||
    typeName.includes("saw") ||
    typeName.includes("cutting") ||
    typeName.includes("nesting") ||
    typeName.includes("beam") ||
    typeName.includes("panel");

  if (isEdgeBander) {
    return {
      tag: "Edgeband Required",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }
  if (isCncOrDrill) {
    return {
      tag: "Exclude Back / < 8mm",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    };
  }
  if (isQc) {
    return {
      tag: "Quality Check",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  if (isPackaging) {
    return {
      tag: "Final Packing",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    };
  }
  if (isPanelSaw) {
    return {
      tag: "Cutting Flow",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    };
  }
  return {
    tag: "Standard Flow",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };
}

export function GenerateDefaultRulesModal({
  open,
  onOpenChange,
  vendorId,
  userId,
  onSuccess,
}: GenerateDefaultRulesModalProps) {
  const [overwrite, setOverwrite] = useState(false);
  const { data: machines = [], isLoading: isMachinesLoading } = useMachinesByVendor(vendorId);
  const { mutate: generateRules, isPending: isGenerating } = useGenerateDefaultRules(vendorId);

  const activeMachines = machines.filter((m) => m.status === "ACTIVE");

  const handleGenerate = () => {
    generateRules(
      { overwrite, created_by: userId },
      {
        onSuccess: (data) => {
          toastManager.add({
            title: "Default rules generated successfully",
            description: data.message || `Configured ${data.totalMachines} workstation(s).`,
            type: "success",
          });
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          toastManager.add({
            title: "Failed to generate default rules",
            description: err.message || "An unexpected error occurred",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 shadow-xl border border-border">
        {/* Header */}
        <DialogHeader className="space-y-1.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wand2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Generate Default Rules
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Populate baseline routing rules for your workstations.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Workstations List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
              <span>Workstations ({activeMachines.length})</span>
              <span>Rule Type</span>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 divide-y divide-border/60 max-h-52 overflow-y-auto">
              {isMachinesLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading workstations...
                </div>
              ) : activeMachines.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No active workstations found.
                </div>
              ) : (
                activeMachines.map((machine) => {
                  const info = getMachineDefaultRuleInfo(machine);
                  return (
                    <div
                      key={machine.id}
                      className="px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[240px]">
                        <span className="font-medium text-foreground truncate">
                          {machine.machine_name}
                        </span>
                        {machine.has_rules ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            (Configured)
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            (Not Configured)
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium py-0.5 px-2 rounded-md ${info.color}`}
                      >
                        {info.tag}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Overwrite option */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none p-2 rounded-md hover:bg-muted/40 transition-colors">
            <Checkbox
              id="overwrite-existing"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(Boolean(checked))}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground block">
                Overwrite existing rules
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Replace rules on workstations that already have one configured.
              </span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-8 px-3.5 text-xs gap-1.5 font-medium shadow-xs"
            onClick={handleGenerate}
            disabled={isGenerating || activeMachines.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate Rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
