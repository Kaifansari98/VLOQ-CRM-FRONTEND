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

import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

import { mapTableFiltersToPayload } from "@/lib/utils";
import {
  getMiscellaneousTableColumns,
  MiscLeadColumn,
} from "./miscellaneous-column";
import {
  PendingMiscellaneousPayload,
  usePendingMiscellaneousLeads,
} from "@/api/installation/useUnderInstallationStageLeads";

// -------------------------------------------------------
// 🟣 COMPONENT PROPS
// -------------------------------------------------------

export interface MiscellaneousTableProps {
  getRowId?: (row: MiscLeadColumn) => string;
  onRowNavigate: (row: MiscLeadColumn) => string;
  title?: string;
  description?: string;
  showPendingCount?: boolean;
}

// -------------------------------------------------------
// 🟩 COMPONENT
// -------------------------------------------------------

export function MiscellaneousTable({
  getRowId,
  onRowNavigate,
  title,
  description,
  showPendingCount = true,
}: MiscellaneousTableProps) {
  // -------------------- GLOBAL STATE --------------------

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const franchiseId = useAppSelector((s) => s.auth.franchise_id);
  const isHoUser = useAppSelector((s) => s.auth.is_ho_user);

  const router = useRouter();

  // -------------------- LOCAL UI STATE --------------------

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

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
  });

  // -------------------- POST PAYLOAD --------------------

  const postPayload: PendingMiscellaneousPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = sorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(columnFilters);

    return {
      ...(!isHoUser && franchiseId ? { franchise_id: franchiseId } : {}),
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      global_search: globalFilter || "",

      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,

      assign_to: mappedFilters.assign_to,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,

      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,

      site_map_link: mappedFilters.site_map_link,
      date_range: mappedFilters.date_range,
    };
  }, [userId, franchiseId, isHoUser, pagination, sorting, columnFilters, globalFilter]);

  // -------------------- API CALL (SINGLE HOOK) --------------------

  const { data: miscData, isLoading } = usePendingMiscellaneousLeads(
    vendorId!,
    postPayload,
  );

  // -------------------- ACTIVE DATA --------------------

  const activeData = miscData?.data ?? [];
  const totalPages = miscData?.pagination?.totalPages ?? 1;
  const totalCount = miscData?.count ?? 0;

  // -------------------- ROW MAPPER --------------------

  const mapMiscRow = (lead: any, index: number): MiscLeadColumn => ({
    rowKey: String(lead.id),
    id: lead.id,
    srNo: index + 1,
    lead_code: lead.lead_code ?? "",
    name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
    email: lead.email ?? "",
    contact: `${lead.country_code ?? ""}${lead.contact_no ?? ""}`,
    altContact: lead.alt_contact_no ?? "",
    siteAddress: lead.site_address ?? "",
    site_map_link: lead.site_map_link ?? "",
    architechName: lead.archetech_name ?? "",
    furnitureType:
      lead.productMappings?.map((p: any) => p.productType?.type).join(", ") ??
      "",
    furnitueStructures:
      lead.leadProductStructureMapping?.map(
        (p: any) => p.productStructure?.type,
      ) ?? [],
    source: lead.source?.type ?? "",
    siteType: lead.siteType?.type ?? "",
    createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
    updatedAt: lead.updated_at ?? "",
    status: lead.statusType?.type ?? "",
    statusTag: lead.statusType?.tag ?? "",
    sales_executive: lead.assignedTo?.user_name ?? "",
    assignedToId: lead.assignedTo?.id ?? "",
    account_id: lead.account?.id ?? lead.account_id ?? 0,
    pendingMiscCount: lead.pendingMiscCount ?? undefined,
  });

  console.log("mapMiscRow: ", miscData);

  // -------------------- TABLE DATA --------------------

  const tableData = useMemo<MiscLeadColumn[]>(() => {
    return activeData.map((item, idx) => mapMiscRow(item, idx));
  }, [activeData]);

  // -------------------- COLUMNS --------------------

  const columns = useMemo(
    () => getMiscellaneousTableColumns({ showPendingCount }),
    [showPendingCount],
  );

  // -------------------- TABLE INSTANCE --------------------

  const table = useReactTable<MiscLeadColumn>({
    data: tableData,
    columns,

    manualPagination: true,
    manualFiltering: false,
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

    getRowId: getRowId ?? ((row) => row.rowKey ?? row.id.toString()),
  });

  // -------------------- ROW NAVIGATION --------------------

  const handleRowClick = (row: MiscLeadColumn) => {
    const targetPath = onRowNavigate(row);
    router.push(targetPath);
  };

  // -------------------- UI --------------------

  return (
    <div className="py-2">
      {/* 📱 MOBILE & DESKTOP HEADER */}
      <div className="px-4 space-y-3">
        {/* Title & Description */}
        <div className="flex flex-col gap-2 md:flex-row items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              {description}
            </p>
          </div>
        </div>

        {/* 📱 MOBILE FILTERS */}
        <div className="flex md:hidden gap-2 flex-wrap">
          <DataTableDateFilter
            column={table.getColumn("createdAt")!}
            title="Created At"
            multiple
          />
          <DataTableViewOptions table={table} />
        </div>

        {/* 📱 MOBILE SEARCH BAR */}
        <div className="md:hidden w-full">
          <ClearInput
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder="Search..."
            className="h-8 w-full"
          />
        </div>
      </div>

      <DataTable
        table={table}
        onRowDoubleClick={handleRowClick}
        className="pt-3 px-4"
      >
        {/* 🖥️ DESKTOP FILTERS */}
        <div className="hidden md:flex justify-between items-end">
          <div className="flex gap-3">
            <ClearInput
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </DataTable>
    </div>
  );
}

export default MiscellaneousTable;
