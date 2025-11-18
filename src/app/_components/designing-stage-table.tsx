"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";

import {
  useDesigningStageLeads,
  useVendorDesigningLeads,
} from "@/hooks/designing-stage/designing-leads-hooks";

import { useFeatureFlags } from "./feature-flags-provider";
import { getUniversalTableColumns } from "@/components/utils/column/Universal-column";

import { LeadColumn } from "@/components/utils/column/column-type";
import type { DesigningLead } from "@/types/designing-stage-types";

const DesigningStageTable = () => {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);

  const router = useRouter();

  // Tabs
  const [viewType, setViewType] = useState<"my" | "overall">("my");

  // Pagination
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Queries
  const {
    data: myLeadsData,
    isLoading: isMyLoading,
    isError: isMyError,
  } = useDesigningStageLeads(
    vendorId!,
    userId!,
    pagination.pageIndex + 1, // backend 1-based
    pagination.pageSize
  );

  const {
    data: overallLeadsData,
    isLoading: isOverallLoading,
    isError: isOverallError,
  } = useVendorDesigningLeads(vendorId!, userId!);

  const isLoading = viewType === "my" ? isMyLoading : isOverallLoading;
  const isError = viewType === "my" ? isMyError : isOverallError;

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  // Table states
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    architechName: false,
    source: false,
    createdAt: false,
    altContact: false,
    productTypes: true,
    email: false,
    productStructures: false,
    designerRemark: false,
  });

  // Row click handler
  const handleRowClick = (row: LeadColumn) => {
    router.push(
      `/dashboard/leads/designing-stage/details/${row.id}?accountId=${row.accountId}`
    );
  };

  // Active dataset
  const activeData =
    viewType === "my"
      ? myLeadsData?.data?.leads || []
      : overallLeadsData?.data || [];

  console.log("Designing Stage Lead Data: ", activeData);

  const rowData = useMemo<LeadColumn[]>(() => {
    if (!Array.isArray(activeData)) return [];

    return (activeData as DesigningLead[]).map((lead, index) => ({
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
        lead.productMappings?.map((pm) => pm.productType.type).join(", ") ?? "",

      productStructures:
        lead.leadProductStructureMapping
          ?.map((pm) => pm.productStructure.type)
          .join(", ") ?? "",

      source: lead.source?.type ?? "",
      siteType: lead.siteType?.type ?? "",
      createdAt: lead.created_at ?? "",
      updatedAt: lead.updated_at ?? "",
      altContact: lead.alt_contact_no ?? "",
      status: lead.statusType?.type ?? "",
      assign_to: lead.assignedTo?.user_name ?? "",
      site_map_link: lead?.site_map_link ?? "",
      accountId: lead.account_id ?? 0,
    }));
  }, [activeData]);

  // Columns → reuse universal column module
  const columns = useMemo(() => getUniversalTableColumns(), []);

  // Table setup
  const table = useReactTable({
    data: rowData,
    columns,

    manualPagination: true,
    pageCount: myLeadsData?.data?.pagination?.totalPages ?? -1,
    onPaginationChange: setPagination,

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: (row) => row.id.toString(),
    globalFilterFn: "includesString",
  });

  // Loading/error
  if (isLoading) return <p className="p-4">Loading designing leads...</p>;
  if (isError) return <p className="p-4">Error fetching leads</p>;

  const myLeadsCount = myLeadsData?.data?.count ?? 0;
  const overallLeadsCount = overallLeadsData?.count ?? 0;

  const mockProps = { shallow: true, debounceMs: 300, throttleMs: 50 };

  // Render
  return (
    <>
      <DataTable table={table} onRowDoubleClick={handleRowClick}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />

            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList table={table} {...mockProps} />
            ) : (
              <DataTableFilterMenu table={table} {...mockProps} />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            {/* My / Overall Tabs */}
            {!["admin", "super_admin"].includes(
              userType?.toLowerCase() || ""
            ) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewType("my")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewType === "my"
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Leads
                  <span className="ml-2 bg-blue-100 text-xs text-blue-500 px-1.5 py-0.5 rounded-full">
                    {myLeadsCount}
                  </span>
                </button>

                <button
                  onClick={() => setViewType("overall")}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    viewType === "overall"
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Overall Leads
                  <span className="ml-2 bg-blue-100 text-xs text-blue-500 px-1.5 py-0.5 rounded-full">
                    {overallLeadsCount}
                  </span>
                </button>
              </div>
            )}

            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
};

export default DesigningStageTable;
