"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  PaginationState,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useVendors, type VendorListItem } from "@/api/vendors";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import ClearInput from "@/components/origin-input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImageViewerModal from "@/components/utils/ImageViewerModal";
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";

// ─── Row type ────────────────────────────────────────────────────────────────

type VendorRow = {
  srNo: number;
  id: number;
  vendor_name: string;
  vendor_code: string;
  subdomain_url: string;
  primary_contact_email: string;
  primary_contact_number: string;
  primary_contact_name: string;
  status: string;
  is_crm_enabled: boolean;
  is_inventory_enabled: boolean;
  is_tracktrace_enabled: boolean;
  createdAt: string;
  logoUrl?: string;
  iconUrl?: string;
  loginImageUrl?: string;
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

// Columns are defined inside the VendorsTable component to access local state.

// ─── Component ───────────────────────────────────────────────────────────────

interface VendorsTableProps {
  onLoginToVendor?: (row: VendorRow) => void;
  onConfigureVendor?: (row: VendorRow) => void;
}

export default function VendorsTable({
  onLoginToVendor,
  onConfigureVendor,
}: VendorsTableProps) {
  const router = useRouter();

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const { data, isLoading, isError, error } = useVendors({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter || undefined,
  });

  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState("");

  const tableData = React.useMemo<VendorRow[]>(
    () =>
      (data?.data ?? []).map((item: VendorListItem, index: number) => ({
        srNo: pagination.pageIndex * pagination.pageSize + index + 1,
        id: item.id,
        vendor_name: item.vendor_name ?? "",
        vendor_code: item.vendor_code ?? "",
        subdomain_url: item.subdomain_url ?? "",
        primary_contact_name: item.primary_contact_name ?? "",
        primary_contact_email: item.primary_contact_email ?? "",
        primary_contact_number: item.primary_contact_number ?? "",
        status: item.status ?? "",
        is_crm_enabled: item.is_crm_enabled !== false,
        is_inventory_enabled: item.is_inventory_enabled === true,
        is_tracktrace_enabled: item.is_tracktrace_enabled === true,
        createdAt: item.createdAt ?? "",
        logoUrl: item.logoUrl ?? "",
        iconUrl: item.iconUrl ?? "",
        loginImageUrl: item.loginImageUrl ?? "",
      })),
    [data, pagination.pageIndex, pagination.pageSize],
  );

  const columns = React.useMemo<ColumnDef<VendorRow>[]>(
    () => [
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
        accessorKey: "vendor_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vendor Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("vendor_name") || "—"}</span>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "vendor_code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vendor Code" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.getValue("vendor_code") || "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "primary_contact_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact Person" />
        ),
        cell: ({ row }) => (
          <span>{row.getValue("primary_contact_name") || "—"}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "primary_contact_email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("primary_contact_email") || "—"}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "primary_contact_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact No." />
        ),
        cell: ({ row }) => (
          <span>{row.getValue("primary_contact_number") || "—"}</span>
        ),
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
        accessorKey: "is_inventory_enabled",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Inventory" />
        ),
        cell: ({ row }) => {
          const enabled = row.getValue("is_inventory_enabled") as boolean;
          return (
            <Badge
              variant={enabled ? "default" : "secondary"}
              className={cn(
                "text-xs",
                enabled
                  ? "bg-blue-500/10 text-blue-600 border border-blue-200 hover:bg-blue-500/10"
                  : "",
              )}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "is_tracktrace_enabled",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Track & Trace" />
        ),
        cell: ({ row }) => {
          const enabled = row.getValue("is_tracktrace_enabled") as boolean;
          return (
            <Badge
              variant={enabled ? "default" : "secondary"}
              className={cn(
                "text-xs",
                enabled
                  ? "bg-violet-500/10 text-violet-600 border border-violet-200 hover:bg-violet-500/10"
                  : "",
              )}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
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
      {
        id: "actions",
        header: () => <div>Actions</div>,
        cell: ({ row }) => {
          const original = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureVendor?.(original);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!original.logoUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  if (original.logoUrl) {
                    setViewerUrl(original.logoUrl);
                    setViewerOpen(true);
                  }
                }}
              >
                Logo
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!original.iconUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  if (original.iconUrl) {
                    setViewerUrl(original.iconUrl);
                    setViewerOpen(true);
                  }
                }}
              >
                Icon
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!original.loginImageUrl}
                onClick={(e) => {
                  e.stopPropagation();
                  if (original.loginImageUrl) {
                    setViewerUrl(original.loginImageUrl);
                    setViewerOpen(true);
                  }
                }}
              >
                Login Image
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onConfigureVendor],
  );

  const totalPages = data?.pagination?.totalPages ?? 1;

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowDoubleClick = (row: VendorRow) => {
    router.push(`/dashboard/vendors/${row.id}`);
  };

  const handleVendorMasterNavigation = (
    row: VendorRow,
    path: "/dashboard/masters-management/field-masters" | "/dashboard/masters-management/user-master",
  ) => {
    const params = new URLSearchParams({ vendor_id: String(row.id) });
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <Card className="rounded-2xl p-0 border-0">
      <CardContent className="space-y-4 p-0">
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <ClearInput
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder="Search vendors..."
            className="h-9 w-full max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
            Loading vendors...
          </div>
        ) : isError ? (
          <div className="rounded-lg border bg-background p-6 text-sm text-destructive space-y-1">
            <p className="font-medium">Failed to load vendors.</p>
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
            No vendors found.
          </div>
        ) : (
          <div className="select-none">
            <DataTable
              table={table}
              onRowDoubleClick={handleRowDoubleClick}
              renderRowContextMenu={(row) => (
                <>
                  <ContextMenuItem onClick={() => onConfigureVendor?.(row)}>
                    Configure Vendor
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onLoginToVendor?.(row)}>
                    {`Login to ${row.vendor_name}`}
                  </ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>CRM Masters</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem
                        onClick={() =>
                          handleVendorMasterNavigation(
                            row,
                            "/dashboard/masters-management/field-masters",
                          )
                        }
                      >
                        Field Masters
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() =>
                          handleVendorMasterNavigation(
                            row,
                            "/dashboard/masters-management/user-master",
                          )
                        }
                      >
                        User Master
                      </ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </>
              )}
            />
          </div>
        )}
      </CardContent>
      <ImageViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageUrl={viewerUrl}
      />
    </Card>
  );
}
