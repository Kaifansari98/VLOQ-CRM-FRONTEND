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
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

import { useUniversalStageLeads } from "@/api/universalstage";
import { useVendorOverallLeads } from "@/hooks/useLeadsQueries";
import { getUniversalTableColumns } from "../utils/column/Universal-column";
import { LeadColumn } from "../utils/column/column-type";

//
// -------------------------------------------------------
// 🔵 UNIVERSAL ROW TYPE
// -------------------------------------------------------
//

//
// -------------------------------------------------------
// 🟣 UNIVERSAL TABLE PROPS
// -------------------------------------------------------
//
export interface UniversalTableProps {
  getRowId?: (row: LeadColumn) => string;
  onRowNavigate: (row: LeadColumn) => string;
  type: string; // "Type 2" or any stage type
  title?: string;
  description?: string;
  enableAdminTabs?: boolean;
}

//
// -------------------------------------------------------
// 🟩 UNIVERSAL TABLE COMPONENT
// -------------------------------------------------------
//
export function UniversalTable({
  getRowId,
  onRowNavigate,
  title,
  description,
  enableAdminTabs = true,
  type,
}: UniversalTableProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);
  const router = useRouter();

  const isAdmin = userType === "admin" || userType === "super_admin";

  //
  // 🔵 Tabs (My / Overall)
  //
  const [viewType, setViewType] = useState<"my" | "overall">("my");

  //
  // 🔵 Pagination State
  //
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  //
  // 🔵 Table Controls
  //
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

  //
  // -------------------------------------------------------
  // 🔵 API CALLS — Stage data dynamically depends on `type`
  // -------------------------------------------------------
  //
  const { data: myData, isLoading: isMyLoading } = useUniversalStageLeads(
    vendorId!,
    userId!,
    type,
    pagination.pageIndex + 1,
    pagination.pageSize
  );

  const { data: overallData, isLoading: isOverallLoading } =
    useVendorOverallLeads(
      vendorId!,
      userId!,
      type,
      pagination.pageIndex + 1,
      pagination.pageSize
    );

  //
  // 🔵 Active Dataset
  //
  const activeData =
    viewType === "overall" ? overallData?.data ?? [] : myData?.data ?? [];

  //
  // 🔵 Pagination Meta
  //
  const totalPages =
    viewType === "overall"
      ? overallData?.pagination?.totalPages ?? 1
      : myData?.pagination?.totalPages ?? 1;

  // const isLoading = viewType === "overall" ? isOverallLoading : isMyLoading;

  const myCount = myData?.count ?? 0;
  const overallCount = overallData?.count ?? 0;

  //
  // -------------------------------------------------------
  // 🔵 ROW MAPPER — converts Lead → UniversalRow
  // -------------------------------------------------------
  //
  const mapUniversalRow = (lead: any, index: number): LeadColumn => ({
    id: lead.id,
    srNo: index + 1,

    lead_code: lead.lead_code ?? "",
    name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
    email: lead.email ?? "",
    contact: `${lead.country_code ?? ""} ${lead.contact_no ?? ""}`.trim(),

    siteAddress: lead.site_address ?? "",
    site_map_link: lead.site_map_link ?? "",

    architechName: lead.archetech_name ?? "",
    designerRemark: lead.designer_remark ?? "",

    productTypes:
      lead.productMappings?.map((p: any) => p.productType?.type).join(", ") ??
      "",
    productStructures:
      lead.leadProductStructureMapping
        ?.map((p: any) => p.productStructure?.type)
        .join(", ") ?? "",

    source: lead.source?.type ?? "",
    siteType: lead.siteType?.type ?? "",

    createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
    updatedAt: lead.updated_at ?? "",

    altContact: lead.alt_contact_no ?? "",
    status: lead.statusType?.type ?? "",

    assign_to: lead.assignedTo?.user_name ?? "",
    accountId: lead.account?.id ?? lead.account_id ?? 0,
  });

  //
  // -------------------------------------------------------
  // 🔵 TABLE DATA
  // -------------------------------------------------------
  //
  const tableData = useMemo<LeadColumn[]>(() => {
    if (!Array.isArray(activeData)) return [];
    return activeData.map((item, idx) => mapUniversalRow(item, idx));
  }, [activeData]);

  //
  // 🔵 COLUMN BUILDER
  //
  const columns = useMemo(() => getUniversalTableColumns(), []);

  //
  // -------------------------------------------------------
  // 🔵 TANSTACK TABLE SETUP
  // -------------------------------------------------------
  //
  const table = useReactTable<LeadColumn>({
    data: tableData,
    columns,

    manualPagination: true,
    pageCount: totalPages,

    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },

    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: getRowId ?? ((row) => row.id.toString()),
    globalFilterFn: "includesString",
  });

  //
  // 🔵 Loading State
  //
  // if (isLoading) {
  //  return  <DataTableSkeleton rowCount={8} columnCount={10} />;
  // }

  //
  // 🔵 Row Navigation
  //
  const handleRowClick = (row: LeadColumn) => {
    router.push(onRowNavigate(row));
  };

  //
  // -------------------------------------------------------
  // 🔵 UI
  // -------------------------------------------------------
  //
  return (
    <div className="py-2">
      {/* HEADER */}
      <div className="flex justify-between items-end px-4">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* MY / OVERALL TABS */}
        {enableAdminTabs && !isAdmin && (
          <div className="flex items-center gap-2 mb-2">
            <Button
              size="sm"
              className="flex gap-2"
              variant={viewType === "my" ? "default" : "secondary"}
              onClick={() => {
                setViewType("my");
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            >
              My Leads
              <p>{myCount}</p>
            </Button>

            <Button
              size="sm"
              className="flex gap-2"
              variant={viewType === "overall" ? "default" : "secondary"}
              onClick={() => {
                setViewType("overall");
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            >
              Overall Leads
              <p>{overallCount}</p>
            </Button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <DataTable
        table={table}
        onRowDoubleClick={handleRowClick}
        className=" pt-3 px-4"
      >
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <ClearInput
              value={globalFilter ?? ""}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination({ ...pagination, pageIndex: 0 });
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
