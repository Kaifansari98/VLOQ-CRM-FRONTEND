"use client";

import { Item } from "@/types/track-trace";
import { Separator } from "@/components/ui/separator";

interface RealTimeTrackingProps {
  items: Item[];
}

const STATUS_CONFIG = {
  in_process: { label: "In Process", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  queued:     { label: "Queued",     dot: "bg-blue-400",  pill: "bg-blue-50 text-blue-700 border-blue-200"   },
  completed:  { label: "Scanned",    dot: "bg-green-500", pill: "bg-green-50 text-green-700 border-green-200"},
  on_hold:    { label: "On Hold",    dot: "bg-red-500",   pill: "bg-red-50 text-red-700 border-red-200"      },
} as const;

const ALPHA = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function RealTimeTracking({ items }: RealTimeTrackingProps) {
  return (
    <div className="bg-card border border-border rounded-xl flex flex-col max-h-110">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground tracking-tight leading-none">
            Real-Time Item Tracking
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 leading-none">
            Live updates every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {items.length > 0 && (
            <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {items.length} items
            </span>
          )}
          <Separator orientation="vertical" className="h-3.5" />
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* ── List ───────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-1.5
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-muted-foreground text-lg">⊘</span>
            </div>
            <p className="text-sm font-medium text-foreground">No items tracked yet</p>
            <p className="text-xs text-muted-foreground mt-1">Items will appear here once scanned</p>
          </div>
        )}

        {items.map((item, index) => {
          const cfg   = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.completed;
          const badge = `${ALPHA[index % ALPHA.length]}${(index % 3) + 1}`;

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 px-3.5 py-3 rounded-xl border border-border hover:bg-muted/30 transition-colors duration-150"
            >
              {/* Index badge */}
              <div className="shrink-0 w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-[10px] tracking-tight select-none mt-0.5">
                {badge}
              </div>

              {/* Main */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">

                  {/* LEFT: project + item + material + desc */}
                  <div className="flex-1 min-w-0">

                    {/* Project label + lead code */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none shrink-0">
                        Project
                      </p>
                      <span className="text-border text-[9px] shrink-0">·</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border leading-none">
                        {item.lead.lead_code}
                      </span>
                    </div>

                    {/* Project name */}
                    <p className="text-xs font-semibold text-foreground leading-snug mb-2">
                      {item.project.project_name}
                    </p>

                    {/* Item + Material — stacked mobile, row desktop */}
                    <div className="flex flex-col sm:flex-row sm:gap-x-4 gap-1.5 mb-1.5">
                      <div className="sm:flex-1 min-w-0">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Item</p>
                        <p className="text-[11px] text-foreground font-medium leading-snug">
                          {item.cut_list.item_name || "—"}
                        </p>
                      </div>
                      <div className="sm:flex-1 min-w-0">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Material</p>
                        <p className="text-[11px] text-foreground font-medium leading-snug">
                          {item.cut_list.material_details || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex items-start gap-1">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none shrink-0 mt-0.5">Desc.</span>
                      <span className="text-border text-[9px] shrink-0 mt-0.5">·</span>
                      <p className="text-[11px] text-foreground font-medium leading-snug">
                        {item.cut_list.description || "—"}
                      </p>
                    </div>

                  </div>

                  {/* RIGHT: 2-col — Status→Machine | Date→Operator */}
                  <div className="shrink-0 grid grid-cols-2 gap-x-4 items-start">

                    {/* Col 1: Status pill → Machine */}
                    <div className="flex flex-col items-start gap-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${cfg.pill}`}>
                        <span className={`w-1 h-1 rounded-full shrink-0 ${cfg.dot} ${item.status === "in_process" ? "animate-pulse" : ""}`} />
                        {cfg.label}
                      </span>
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Machine</p>
                        <p className="text-[11px] font-semibold text-foreground leading-snug">
                          {item.machine.machine_name}
                        </p>
                      </div>
                    </div>

                    {/* Col 2: Date → Operator */}
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-[9px] tabular-nums text-muted-foreground font-medium leading-none py-0.5">
                        {item.actual_in_at_formatted || "—"}
                      </span>
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Operator</p>
                        <p className="text-[11px] font-semibold text-foreground leading-snug">
                          {item.operator.user_name || "Waiting"}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}