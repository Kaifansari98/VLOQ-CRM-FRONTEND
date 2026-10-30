"use client";

import { POStatus } from "@/api/purchaseOrder/purchaseOrder";
import { Search, X, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-72 md:w-80">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search PO no..."
          className="h-9 w-full rounded-lg border bg-background pl-9 pr-8 text-xs outline-none transition-colors hover:bg-muted/20 focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <Select
        value={statusFilter || "all"}
        onValueChange={(val) =>
          onStatus(val === "all" ? "" : (val as POStatus))
        }
      >
        <SelectTrigger className="h-9 w-[170px] rounded-lg border bg-background text-xs font-medium">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border bg-popover text-xs shadow-lg">
          <SelectItem value="all" className="text-xs">
            All Statuses
          </SelectItem>
          <SelectItem value="Draft" className="text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Draft
            </span>
          </SelectItem>
          <SelectItem value="Approved" className="text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Approved
            </span>
          </SelectItem>
          <SelectItem value="PartiallyReceived" className="text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Partially Received
            </span>
          </SelectItem>
          <SelectItem value="Received" className="text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Received
            </span>
          </SelectItem>
          <SelectItem value="Cancelled" className="text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Cancelled
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={onRefresh}
        title="Refresh"
        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}