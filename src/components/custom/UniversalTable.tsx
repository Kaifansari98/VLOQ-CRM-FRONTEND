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

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ClearInput from "@/components/origin-input";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

/**
 * NOTE:
 * - This UniversalTable assumes server-side (backend) pagination.
 * - fetchMyFn and fetchOverallFn are expected to be data hooks or functions
 *   that accept (vendorId, userId, page, pageSize) and return an object
 *   with { data, isLoading, count, ... } similar to your designing-stage hooks.
 */

export interface UniversalTableProps<T> {
  // API Logic (server-side pagination)
  fetchMyFn: (
    vendorId: number,
    userId: number,
    page: number,
    pageSize: number
  ) => any;
  fetchOverallFn?: (
    vendorId: number,
    type: string,
    userId: number,
    page: number,
    pageSize: number
  ) => any;

  type?: string;
  enableAdminTabs?: boolean; // show My vs Overall

  // Data Transformation
  rowMapper: (item: any, index: number) => T;
  getRowId?: (row: T) => string;

  // Column Builder
  getColumns: () => any[];

  // Routing
  onRowNavigate: (row: T) => string;

  // Header
  title?: string;
  description?: string;
}

export function UniversalTable<T>({
  fetchMyFn,
  fetchOverallFn,
  enableAdminTabs = false,
  rowMapper,
  getColumns,
  getRowId,
  onRowNavigate,
  type,
  title,
  description,
}: UniversalTableProps<T>) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);

  const router = useRouter();
  const isAdmin = userType === "admin" || userType === "super_admin";

  // view tabs
  const [viewType, setViewType] = useState<"my" | "overall">("my");

  // pagination: server-side (pageIndex is 0-based in UI, backend expects 1-based)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // table states
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

  // ----------------- API CALLS (server-side) -----------------
  // Pass backend page (1-based) and pageSize from pagination state
  const { data: leadsData, isLoading: isMyLoading } = fetchMyFn(
    vendorId!,
    userId!,
    pagination.pageIndex + 1,
    pagination.pageSize
  );

  const { data: overallData, isLoading: isOverallLoading } = fetchOverallFn
    ? fetchOverallFn(
        vendorId!,
        type ?? "",
        userId!,
        pagination.pageIndex + 1,
        pagination.pageSize
      )
    : { data: [], isLoading: false };

  // Choose active dataset based on viewType
  const activeData =
    viewType === "overall" ? overallData?.data || [] : leadsData?.data || [];

  // pageCount should come from backend pagination metadata (totalPages)
  const pageCountData =
    enableAdminTabs && viewType === "overall"
      ? overallData?.pagination?.totalPages ?? -1
      : leadsData?.pagination?.totalPages ?? -1;

  console.log("Total pages from backend: ", pageCountData);

  const isLoading =
    enableAdminTabs && viewType === "overall" ? isOverallLoading : isMyLoading;

  const myCount = leadsData?.count ?? 0;
  const overallCount = overallData?.count ?? 0;

  // --------- row mapper ----------
  const tableData = useMemo<T[]>(() => {
    if (!Array.isArray(activeData)) return [];
    return activeData.map(rowMapper);
  }, [activeData, rowMapper]);

  const columns = useMemo(() => getColumns(), [getColumns]);

  // ----------------- useReactTable (server-side pagination enabled) -----------------
  const table = useReactTable({
    data: tableData,
    columns,

    // server-side pagination config
    manualPagination: true,
    pageCount: pageCountData ?? -1,

    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },

    // handlers
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    // row models
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    // misc
    getRowId: getRowId ?? ((row: any) => row.id?.toString()),
    globalFilterFn: "includesString",
  });

  if (isLoading) return <DataTableSkeleton rowCount={8} columnCount={10} />;

  // ---------- Row Navigation ----------
  const handleRowClick = (row: T) => {
    const route = onRowNavigate(row);
    router.push(route);
  };

  return (
    <div className="px-4 py-3 ">
      {/* ------ Header: Title + Tabs ------ */}
      <div className="flex justify-between items-end px-2">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {enableAdminTabs && !isAdmin && (
          <div className="flex items-center gap-2 mb-2 flex-wrap w-full md:w-auto justify-center md:justify-end">
            <Button
              size="sm"
              variant={viewType === "my" ? "default" : "secondary"}
              onClick={() => {
                setViewType("my");
                setPagination((p) => ({ ...p, pageIndex: 0 })); // reset to first page
              }}
              className="flex items-center gap-2"
            >
              My Leads
              <Badge variant={viewType === "my" ? "secondary" : "default"}>
                {myCount}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={viewType === "overall" ? "default" : "secondary"}
              onClick={() => {
                setViewType("overall");
                setPagination((p) => ({ ...p, pageIndex: 0 })); // reset to first page
              }}
              className="flex items-center gap-2"
            >
              Overall Leads
              <Badge variant={viewType === "overall" ? "secondary" : "default"}>
                {overallCount}
              </Badge>
            </Button>
          </div>
        )}
      </div>

      {/* ------ Toolbar + Filters ------ */}
      <DataTable
        table={table}
        onRowDoubleClick={handleRowClick}
        className="px-2 py-3"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <ClearInput
              value={globalFilter ?? ""}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                // when filter changes, reset to first page
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="Search…"
              className="w-full h-8 sm:w-64"
            />

            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DataTableSortList table={table} />
            <DataTableFilterList table={table} />
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </DataTable>
    </div>
  );
}

export default UniversalTable;
