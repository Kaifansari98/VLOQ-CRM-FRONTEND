"use client";

import React, { useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import { useVendorUserLeads } from "@/hooks/useLeadsQueries";
import type { Lead } from "@/api/leads";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

import Loader from "@/components/generics/Loader";
import { useFeatureFlags } from "./feature-flags-provider";
import type { DataTableRowAction } from "@/types/data-table";
import { getVendorLeadsTableColumns } from "./tasks-table-columns";

// Define processed lead type for table
type ProcessedLead = {
  id: number;
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
  const [rowAction, setRowAction] = React.useState<DataTableRowAction<ProcessedLead> | null>(null);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true }
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
    }));
  }, [vendorUserLeadsQuery.data]);

  // Setup columns
  const columns = React.useMemo(
    () => getVendorLeadsTableColumns({ setRowAction }),
    [setRowAction]
  );

  // Create table with direct TanStack Table
  const table = useReactTable({
    data: rowData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // DEBUG: Log sorting state
  React.useEffect(() => {
    console.log("🔍 Sorting state:", sorting);
    console.log("🔍 Table rows:", table.getRowModel().rows.map(r => ({
      srNo: r.original.srNo,
      name: r.original.name
    })));
  }, [sorting, table]);

  // Loading / Error / Empty
  if (vendorUserLeadsQuery.isLoading) {
    return (
      <div className="flex flex-1 justify-center items-center p-8 text-lg">
        <Loader />
      </div>
    );
  }

  if (vendorUserLeadsQuery.error) {
    return (
      <div className="p-8 text-red-600">
        Error loading leads: {vendorUserLeadsQuery.error.message}
      </div>
    );
  }

  if (!rowData.length) {
    return <div className="p-8 text-gray-500">No leads found</div>;
  }

  // Mock the missing props that DataTable expects
  const mockProps = {
    shallow: false,
    debounceMs: 300,
    throttleMs: 50,
  };

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
                shallow={mockProps.shallow}
                debounceMs={mockProps.debounceMs}
                throttleMs={mockProps.throttleMs}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={mockProps.shallow}
                debounceMs={mockProps.debounceMs}
                throttleMs={mockProps.throttleMs}
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