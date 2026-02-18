// configure-column.tsx

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Settings2, MapPin } from "lucide-react";
import { tableMultiValueFilter, tableTextSearchFilter } from "@/lib/utils";
import CustomeTooltip from "@/components/custom-tooltip";
import RemarkTooltip from "@/components/origin-tooltip";

// ─── Column Row Type ──────────────────────────────────────────────────────────

export interface ConfigureLeadColumn {
  id: number;
  lead_code: string;
  name: string;
  contact: string; // Changed from contact_no to match Universal
  email: string;
  siteAddress: string; // Changed from site_address to match Universal
  site_map_link: string;
  account_name: string;
  account_email: string | null;
  furnitureType: string; // Changed from product_types to match Universal
  furnitueStructures: string; // Changed from product_structures to match Universal
  instance_count: number;
  account_id: number;
  source: string;
  siteType: string;
  createdAt: string | number;
}

// ─── Column Options ───────────────────────────────────────────────────────────

interface ConfigureColumnOptions {
  onConfigure: (row: ConfigureLeadColumn) => void;
}

// ─── Column Definitions ───────────────────────────────────────────────────────

export function getConfigureTableColumns(
  options: ConfigureColumnOptions,
): ColumnDef<ConfigureLeadColumn>[] {
  const { onConfigure } = options;

  return [
    // 1) Lead Code
    {
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("lead_code")}</div>
      ),
      meta: {
        label: "Lead Code",
      },
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: true,
    },

    // 2) Name
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const maxLength = 25;

        if (name.length <= maxLength)
          return <span className="font-medium">{name}</span>;

        return (
          <CustomeTooltip
            value={name}
            truncateValue={name.slice(0, maxLength) + "..."}
          />
        );
      },
      enableSorting: true,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Name" },
    },

    // 3) Contact (matching Universal column key)
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("contact")}</span>
      ),
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Contact" },
    },

    // 4) Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        const max = 20;
        if (email.length <= max)
          return <span className="text-sm">{email}</span>;

        return (
          <CustomeTooltip
            value={email}
            truncateValue={email.slice(0, max) + "..."}
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Email" },
    },

    // 5) Furniture Type (matching Universal column key)
    {
      accessorKey: "furnitureType",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Furniture Type" />
      ),
      cell: ({ row }) => {
        const products = row.getValue("furnitureType") as string;
        return <span className="text-sm">{products || "—"}</span>;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Furniture Type" },
    },

    // 6) Site Map Link (matching Universal column key and order)
    {
      accessorKey: "site_map_link",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => {
        const link = row.getValue("site_map_link") as string;
        const isValidLink =
          typeof link === "string" &&
          (link.startsWith("http://") || link.startsWith("https://"));

        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border min-h-[32px]">
            {isValidLink ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-foreground gap-1"
              >
                <MapPin size={14} strokeWidth={2} />
                Open Map
              </a>
            ) : (
              <span className="text-muted-foreground italic">No Map Available</span>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Site Map Link" },
    },

    // 7) Site Type (matching Universal column key)
    {
      accessorKey: "siteType",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      cell: ({ row }) => {
        const siteType = row.getValue("siteType") as string;
        return <span className="text-sm">{siteType || "—"}</span>;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Site Type" },
    },

    // 8) Site Address (matching Universal column key)
    {
      accessorKey: "siteAddress",
      filterFn: tableTextSearchFilter<ConfigureLeadColumn>(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Address" />
      ),
      cell: ({ row }) => {
        const address = row.getValue("siteAddress") as string;
        const maxLen = 30;

        if (!address) return "—";
        if (address.length <= maxLen)
          return <span className="text-sm">{address}</span>;

        return (
          <RemarkTooltip
            title="Site Address"
            remarkFull={address}
            remark={address.slice(0, maxLen) + "..."}
          />
        );
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Site Address" },
    },

    // 9) Source (matching Universal column key)
    {
      accessorKey: "source",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      cell: ({ row }) => {
        const source = row.getValue("source") as string;
        return <span className="text-sm">{source || "—"}</span>;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Source" },
    },

    // 10) Created At
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

    // 11) Furniture Structures (matching Universal column key)
    {
      accessorKey: "furnitueStructures",
      filterFn: tableMultiValueFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Furniture Structures" />
      ),
      cell: ({ row }) => {
        const structures = row.getValue("furnitueStructures") as string;
        return <span className="text-sm">{structures || "—"}</span>;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: true,
      meta: { label: "Furniture Structures" },
    },

    // 12) Configure Action
    {
      id: "action",
      header: () => <span className="text-xs font-medium">Action</span>,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(row.original);
          }}
        >
          <Settings2 className="h-3 w-3" />
          Configure
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { label: "Action" },
    },
  ];
}