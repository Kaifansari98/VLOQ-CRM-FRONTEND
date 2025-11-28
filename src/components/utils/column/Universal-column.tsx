"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MapPin } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/cutome-tooltip";

import { LeadColumn } from "./column-type";

export function getUniversalTableColumns(): ColumnDef<LeadColumn>[] {
  return [
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
        variant: "text",
        placeholder: "Search Lead Code...",
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
    },

    // 3) Contact
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 4) Product Types
    {
      accessorKey: "productTypes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Types" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 5) Address / Map Link
    {
      accessorKey: "site_map_link",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,

      cell: ({ row }) => {
        const link = row.getValue("site_map_link") as string;

        const isValidLink =
          typeof link === "string" &&
          (link.startsWith("http://") || link.startsWith("https://"));

        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-black/20 bg-white min-h-[32px]">
            {isValidLink ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-black"
              >
                <MapPin size={14} strokeWidth={2} />
                Open Map
              </a>
            ) : (
              <span className="text-gray-400 italic">No Map Available</span>
            )}
          </div>
        );
      },
    },

    // 6) Site Type
    {
      accessorKey: "siteType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 7) Sales Executive
    {
      accessorKey: "assign_to",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sales Executive" />
      ),

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // 8) Site Address
    {
      accessorKey: "siteAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      enableSorting: true,
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
    },

    // 10) Source
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
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

      enableSorting: false,
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
    },

    // 14) Product Structures
    {
      accessorKey: "productStructures",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Structures" />
      ),

      enableSorting: true,
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
    },
  ];
}
