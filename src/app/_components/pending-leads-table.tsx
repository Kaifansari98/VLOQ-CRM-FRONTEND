"use client";

import { useAppSelector } from "@/redux/store";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
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
import React from "react";
import type { Lead } from "@/api/leads";
import {
  getPendingLeadsColumns,
  PendingLeadRow,
} from "./pending-leads-columns";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RevertRemarkModal from "@/components/generics/RevertRemarkModal";
import { useRevertActivityStatus } from "@/hooks/useActivityStatus";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useQueryClient } from "@tanstack/react-query";
import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { mapTableFiltersToPayload } from "@/lib/utils";
import {
  ActivityStatusFilterPayload,
  useLostApprovalLeadsFilter,
  useLostLeadsFilter,
  useOnHoldLeadsFilter,
} from "@/api/activityStatus";

export default function PendingLeadsTable({
  tab,
  stageTitle = "Pending Leads",
  stageDescription = "",
}: {
  tab: "onHold" | "lostApproval" | "lost";
  stageTitle: string;
  stageDescription?: string;
}) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const router = useRouter();

  // ============================================
  // 🔥 SEPARATE STATE FOR EACH TAB
  // ============================================

  // OnHold States
  const [onHoldGlobalFilter, setOnHoldGlobalFilter] = React.useState("");
  const [onHoldColumnFilters, setOnHoldColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [onHoldPagination, setOnHoldPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // Lost States
  const [lostGlobalFilter, setLostGlobalFilter] = React.useState("");
  const [lostColumnFilters, setLostColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [lostPagination, setLostPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // LostApproval States
  const [lostApprovalGlobalFilter, setLostApprovalGlobalFilter] =
    React.useState("");
  const [lostApprovalColumnFilters, setLostApprovalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [lostApprovalPagination, setLostApprovalPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // ============================================
  // 🔥 COMMON STATES
  // ============================================

  const [activeLead, setActiveLead] = React.useState<PendingLeadRow | null>(
    null,
  );
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [openRemark, setOpenRemark] = React.useState(false);
  const [openActivityStatus, setOpenActivityStatus] = React.useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [rowAction, setRowAction] = React.useState<{
    row: PendingLeadRow;
    variant: "revert" | "lost";
  } | null>(null);

  // ============================================
  // 🔥 CREATE PAYLOADS FOR EACH API
  // ============================================

  const onHoldPayload: ActivityStatusFilterPayload = React.useMemo(() => {
    const sortOrder: "asc" | "desc" = sorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(onHoldColumnFilters);

    return {
      page: onHoldPagination.pageIndex + 1,
      limit: onHoldPagination.pageSize,
      global_search: onHoldGlobalFilter || "",
      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,
      site_address: mappedFilters.site_address,
      furniture_type: mappedFilters.furniture_type, //[1 ,3]
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,
      source: mappedFilters.source,
      assign_to: mappedFilters.assign_to,
      site_map_link: mappedFilters.site_map_link,
      created_at: sortOrder,
      date_range: mappedFilters.date_range,
      status: mappedFilters.stagetag,
    };
  }, [onHoldPagination, onHoldGlobalFilter, onHoldColumnFilters, sorting]);

  const lostPayload: ActivityStatusFilterPayload = React.useMemo(() => {
    const sortOrder: "asc" | "desc" = sorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(lostColumnFilters);

    return {
      page: lostPagination.pageIndex + 1,
      limit: lostPagination.pageSize,
      global_search: lostGlobalFilter || "",
      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,
      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,
      source: mappedFilters.source,
      assign_to: mappedFilters.assign_to,
      site_map_link: mappedFilters.site_map_link,
      created_at: sortOrder,
    };
  }, [lostPagination, lostGlobalFilter, lostColumnFilters, sorting]);

  const lostApprovalPayload: ActivityStatusFilterPayload = React.useMemo(() => {
    const sortOrder: "asc" | "desc" = sorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTableFiltersToPayload(lostApprovalColumnFilters);

    return {
      page: lostApprovalPagination.pageIndex + 1,
      limit: lostApprovalPagination.pageSize,
      global_search: lostApprovalGlobalFilter || "",
      filter_lead_code: mappedFilters.filter_lead_code,
      filter_name: mappedFilters.filter_name,
      contact: mappedFilters.contact,
      alt_contact_no: mappedFilters.alt_contact_no,
      email: mappedFilters.email,
      site_address: mappedFilters.site_address,
      archetech_name: mappedFilters.archetech_name,
      designer_remark: mappedFilters.designer_remark,
      furniture_type: mappedFilters.furniture_type,
      furniture_structure: mappedFilters.furniture_structure,
      site_type: mappedFilters.site_type,
      source: mappedFilters.source,
      assign_to: mappedFilters.assign_to,
      site_map_link: mappedFilters.site_map_link,
      created_at: sortOrder,
    };
  }, [
    lostApprovalPagination,
    lostApprovalGlobalFilter,
    lostApprovalColumnFilters,
    sorting,
  ]);
  // ============================================
  // 🔥 NEW HOOKS WITH FILTERS
  // ============================================

  const { data: onHoldData, isLoading: onHoldLoading } = useOnHoldLeadsFilter(
    vendorId!,
    onHoldPayload,
  );

  console.log("On Hold Data: ", onHoldData);

  const { data: lostData, isLoading: lostLoading } = useLostLeadsFilter(
    vendorId!,
    lostPayload,
  );

  const { data: lostApprovalData, isLoading: lostApprovalLoading } =
    useLostApprovalLeadsFilter(vendorId!, lostApprovalPayload);

  // ============================================
  // 🔥 ROW ACTION HANDLER
  // ============================================

  React.useEffect(() => {
    if (!rowAction) return;

    if (rowAction.variant === "revert") {
      setActiveLead(rowAction.row);
      setOpenConfirm(true);
    }

    if (rowAction.variant === "lost") {
      setActiveLead(rowAction.row);
      setOpenActivityStatus(true);
    }

    setRowAction(null);
  }, [rowAction]);

  const markAsLostMutation = useUpdateActivityStatus();
  const revertMutation = useRevertActivityStatus();

  // ============================================
  // 🔥 PROCESS LEADS TO TABLE ROWS
  // ============================================

  const processLeads = React.useCallback((leads: any[]): PendingLeadRow[] => {
    return leads.map((lead, index) => ({
      id: lead.id,
      lead_code: lead.lead_code,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      siteAddress: lead.site_address || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      activity_status: lead.activity_status || "",
      furnitureType:
        lead.productMappings
          ?.map((pm: any) => pm.productType.type)
          .join(", ") || "",
      furnitueStructures:
        lead.leadProductStructureMapping
          ?.map((psm: any) => psm.productStructure.type)
          .join(", ") || "",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      initial_site_measurement_date: lead.initial_site_measurement_date || "",
      accountId: lead.account?.id ?? lead.account_id ?? 0,
      site_map_link: lead.site_map_link || "",
    }));
  }, []);

  const onHoldProcessed = React.useMemo(
    () => processLeads(onHoldData?.data || []),
    [onHoldData, processLeads],
  );

  const lostProcessed = React.useMemo(
    () => processLeads(lostData?.data || []),
    [lostData, processLeads],
  );

  const lostApprovalProcessed = React.useMemo(
    () => processLeads(lostApprovalData?.data || []),
    [lostApprovalData, processLeads],
  );

  // ============================================
  // 🔥 GET ACTIVE DATA BASED ON TAB
  // ============================================

  const {
    tableData,
    totalPages,
    currentGlobalFilter,
    setCurrentGlobalFilter,
    currentColumnFilters,
    setCurrentColumnFilters,
    currentPagination,
    setCurrentPagination,
  } = React.useMemo(() => {
    switch (tab) {
      case "onHold":
        return {
          tableData: onHoldProcessed,
          totalPages: onHoldData?.pagination?.totalPages ?? 1,
          currentGlobalFilter: onHoldGlobalFilter,
          setCurrentGlobalFilter: setOnHoldGlobalFilter,
          currentColumnFilters: onHoldColumnFilters,
          setCurrentColumnFilters: setOnHoldColumnFilters,
          currentPagination: onHoldPagination,
          setCurrentPagination: setOnHoldPagination,
        };
      case "lostApproval":
        return {
          tableData: lostApprovalProcessed,
          totalPages: lostApprovalData?.pagination?.totalPages ?? 1,
          currentGlobalFilter: lostApprovalGlobalFilter,
          setCurrentGlobalFilter: setLostApprovalGlobalFilter,
          currentColumnFilters: lostApprovalColumnFilters,
          setCurrentColumnFilters: setLostApprovalColumnFilters,
          currentPagination: lostApprovalPagination,
          setCurrentPagination: setLostApprovalPagination,
        };
      case "lost":
        return {
          tableData: lostProcessed,
          totalPages: lostData?.pagination?.totalPages ?? 1,
          currentGlobalFilter: lostGlobalFilter,
          setCurrentGlobalFilter: setLostGlobalFilter,
          currentColumnFilters: lostColumnFilters,
          setCurrentColumnFilters: setLostColumnFilters,
          currentPagination: lostPagination,
          setCurrentPagination: setLostPagination,
        };
      default:
        return {
          tableData: [],
          totalPages: 1,
          currentGlobalFilter: "",
          setCurrentGlobalFilter: () => {},
          currentColumnFilters: [],
          setCurrentColumnFilters: () => {},
          currentPagination: { pageIndex: 0, pageSize: 20 },
          setCurrentPagination: () => {},
        };
    }
  }, [
    tab,
    onHoldProcessed,
    lostProcessed,
    lostApprovalProcessed,
    onHoldData,
    lostData,
    lostApprovalData,
    onHoldGlobalFilter,
    lostGlobalFilter,
    lostApprovalGlobalFilter,
    onHoldColumnFilters,
    lostColumnFilters,
    lostApprovalColumnFilters,
    onHoldPagination,
    lostPagination,
    lostApprovalPagination,
  ]);

  // ============================================
  // 🔥 COLUMNS
  // ============================================

  const columns = React.useMemo(
    () =>
      getPendingLeadsColumns({
        tab,
        onRevert: (lead) => {
          setRowAction({ row: lead, variant: "revert" });
        },
        onMarkAsLost: (lead) => {
          setRowAction({ row: lead, variant: "lost" });
        },
      }),
    [tab],
  );

  // ============================================
  // 🔥 REVERT HANDLERS
  // ============================================

  const onConfirmRevert = () => {
    setOpenConfirm(false);
    setOpenRemark(true);
  };

  const onSubmitRemark = (remark: string) => {
    if (!activeLead || !vendorId || !userId) {
      toast.error("Missing vendor/user/lead info");
      return;
    }

    revertMutation.mutate(
      {
        leadId: activeLead.id,
        payload: {
          vendorId,
          accountId: activeLead.accountId || 0,
          userId,
          remark,
          createdBy: userId,
        },
      },
      {
        onSuccess: () => {
          setOpenRemark(false);
          setActiveLead(null);
          if (tab === "onHold") {
            queryClient.invalidateQueries({
              queryKey: ["onHoldLeads"],
            });
          } else if (tab === "lostApproval") {
            queryClient.invalidateQueries({
              queryKey: ["lostApprovalLeads"],
            });
          } else if (tab === "lost") {
            queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
          }
        },
      },
    );
  };

  // ============================================
  // 🔥 TABLE INSTANCE
  // ============================================

  // ============================================
  // 🔥 TABLE INSTANCE (COMPLETE FIX)
  // ============================================

  const table = useReactTable({
    data: tableData,
    columns,

    // ✅ Manual modes - Backend handles everything
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,

    pageCount: totalPages,

    state: {
      pagination: currentPagination,
      sorting,
      columnFilters: currentColumnFilters,
      rowSelection,
      globalFilter: currentGlobalFilter,
      columnVisibility,
    },

    onPaginationChange: setCurrentPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setCurrentColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setCurrentGlobalFilter,

    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
  });

  // ============================================
  // 🔥 LOADING STATE
  // ============================================

  const isLoading =
    (tab === "onHold" && onHoldLoading) ||
    (tab === "lostApproval" && lostApprovalLoading) ||
    (tab === "lost" && lostLoading);

  // ============================================
  // 🔥 ROW NAVIGATION
  // ============================================

  const handleRowClick = (row: PendingLeadRow) => {
    router.push(
      `/dashboard/leads/leadstable/pendingleaddetails/${row.id}?accountId=${row.accountId}&tab=${tab}`,
    );
  };

  // ============================================
  // 🔥 RENDER
  // ============================================

  return (
    <>
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
              <DataTableSortList table={table} />
              <DataTableFilterList table={table} />
              <DataTableViewOptions table={table} />

              <DataTableDateFilter
                column={table.getColumn("createdAt")!}
                title="Created At"
                multiple
              />
            </div>

            <ClearInput
              value={currentGlobalFilter ?? ""}
              onChange={(e) => {
                setCurrentGlobalFilter(e.target.value);
                setCurrentPagination({ ...currentPagination, pageIndex: 0 });
              }}
              placeholder="Search…"
              className="w-full sm:w-64 h-8"
            />
          </div>

          {/* ================= DESKTOP LAYOUT ================= */}
          <div className="hidden md:flex justify-between items-end">
            <div className="flex items-end gap-3">
              <ClearInput
                value={currentGlobalFilter ?? ""}
                onChange={(e) => {
                  setCurrentGlobalFilter(e.target.value);
                  setCurrentPagination({ ...currentPagination, pageIndex: 0 });
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
              <DataTableSortList table={table} />
              <DataTableFilterList table={table} />
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </DataTable>
      </div>

      {/* ================= CONFIRMATION DIALOG ================= */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Revert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert this lead back to active status?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRevert}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================= REMARK MODAL ================= */}
      <RevertRemarkModal
        open={openRemark}
        onOpenChange={setOpenRemark}
        onSubmitRemark={onSubmitRemark}
        loading={revertMutation.isPending}
      />

      {/* ================= ACTIVITY STATUS MODAL ================= */}
      <ActivityStatusModal
        open={openActivityStatus}
        onOpenChange={setOpenActivityStatus}
        statusType="lost"
        onSubmitRemark={(remark) => {
          if (!activeLead || !vendorId || !userId) return;

          markAsLostMutation.mutate(
            {
              leadId: activeLead.id,
              payload: {
                vendorId,
                accountId: activeLead.accountId || 0,
                userId,
                status: "lost",
                remark,
                createdBy: userId,
              },
            },
            {
              onSuccess: () => {
                toast.success("Lead marked as Lost!");
                setOpenActivityStatus(false);
                setActiveLead(null);
                queryClient.invalidateQueries({
                  queryKey: ["lostApprovalLeads"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["lostLeads"],
                });
              },
            },
          );
        }}
        loading={markAsLostMutation.isPending}
      />
    </>
  );
}
