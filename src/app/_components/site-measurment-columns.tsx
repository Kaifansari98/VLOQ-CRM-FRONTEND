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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ellipsis,
  Eye,
  Users,
  Text,
  CheckCircle,
  Clock,
  XCircle,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataTableRowActionSiteMeasurement } from "@/types/data-table";
import { canDeleteLead, canReassingLead } from "@/components/utils/privileges";
import CustomeBadge from "@/components/origin-badge";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import CustomeStatusBadge from "@/components/origin-status-badge";
import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/cutome-tooltip";
import { ProcessedSiteMeasurementLead } from "@/types/site-measrument-types";
import { useRouter } from "next/navigation";

interface GetSiteMeasurementColumnProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowActionSiteMeasurement<ProcessedSiteMeasurementLead> | null>
  >;
  userType?: string;
  router: ReturnType<typeof useRouter>;
}

export function getSiteMeasurementColumn({
  setRowAction,
  userType,
  router,
}: GetSiteMeasurementColumnProps): ColumnDef<ProcessedSiteMeasurementLead>[] {
  return [
    // Sr NO
    {
      accessorKey: "srNo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sr. No." />
      ),
      cell: ({ row }) => (
        <div className="w-full text-center">
          {row.getValue("srNo")}
        </div>
      ),
      meta: {
        label: "SrNo",
      },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },    

    // First name and lastname: 1
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: "Name",
        placeholder: "Search names...",
        variant: "text",
        icon: Text,
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const maxLength = 25;

        // Agar name chhota hai, sirf text dikhaye
        if (name.length <= maxLength) {
          return <span>{name}</span>;
        }

        // Agar name bada hai, truncate + tooltip dikhaye
        const truncateValue = name.slice(0, maxLength) + "...";

        return <CustomeTooltip value={name} truncateValue={truncateValue} />;
      },
    },
    // contact: 2
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: "Contact",
      },
    },

    // Email : 3
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      meta: {
        label: "Email",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const maxLength = 20;

        if (email.length <= maxLength) {
          return <span>{email}</span>;
        }

        const truncateValue = email.slice(0, maxLength) + "...";

        return <CustomeTooltip truncateValue={truncateValue} value={email} />;
      },
    },

    // Status : 5
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      meta: {
        label: "Status",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        return (
          <div className="flex items-center justify-center">
            <CustomeStatusBadge title={status} />
          </div>
        );
      },
    },

    // Site Type: 6
    {
      accessorKey: "siteType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      meta: {
        label: "Site Type",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // Sales Executive: 7 - FIXED the column definition
    ...(canReassingLead(userType)
      ? [
          {
            accessorKey: "assignedTo",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Sales Executive" />
            ),
            cell: ({ row }) => {
              const assignedTo = row.getValue("assignedTo") as string;
              return assignedTo || "Unassigned";
            },
            meta: {
              label: "Sales Executive",
            },
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
          } as ColumnDef<ProcessedSiteMeasurementLead>,
        ]
      : []),

    // Site Address: 8
    {
      accessorKey: "siteAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      meta: {
        label: "Site Address",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const address = row.getValue("siteAddress") as string;
        const maxLength = 30;

        if (address.length <= maxLength) {
          return <span>{address}</span>;
        }

        const truncateAddress = address.slice(0, maxLength) + "...";

        return <RemarkTooltip remark={truncateAddress} remarkFull={address} />;
      },
    },

    // ArchitechName
    {
      accessorKey: "architechName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Architect Name" />
      ),
      meta: {
        label: "Architech Name",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // Source
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      meta: {
        label: "Source",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    // Create At
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ getValue }) => {
        const dateValue = getValue() as string;
        if (!dateValue) return "";
        const date = new Date(dateValue);
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

      meta: {
        label: "Created At",
      },

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
    // Alt contact
    {
      accessorKey: "altContact",
      header: ({ column }) => (
        <div className="w-full text-center">
          <DataTableColumnHeader column={column} title="Alt Contact" />
        </div>
      ),
      meta: {
        label: "Alt Contact",
      },
      cell: ({ getValue }) => {
        const rawValue = getValue() as string | null;

        let formatted = "–";
        if (rawValue) {
          try {
            const phone = parsePhoneNumberFromString(rawValue); // ✅ correct method
            if (phone) {
              formatted = phone.formatInternational(); // e.g. +91 98765 43210
            } else {
              formatted = rawValue;
            }
          } catch {
            formatted = rawValue; // fallback
          }
        }

        return <div className="w-full text-center">{formatted}</div>;
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // Product Types
    // {
    //   accessorKey: "productTypes",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="Product Types" />
    //   ),
    //   meta: {
    //     label: "Product Types",
    //   },
    //   enableSorting: true,
    //   enableHiding: true,
    //   enableColumnFilter: true,
    // },

    // Product Structures
    // {
    //   accessorKey: "productStructures",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="Product Structures" />
    //   ),
    //   meta: {
    //     label: "Product Structures",
    //   },
    //   enableSorting: true,
    //   enableHiding: true,
    //   enableColumnFilter: true,
    // },

    // design Remark
    {
      accessorKey: "designerRemark",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designer Remark" />
      ),
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        label: "Designer's Remark",
      },
      cell: ({ row }) => {
        const fullRemark = row.getValue("designerRemark") as string;
        if (!fullRemark) return "–";

        const truncatedRemark =
          fullRemark.length > 15 ? fullRemark.slice(0, 15) + "..." : fullRemark;
        return (
          <RemarkTooltip remark={truncatedRemark} remarkFull={fullRemark} />
        );
      },
    },
  ];
}