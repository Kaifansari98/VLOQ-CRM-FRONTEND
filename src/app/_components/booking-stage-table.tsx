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

import { useFeatureFlags } from "./feature-flags-provider";

import { useRouter } from "next/navigation";
import {
  useBookingLeads,
  useVendorBookingLeads,
} from "@/hooks/booking-stage/use-booking";
import { BookingLead } from "@/types/booking-types";

import { getUniversalTableColumns } from "@/components/utils/column/Universal-column";
import { LeadColumn } from "@/components/utils/column/column-type";

const BookingStageLeadsTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  const router = useRouter();
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const [viewType, setViewType] = useState<"my" | "overall">("my");

  // Fetch My Leads
  const {
    data: myLeadsData,
    isLoading: isMyLoading,
    isError: isMyError,
  } = useBookingLeads(vendorId!, userId!);

  // Fetch Overall Leads
  const {
    data: overallLeadsData,
    isLoading: isOverallLoading,
    isError: isOverallError,
  } = useVendorBookingLeads(vendorId!, userId!);

  const isLoading = viewType === "my" ? isMyLoading : isOverallLoading;
  const isError = viewType === "my" ? isMyError : isOverallError;

  // Active dataset
  const activeData =
    viewType === "my"
      ? myLeadsData?.data?.leads || []
      : overallLeadsData?.data || [];

  // Table states
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({
      architechName: false,
      source: false,
      createdAt: false,
      altContact: false,
      productTypes: true,
      productStructures: false,
      email: false,
      designerRemark: false,
    });

  const rowData = useMemo<LeadColumn[]>(() => {
    if (!Array.isArray(activeData)) return [];

    return (activeData as BookingLead[]).map((lead, index) => ({
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
        lead.productMappings
          ?.map((pm) => pm.productType?.type)
          .filter(Boolean)
          .join(", ") ?? "",

      productStructures:
        lead.leadProductStructureMapping
          ?.map((ps) => ps.productStructure?.type)
          .filter(Boolean)
          .join(", ") ?? "",

      source: lead.source?.type ?? "",
      siteType: lead.siteType?.type ?? "",
      createdAt: lead.created_at ?? "",
      updatedAt: lead.updated_at ?? "",
      altContact: lead.alt_contact_no ?? "",
      status: lead.statusType?.type ?? "",
      assign_to: lead.assignedTo?.user_name ?? "",

      accountId: lead.account_id ?? 0,
    }));
  }, [activeData]);

  // Columns
  const columns = useMemo(
    () => getUniversalTableColumns({ userType, router }),
    [userType, router]
  );

  // Table setup
  const table = useReactTable({
    data: rowData,
    columns,
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

    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },
  });

  const handleRowClick = (row: LeadColumn) => {
    router.push(
      `/dashboard/sales-executive/booking-stage/details/${row.id}?accountId=${row.accountId}`
    );
  };

  // Loading states
  if (!vendorId) return <p>No vendor selected</p>;
  if (isLoading) return <p>Loading booking leads...</p>;
  if (isError) return <p>Error loading leads</p>;

  const myLeadsCount = myLeadsData?.data?.count ?? 0;
  const overallLeadsCount = overallLeadsData?.count ?? 0;

  return (
    <>
      <DataTable table={table} onRowDoubleClick={handleRowClick}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                table={table}
                shallow
                debounceMs={300}
                throttleMs={50}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow
                debounceMs={300}
                throttleMs={50}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            {!["admin", "super_admin"].includes(
              userType?.toLowerCase() || ""
            ) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewType("my")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    viewType === "my"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Leads
                  <span className="ml-2 py-0.5 px-1.5 rounded-full bg-blue-100 text-xs text-blue-500">
                    {myLeadsCount}
                  </span>
                </button>

                <button
                  onClick={() => setViewType("overall")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    viewType === "overall"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Overall Leads
                  <span className="ml-2 py-0.5 px-1.5 rounded-full bg-blue-100 text-xs text-blue-500">
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

export default BookingStageLeadsTable;
