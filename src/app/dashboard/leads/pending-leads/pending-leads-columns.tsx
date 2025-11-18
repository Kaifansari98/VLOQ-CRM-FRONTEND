"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import CustomeTooltip from "@/components/cutome-tooltip";
import CustomeStatusBadge from "@/components/origin-status-badge";
import CustomeBadge from "@/components/origin-badge";
import RemarkTooltip from "@/components/origin-tooltip";
import { Text } from "lucide-react";
import type { ProcessedLead } from "@/app/_components/view-tables-coloumns";

export type PendingLeadRow = ProcessedLead & { accountId?: number };

// ✅ Columns for Pending Leads (OnHold + Lost)
export function getPendingLeadsColumns({
}: {
  tab: "onHold" | "lostApproval" | "lost";
  onRevert: (lead: PendingLeadRow) => void;
  onMarkAsLost: (lead: PendingLeadRow) => void;
}): ColumnDef<PendingLeadRow>[] {
  return [
    // {
    //   id: "actions",
    //   header: () => <span className="sr-only">Actions</span>,
    //   cell: ({ row }) => (
    //     <DropdownMenu>
    //       <DropdownMenuTrigger asChild>
    //         <Button
    //           type="button"
    //           aria-label="Open menu"
    //           variant="ghost"
    //           className="flex size-8 p-0 data-[state=open]:bg-muted"
    //         >
    //           <Ellipsis className="size-4" aria-hidden="true" />
    //         </Button>
    //       </DropdownMenuTrigger>

    //       <DropdownMenuContent align="end" className="w-44">
    //         {/* OnHold + Lost → only Revert */}
    //         {(tab === "onHold" || tab === "lost") && (
    //           <DropdownMenuItem
    //             onSelect={(e) => {
    //               e.preventDefault();
    //               onRevert(row.original);
    //             }}
    //           >
    //             <CircleCheck size={18} className="" />
    //             Mark as active
    //           </DropdownMenuItem>
    //         )}

    //         {/* LostApproval → two actions */}
    //         {tab === "lostApproval" && (
    //           <>
    //             <DropdownMenuItem
    //               onSelect={(e) => {
    //                 e.preventDefault();
    //                 onRevert(row.original);
    //               }}
    //             >
    //               <CircleX size={18} className="mr-2" />
    //               Rejected
    //             </DropdownMenuItem>
    //             <DropdownMenuItem
    //               onSelect={(e) => {
    //                 e.preventDefault();
    //                 onMarkAsLost(row.original);
    //               }}
    //             >
    //               <CircleCheck size={18} className="mr-2" />
    //               Approved
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
    {
      accessorKey: "srNo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sr. No." />
      ),
      enableSorting: true,
      enableColumnFilter: false,
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
