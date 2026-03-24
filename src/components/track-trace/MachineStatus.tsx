"use client";

import { Machine } from "@/types/track-trace";
import { Separator } from "@/components/ui/separator";

interface MachineStatusProps {
  machines: Machine[];
}

const STATUS_CONFIG = {
  ACTIVE:      { label: "Active",      dot: "bg-green-500",        pulse: true  },
  IDLE:        { label: "Idle",        dot: "bg-amber-400",        pulse: false },
  MAINTENANCE: { label: "Maintenance", dot: "bg-red-500",          pulse: false },
  INACTIVE:    { label: "Inactive",    dot: "bg-muted-foreground", pulse: false },
} as const;

export default function MachineStatus({ machines }: MachineStatusProps) {
  const totalMachines  = machines.length;
  const activeMachines = machines.filter((m) => m.status === "ACTIVE").length;
  const idleMachines   = machines.filter((m) => m.status === "IDLE").length;
  const inMaintenance  = machines.filter((m) => m.status === "MAINTENANCE").length;

  const summaryItems = [
    {
      count: activeMachines,
      label: "Active",
      dot: "bg-green-500",
      bar: "bg-green-500",
      pct: totalMachines ? Math.round((activeMachines / totalMachines) * 100) : 0,
    },
    {
      count: idleMachines,
      label: "Idle",
      dot: "bg-amber-400",
      bar: "bg-amber-400",
      pct: totalMachines ? Math.round((idleMachines / totalMachines) * 100) : 0,
    },
    {
      count: inMaintenance,
      label: "Maint.",
      dot: "bg-red-500",
      bar: "bg-red-500",
      pct: totalMachines ? Math.round((inMaintenance / totalMachines) * 100) : 0,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col max-h-110">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            Machine Status
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Current operational status
          </p>
        </div>
        <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
          {totalMachines} machines
        </span>
      </div>

      <Separator />

      {/* ── Summary Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-border shrink-0">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex flex-col gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot}`} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums leading-none">
                {item.count}
              </span>
            </div>
            <div className="h-1 w-full bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.bar}`}
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground tabular-nums leading-none">
              {item.pct}% of total
            </p>
          </div>
        ))}
      </div>

      {/* ── Machine List ────────────────────────────────────────────── */}
      <div
        className="overflow-y-auto max-h-95 min-h-40 p-5 space-y-1
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {machines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-muted-foreground text-lg">⊘</span>
            </div>
            <p className="text-sm font-medium text-foreground">No machines found</p>
            <p className="text-xs text-muted-foreground mt-1">Machine data will appear here</p>
          </div>
        ) : (
          machines.map((machine) => {
            const cfg  = STATUS_CONFIG[machine.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
            const util = machine.utilization ?? 0;

            return (
              <div
                key={machine.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors duration-150"
              >
                {/* Status dot */}
                <span className="relative flex shrink-0 h-1.5 w-1.5">
                  {cfg.pulse && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
                </span>

                {/* Name + operator */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-none truncate">
                    {machine.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-none truncate">
                    {machine.operator || "—"}
                  </p>
                </div>

                {/* Status label */}
                <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                  {cfg.label}
                </span>

                {/* Divider */}
                <div className="w-px h-6 bg-border shrink-0" />

                {/* Utilization */}
                <div className="shrink-0 text-right w-10">
                  <p className="text-xs font-bold tabular-nums leading-none text-foreground">
                    {util}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                    Util.
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}