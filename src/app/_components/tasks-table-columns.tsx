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
import { MapPin } from "lucide-react";
import {
  siteMapLinkSort,
  tableMultiValueFilter,
  tableSingleValueMultiSelectFilter,
} from "@/lib/utils";

export type ProcessedTask = {
  id: number; // userLeadTask.id
  lead_code: string;
  accountId: number;
  leadId: number;
  srNo: number; // serial number in table
  name: string; // leadMaster.name
  phoneNumber: string; // leadMaster.phone_number
  leadStatus: string; // userLeadTask.status
  siteType: string; // leadMaster.site_type
  furnitureType: string; // joined string from array
  furnitueStructures: string; // joined string from array
  taskType: string; // userLeadTask.task_type
  dueDate: string; // userLeadTask.due_date
  assignedBy: number; // userLeadTask.created_by
  assignedAt: string; // userLeadTask.created_at
  assignedByName: string;
  assignedToName?: string | null;
  remark?: string;
  site_map_link: string;
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
    // Sr No
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

    // Task type
    {
      accessorKey: "taskType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task Type" />
      ),
      meta: {
        label: "Task Type",
      },

      enableSorting: false,
      enableColumnFilter: true,
      enableHiding: true,
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
        const remark = row.getValue("remark") as string;
        const maxLength = 20;

        if (remark.length <= maxLength) {
          return <span>{remark}</span>;
        }

        const truncateValue = remark.slice(0, maxLength) + "...";

        return <RemarkTooltip remark={truncateValue} remarkFull={remark} />;
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
      enableSorting: false,
      enableColumnFilter: true,
      enableHiding: true,
      meta: {
        label: "Furniture Structures",
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
