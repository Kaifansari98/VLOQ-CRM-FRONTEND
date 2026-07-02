"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import CustomeTooltip from "@/components/custom-tooltip";
import CustomeStatusBadge from "@/components/origin-status-badge";
import RemarkTooltip from "@/components/origin-tooltip";
import { MapPin, Text } from "lucide-react";
import type { ProcessedLead } from "./view-tables-coloumns";
import {
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
  tableTextSearchFilter,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      meta: { label: "Lead Name", icon: Text },
    },
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      meta: {
        label: "Contact",
      },
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
      meta: {
        label: "Email",
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.isDraft ? "Draft" : (row.getValue("status") as string);
        return <CustomeStatusBadge title={status} />;
      },
      meta: {
        label: "Status",
      },

      filterFn: tableMultiValueFilter,
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
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
    {
      accessorKey: "sales_executive",
      filterFn: tableSingleValueMultiSelectFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sales Executive" />
      ),
      cell: ({ row }) => {
        const salesExecutive = row.getValue("sales_executive") as string;
        return salesExecutive || "—";
      },
      meta: {
        label: "Sales Executive",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },

    {
      accessorKey: "site_map_link",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      sortingFn: siteMapLinkSort<PendingLeadRow>(),

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
      meta: {
        label: "Site Map Link",
      },
    },
    {
      accessorKey: "siteAddress",
      filterFn: tableTextSearchFilter<ProcessedLead>(),

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
      meta: {
        label: "Site Address",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
    },
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

      cell: ({ row }) => {
        const structures: string[] = row.original.furnitueStructures ?? [];

        if (!structures.length) return "—";

        const visible = structures.slice(0, 2);
        const remaining = structures.slice(2);

        return (
          <div className="space-x-1">
            {visible.map((name: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 capitalize">
                {name}
              </Badge>
            ))}

            {remaining.length > 0 && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-xs px-2 cursor-pointer hover:bg-muted transition-colors"
                    >
                      +{remaining.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-[220px] p-2 space-y-1"
                  >
                    {remaining.map((name: string, index: number) => (
                      <p key={index} className="text-xs capitalize">
                        • {name}
                      </p>
                    ))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
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
      meta: {
        label: "Created At",
      },
    },
  ];
}
