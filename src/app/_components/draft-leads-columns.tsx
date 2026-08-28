"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MapPin } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/custom-tooltip";

import { LeadColumn } from "@/components/utils/column/column-type";
import {
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
  tableTextSearchFilter,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import CustomeStatusBadge from "@/components/origin-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export type DraftLeadRow = LeadColumn & {
  approval_status?: string;
  pending_store_id?: number;
  is_online_lead?: boolean;
  franchiseId?: number;
};

export interface DraftLeadsColumnsOptions {
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  actingLeadId?: number | null;
  userType?: string;
  userFranchiseId?: number;
  isSuperAdminOrAdmin?: boolean;
}

export function getDraftLeadsColumns(options?: DraftLeadsColumnsOptions): ColumnDef<DraftLeadRow>[] {
  const columns: ColumnDef<DraftLeadRow>[] = [
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
        const name = toTitleCase((row.getValue("name") as string) ?? "");
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

    {
      accessorKey: "priority",
      filterFn: tableSingleValueMultiSelectFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      meta: {
        label: "Priority",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const value = (row.getValue("priority") as string) || "";
        if (!value) return "—";

        const config: Record<string, { dot: string; pill: string }> = {
          High: {
            dot: "bg-red-500",
            pill: "bg-red-500/10 text-red-600 border-red-200",
          },
          Medium: {
            dot: "bg-orange-500",
            pill: "bg-orange-500/10 text-orange-600 border-orange-200",
          },
          Low: {
            dot: "bg-yellow-500",
            pill: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
          },
        };

        const style = config[value] ?? {
          dot: "bg-zinc-400",
          pill: "bg-zinc-100 text-zinc-600 border-zinc-200",
        };

        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              style.pill,
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                style.dot,
              )}
            />
            {value}
          </span>
        );
      },
    },

    // Stage
    {
      accessorKey: "status",
      filterFn: tableMultiValueFilter,

      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stage" />
      ),

      cell: ({ row }) => {
        const status = row.original.isDraft ? "Draft" : (row.getValue("status") as string);
        return <CustomeStatusBadge title={status} />;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
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

    // 4.1) Furniture Structures
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
        const instanceTitle = row.original.instanceTitle;
        const instanceDescription = row.original.instanceDescription;
        const hasInstanceInfo = instanceTitle || instanceDescription;

        if (!structures.length) return "—";

        const visible = structures.slice(0, 2);
        const remaining = structures.slice(2);

        return (
          <div className="space-x-1">
            {visible.map((name: string, index: number) =>
              hasInstanceInfo ? (
                <TooltipProvider key={index} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs px-2 cursor-default flex flex-col items-start gap-0">
                        <span className="capitalize">{instanceTitle ?? name}</span>
                        {instanceTitle && instanceTitle !== name && (
                          <span className="opacity-60 text-[10px] leading-tight capitalize">{name}</span>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="start"
                      className="max-w-[260px] p-2 space-y-1"
                    >
                      {instanceTitle && (
                        <p className="text-xs font-semibold">{instanceTitle}</p>
                      )}
                      {instanceTitle && instanceTitle !== name && (
                        <p className="text-xs opacity-60">{name}</p>
                      )}
                      {instanceDescription && (
                        <p className="text-xs opacity-75">{instanceDescription}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Badge key={index} variant="secondary" className="text-xs px-2 capitalize">
                  {name}
                </Badge>
              ),
            )}

            {remaining.length > 0 && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs px-2">
                      +{remaining.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-[220px] p-2 space-y-1"
                  >
                    {remaining.map((name: string, index: number) => (
                      <p key={index} className="text-xs">
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
        const email = (row.getValue("email") as string) || "";
        const max = 20;
        if (!email) return "—";
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

    // 14) Designer Remark
    {
      accessorKey: "designerRemark",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Designer Remark" />
      ),

      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const full = (row.getValue("designerRemark") as string) || "";
        if (!full) return "—";
        const trunc = full.length > 15 ? full.slice(0, 15) + "..." : full;

        return <RemarkTooltip remark={trunc} remarkFull={full} />;
      },
      meta: {
        label: "Designer Remark",
      },
    },

    // 15) Actions (Approve / Reject for Pending Leads)
    {
      id: "actions",
      header: () => (
        <div className="w-full text-center font-medium text-foreground">
          Actions
        </div>
      ),
      cell: ({ row }) => {
        const isPending = row.original.approval_status === "PENDING";
        const isAuthorized =
          options?.isSuperAdminOrAdmin ||
          (options?.userFranchiseId != null &&
            options.userFranchiseId === (row.original.pending_store_id || row.original.franchiseId));
        const isActing = options?.actingLeadId === row.original.id;

        if (isPending) {
          if (isAuthorized) {
            return (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    options?.onApprove?.(row.original.id);
                  }}
                  disabled={isActing}
                  size="sm"
                  className="h-8 text-xs w-28 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-medium flex items-center justify-center gap-1"
                >
                  {isActing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Approve
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    options?.onReject?.(row.original.id);
                  }}
                  disabled={isActing}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs w-28 border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 font-medium flex items-center justify-center gap-1"
                >
                  {isActing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  Reject
                </Button>
              </div>
            );
          } else {
            return (
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold italic flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Approval Pending
                </span>
              </div>
            );
          }
        }

        return <span className="text-xs text-muted-foreground italic">—</span>;
      },
    },
  ];
  return columns;
}
