"use client";

import React, { useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import { useVendorUserLeads } from "@/hooks/useLeadsQueries";
import type { Lead } from "@/api/leads";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import Loader from "@/components/generics/Loader";
import { useDataTable } from "@/hooks/use-data-table";
import { useFeatureFlags } from "./feature-flags-provider";
import type { DataTableRowAction } from "@/types/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVendorLeadsTableColumns } from "./tasks-table-columns";

// Define processed lead type for table
type ProcessedLead = {
  id: number; // 👈 unique id zaroori hai
  srNo: number;
  name: string;
  email: string;
  contact: string;
  priority: string;
  siteAddress: string;
  billingName: string;
  architechName: string;
  designerRemark: string;
  productTypes: string;
  productStructures: string;
  source: string;
  siteType: string;
  createdAt: string;
  updatedAt: string;
};


const VendorLeadsTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const shouldFetch = !!vendorId && !!userId;

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  // Fetch leads
  const vendorUserLeadsQuery = useVendorUserLeads(
    vendorId || 0,
    userId || 0,
    shouldFetch
  );

  // Row action state
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ProcessedLead> | null>(null);

  console.log(rowAction);

  // Process leads into table data
  const rowData = useMemo<ProcessedLead[]>(() => {
    if (!vendorUserLeadsQuery.data) return [];

    return vendorUserLeadsQuery.data.map((lead: Lead, index: number) => ({
      id: lead.id,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      contact: lead.contact_no || "",
      priority: lead.priority || "",
      siteAddress: lead.site_address || "",
      billingName: lead.billing_name || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      productTypes:
        lead.productMappings?.map((pm) => pm.productType.type).join(", ") || "",
      productStructures:
        lead.leadProductStructureMapping
          ?.map((psm) => psm.productStructure.type)
          .join(", ") || "",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at
        ? new Date(lead.created_at).toLocaleDateString()
        : "",
      updatedAt: lead.updated_at
        ? new Date(lead.updated_at).toLocaleDateString()
        : "",
    }));
  }, [vendorUserLeadsQuery.data]);

  // Setup columns
  const columns = React.useMemo(
    () => getVendorLeadsTableColumns({setRowAction}),
    []
  );

  // Initialize DataTable hook
  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: rowData,
    columns,
    pageCount: 1,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id.toString(),
    shallow: false,
    clearOnDefault: true,
  });

  // Loading / Error / Empty
  // if (vendorUserLeadsQuery.isLoading) {
  //   return (
  //     <div className="flex flex-1 justify-center items-center p-8 text-lg">
  //       <Loader />
  //     </div>
  //   );
  // }

  if (vendorUserLeadsQuery.error) {
    return (
      <div className="p-8 text-red-600">
        Error loading leads: {vendorUserLeadsQuery.error.message}
      </div>
    );
  }

  // if (!rowData.length) {
  //   return <div className="p-8 text-gray-500">No leads found</div>;
  // }

  // Render table
  return (
    <>
      <DataTable table={table}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
};

export default VendorLeadsTable;
