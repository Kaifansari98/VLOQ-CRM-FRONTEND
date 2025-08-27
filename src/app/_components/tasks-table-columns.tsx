"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableRowAction } from "@/types/data-table";
import { canReassingLead } from "@/components/utils/privileges";

export type ProcessedLead = {
  id: number;
  srNo: number;
  name: string;
  email: string;
  contact: string;
  priority: string;
  siteAddress: string;
  billingName: string;
  architechName: string;
  designerRemark: string;
  productTypes: string;
  productStructures: string;
  source: string;
  siteType: string;
  createdAt: string;
  updatedAt: string;
};

interface GetVendorLeadsTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<ProcessedLead> | null>
  >;
  userType?: string;
}

export function getVendorLeadsTableColumns({
  setRowAction,
  userType,
}: GetVendorLeadsTableColumnsProps): ColumnDef<ProcessedLead>[] {
  return [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //       className="translate-y-0.5"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //       className="translate-y-0.5"
    //     />
    //   ),
    //   enableSorting: false, // Fixed: Checkbox column shouldn't be sortable
    //   enableHiding: false, // Fixed: Don't hide select column
    //   size: 50,
    // },
    {
      accessorKey: "srNo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sr. No." />
      ),
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "billingName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Billing Name" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "siteAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "architechName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Architect Name" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ getValue }) => {
        const dateValue = getValue() as string;
        return dateValue ? new Date(dateValue).toLocaleDateString() : "";
      },
      sortingFn: (rowA, rowB, columnId) => {
        const aDate = new Date(rowA.getValue(columnId) as string);
        const bDate = new Date(rowB.getValue(columnId) as string);
        return aDate.getTime() - bDate.getTime();
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    ...(canReassingLead(userType)
      ? [
          {
            accessorKey: "assign_to",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Sales Executive" />
            ),
            cell: ({ row }) => row.getValue("assign_to"),
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          } as ColumnDef<ProcessedLead>,
        ]
      : []),
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Open menu"
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
            >
              <Ellipsis className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {/* 👇 New View Option */}
            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "view" })}
            >
              View
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "edit" })}
            >
              Edit
            </DropdownMenuItem>

            {canReassingLead(userType) && (
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "reassignlead" })}
              >
                Reassign Lead
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "delete" })}
            >
              Delete
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ];
}
