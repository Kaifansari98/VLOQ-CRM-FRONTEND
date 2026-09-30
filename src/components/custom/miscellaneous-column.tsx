"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MapPin } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/custom-tooltip";

import {
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
  tableTextSearchFilter,
} from "@/lib/utils";

// -------------------------------------------------------
// 🟣 COLUMN TYPE
// -------------------------------------------------------

export interface MiscLeadColumn {
  id: number;
  srNo: number;
  rowKey?: string;

  lead_code: string;
  name: string;
  email: string;
  contact: string;

  altContact: string;
  siteAddress: string;
  site_map_link: string;
  architechName: string;

  furnitureType: string;
  furnitueStructures: string[];

  source: string;
  siteType: string;

  sales_executive: string;
  assignedToId: string | number;

  createdAt: string | number;
  updatedAt: string;

  status: string;
  statusTag: string;
  account_id: number;

  // 🔵 Misc specific
  pendingMiscCount?: number;
}

// -------------------------------------------------------
// 🟩 COLUMN FACTORY
// -------------------------------------------------------

interface MiscColumnOptions {
  showPendingCount?: boolean;
}

export function getMiscellaneousTableColumns(
  options: MiscColumnOptions = {},
): ColumnDef<MiscLeadColumn>[] {
  const { showPendingCount = true } = options;

  const columns: ColumnDef<MiscLeadColumn>[] = [
    // 1) Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("lead_code")}</div>
      ),
      meta: {
        label: "Lead Code",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 2) Name
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const maxLength = 25;

        if (name.length <= maxLength) return <span>{name}</span>;

        return (
          <CustomeTooltip
            value={name}
            truncateValue={name.slice(0, maxLength) + "..."}
          />
        );
      },
      meta: {
        label: "Name",
      },
    },

    // 3) Contact
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      meta: {
        label: "Contact",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 4) Furniture Type
    {
      accessorKey: "furnitureType",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Furniture Type" />
      ),
      meta: {
        label: "Furniture Type",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 5) Address / Map Link
    {
      accessorKey: "site_map_link",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      sortingFn: siteMapLinkSort<MiscLeadColumn>(),
      meta: {
        label: "Site Map Link",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,

      cell: ({ row }) => {
        const link = row.getValue("site_map_link") as string;

        const isValidLink =
          typeof link === "string" &&
          (link.startsWith("http://") || link.startsWith("https://"));

        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border min-h-[32px]">
            {isValidLink ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-foreground gap-1"
              >
                <MapPin size={14} strokeWidth={2} />
                Open Map
              </a>
            ) : (
              <span className="text-foreground italic">No Map Available</span>
            )}
          </div>
        );
      },
    },

    // 6) Site Type
    {
      accessorKey: "siteType",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      meta: {
        label: "Site Type",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 7) Sales Executive
    {
      accessorKey: "sales_executive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sales Executive" />
      ),
      meta: {
        label: "Sales Executive",
      },
      filterFn: tableSingleValueMultiSelectFilter,
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 8) Site Address
    {
      accessorKey: "siteAddress",
      filterFn: tableTextSearchFilter<MiscLeadColumn>(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const address = row.getValue("siteAddress") as string;
        const maxLen = 30;

        if (!address) return "—";
        if (address.length <= maxLen) return address;

        return (
          <RemarkTooltip
            title="Site Address"
            remarkFull={address}
            remark={address.slice(0, maxLen) + "..."}
          />
        );
      },
      meta: {
        label: "Site Address",
      },
    },

    // 10) Source
    {
      accessorKey: "source",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: "Source",
      },
    },

    // 11) Created At
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      meta: {
        label: "Created At",
        variant: "dateRange",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,

      cell: ({ getValue }) => {
        const value = getValue() as string | number;
        if (!value) return "";
        const date = new Date(value);

        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },

    // 13) Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,

      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const max = 20;
        if (email.length <= max) return email;

        return (
          <CustomeTooltip
            value={email}
            truncateValue={email.slice(0, max) + "..."}
          />
        );
      },
      meta: {
        label: "Email",
      },
    },

    // 14) Pending Misc Count (Misc specific)
    // ...(showPendingCount
    //   ? ([
    //       {
    //         accessorKey: "pendingMiscCount",
    //         header: ({ column }) => (
    //           <DataTableColumnHeader
    //             column={column}
    //             title="Pending Misc"
    //           />
    //         ),
    //         cell: ({ row }) => {
    //           const count = row.getValue("pendingMiscCount") as
    //             | number
    //             | undefined;
    //           if (count === undefined || count === null) return "—";
    //           return (
    //             <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 text-xs font-medium">
    //               {count} Pending
    //             </span>
    //           );
    //         },
    //         meta: {
    //           label: "Pending Misc",
    //         },
    //         enableSorting: false,
    //         enableHiding: true,
    //         enableColumnFilter: false,
    //       },
    //     ] satisfies ColumnDef<MiscLeadColumn>[])
    //   : []),
  ];

  return columns;
}