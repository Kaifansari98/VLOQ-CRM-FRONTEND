"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MapPin } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/custom-tooltip";

import { LeadColumn } from "./column-type";
import {
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
  tableTextSearchFilter,
} from "@/lib/utils";
import CustomeStatusBadge from "@/components/origin-status-badge";

interface UniversalColumnOptions {
  showStageColumn?: boolean;
}

export function getUniversalTableColumns(
  options: UniversalColumnOptions = {},
): ColumnDef<LeadColumn>[] {
  const { showStageColumn = false } = options;
  const columns: ColumnDef<LeadColumn>[] = [
    // 1) Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => (
        <div className=" font-medium">{row.getValue("lead_code")}</div>
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

    // Stage
    ...(showStageColumn
      ? ([
          {
            accessorKey: "status",
            filterFn: tableMultiValueFilter,

            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Stage" />
            ),

            cell: ({ row }) => {
              const status = row.getValue("status") as string;
              return (
                <div className="flex w-full justify-center">
                  <CustomeStatusBadge title={status} />
                </div>
              );
            },
            enableSorting: false,
            enableHiding: true,
            enableColumnFilter: true,
          },
        ] satisfies ColumnDef<LeadColumn>[])
      : []),

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

    // 4) Product Types

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
      sortingFn: siteMapLinkSort<LeadColumn>(),
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border   min-h-[32px]">
            {isValidLink ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center  text-foreground bg-bac gap-1 "
              >
                <MapPin size={14} strokeWidth={2} />
                Open Map
              </a>
            ) : (
              <span className="text-foreground italic ">No Map Available</span>
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
      filterFn: tableTextSearchFilter<LeadColumn>(),
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

    // 9) Architect Name
    {
      accessorKey: "architechName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Architect Name" />
      ),

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: "Architect Name",
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

    // 11) Created At (DATE)
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
        const value = getValue() as string;
        if (!value) return "";
        const date = new Date(value);

        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },

    // 12) Alt Contact
    {
      accessorKey: "altContact",
      header: ({ column }) => (
        <div className="w-full text-center">
          <DataTableColumnHeader column={column} title="Alt Contact" />
        </div>
      ),

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,

      cell: ({ getValue }) => {
        const raw = getValue() as string | null;
        if (!raw) return "—";

        try {
          const phone = parsePhoneNumberFromString(raw);
          return (
            <div className="w-full text-center">
              {phone ? phone.formatInternational() : raw}
            </div>
          );
        } catch {
          return <div className="w-full text-center">{raw}</div>;
        }
      },
      meta: {
        label: "Alt Contact",
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

    // 14) Product Structures
    {
      accessorKey: "furnitueStructures",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Furniture Structures" />
      ),
      meta: {
        label: "Furniture Structures",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
    // 15) Designer Remark
    {
      accessorKey: "designerRemark",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designer Remark" />
      ),

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const full = row.getValue("designerRemark") as string;
        const trunc = full.length > 15 ? full.slice(0, 15) + "..." : full;

        return <RemarkTooltip remark={trunc} remarkFull={full} />;
      },
      meta: {
        label: "Designer Remark",
      },
    },
  ];
  return columns;
}
