"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { MapPin, Zap } from "lucide-react";
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
import { cn } from "@/lib/utils";
import CustomeStatusBadge from "@/components/origin-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UniversalColumnOptions {
  showStageColumn?: boolean;
  showProductionStatusColumn?: boolean;
  showPriorityColumn?: boolean;
  showServicingColumn?: boolean;
  showDesignerColumn?: boolean;
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getUniversalTableColumns(
  options: UniversalColumnOptions = {},
): ColumnDef<LeadColumn>[] {
  const {
    showStageColumn = false,
    showProductionStatusColumn = false,
    showPriorityColumn = false,
    showServicingColumn = false,
    showDesignerColumn = false,
  } =
    options;
  const columns: ColumnDef<LeadColumn>[] = [
    // 1) Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => {
        const isFastProduction = row.original.isFastProduction === true;

      return (
        <div className="flex items-center gap-2 font-medium">
          {isFastProduction && (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-300/90 bg-gradient-to-br from-orange-200 via-orange-300 to-orange-500 text-orange-950 shadow-[0_0_0_3px_rgba(251,146,60,0.18),0_10px_24px_-16px_rgba(234,88,12,0.55)] transition-transform duration-300 hover:scale-110 dark:border-orange-400/60 dark:bg-gradient-to-br dark:from-orange-400 dark:via-orange-500 dark:to-red-500 dark:text-white dark:shadow-[0_0_0_3px_rgba(249,115,22,0.18),0_14px_28px_-18px_rgba(249,115,22,0.7)]">
              <Zap className="h-4 w-4 fill-current animate-pulse motion-reduce:animate-none" />
            </span>
          )}
          <div className="flex flex-col">
            <span>{row.getValue("lead_code")}</span>
            {isFastProduction && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
                Fast Production
              </span>
            )}
          </div>
        </div>
      );
      },
      meta: {
        label: "Lead Code",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: false,
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

    ...(showServicingColumn
      ? ([
          {
            accessorKey: "servicing",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Servicing" />
            ),
            cell: ({ row }) => {
              const value = row.getValue("servicing") as string | undefined;
              return (
                <span className="text-sm text-foreground">
                  {value && value.trim() ? value : "—"}
                </span>
              );
            },
            meta: {
              label: "Servicing",
            },
            enableSorting: false,
            enableHiding: true,
            enableColumnFilter: true,
          },
        ] satisfies ColumnDef<LeadColumn>[])
      : []),

    ...(showPriorityColumn
      ? ([
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
        ] satisfies ColumnDef<LeadColumn>[])
      : []),

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
              const status = row.original.isDraft ? "Draft" : (row.getValue("status") as string);
              return <CustomeStatusBadge title={status} />;
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
                        <p className="text-xs opacity-60 capitalize">{name}</p>
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
    // 4.2) Production Status (Type 10 only)
    ...(showProductionStatusColumn
      ? ([
          {
            accessorKey: "productionStatus",
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title="Production Status"
              />
            ),
            cell: ({ row }) => {
              const status = (row.getValue("productionStatus") as string) || "";
              if (!status) return "—";

              const dotColor =
                status === "Completed"
                  ? "bg-green-500"
                  : status === "Post Production"
                    ? "bg-violet-500"
                  : status === "Under Production"
                    ? "bg-orange-500"
                    : status === "Pre Prod Done"
                      ? "bg-yellow-400"
                      : "bg-blue-500"; // Pending

              return (
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium">
                  <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                  {status}
                </span>
              );
            },
            meta: {
              label: "Production Status",
            },
            enableSorting: false,
            enableHiding: true,
            enableColumnFilter: false,
          },
        ] satisfies ColumnDef<LeadColumn>[])
      : []),

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

    ...(showDesignerColumn
      ? ([
          {
            accessorKey: "designer",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Designer" />
            ),
            meta: {
              label: "Designer",
            },
            filterFn: tableSingleValueMultiSelectFilter,
            enableSorting: false,
            enableHiding: true,
            enableColumnFilter: true,
            cell: ({ row }) => {
              const designer = (row.getValue("designer") as string) || "";
              return designer.trim() ? designer : "—";
            },
          },
        ] satisfies ColumnDef<LeadColumn>[])
      : []),

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
