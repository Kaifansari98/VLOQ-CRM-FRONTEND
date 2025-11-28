"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Text } from "lucide-react";
import type { DataTableRowActionFinalMeasurement } from "@/types/data-table";
import { canReassingLead } from "@/components/utils/privileges";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import CustomeStatusBadge from "@/components/origin-status-badge";
import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/cutome-tooltip";
import { ProcessedBookingLead } from "@/types/booking-types";

interface GetTechCheckTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<
      DataTableRowActionFinalMeasurement<ProcessedBookingLead> | null
    >
  >;
  userType?: string;
}

export function getTechCheckTableColumns({
  userType,
}: GetTechCheckTableColumnsProps): ColumnDef<ProcessedBookingLead>[] {
  return [
    // Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.getValue("lead_code")}
        </div>
      ),
      meta: { label: "Lead Code" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Name
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Client Name" />
      ),
      meta: { label: "Name", variant: "text", icon: Text },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const max = 25;
        if (name.length <= max) return <span>{name}</span>;
        const trunc = name.slice(0, max) + "...";
        return <CustomeTooltip value={name} truncateValue={trunc} />;
      },
    },

    // Contact
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      meta: { label: "Contact" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Product Types
    {
      accessorKey: "productTypes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Types" />
      ),
      meta: { label: "Product Types" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      meta: { label: "Status" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ row }) => (
        <div className="flex items-center">
          <CustomeStatusBadge title={row.getValue("status")} />
        </div>
      ),
    },

    // Site Type
    {
      accessorKey: "siteType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      meta: { label: "Site Type" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Assigned User
    ...(canReassingLead(userType)
      ? [
          {
            accessorKey: "assignedTo",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Assigned To" />
            ),
            cell: ({ row }) => row.getValue("assignedTo"),
            meta: { label: "Assigned To" },
            enableSorting: true,
            enableColumnFilter: true,
            enableHiding: true,
          } as ColumnDef<ProcessedBookingLead>,
        ]
      : []),

    // Site Address
    {
      accessorKey: "siteAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      meta: { label: "Site Address" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ row }) => {
        const address = row.getValue("siteAddress") as string;
        const max = 30;
        if (address.length <= max) return <span>{address}</span>;
        const trunc = address.slice(0, max) + "...";
        return <RemarkTooltip remark={trunc} remarkFull={address} />;
      },
    },

    // Architect Name
    {
      accessorKey: "architechName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Architect Name" />
      ),
      meta: { label: "Architect Name" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Source
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      meta: { label: "Source" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Created At
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      meta: { label: "Created At" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        if (!val) return "";
        const date = new Date(val);
        return (
          <span className="text-gray-700">
            {date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },

    // Alt Contact
    {
      accessorKey: "altContact",
      header: ({ column }) => (
        <div className="w-full text-center">
          <DataTableColumnHeader column={column} title="Alt Contact" />
        </div>
      ),
      meta: { label: "Alt Contact" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ getValue }) => {
        const raw = getValue() as string | null;
        let formatted = "–";
        if (raw) {
          try {
            const phone = parsePhoneNumberFromString(raw);
            formatted = phone ? phone.formatInternational() : raw;
          } catch {
            formatted = raw;
          }
        }
        return <div className="w-full text-center">{formatted}</div>;
      },
    },

    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      meta: { label: "Email" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const max = 22;
        if (email.length <= max) return <span>{email}</span>;
        const trunc = email.slice(0, max) + "...";
        return <CustomeTooltip value={email} truncateValue={trunc} />;
      },
    },

    // Product Structures
    {
      accessorKey: "productStructures",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Structures" />
      ),
      meta: { label: "Product Structures" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Designer Remark
    {
      accessorKey: "designerRemark",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designer Remark" />
      ),
      meta: { label: "Designer Remark" },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      cell: ({ row }) => {
        const full = row.getValue("designerRemark") as string;
        const short =
          full.length > 15 ? full.slice(0, 15) + "..." : full;
        return <RemarkTooltip remark={short} remarkFull={full} />;
      },
    },
  ];
}
