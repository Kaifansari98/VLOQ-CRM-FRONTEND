"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Text } from "lucide-react";
import CustomeStatusBadge from "@/components/origin-status-badge";
import RemarkTooltip from "@/components/origin-tooltip";
import CustomeTooltip from "@/components/cutome-tooltip";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { DataTableRowActionClientDocumentation } from "@/types/data-table";
import { ProcessedClientApprovalLead } from "@/types/client-approval";

interface GetClientApprovalTableColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowActionClientDocumentation<ProcessedClientApprovalLead> | null>
  >;
  userType?: string;
}

export function getClientApprovalTableColumns({
  setRowAction,
  userType,
}: GetClientApprovalTableColumnsProps): ColumnDef<ProcessedClientApprovalLead>[] {
  return [
    // Actions
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
    //         <DropdownMenuItem
    //           data-slot="action-button"
    //           onSelect={() => setRowAction({ row, variant: "view" })}
    //         >
    //           <Eye size={20} />
    //           View
    //         </DropdownMenuItem>

    //         {/* <DropdownMenuItem
    //           data-slot="action-button"
    //           onSelect={() => setRowAction({ row, variant: "clientapproval" })}
    //         >
    //           <FileText size={20} />
    //           Client Approval
    //         </DropdownMenuItem> */}

    //         {canReassingLead(userType) && (
    //           <DropdownMenuItem
    //             data-slot="action-button"
    //             onSelect={() => setRowAction({ row, variant: "reassignlead" })}
    //           >
    //             <Users size={20} />
    //             Reassign Lead
    //           </DropdownMenuItem>
    //         )}

    //         {canDeleteLead(userType) && (
    //           <>
    //             <DropdownMenuSeparator />
    //             <DropdownMenuItem
    //               data-slot="action-button"
    //               onSelect={() => setRowAction({ row, variant: "delete" })}
    //             >
    //               Delete
    //               <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
    //             </DropdownMenuItem>
    //           </>
    //         )}
    //       </DropdownMenuContent>
    //     </DropdownMenu>
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    //   size: 40,
    // },

    // Sr NO
    // {
    //   accessorKey: "srNo",
    //   header: ({ column }) => (
    //     <div className="w-full text-center">
    //       <DataTableColumnHeader column={column} title="Sr. No." />
    //     </div>
    //   ),
    //   cell: ({ getValue }) => (
    //     <div className="w-full text-center">{getValue<number>()}</div>
    //   ),
    //   enableSorting: true,
    //   enableColumnFilter: true,
    // },

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
      meta: {
        label: "Lead Code",
      },
      enableSorting: true,
      enableColumnFilter: true,
      enableHiding: true,
    },

    // Name
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
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: "Name",
        placeholder: "Search names...",
        variant: "text",
        icon: Text,
      },
    },

    // Contact
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ getValue }) => {
        const rawValue = getValue() as string;
        let formatted = rawValue;
        try {
          const phone = parsePhoneNumberFromString(rawValue);
          if (phone) formatted = phone.formatInternational();
        } catch {
          formatted = rawValue;
        }
        return <span>{formatted}</span>;
      },
      enableSorting: true,
      enableColumnFilter: true,
    },

    // Product Types
    {
      accessorKey: "productTypes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Types" />
      ),
      meta: {
        label: "Product Types",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },

    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <CustomeStatusBadge title={row.getValue("status")} />,
      enableSorting: true,
      enableColumnFilter: true,
    },

    // Site Address
    {
      accessorKey: "siteAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      cell: ({ row }) => {
        const address = row.getValue("siteAddress") as string;
        const truncated =
          address.length > 30 ? address.slice(0, 30) + "..." : address;
        return <RemarkTooltip remark={truncated} remarkFull={address} />;
      },
      enableSorting: true,
      enableColumnFilter: true,
    },

    // Assigned To
    {
      accessorKey: "assignedTo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned To" />
      ),
      enableSorting: true,
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
    },

    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const maxLength = 20;
        if (email.length <= maxLength) return <span>{email}</span>;
        return (
          <CustomeTooltip
            truncateValue={email.slice(0, maxLength) + "..."}
            value={email}
          />
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
    },

    // Product Structures
    {
      accessorKey: "productStructures",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Structures" />
      ),
      meta: {
        label: "Product Structures",
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
    },
  ];
}
