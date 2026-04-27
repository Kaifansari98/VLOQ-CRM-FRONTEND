"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useAppSelector } from "@/redux/store";
import { useAdminTaskOverview } from "@/api/dashboard/useDashboard";
import type { AdminTaskOverviewRow } from "@/api/dashboard/dashboard.api";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ClearInput from "@/components/origin-input";
import { ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "open" | "completed";
type OverviewFilter = "all" | "today" | "upcoming" | "overdue";
type SalesExecutiveFilter = "all" | number;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "open",        label: "Open"        },
  { value: "completed",   label: "Completed"   },
];

const OVERVIEW_OPTIONS: { value: OverviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "overdue", label: "Overdue" },
];

const STATUS_BADGE: Record<AdminTaskOverviewRow["status"], string> = {
  open:        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const STATUS_LABEL: Record<AdminTaskOverviewRow["status"], string> = {
  open:        "Open",
  in_progress: "In Progress",
  completed:   "Completed",
};

type SalesExecutiveOption = {
  id: number;
  user_name: string;
};

// ─── Overview badge ───────────────────────────────────────────────────────────

function OverviewBadge({ status, dueDate }: { status: AdminTaskOverviewRow["status"]; dueDate: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
        Completed
      </span>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();

  if (diff < 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
        Overdue
      </span>
    );
  }
  if (diff === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
        Today
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
      Upcoming
    </span>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<AdminTaskOverviewRow>[] = [
  {
    accessorKey: "lead_code",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lead Code" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">{row.getValue("lead_code")}</span>
    ),
  },
  {
    accessorKey: "sales_executive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sales Executive" />,
    cell: ({ row }) => <span className="text-xs">{row.getValue("sales_executive")}</span>,
  },
  {
    accessorKey: "task_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task Type" />,
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("task_type")}</span>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const s = row.getValue<AdminTaskOverviewRow["status"]>("status");
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_BADGE[s]}`}>
          {STATUS_LABEL[s]}
        </span>
      );
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.getValue<string>("due_date")).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    id: "overview",
    header: "Overview",
    cell: ({ row }) => (
      <OverviewBadge status={row.original.status} dueDate={row.original.due_date} />
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminTaskTable() {
  const vendorId  = useAppSelector((s) => s.auth.user?.vendor_id);
  const franchiseId = useAppSelector((s) => s.auth.franchise_id);

  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("open");
  const [overviewFilter, setOverviewFilter] = useState<OverviewFilter>("all");
  const [salesExecutiveFilter, setSalesExecutiveFilter] =
    useState<SalesExecutiveFilter>("all");
  const [sorting, setSorting]       = useState<SortingState>([]);

  const PAGE_SIZE = 20;

  const { data: salesExecutivesResult, isLoading: isSalesExecutivesLoading } =
    useVendorSalesExecutiveUsers(vendorId as number, franchiseId ?? undefined);

  const salesExecutiveOptions = useMemo(() => {
    const executives = salesExecutivesResult?.data?.sales_executives;
    if (!Array.isArray(executives)) return [];

    return executives.map((executive: SalesExecutiveOption) => ({
      value: executive.id,
      label: executive.user_name,
    }));
  }, [salesExecutivesResult]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const { data: result, isLoading } = useAdminTaskOverview(vendorId, {
    franchiseId: franchiseId ?? undefined,
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    overview: overviewFilter,
    salesExecutiveId:
      salesExecutiveFilter === "all" ? undefined : salesExecutiveFilter,
  });

  const rows        = result?.data ?? [];
  const totalPages  = result?.pagination.totalPages ?? 1;
  const total       = result?.pagination.total ?? 0;

  const table = useReactTable<AdminTaskOverviewRow>({
    data: rows,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      pagination: { pageIndex: page - 1, pageSize: PAGE_SIZE },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function"
        ? updater({ pageIndex: page - 1, pageSize: PAGE_SIZE })
        : updater;
      setPage(next.pageIndex + 1);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const activeStatusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Open";
  const activeOverviewLabel =
    OVERVIEW_OPTIONS.find((o) => o.value === overviewFilter)?.label ?? "All";
  const activeSalesExecutiveLabel =
    salesExecutiveFilter === "all"
      ? "All"
      : salesExecutiveOptions.find((o) => o.value === salesExecutiveFilter)?.label ?? "All";

  return (
    <div className="border rounded-2xl bg-background overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Task Overview</p>
          <p className="text-xs text-muted-foreground">
            Sales executive tasks by franchise
            {!isLoading && ` · ${total.toLocaleString()} total`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ClearInput
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search..."
            className="h-8 w-48"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 gap-1 text-xs text-muted-foreground">
                Status: {activeStatusLabel}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {STATUS_OPTIONS.map((o) => (
                <DropdownMenuItem
                  key={o.value}
                  onClick={() => { setStatusFilter(o.value); setPage(1); }}
                >
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 gap-1 text-xs text-muted-foreground"
                disabled={isSalesExecutivesLoading}
              >
                Sales Executive: {activeSalesExecutiveLabel}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  setSalesExecutiveFilter("all");
                  setPage(1);
                }}
              >
                All
              </DropdownMenuItem>
              {salesExecutiveOptions.map((o) => (
                <DropdownMenuItem
                  key={o.value}
                  onClick={() => {
                    setSalesExecutiveFilter(o.value);
                    setPage(1);
                  }}
                >
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 gap-1 text-xs text-muted-foreground">
                Overview: {activeOverviewLabel}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {OVERVIEW_OPTIONS.map((o) => (
                <DropdownMenuItem
                  key={o.value}
                  onClick={() => { setOverviewFilter(o.value); setPage(1); }}
                >
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DataTable table={table} className="rounded-none border-0">
        {null}
      </DataTable>
    </div>
  );
}

export default AdminTaskTable;
