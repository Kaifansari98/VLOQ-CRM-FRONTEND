"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, Search, X } from "lucide-react";

const GRN_STATUSES = ["", "Draft", "Confirmed", "Closed"];

export function GRNFilters({
  search,
  status,
  loading,
  onSearch,
  onStatus,
  onRefresh,
}: {
  search: string;
  status: string;
  loading: boolean;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black">GRN Register</p>
          <p className="text-xs text-muted-foreground">
            Track goods received against approved purchase orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search GRN, PO or supplier..."
              className="h-9 w-full rounded-xl border bg-background pl-9 pr-8 text-xs outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />

            {search && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GRN_STATUSES.map((s) => (
              <button
                key={s || "All"}
                onClick={() => onStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
                  status === s
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-border text-muted-foreground hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/30"
                )}
              >
                {s || "All"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-9 rounded-xl px-3"
          >
            <RefreshCw
              size={14}
              className={cn(loading && "animate-spin")}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}