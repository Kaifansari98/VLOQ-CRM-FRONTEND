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

import { useFeatureFlags } from "@/app/_components/feature-flags-provider";
import { useRouter } from "next/navigation";

import { useDispatchStageLeads } from "@/api/installation/useDispatchStageLeads";
import { LeadColumn } from "@/components/utils/column/column-type";

import { getUniversalTableColumns } from "@/components/utils/column/Universal-column";

const DispatchStageTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);


  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();

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
    productTypes: true,
    productStructures: false,
    email: false,
    designerRemark: false,
  });

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // 🔹 Fetch Data
  const { data, isLoading, isError } = useDispatchStageLeads(
    vendorId!,
    userId!,
    pagination.pageIndex + 1,
    pagination.pageSize
  );

  // 🔹 Convert to LeadColumn (universal structure)
  const rowData = useMemo<LeadColumn[]>(() => {
    if (!data?.leads || !Array.isArray(data.leads)) return [];

    return data.leads.map(
      (lead: any, index: number): LeadColumn => ({
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
            ?.map((pm: any) => pm.productType?.type)
            .filter(Boolean)
            .join(", ") ?? "",

        productStructures:
          lead.leadProductStructureMapping
            ?.map((ps: any) => ps.productStructure?.type)
            .filter(Boolean)
            .join(", ") ?? "",

        source: lead.source?.type ?? "",
        siteType: lead.siteType?.type ?? "",
        createdAt: lead.created_at ?? "",
        updatedAt: lead.updated_at ?? "",
        altContact: lead.alt_contact_no ?? "",
        site_map_link: lead.site_map_link ?? "",
        status: lead.statusType?.type ?? "Dispatch Stage",

        assign_to: lead.assignedTo?.user_name ?? "",
        accountId: lead.account_id ?? 0,
      })
    );
  }, [data]);

  // 🔹 Columns
  const columns = useMemo(() => getUniversalTableColumns(), []);

  // 🔹 Table Setup
  const table = useReactTable({
    data: rowData,
    columns,
    pageCount: Math.ceil((data?.total || 0) / pagination.pageSize),

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    getRowId: (row) => row.id.toString(),
    globalFilterFn: "includesString",

    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },

    onPaginationChange: setPagination,
    manualPagination: true,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleRowClick = (row: LeadColumn) => {
    router.push(`/dashboard/installation/dispatch-stage/details/${row.id}`);
  };

  if (!vendorId) return <p>No vendor selected</p>;
  if (isLoading) return <p>Loading Dispatch Stage leads...</p>;
  if (isError) return <p>Error loading Dispatch Stage leads</p>;

  return (
    <>
      <DataTable table={table} onRowDoubleClick={handleRowClick}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList table={table} shallow />
            ) : (
              <DataTableFilterMenu table={table} shallow />
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

export default DispatchStageTable;
