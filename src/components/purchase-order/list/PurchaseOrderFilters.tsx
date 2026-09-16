"use client";

import { POStatus } from "@/api/purchaseOrder/purchaseOrder";
import { cn } from "@/lib/utils";
import { Search, X, RefreshCw } from "lucide-react";
import { STATUS_CFG } from "../shared/poUtils";

export function PurchaseOrderFilters({
  search,
  statusFilter,
  loading,
  onSearch,
  onStatus,
  onRefresh,
}: {
  search: string;
  statusFilter: POStatus | "";
  loading: boolean;
  onSearch: (v: string) => void;
  onStatus: (v: POStatus | "") => void;
  onRefresh: () => void;
}) {
  const statuses = Object.keys(STATUS_CFG) as POStatus[];

  return (
    <div className="rounded-[28px] border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([["", "All"], ...statuses.map((s) => [s, STATUS_CFG[s].label])] as [
            string,
            string,
          ][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => onStatus(val as POStatus | "")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                statusFilter === val
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:border-indigo-300 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative w-full lg:w-80">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search PO no..."
              className="h-10 w-full rounded-xl border bg-muted/30 pl-9 pr-9 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
            />

            {search && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}