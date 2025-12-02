"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useVendorOverallLeads,
  useVendorUserLeadsOpen,
} from "@/hooks/useLeadsQueries";
import { type Lead } from "@/api/leads";

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

import { useRouter } from "next/navigation";
import { getUniversalTableColumns } from "@/components/utils/column/Universal-column";
import { LeadColumn } from "@/components/utils/column/column-type";
import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";

const ViewOpenLeadTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [viewType, setViewType] = useState<"my" | "overall">("my");

  const vendorUserLeadsQuery = useVendorUserLeadsOpen(vendorId!, userId!);
  const vendorOverallLeadsQuery = useVendorOverallLeads(
    vendorId!,
    userId!,
    "Type 1",
    pagination.pageIndex + 1,
    pagination.pageSize
  );

  const myLeads = vendorUserLeadsQuery.data?.count ?? 0;

  const overallLeads = vendorOverallLeadsQuery.data?.count ?? 0;

  const isAdmin =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super_admin";

  const router = useRouter();

  // 🆕 Select which data to use
  const activeData =
    viewType === "my"
      ? vendorUserLeadsQuery.data?.data || []
      : vendorOverallLeadsQuery.data?.data || [];

  const isLoading =
    viewType === "my"
      ? vendorUserLeadsQuery.isLoading
      : vendorOverallLeadsQuery.isLoading;

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      architechName: false,
      source: false,
      createdAt: false,
      altContact: false,
      productTypes: true,
      productStructures: false,
      designerRemark: false,
    });

  const handleRowClick = (row: LeadColumn) => {
    router.push(
      `/dashboard/leads/leadstable/details/${row.id}?accountId=${row.accountId}`
    );
  };

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // 🆕 Process active data (from selected tab)
  const rowData = useMemo<LeadColumn[]>(() => {
    if (!Array.isArray(activeData)) return [];

    return activeData.map((lead: Lead, index: number) => {
      const accountId = lead.account?.id ?? lead.account_id ?? 0;

      return {
        id: lead.id,
        srNo: index + 1,
        lead_code: lead.lead_code ?? "",

        name: `${lead.firstname} ${lead.lastname}`.trim(),
        email: lead.email || "",
        assign_to: lead.assignedTo?.user_name || "",
        contact: lead.country_code + " " + lead.contact_no || "",
        siteAddress: lead.site_address || "",
        architechName: lead.archetech_name || "",
        designerRemark: lead.designer_remark || "",
        productTypes:
          lead.productMappings?.map((pm) => pm.productType.type).join(", ") ||
          "",
        productStructures:
          lead.leadProductStructureMapping
            ?.map((psm) => psm.productStructure.type)
            .join(", ") || "",
        source: lead.source?.type || "",
        site_map_link: lead.site_map_link || "",
        siteType: lead.siteType?.type || "",
        createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
        updatedAt: lead.updated_at || "",
        altContact: lead.alt_contact_no || "",
        status: lead.statusType?.type || "",
        accountId,
      };
    });
  }, [activeData, viewType]);

  // Setup columns
  const columns = React.useMemo(
    () => getUniversalTableColumns(),
    [userType, router]
  );

  // Create table
  const table = useReactTable({
    data: rowData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
      globalFilter,
      columnVisibility,
    },
  });

  if (vendorUserLeadsQuery.error) {
    return (
      <div className="p-8 text-red-600">
        Error loading leads: {vendorUserLeadsQuery.error.message}
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading {viewType} leads...</div>;
  }

  return (
    <div className="py-2">
      {/* HEADER */}
      <div className="flex justify-between items-end px-4">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">Open Leads</h1>
          <p className="text-sm text-muted-foreground">
            Fresh leads that have not yet been processed or contacted.
          </p>
        </div>

        {/* MY / OVERALL TABS */}
        {!isAdmin && (
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
              <p>{myLeads}</p>
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
              <p>{overallLeads}</p>
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
};

export default ViewOpenLeadTable;
