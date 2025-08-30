"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Eye, SquarePen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableRowAction } from "@/types/data-table";
import { canDeleteLead, canReassingLead } from "@/components/utils/privileges";

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
            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "view" })}
            >
              <Eye size={20} />
              View
            </DropdownMenuItem>
            {!canDeleteLead(userType) && <DropdownMenuSeparator />}

            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "edit" })}
            >
              <SquarePen size={20} />
              Edit
            </DropdownMenuItem>

            {canReassingLead(userType) && (
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "reassignlead" })}
              >
                <Users size={20} />
                Reassign Lead
              </DropdownMenuItem>
            )}

            {canDeleteLead(userType) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  Delete
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
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
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
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
      accessorKey: "siteType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ getValue }) => {
        const priority = getValue() as string;
        // You can customize the display based on priority value
        const priorityColors = {
          urgent: "text-red-600 font-bold",
          high: "text-orange-600 font-medium",
          standard: "text-green-600",
          low: "text-gray-600",
        };
        return (
          <div className="p-1 flex items-center justify-center">
            <span
              className={
                priorityColors[priority as keyof typeof priorityColors] || ""
              }
            >
              {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
            </span>
          </div>
        );
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
  ];
}
