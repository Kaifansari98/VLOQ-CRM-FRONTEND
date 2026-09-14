"use client";

import { DataTable } from "@/components/data-table/data-table";
import {
  useReactTable,
  getCoreRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import React from "react";
import {
  getDraftLeadsColumns,
  DraftLeadRow,
} from "./draft-leads-columns";

import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { formatSalesExecutiveName } from "@/lib/utils";
import { useRouter } from "next/navigation";

// API & REDUX IMPORTS
import { useAppSelector } from "@/redux/store";
import {
  DraftLeadTableDataPostPayload,
  useDraftLeadTableDataPost,
} from "@/api/universalstage";
import { mapTableFiltersToPayload } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";

export default function DraftLeadsTable({
  stageTitle = "Draft Leads",
  stageDescription = "Leads that are saved as draft and not yet submitted.",
}: {
  stageTitle?: string;
  stageDescription?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const franchiseId = useAppSelector(
    (s) => s.auth.franchise_id ?? s.auth.user?.franchise_id,
  );
  const isOnlineLeadFeatureEnabled = useAppSelector(
    (s) => s.auth.user?.vendor?.is_online_lead_feature_enabled === true,
  );
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);
  const normalizedUserType = userType?.toLowerCase();
  const isSuperAdminOrAdmin =
    normalizedUserType === "super-admin" ||
    normalizedUserType === "admin" ||
    normalizedUserType === "sales admin" ||
    normalizedUserType === "sales-admin";

  const shouldIncludeFranchise =
    normalizedUserType === "admin" ||
    normalizedUserType === "super-admin" ||
    normalizedUserType === "sales-executive" ||
    normalizedUserType === "head-site-supervisor";

  const [actingLeadId, setActingLeadId] = React.useState<number | null>(null);

  const handleApprove = React.useCallback(async (leadId: number) => {
    setActingLeadId(leadId);
    try {
      const res = await apiClient.post(`/online-leads/${leadId}/approve`, {
        user_id: userId,
      });
      if (res.data?.success) {
        toastManager.add({ title: "Lead approved successfully", type: "success" });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["draft-lead-table-data"] }),
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] }),
          queryClient.invalidateQueries({ queryKey: ["vendorOverallLeads"] }),
          queryClient.invalidateQueries({ queryKey: ["leadStats"] }),
          queryClient.invalidateQueries({ queryKey: ["activity-status-counts"] }),
          queryClient.invalidateQueries({ queryKey: ["online-leads"] }),
        ]);
      }
    } catch (err: any) {
      toastManager.add({
        title: err.response?.data?.error || "Failed to approve lead.",
        type: "error",
      });
    } finally {
      setActingLeadId(null);
    }
  }, [userId, queryClient]);

  const handleReject = React.useCallback(async (leadId: number) => {
    setActingLeadId(leadId);
    try {
      const res = await apiClient.post(`/online-leads/${leadId}/reject`, {
        user_id: userId,
      });
      if (res.data?.success) {
        toastManager.add({ title: "Lead rejected successfully", type: "success" });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["draft-lead-table-data"] }),
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] }),
          queryClient.invalidateQueries({ queryKey: ["vendorOverallLeads"] }),
          queryClient.invalidateQueries({ queryKey: ["leadStats"] }),
          queryClient.invalidateQueries({ queryKey: ["activity-status-counts"] }),
          queryClient.invalidateQueries({ queryKey: ["online-leads"] }),
        ]);
      }
    } catch (err: any) {
      toastManager.add({
        title: err.response?.data?.error || "Failed to reject lead.",
        type: "error",
      });
    } finally {
      setActingLeadId(null);
    }
  }, [userId, queryClient]);

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const postPayload: DraftLeadTableDataPostPayload = React.useMemo(() => {
    const sortOrder: "asc" | "desc" = sorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(columnFilters);

    return {
      userId: userId!,
      franchise_id: shouldIncludeFranchise ? franchiseId! : undefined,
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
      priority:
        Array.isArray(mappedFilters.priority) &&
          mappedFilters.priority.length > 0
          ? mappedFilters.priority
          : undefined,
      created_at: sortOrder,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,
      site_map_link: mappedFilters.site_map_link,
      date_range: mappedFilters.date_range,
    };
  }, [
    userId,
    shouldIncludeFranchise,
    franchiseId,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
  ]);

  const { data, isLoading } = useDraftLeadTableDataPost(
    vendorId!,
    postPayload
  );


  const tableData: DraftLeadRow[] = React.useMemo(() => {
    const rawData = data?.data || [];
    return rawData.map((lead: any, index: number) => ({
      id: lead.id,
      srNo: index + 1,
      lead_code: lead.lead_code ?? "",
      name: `${lead.firstname ?? ""} ${lead.lastname ?? ""}`.trim(),
      email: lead.email ?? "",
      contact: `${lead.country_code ?? ""}${lead.contact_no ?? ""}`.trim(),
      siteAddress: lead.site_address ?? "",
      site_map_link: lead.site_map_link ?? "",
      architechName: lead.archetech_name ?? "",
      designerRemark: lead.designer_remark ?? "",
      furnitureType: (() => {
        const types = (lead.productMappings || [])
          .map((p: any) => {
            const raw = String(p.productType?.type ?? "").trim();
            return raw.includes("|") ? raw.split("|").pop()!.trim() : raw;
          })
          .filter(Boolean);
        return Array.from(new Set(types)).join(", ");
      })(),
      furnitueStructures: lead.leadProductStructureMapping?.map((p: any) => p.productStructure?.type) ?? [],
      source: lead.source?.type ?? "",
      siteType: lead.siteType?.type ?? "",
      createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
      updatedAt: lead.updated_at ?? "",
      altContact: lead.alt_contact_no ?? "",
      status: lead.statusType?.type ?? "Draft",
      statusTag: lead.statusTag ?? lead.statusType?.tag ?? "",
      sales_executive: formatSalesExecutiveName(lead.assignedTo),
      assignedToId: lead.assignedTo?.id ?? "",
      isDraft: lead.is_draft === true,
      accountId: lead.account?.id ?? lead.account_id ?? 0,
      priority: lead.priority ?? "",
      servicing: "",
      approval_status: lead.approval_status,
      pending_store_id: lead.pending_store_id,
      is_online_lead: isOnlineLeadFeatureEnabled || lead.is_online_lead === true,
      franchiseId: lead.franchise_id ?? lead.franchise?.id ?? undefined,
      rawLead: lead,
    }));
  }, [data, isOnlineLeadFeatureEnabled]);

  const totalPages = data?.pagination?.totalPages || 1;
  const columns = React.useMemo(
    () =>
      getDraftLeadsColumns({
        onApprove: handleApprove,
        onReject: handleReject,
        actingLeadId,
        userType: normalizedUserType,
        userFranchiseId: franchiseId ?? undefined,
        isSuperAdminOrAdmin,
        isOnlineLeadFeatureEnabled,
      }),
    [handleApprove, handleReject, actingLeadId, normalizedUserType, franchiseId, isSuperAdminOrAdmin, isOnlineLeadFeatureEnabled],
  );

  const table = useReactTable({
    data: tableData,
    columns,

    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,

    pageCount: totalPages,

    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },

    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id?.toString() || Math.random().toString(),
  });

  const handleRowClick = (row: DraftLeadRow) => {
    if (row.id) {
      if (row.is_online_lead) {
        router.push(`/dashboard/online-leads/details/${row.id}`);
      } else {
        const basePath = isOnlineLeadFeatureEnabled
          ? "/dashboard/leads/online-lead"
          : "/dashboard/leads/draft-lead";
        router.push(`${basePath}/details/${row.id}`);
      }
    }
  };

  return (
    <div className="py-2">
      {/* ================= HEADER ================= */}
      <div className="px-4 space-y-3 md:space-y-2 md:flex md:flex-col lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">{stageTitle}</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {stageDescription}
          </p>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <DataTable
        table={table}
        className="pt-3 px-4"
        onRowDoubleClick={handleRowClick}
      >
        {/* ================= MOBILE LAYOUT ================= */}
        <div className="flex flex-col gap-4 md:hidden">
          <div className="flex flex-wrap gap-2">
            <DataTableViewOptions table={table} />

            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
          </div>

          <ClearInput
            value={globalFilter ?? ""}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination({ ...pagination, pageIndex: 0 });
            }}
            placeholder="Search…"
            className="w-full sm:w-64 h-8"
          />
        </div>

        {/* ================= DESKTOP LAYOUT ================= */}
        <div className="hidden md:flex justify-between items-end">
          <div className="flex items-end gap-3">
            <ClearInput
              value={globalFilter ?? ""}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination({ ...pagination, pageIndex: 0 });
              }}
              placeholder="Search…"
              className="h-8 w-64"
            />

            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
          </div>

          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </DataTable>
    </div>
  );
}
