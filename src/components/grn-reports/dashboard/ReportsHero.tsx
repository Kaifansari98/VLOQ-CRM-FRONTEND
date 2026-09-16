"use client";

import { BarChart3, Sparkles } from "lucide-react";
import { fmtDate } from "../shared/reportUtils";

export function ReportsHero({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border bg-background shadow-sm">
      <div className="relative p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-indigo-500/10" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
              <BarChart3 size={26} />
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles size={13} className="text-indigo-500" />
                Procurement Intelligence
              </div>

              <h1 className="text-3xl font-black tracking-tight">
                GRN Analytics & Reports
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Track received quantity, accepted stock, supplier rejection,
                delivery delays, and vendor performance in one premium dashboard.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border bg-indigo-50/70 p-4 text-right dark:bg-indigo-950/30">
            <p className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
              Reporting Period
            </p>
            <p className="mt-1 text-sm font-black text-indigo-700 dark:text-indigo-300">
              {fmtDate(from)} → {fmtDate(to)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}