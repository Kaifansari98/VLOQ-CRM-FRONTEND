"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { useFranchisesByVendor, type FranchiseListItem } from "@/api/franchises";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Row type ────────────────────────────────────────────────────────────────

type FranchiseRow = {
  srNo: number;
  id: number;
  franchise_name: string;
  franchise_code: string;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  address: string;
  pincode: string;
  is_head_office: boolean;
  status: string;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Columns ─────────────────────────────────────────────────────────────────

const columns: ColumnDef<FranchiseRow>[] = [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("srNo")}</span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "franchise_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Franchise Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue("franchise_name") || "—"}
      </span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "franchise_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Franchise Code" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("franchise_code") || "—"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "contact_person",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Person" />
    ),
    cell: ({ row }) => (
      <span>{row.getValue("contact_person") || "—"}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "contact_email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("contact_email") || "—"}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "contact_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact No." />
    ),
    cell: ({ row }) => (
      <span>{row.getValue("contact_number") || "—"}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => {
      const addr = row.getValue("address") as string;
      const pincode = row.original.pincode;
      if (!addr && !pincode) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="text-sm">
          {[addr, pincode].filter(Boolean).join(", ")}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "is_head_office",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Head Office" />
    ),
    cell: ({ row }) => {
      const isHead = row.getValue("is_head_office") as boolean;
      return isHead ? (
        <Badge
          variant="default"
          className="bg-amber-500/10 text-amber-600 border border-amber-200 hover:bg-amber-500/10 text-xs"
        >
          Head Office
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = ((row.getValue("status") as string) || "").toLowerCase();
      const isActive = status === "active";
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
            isActive
              ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
              : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isActive ? "bg-emerald-500" : "bg-zinc-400",
            )}
          />
          {status || "—"}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
    enableSorting: false,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface FranchisesTableProps {
  vendorId: number;
}

export default function FranchisesTable({ vendorId }: FranchisesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const { data, isLoading, isError, error } = useFranchisesByVendor(vendorId);

  const tableData = React.useMemo<FranchiseRow[]>(
    () =>
      (data?.data ?? []).map((item: FranchiseListItem, index: number) => ({
        srNo: index + 1,
        id: item.id,
        franchise_name: item.franchise_name ?? "",
        franchise_code: item.franchise_code ?? "",
        contact_person: item.contact_person ?? "",
        contact_email: item.contact_email ?? "",
        contact_number: item.contact_number ?? "",
        address: item.address ?? "",
        pincode: item.pincode ?? "",
        is_head_office: item.is_head_office === true,
        status: item.status ?? "",
        createdAt: item.createdAt ?? "",
      })),
    [data],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="rounded-2xl border-0 p-0">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            Loading franchises...
          </div>
        ) : isError ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-destructive space-y-1">
            <p className="font-medium">Failed to load franchises.</p>
            <p className="text-xs text-muted-foreground font-mono">
              {(error as any)?.response?.status
                ? `HTTP ${(error as any).response.status} — `
                : ""}
              {(error as any)?.response?.data?.message ??
                (error as any)?.message ??
                "Unknown error"}
            </p>
          </div>
        ) : tableData.length === 0 ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            No franchise stores found for this vendor.
          </div>
        ) : (
          <div className="select-none">
            <DataTable table={table} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
