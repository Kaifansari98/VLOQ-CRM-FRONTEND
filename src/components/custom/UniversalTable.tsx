"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
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

import {
  UniversalStagePostPayload,
  useUniversalStageLeadsPost,
} from "@/api/universalstage";
import { useVendorOverallLeads } from "@/hooks/useLeadsQueries";

import { getUniversalTableColumns } from "../utils/column/Universal-column";
import { LeadColumn } from "../utils/column/column-type";
import { mapTableFiltersToPayload } from "@/lib/utils";

// -------------------------------------------------------
// 🟣 COMPONENT PROPS
// -------------------------------------------------------

export interface UniversalTableProps {
  getRowId?: (row: LeadColumn) => string;
  onRowNavigate: (row: LeadColumn) => string;
  type: string;
  title?: string;
  description?: string;
  enableAdminTabs?: boolean;
  enableOverallData?: boolean;
  showStageColumn?: boolean;
  defaultViewType?: "my" | "overall";
}

// -------------------------------------------------------
// 🟩 COMPONENT
// -------------------------------------------------------

export function UniversalTable({
  getRowId,
  onRowNavigate,
  title,
  description,
  enableAdminTabs = true,
  enableOverallData = true,
  showStageColumn = false,
  defaultViewType = "my",
  type,
}: UniversalTableProps) {
  // -------------------- GLOBAL STATE --------------------

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);

  const router = useRouter();
  const isAdmin = userType === "admin" || userType === "super_admin";

  // -------------------- LOCAL UI STATE --------------------

  const [viewType, setViewType] = useState<"my" | "overall">(defaultViewType);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  console.log("Column Filter data: ", columnFilters);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    architechName: false,
    source: false,
    createdAt: false,
    altContact: false,
    email: false,
    furnitueStructures: false,
    designerRemark: false,
  });

  // -------------------- POST PAYLOAD --------------------

  const postPayload: UniversalStagePostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = sorting[0]?.desc ? "desc" : "asc";

    const mappedFilters = mapTableFiltersToPayload(columnFilters);

    return {
      userId: userId!,
      tag: type,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      filter_name: globalFilter || "",
      filter_lead_code: mappedFilters.filter_lead_code,
      contact: mappedFilters.contact,
      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      name: mappedFilters.name,
      source: mappedFilters.source,
      status: mappedFilters.status,
      assign_to: mappedFilters.assign_to,
      siteType: mappedFilters.siteType,
      architectName: mappedFilters.architectName,
      created_at: sortOrder,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      furnitue_structures: mappedFilters.furnitue_structures,
      site_type: mappedFilters.site_type,
      site_map_link: mappedFilters.site_map_link,
    };
  }, [userId, type, pagination, sorting, columnFilters, globalFilter]);

  // -------------------- API CALLS --------------------

  const { data: myData, isLoading: isMyLoading } = useUniversalStageLeadsPost(
    vendorId!,
    postPayload,
  );

  const { data: overallData, isLoading: isOverallLoading } =
    useVendorOverallLeads(
      vendorId!,
      userId!,
      type,
      pagination.pageIndex + 1,
      pagination.pageSize,
      enableOverallData,
    );

  // -------------------- DATA SELECTION --------------------

  const activeData =
    viewType === "overall" ? (overallData?.data ?? []) : (myData?.data ?? []);

  const totalPages =
    viewType === "overall"
      ? (overallData?.pagination?.totalPages ?? 1)
      : (myData?.pagination?.totalPages ?? 1);

  const myCount = myData?.count ?? 0;
  const overallCount = overallData?.count ?? 0;

  // -------------------- ROW MAPPER --------------------

  const mapUniversalRow = (lead: any, index: number): LeadColumn => ({
    id: lead.id,
    srNo: index + 1,

    lead_code: lead.lead_code ?? "",
    name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
    email: lead.email ?? "",
    contact: `${lead.country_code ?? ""}${lead.contact_no ?? ""}`,

    siteAddress: lead.site_address ?? "",
    site_map_link: lead.site_map_link ?? "",

    architechName: lead.archetech_name ?? "",
    designerRemark: lead.designer_remark ?? "",

    furnitureType:
      lead.productMappings?.map((p: any) => p.productType?.type).join(", ") ??
      "",

    furnitueStructures:
      lead.leadProductStructureMapping
        ?.map((p: any) => p.productStructure?.type)
        .join(", ") ?? "",

    source: lead.source?.type ?? "",
    siteType: lead.siteType?.type ?? "",

    createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",

    updatedAt: lead.updated_at ?? "",

    altContact: lead.alt_contact_no ?? "",
    status: lead.statusType?.type ?? "",
    statusTag: lead.statusType?.tag ?? "",

    assign_to: lead.assignedTo?.user_name ?? "",
    accountId: lead.account?.id ?? lead.account_id ?? 0,
  });

  // -------------------- TABLE DATA --------------------

  const tableData = useMemo<LeadColumn[]>(() => {
    return activeData.map((item, idx) => mapUniversalRow(item, idx));
  }, [activeData]);

  // -------------------- COLUMNS --------------------

  const columns = useMemo(
    () => getUniversalTableColumns({ showStageColumn }),
    [showStageColumn],
  );

  // -------------------- TABLE INSTANCE --------------------

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
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: getRowId ?? ((row) => row.id.toString()),
  });

  // -------------------- ROW NAVIGATION --------------------

  const handleRowClick = (row: LeadColumn) => {
    router.push(onRowNavigate(row));
  };

  // -------------------- UI --------------------

  return (
    <div className="py-2">
      <div className="px-4 flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {enableAdminTabs && !isAdmin && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewType === "my" ? "default" : "secondary"}
              onClick={() => {
                setViewType("my");
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            >
              My Leads ({myCount})
            </Button>

            <Button
              size="sm"
              variant={viewType === "overall" ? "default" : "secondary"}
              onClick={() => {
                setViewType("overall");
                setPagination({ ...pagination, pageIndex: 0 });
              }}
            >
              Overall Leads ({overallCount})
            </Button>
          </div>
        )}
      </div>

      <DataTable
        table={table}
        onRowDoubleClick={handleRowClick}
        className="pt-3 px-4"
      >
        <div className="hidden md:flex justify-between items-end">
          <div className="flex gap-3">
            <ClearInput
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
              placeholder="Search..."
              className="h-8 w-64"
            />

            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
          </div>

          <div className="flex gap-2">
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
