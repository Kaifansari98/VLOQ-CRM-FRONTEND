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
  useUnderInstallationLeadsWithMiscellaneous,
  useUniversalStageLeadsPost,
  useVendorLeadsByTagPost,
  VendorLeadsByTagPostPayload,
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
  dataMode?: "universal" | "misc";
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
  dataMode = "universal",
}: UniversalTableProps) {
  // -------------------- GLOBAL STATE --------------------

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);

  const router = useRouter();
  const isAdmin = userType === "admin" || userType === "super_admin";

  // -------------------- LOCAL UI STATE --------------------

  const [viewType, setViewType] = useState<"my" | "overall">(defaultViewType);

  // ✅ SEPARATE PAGINATION FOR BOTH VIEWS
  const [myPagination, setMyPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [overallPagination, setOverallPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // ✅ SEPARATE GLOBAL FILTER FOR BOTH VIEWS
  const [myGlobalFilter, setMyGlobalFilter] = useState("");
  const [overallGlobalFilter, setOverallGlobalFilter] = useState("");

  // ✅ SEPARATE SORTING FOR BOTH VIEWS
  const [mySorting, setMySorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const [overallSorting, setOverallSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  // ✅ SEPARATE COLUMN FILTERS FOR BOTH VIEWS
  const [myColumnFilters, setMyColumnFilters] = useState<ColumnFiltersState>(
    [],
  );
  const [overallColumnFilters, setOverallColumnFilters] =
    useState<ColumnFiltersState>([]);

  console.log("My Column Filters: ", myColumnFilters);
  console.log("Overall Column Filters: ", overallColumnFilters);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    architechName: false,
    source: false,
    createdAt: false,
    altContact: false,
    email: false,
    designerRemark: false,
  });

  // ✅ DETERMINE ACTIVE STATE BASED ON VIEW TYPE
  const activePagination = viewType === "my" ? myPagination : overallPagination;
  const activeGlobalFilter =
    viewType === "my" ? myGlobalFilter : overallGlobalFilter;
  const activeSorting = viewType === "my" ? mySorting : overallSorting;
  const activeColumnFilters =
    viewType === "my" ? myColumnFilters : overallColumnFilters;

  // -------------------- MY LEADS POST PAYLOAD --------------------

  const myPostPayload: UniversalStagePostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = mySorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(myColumnFilters);

    return {
      userId: userId!,
      tag: type,
      page: myPagination.pageIndex + 1,
      limit: myPagination.pageSize,
      global_search: myGlobalFilter || "",

      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,
      status: mappedFilters.status,
      assign_to: mappedFilters.assign_to,
      siteType: mappedFilters.siteType,
      architectName: mappedFilters.architectName,
      created_at: sortOrder,
      stagetag: mappedFilters.stagetag,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      furnitue_structures: mappedFilters.furnitue_structures,
      site_type: mappedFilters.site_type,
      site_map_link: mappedFilters.site_map_link,
      date_range: mappedFilters.date_range,
    };
  }, [userId, type, myPagination, mySorting, myColumnFilters, myGlobalFilter]);

  // -------------------- OVERALL LEADS POST PAYLOAD --------------------

  const overallPostPayload: VendorLeadsByTagPostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = overallSorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(overallColumnFilters);

    return {
      userId: userId!,
      tag: type,

      page: overallPagination.pageIndex + 1,
      limit: overallPagination.pageSize,

      global_search: overallGlobalFilter || "",

      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,

      assign_to: mappedFilters.assign_to,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      stagetag: mappedFilters.stagetag,

      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,

      site_map_link: mappedFilters.site_map_link,
      date_range: mappedFilters.date_range,
      created_at: sortOrder,
    };
  }, [
    userId,
    type,
    overallPagination,
    overallSorting,
    overallColumnFilters,
    overallGlobalFilter,
  ]);

  // -------------------- API CALLS --------------------

  const { data: myData, isLoading: isMyLoading } = useUniversalStageLeadsPost(
    vendorId!,
    myPostPayload,
  );

  const { data: overallData, isLoading: isOverallLoading } =
    useVendorLeadsByTagPost(vendorId!, overallPostPayload);

  // -------------------- MISCELLANEOUS LEADS POST PAYLOAD --------------------

  const miscPayload: UniversalStagePostPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = mySorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(myColumnFilters);

    return {
      userId: userId!,
      page: myPagination.pageIndex + 1,
      limit: myPagination.pageSize,

      global_search: myGlobalFilter || "",

      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,

      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      source: mappedFilters.source,

      assign_to: mappedFilters.assign_to,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      stagetag: mappedFilters.stagetag,

      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,

      site_map_link: mappedFilters.site_map_link,
      date_range: mappedFilters.date_range,
      created_at: sortOrder,
    };
  }, [userId, myPagination, mySorting, myColumnFilters, myGlobalFilter]);

  const { data: miscData, isLoading: isMiscLoading } =
    useUnderInstallationLeadsWithMiscellaneous(vendorId!, miscPayload);

  //
  // 🔵 Active Dataset
  //
  const activeData =
    dataMode === "misc"
      ? (miscData?.data ?? [])
      : viewType === "overall"
        ? (overallData?.data ?? [])
        : (myData?.data ?? []);

  const totalPages =
    dataMode === "misc"
      ? (miscData?.pagination?.totalPages ?? 1)
      : viewType === "overall"
        ? (overallData?.pagination?.totalPages ?? 1)
        : (myData?.pagination?.totalPages ?? 1);

  const myCount =
    dataMode === "misc" ? (miscData?.count ?? 0) : (myData?.count ?? 0);
  const overallCount = dataMode === "misc" ? 0 : (overallData?.count ?? 0);

  // -------------------- ROW MAPPER --------------------

  const mapUniversalRow = (
    lead: any,
    index: number,
    options?: {
      rowKey?: string;
      instanceId?: number;
      leadCodeSuffix?: string;
      furnitureStructureOverride?: string;
    },
  ): LeadColumn => ({
    rowKey: options?.rowKey,
    instanceId: options?.instanceId,
    id: lead.id,
    srNo: index + 1,
    lead_code: `${lead.lead_code ?? ""}${options?.leadCodeSuffix ?? ""}`,
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
    furnitueStructures: options?.furnitureStructureOverride
      ? options.furnitureStructureOverride
      : lead.leadProductStructureMapping
          ?.map((p: any) => p.productStructure?.type)
          .join(", ") ?? "",
    source: lead.source?.type ?? "",
    siteType: lead.siteType?.type ?? "",
    createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
    updatedAt: lead.updated_at ?? "",
    altContact: lead.alt_contact_no ?? "",
    status: lead.statusType?.type ?? "",
    statusTag: lead.statusType?.tag ?? "",
    sales_executive: lead.assignedTo?.user_name ?? "",
    assignedToId: lead.assignedTo?.id ?? "",
    accountId: lead.account?.id ?? lead.account_id ?? 0,
  });

  // -------------------- TABLE DATA --------------------

  const tableData = useMemo<LeadColumn[]>(() => {
    const normalizedType = String(type || "").trim().toLowerCase();
    const isType8 = normalizedType === "type 8";
    const isType9 = normalizedType === "type 9";
    const isType10 = normalizedType === "type 10";

    if (!isType8 && !isType9 && !isType10) {
      return activeData.map((item, idx) =>
        mapUniversalRow(item, idx, { rowKey: String(item.id) }),
      );
    }

    const expanded: LeadColumn[] = [];

    activeData.forEach((lead) => {
      const instances = Array.isArray(lead?.productStructureInstances)
        ? lead.productStructureInstances
        : [];
      let instanceRows = instances;
      if (isType8) {
        instanceRows = instances.filter(
          (instance: any) => instance?.is_tech_check_completed !== true,
        );
      } else if (isType9) {
        instanceRows = instances.filter(
          (instance: any) =>
            instance?.is_tech_check_completed === true &&
            instance?.is_order_login_completed !== true,
        );
      } else if (isType10) {
        instanceRows = instances.filter(
          (instance: any) =>
            instance?.is_tech_check_completed === true &&
            instance?.is_order_login_completed === true,
        );
      }

      if (instanceRows.length === 0) {
        return;
      }

      if (instanceRows.length <= 1) {
        const onlyInstance = instanceRows[0];
        const structureType =
          onlyInstance?.productStructure?.type ??
          lead.leadProductStructureMapping?.[0]?.productStructure?.type ??
          "";
        const suffix =
          instances.length > 1
            ? `.${onlyInstance?.quantity_index ?? 1}`
            : "";
        expanded.push(
          mapUniversalRow(lead, expanded.length, {
            rowKey: String(lead.id),
            instanceId: onlyInstance?.id,
            leadCodeSuffix: suffix,
            furnitureStructureOverride: structureType,
          }),
        );
        return;
      }

      instanceRows.forEach((instance: any, instanceIndex: number) => {
        const structureType =
          instance?.productStructure?.type ??
          lead.leadProductStructureMapping?.find(
            (item: any) =>
              item?.productStructure?.id === instance?.product_structure_id
          )?.productStructure?.type ??
          "";
        const suffixIndex = instance?.quantity_index ?? instanceIndex + 1;
        expanded.push(
          mapUniversalRow(lead, expanded.length, {
            rowKey: `${lead.id}-${instance?.id ?? instanceIndex + 1}`,
            instanceId: instance?.id,
            leadCodeSuffix: instances.length > 1 ? `.${suffixIndex}` : "",
            furnitureStructureOverride: structureType,
          }),
        );
      });
    });

    return expanded;
  }, [activeData, type]);

  console.log("Overall Post Payload: ", tableData);

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
    manualFiltering: false,
    pageCount: totalPages,

    state: {
      pagination: activePagination,
      sorting: activeSorting,
      columnFilters: activeColumnFilters,
      globalFilter: activeGlobalFilter,
      columnVisibility,
      rowSelection,
    },

    onPaginationChange:
      viewType === "my" ? setMyPagination : setOverallPagination,
    onSortingChange: viewType === "my" ? setMySorting : setOverallSorting,
    onColumnFiltersChange:
      viewType === "my" ? setMyColumnFilters : setOverallColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange:
      viewType === "my" ? setMyGlobalFilter : setOverallGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getRowId: getRowId ?? ((row) => row.rowKey ?? row.id.toString()),
  });

  // -------------------- ROW NAVIGATION --------------------
  const withInstanceId = (path: string, instanceId?: number) => {
    if (!instanceId) return path;
    const [baseAndQuery, hash = ""] = path.split("#");
    const [basePath, queryString = ""] = baseAndQuery.split("?");
    const params = new URLSearchParams(queryString);
    params.set("instance_id", String(instanceId));
    const next = `${basePath}?${params.toString()}`;
    return hash ? `${next}#${hash}` : next;
  };

  const handleRowClick = (row: LeadColumn) => {
    const targetPath = onRowNavigate(row);
    router.push(withInstanceId(targetPath, row.instanceId));
  };

  // ✅ HANDLE VIEW SWITCH
  const handleViewSwitch = (newView: "my" | "overall") => {
    setViewType(newView);
    // Reset pagination when switching views
    if (newView === "my") {
      setMyPagination({ ...myPagination, pageIndex: 0 });
    } else {
      setOverallPagination({ ...overallPagination, pageIndex: 0 });
    }
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
            <p className="text-sm text-muted-foreground hidden md:block">{description}</p>
          </div>

          {/* My Leads / Overall Leads Buttons */}
          {enableAdminTabs && !isAdmin && (
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant={viewType === "my" ? "default" : "secondary"}
                onClick={() => handleViewSwitch("my")}
                className="flex-1 md:flex-none"
              >
                My Leads ({myCount})
              </Button>

              <Button
                size="sm"
                variant={viewType === "overall" ? "default" : "secondary"}
                onClick={() => handleViewSwitch("overall")}
                className="flex-1 md:flex-none"
              >
                Overall Leads ({overallCount})
              </Button>
            </div>
          )}
        </div>

        {/* 📱 MOBILE FILTERS (4 components in a row) */}
        <div className="flex md:hidden gap-2 flex-wrap">
          <DataTableDateFilter
            column={table.getColumn("createdAt")!}
            title="Created At"
            multiple
          />
          {/* <DataTableSortList table={table} />
          <DataTableFilterList table={table} /> */}
          <DataTableViewOptions table={table} />
        </div>

        {/* 📱 MOBILE SEARCH BAR (Full Width) */}
        <div className="md:hidden w-full">
          <ClearInput
            value={activeGlobalFilter}
            onChange={(e) => {
              if (viewType === "my") {
                setMyGlobalFilter(e.target.value);
                setMyPagination({ ...myPagination, pageIndex: 0 });
              } else {
                setOverallGlobalFilter(e.target.value);
                setOverallPagination({ ...overallPagination, pageIndex: 0 });
              }
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
        {/* 🖥️ DESKTOP FILTERS (Horizontal Layout) */}
        <div className="hidden md:flex justify-between items-end">
          <div className="flex gap-3">
            <ClearInput
              value={activeGlobalFilter}
              onChange={(e) => {
                if (viewType === "my") {
                  setMyGlobalFilter(e.target.value);
                  setMyPagination({ ...myPagination, pageIndex: 0 });
                } else {
                  setOverallGlobalFilter(e.target.value);
                  setOverallPagination({ ...overallPagination, pageIndex: 0 });
                }
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
            {/* <DataTableSortList table={table} />
            <DataTableFilterList table={table} /> */}
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </DataTable>
    </div>
  );
}

export default UniversalTable;
