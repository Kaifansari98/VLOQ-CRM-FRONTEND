"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { useSmallOrderRequestsByLead } from "@/hooks/useLeadsQueries";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SmallOrderRequestRow = {
  srNo: number;
  id: number;
  so_code: string | null;
  request_type: string;
  request_source: "post_dispatch" | "final_handover";
  status: "pending_approval" | "pending_approvals" | "approved" | "rejected";
  is_request_resolved: boolean;
  required_date: string;
  requested_by: string;
  created_at: string;
  supervisor_approved: boolean;
  admin_approved: boolean;
  document_count: number;
  remarks: string | null;
  linked_lead_id: number | null;
  linked_lead_account_id: number | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value?: string | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "—";

  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({
  value,
}: {
  value: SmallOrderRequestRow["status"];
}) {
  const normalized = String(value ?? "").toLowerCase();
  const classes =
    normalized === "approved"
      ? "border-emerald-200 bg-emerald-500/10 text-emerald-600"
      : normalized === "rejected"
        ? "border-rose-200 bg-rose-500/10 text-rose-600"
        : "border-amber-200 bg-amber-500/10 text-amber-600";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        classes,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatLabel(value)}
    </span>
  );
}

function ApprovalBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-500/10 text-emerald-600"
    >
      Approved
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Pending
    </Badge>
  );
}

function ResolutionBadge({ resolved }: { resolved: boolean }) {
  return resolved ? (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-500/10 text-emerald-600"
    >
      Resolved
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Pending
    </Badge>
  );
}

const columns: ColumnDef<SmallOrderRequestRow>[] = [
  {
    accessorKey: "srNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sr. No." />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.srNo}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "so_code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Small Order Lead" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.so_code || "Not generated yet"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "request_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type of Order" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "request_source",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => formatLabel(row.original.request_source),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge value={row.original.status} />,
    enableSorting: false,
  },
  {
    accessorKey: "is_request_resolved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resolved" />
    ),
    cell: ({ row }) => (
      <ResolutionBadge resolved={row.original.is_request_resolved} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "required_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Required Date" />
    ),
    cell: ({ row }) => formatDate(row.original.required_date),
    enableSorting: false,
  },
  {
    accessorKey: "requested_by",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requested By" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "supervisor_approved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supervisor" />
    ),
    cell: ({ row }) => (
      <ApprovalBadge approved={row.original.supervisor_approved} />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "admin_approved",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Admin" />
    ),
    cell: ({ row }) => <ApprovalBadge approved={row.original.admin_approved} />,
    enableSorting: false,
  },
  {
    accessorKey: "document_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Documents" />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => formatDate(row.original.created_at),
    enableSorting: false,
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remarks" />
    ),
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[280px] text-sm">
        {row.original.remarks?.trim() || "—"}
      </span>
    ),
    enableSorting: false,
  },
];

export default function SmallOrderRequestsTable({
  vendorId,
  leadId,
  requestSource,
}: {
  vendorId: number;
  leadId: number;
  requestSource?: "post_dispatch" | "final_handover";
}) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { data, isLoading, isError, error } = useSmallOrderRequestsByLead(
    vendorId,
    leadId,
  );

  const tableData = React.useMemo<SmallOrderRequestRow[]>(
    () =>
      (data?.data ?? [])
        .filter((request) =>
          requestSource ? request.request_source === requestSource : true,
        )
        .map((request, index) => ({
        srNo: index + 1,
        id: request.id,
        so_code: request.so_code,
        request_type: request.requestType?.type ?? "—",
        request_source: request.request_source,
        status: request.status,
        is_request_resolved: request.is_request_resolved,
        required_date: request.required_date,
        requested_by: request.createdBy?.user_name?.trim() || "—",
        created_at: request.created_at,
        supervisor_approved: request.supervisor_approved,
        admin_approved: request.admin_approved,
        document_count: request.document_count ?? 0,
        remarks: request.remarks,
        linked_lead_id: request.linked_lead?.id ?? null,
        linked_lead_account_id: request.linked_lead?.account_id ?? null,
      })),
    [data, requestSource],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <Card className="rounded-2xl border-0 p-0 shadow-none">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            Loading small order requests...
          </div>
        ) : isError ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-destructive">
            {(error as any)?.response?.data?.message ??
              error?.message ??
              "Failed to load small order requests."}
          </div>
        ) : tableData.length === 0 ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            No small order requests found for this lead.
          </div>
        ) : (
          <DataTable
            table={table}
            onRowDoubleClick={(row) => {
              if (
                row.status !== "approved" ||
                !row.linked_lead_id ||
                !row.linked_lead_account_id
              ) {
                return;
              }

              router.push(
                `/dashboard/leads/details/${row.linked_lead_id}?accountId=${row.linked_lead_account_id}`,
              );
            }}
            rowClassName={(row) =>
              row.status === "approved" && row.linked_lead_id
                ? "cursor-pointer"
                : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
