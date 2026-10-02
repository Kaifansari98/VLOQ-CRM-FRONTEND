"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { DataTableRowAction } from "@/types/data-table";
import CustomeBadge from "@/components/origin-badge";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import CustomeTooltip from "@/components/custom-tooltip";
import { useRouter } from "next/navigation";
import RemarkTooltip from "@/components/origin-tooltip";
import { MapPin, Zap, Ban } from "lucide-react";
import {
  sanitizeRemark,
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ProcessedTask = {
  id: number; // userLeadTask.id
  lead_code: string;
  accountId: number;
  leadId: number;
  srNo: number; // serial number in table
  name: string; // leadMaster.name
  phoneNumber: string; // leadMaster.phone_number
  leadStatus: string; // userLeadTask.status
  leadStage?: string; // leadMaster.lead_status
  siteType: string; // leadMaster.site_type
  furnitureType: string; // joined string from array
  furnitueStructures: string[]; // joined string from array
  taskType: string; // userLeadTask.task_type
  dueDate: string; // userLeadTask.due_date
  assignedBy: number; // userLeadTask.created_by
  assignedAt: string; // userLeadTask.created_at
  assignedByName: string;
  assignedToName?: string | null;
  remark?: string;
  site_map_link: string;
  instance_id: number;
  is_blocked?: boolean;
  lead_blocked_at?: string | null;
  isFastProductionRequestTask?: boolean;
  isOnlineLead?: boolean;
};

export function getVendorLeadsTableColumns({
  showAssignedTo = false,
}: {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<ProcessedTask> | null>
  >;
  userType?: string;
  router: ReturnType<typeof useRouter>;
  showAssignedTo?: boolean;
}): ColumnDef<ProcessedTask>[] {
  return [
    // Action Button
    // {
    //   id: "actions",
    //   cell: ({ row }) => (
    //     <DropdownMenu>
    //       <DropdownMenuTrigger asChild>
    //         <Button
    //           aria-label="Open menu"
    //           variant="ghost"
    //           className="flex size-8 p-0 data-[state=open]:bg-muted"
    //         >
    //           <Ellipsis className="size-4" aria-hidden="true" />
    //         </Button>
    //       </DropdownMenuTrigger>
    //       <DropdownMenuContent align="end">
    //         {/* View */}
    //         <DropdownMenuItem
    //           onSelect={() =>
    //             router.push(
    //               `/dashboard/sales-executive/leadstable/details/${row.original.id}`
    //             )
    //           }
    //         >
    //           <Eye size={18} />
    //           View
    //         </DropdownMenuItem>

    //         {/* ✅ Conditionally show Upload Measurement */}
    //         {row.original.taskType === "Initial Site Measurement" && (
    //           <>
    //             <DropdownMenuSeparator />
    //             <DropdownMenuItem
    //               onSelect={() =>
    //                 setRowAction({ row, variant: "uploadmeasurement" })
    //               }
    //             >
    //               <ClipboardCheck size={18} />
    //               Upload Measurement
    //             </DropdownMenuItem>
    //           </>
    //         )}

    //         {canReassingLead(userType) && (
    //           <DropdownMenuItem
    //             onSelect={() => setRowAction({ row, variant: "reassignlead" })}
    //           >
    //             <Users size={18} />
    //             Reassign Lead
    //           </DropdownMenuItem>
    //         )}
    //       </DropdownMenuContent>
    //     </DropdownMenu>
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    //   size: 40,
    // },
    // Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => {
        const isBlocked = row.original.is_blocked === true;
        const isFastProduction =
          row.original.isFastProductionRequestTask === true;

        return (
          <div className="flex items-center gap-2 font-medium">
            {isBlocked ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-600 bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-[0_0_0_3px_rgba(239,68,68,0.25),0_10px_24px_-16px_rgba(220,38,38,0.75)] transition-transform duration-300 hover:scale-110 dark:border-red-500 dark:bg-gradient-to-br dark:from-red-600 dark:via-red-700 dark:to-red-800 dark:text-white dark:shadow-[0_0_0_3px_rgba(239,68,68,0.25),0_14px_28px_-18px_rgba(239,68,68,0.8)]">
                <Ban className="h-4 w-4 stroke-[2.5]" />
              </span>
            ) : isFastProduction ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-300/90 bg-gradient-to-br from-orange-200 via-orange-300 to-orange-500 text-orange-950 shadow-[0_0_0_3px_rgba(251,146,60,0.18),0_10px_24px_-16px_rgba(234,88,12,0.55)] transition-transform duration-300 hover:scale-110 dark:border-orange-400/60 dark:bg-gradient-to-br dark:from-orange-400 dark:via-orange-500 dark:to-red-500 dark:text-white dark:shadow-[0_0_0_3px_rgba(249,115,22,0.18),0_14px_28px_-18px_rgba(249,115,22,0.7)]">
                <Zap className="h-4 w-4 fill-current animate-pulse motion-reduce:animate-none" />
              </span>
            ) : null}
            <div className="flex flex-col">
              <span>{row.getValue("lead_code")}</span>
              {isBlocked && (
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
                  Blocked
                </span>
              )}
              {!isBlocked && isFastProduction && (
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
    },

    // Lead name
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Name" />
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return name.length > 25 ? (
          <CustomeTooltip
            value={name}
            truncateValue={name.slice(0, 25) + "..."}
          />
        ) : (
          <span>{name}</span>
        );
      },
      meta: {
        label: "Lead Name",
      },
    },

    // Phone number
    {
      accessorKey: "phoneNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone Number" />
      ),
      cell: ({ getValue }) => {
        const rawValue = getValue() as string;
        const phone = parsePhoneNumberFromString(rawValue);
        return phone ? phone.formatInternational() : rawValue;
      },
      meta: {
        label: "Phone Number",
      },
    },

    // Status
    {
      accessorKey: "leadStage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = (row.getValue("leadStage") as string) || "-";
        return <span className="capitalize font-medium">{status}</span>;
      },
      meta: {
        label: "Status",
      },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
      filterFn: tableMultiValueFilter,
    },

    {
      accessorKey: "taskType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task Type" />
      ),
      cell: ({ row }) => {
        const taskType = (row.getValue("taskType") as string) || "—";
        return <span className="font-medium">{taskType}</span>;
      },
      meta: {
        label: "Task Type",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      filterFn: tableMultiValueFilter,
    },

    {
      accessorKey: "remark",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remark" />
      ),
      meta: {
        label: "Remark",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      cell: ({ row }) => {
        const rawRemark = row.getValue("remark") as string;

        // 🔹 Step 1: Remove system markers like ||OL:37||
        const remark = sanitizeRemark(rawRemark);

        const maxLength = 20;

        // 🔹 Step 2: If short → no tooltip needed
        if (remark.length <= maxLength) {
          return <span>{remark}</span>;
        }

        // 🔹 Step 3: Truncate for display
        const truncateValue = remark.slice(0, maxLength) + "...";

        // 🔹 Step 4: Use your CustomeTooltip
        return (
          <CustomeTooltip
            truncateValue={<span>{truncateValue}</span>}
            value={remark}
            side="top"
            align="center"
            contentClassName="w-100 break-words"
          />
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string);
        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
      meta: {
        label: "Due Date",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true, // ✅ ADD THIS
    },

    {
      accessorKey: "site_map_link",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      sortingFn: siteMapLinkSort<ProcessedTask>(),

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

    // Site type
    {
      accessorKey: "siteType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      enableSorting: false,
      enableColumnFilter: true,
      enableHiding: true,
      filterFn: tableMultiValueFilter,
      meta: {
        label: "Site Type",
      },
    },

    // Product Types
    {
      accessorKey: "furnitureType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Furniture Types" />
      ),
      enableSorting: false,
      enableColumnFilter: true,
      enableHiding: true,
      filterFn: tableMultiValueFilter,
      meta: {
        label: "Furniture Types",
      },
    },

    // Product Structures
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
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 capitalize"
              >
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

    ...(showAssignedTo
      ? ([
          {
            accessorKey: "assignedToName",

            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Assigned To" />
            ),
            cell: ({ row }) => {
              const name = row.getValue("assignedToName") as string;
              return name || "—";
            },
            meta: {
              label: "Assigned To",
            },
            filterFn: tableSingleValueMultiSelectFilter,
            enableSorting: false,
            enableHiding: true,
            enableColumnFilter: true,
          },
        ] satisfies ColumnDef<ProcessedTask>[])
      : []),

    // Assigned At
    {
      accessorKey: "assignedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned At" />
      ),
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string);
        return date.toLocaleString("en-IN");
      },
      meta: {
        label: "Assigned At",
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true, // ✅ ADD THIS
    },
  ];
}
