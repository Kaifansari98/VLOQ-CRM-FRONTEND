"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import type { DataTableRowActionFinalMeasurement } from "@/types/data-table";

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

import { useDeleteLead } from "@/hooks/useDeleteLead";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import AssignTaskFinalMeasurementForm from "@/components/sales-executive/Lead/assign-task-final-measurement-form";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { useSiteReadinessLeads } from "@/api/installation/useSiteReadinessLeads";
import {
  orderLoginLead as SiteReadinessLead,
  ProcessedOrderLoginLead as ProcessedSiteReadinessLead,
} from "@/types/production/order-login.types";

import { getSiteReadinessTableColumns } from "./site-readiness-columns";// ✅ reuse same column config

const SiteReadinessTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

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

  // 🔹 Fetch Site Readiness Data
  const { data, isLoading, isError } = useSiteReadinessLeads(
    vendorId!,
    userId!,
    pagination.pageIndex + 1,
    pagination.pageSize
  );

  const deleteLeadMutation = useDeleteLead();

  // 🔹 Modals
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [rowAction, setRowAction] =
    useState<DataTableRowActionFinalMeasurement<ProcessedSiteReadinessLead> | null>(
      null
    );

  // 🔹 Row Actions
  useEffect(() => {
    if (!rowAction) return;
    if (rowAction.variant === "delete") setOpenDelete(true);
    if (rowAction.variant === "reassignlead") setAssignOpenLead(true);
    if (rowAction.variant === "assignTask") setOpenTaskModal(true);
  }, [rowAction]);

  // 🔹 Data Mapping
  const rowData = useMemo<ProcessedSiteReadinessLead[]>(() => {
    if (!data?.leads || !Array.isArray(data.leads)) return [];

    return (data.leads as SiteReadinessLead[]).map((lead, index) => ({
      id: lead.id,
      srNo: index + 1,
      lead_code: lead.lead_code || "-",
      name: `${lead.firstname || ""} ${lead.lastname || ""}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      siteAddress: lead.site_address || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      productTypes:
        lead.productMappings
          ?.map((pm: any) => pm.productType?.type)
          .join(", ") || "-",
      productStructures:
        lead.leadProductStructureMapping
          ?.map((ps: any) => ps.productStructure?.type)
          .join(", ") || "-",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "Site Readiness",
      assignedTo: lead.assignedTo?.user_name || "-",
      accountId: lead.account_id,
      siteSupervisor: lead.siteSupervisors?.[0]?.user_name || "-",
      siteSupervisorId: lead.siteSupervisors?.[0]?.id ?? 0,
      final_booking_amt: lead.final_booking_amt ?? 0,
    }));
  }, [data]);

  const columns = useMemo(
    () => getSiteReadinessTableColumns({ setRowAction, userType }),
    [setRowAction, userType]
  );

  // ⚙️ Table
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

  const handleDeleteLead = () => {
    if (!rowAction?.row || !vendorId || !userId) {
      toast.error("Missing vendor or user info!");
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: rowAction.row.original.id, vendorId, userId },
      {
        onSuccess: () => toast.success("Lead deleted successfully!"),
        onError: (err: any) =>
          toast.error(err?.message || "Failed to delete lead"),
      }
    );

    setOpenDelete(false);
    setRowAction(null);
  };

  const handleRowClick = (row: ProcessedSiteReadinessLead) => {
    router.push(`/dashboard/installation/site-readiness/details/${row.id}`);
  };

  if (!vendorId) return <p>No vendor selected</p>;
  if (isLoading) return <p>Loading Site Readiness leads...</p>;
  if (isError) return <p>Error loading Site Readiness leads</p>;

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

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={rowAction?.row.original}
      />
      <AssignTaskFinalMeasurementForm
        open={openTaskModal}
        onOpenChange={setOpenTaskModal}
        data={rowAction?.row.original}
      />
    </>
  );
};

export default SiteReadinessTable;
