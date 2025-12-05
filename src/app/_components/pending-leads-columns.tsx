"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import CustomeTooltip from "@/components/cutome-tooltip";
import CustomeStatusBadge from "@/components/origin-status-badge";
import RemarkTooltip from "@/components/origin-tooltip";
import { MapPin, Text } from "lucide-react";
import type { ProcessedLead } from "@/app/_components/view-tables-coloumns";

export type PendingLeadRow = ProcessedLead & { accountId?: number };

// ✅ Columns for Pending Leads (OnHold + Lost)
export function getPendingLeadsColumns({}: {
  tab: "onHold" | "lostApproval" | "lost";
  onRevert: (lead: PendingLeadRow) => void;
  onMarkAsLost: (lead: PendingLeadRow) => void;
}): ColumnDef<PendingLeadRow>[] {
  return [
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
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
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
      meta: { label: "Name", icon: Text },
    },
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const maxLength = 20;
        if (!email) return "—";
        return email.length <= maxLength ? (
          <span>{email}</span>
        ) : (
          <CustomeTooltip
            value={email}
            truncateValue={email.slice(0, maxLength) + "..."}
          />
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stage" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <CustomeStatusBadge title={status} />;
      },
    },
    {
      accessorKey: "siteType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
    },

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
    {
      accessorKey: "siteAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      cell: ({ row }) => {
        const address = row.getValue("siteAddress") as string;
        if (!address) return "—";
        const maxLength = 30;
        if (address.length <= maxLength) return address;
        return (
          <RemarkTooltip
            remark={address.slice(0, maxLength) + "..."}
            remarkFull={address}
          />
        );
      },
    },
    {
      accessorKey: "productTypes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Types" />
      ),
    },
    {
      accessorKey: "productStructures",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Structures" />
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ getValue }) => {
        const dateValue = getValue() as string;
        if (!dateValue) return "—";
        const date = new Date(dateValue);
        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
  ];
}
