"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface BroadcastCategoryMasterRow {
  srNo: number;
  id: number;
  category: string;
  type: string;
  status: string;
}

export const getBroadcastCategoryMastersColumns = ({
  onEdit,
  onToggleStatus,
}: {
  onEdit: (row: BroadcastCategoryMasterRow) => void;
  onToggleStatus: (row: BroadcastCategoryMasterRow) => void;
}): ColumnDef<BroadcastCategoryMasterRow>[] => [
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
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("category") || "—"}</span>
    ),
    enableSorting: true,
    enableHiding: false,
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
              : "border-zinc-200 bg-zinc-100 text-zinc-600",
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
    enableSorting: true,
    enableHiding: false,
  },
  {
    id: "actions",
    header: () => <div>Action</div>,
    cell: ({ row }) => {
      const original = row.original;
      const isActive = original.status?.toLowerCase() === "active";

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(original)}
            data-slot="action-button"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(original)}
            data-slot="action-button"
          >
            {isActive ? "Mark Inactive" : "Mark Active"}
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
