"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { daysAgo, today } from "../shared/reportUtils";

export function ReportsFilters({
  from,
  to,
  loading,
  onFromChange,
  onToChange,
  onRefresh,
}: {
  from: string;
  to: string;
  loading: boolean;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onRefresh: () => void;
}) {
  const presets = [
    { label: "7 Days", from: daysAgo(7) },
    { label: "30 Days", from: daysAgo(30) },
    { label: "90 Days", from: daysAgo(90) },
  ];

  return (
    <div className="sticky top-0 z-20 rounded-[24px] border bg-background/90 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <span className="text-xs font-bold text-muted-foreground">to</span>

          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <div className="ml-0 flex gap-1 lg:ml-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onFromChange(p.from);
                  onToChange(today());
                }}
                className="rounded-xl border px-3 py-2 text-xs font-bold text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-10 rounded-xl gap-1.5"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh
        </Button>
      </div>
    </div>
  );
}