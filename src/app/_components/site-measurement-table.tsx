"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";

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

import { useVendorOverallLeads } from "@/hooks/useLeadsQueries";
import { useInitialSiteMeasurement } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";

import { useFeatureFlags } from "./feature-flags-provider";
import { getUniversalTableColumns } from "@/components/utils/column/Universal-column";
import { LeadColumn } from "@/components/utils/column/column-type";

import { useRouter } from "next/navigation";
import type { Lead } from "@/api/leads";

const SiteMeasurementTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  const router = useRouter();
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const isAdmin =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super_admin";

  const [viewType, setViewType] = useState<"my" | "overall">("my");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    architechName: false,
    source: false,
    createdAt: false,
    altContact: false,
    email: false,
    productTypes: true,
    productStructures: false,
    designerRemark: false,
  });

  // API CALLS
  const {
    data: myLeadsData,
    isLoading: isMyLoading,
    isError,
    error,
  } = useInitialSiteMeasurement(vendorId || 0, userId || 0);

  const { data: overallLeadsData, isLoading: isOverallLoading } =
    useVendorOverallLeads(vendorId!, "Type 2", userId!);

  const isLoading = viewType === "my" ? isMyLoading : isOverallLoading;

  const activeData =
    viewType === "my" ? myLeadsData?.data || [] : overallLeadsData?.data || [];

  // ⭐ LeadColumn mapping (IMPORTANT)
  const rowData = useMemo<LeadColumn[]>(() => {
    if (!Array.isArray(activeData)) return [];

    console.log("Initial site measurment Data: ", activeData);
    return activeData.map(
      (lead: Lead, index: number): LeadColumn => ({
        id: lead.id,
        srNo: index + 1,

        lead_code: lead.lead_code ?? "",
        name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
        email: lead.email ?? "",
        contact: `${lead.country_code ?? ""} ${lead.contact_no ?? ""}`.trim(),

        siteAddress: lead.site_address ?? "",
        architechName: lead.archetech_name ?? "",
        designerRemark: lead.designer_remark ?? "",

        productTypes:
          lead.productMappings?.map((pm) => pm.productType?.type).join(", ") ??
          "",

        productStructures:
          lead.leadProductStructureMapping
            ?.map((psm) => psm.productStructure?.type)
            .join(", ") ?? "",

        source: lead.source?.type ?? "",
        siteType: lead.siteType?.type ?? "",
        createdAt: lead.created_at ?? "",
        updatedAt: lead.updated_at ?? "",
        altContact: lead.alt_contact_no ?? "",
        status: lead.statusType?.type ?? "",
        site_map_link: lead?.site_map_link ?? "",
        assign_to: lead.assignedTo?.user_name ?? "",
        accountId: lead.account?.id ?? lead.account_id ?? 0,
      })
    );
  }, [activeData]);

  // Columns
  const columns = useMemo(() => getUniversalTableColumns(), []);

  // Table
  const table = useReactTable({
    data: rowData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: (row) => row.id.toString(),
    globalFilterFn: "includesString",
  });

  const handleRowClick = (row: LeadColumn) => {
    router.push(
      `/dashboard/leads/initial-site-measurement/details/${row.id}?accountId=${row.accountId}`
    );
  };

  if (!vendorId) return <p>No vendor selected</p>;
  if (isLoading)
    return (
      <p className="p-4 text-gray-600">Loading Site Measurement Leads...</p>
    );

  if (isError) {
    console.log("API Error:", error);
    return <p>Something went wrong</p>;
  }

  const mockProps = { shallow: true, debounceMs: 300, throttleMs: 50 };

  const myLeadsCount = myLeadsData?.count ?? 0;
  const overallLeadsCount = overallLeadsData?.count ?? 0;

  return (
    <DataTable table={table} onRowDoubleClick={handleRowClick}>
      {enableAdvancedFilter ? (
        <DataTableAdvancedToolbar table={table}>
          <DataTableSortList table={table} align="start" />

          {filterFlag === "advancedFilters" ? (
            <DataTableFilterList table={table} {...mockProps} align="start" />
          ) : (
            <DataTableFilterMenu table={table} {...mockProps} />
          )}

          {!isAdmin && (
            <div className="ml-auto flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setViewType("my")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewType === "my" ? "bg-blue-600 text-white" : "bg-muted"
                }`}
              >
                My Leads{" "}
                <span className="ml-2 bg-blue-100 text-xs text-blue-500 px-1.5 py-0.5 rounded-full">
                  {myLeadsCount}
                </span>
              </button>

              <button
                onClick={() => setViewType("overall")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewType === "overall" ? "bg-blue-600 text-white" : "bg-muted"
                }`}
              >
                Overall Leads{" "}
                <span className="ml-2 bg-blue-100 text-xs text-blue-500 px-1.5 py-0.5 rounded-full">
                  {overallLeadsCount}
                </span>
              </button>
            </div>
          )}
        </DataTableAdvancedToolbar>
      ) : (
        <DataTableToolbar table={table}>
          {!isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewType("my")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewType === "my" ? "bg-blue-600 text-white" : "bg-muted"
                }`}
              >
                My Leads
              </button>

              <button
                onClick={() => setViewType("overall")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  viewType === "overall" ? "bg-blue-600 text-white" : "bg-muted"
                }`}
              >
                Overall Leads
              </button>
            </div>
          )}
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      )}
    </DataTable>
  );
};

export default SiteMeasurementTable;
