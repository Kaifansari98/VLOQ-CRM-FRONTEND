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
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

import { useDeleteLead } from "@/hooks/useDeleteLead";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { BookingLead, ProcessedBookingLead } from "@/types/booking-types";
import { getTechCheckTableColumns } from "./tech-check-stage-columns";
// 🔁 Temporarily reuse booking hooks
import {
  useTechCheckLeads,
  useVendorTechCheckOverallLeads,
} from "@/api/tech-check";

import BookingEditModal from "@/components/sales-executive/booking-stage/bookint-edit-form";
import AssignTaskFinalMeasurementForm from "@/components/sales-executive/Lead/assign-task-final-measurement-form";

const TechCheckStageTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();

  const [viewType, setViewType] = useState<"my" | "overall">("my");

  // Temporary: using booking stage APIs
  const {
    data: myLeadsData,
    isLoading: isMyLoading,
    isError: isMyError,
  } = useTechCheckLeads(vendorId!, userId!);

  console.log("Tech check data :- ", myLeadsData);

  const {
    data: overallLeadsData,
    isLoading: isOverallLoading,
    isError: isOverallError,
  } = useVendorTechCheckOverallLeads(vendorId!, userId!);

  const isLoading = viewType === "my" ? isMyLoading : isOverallLoading;
  const isError = viewType === "my" ? isMyError : isOverallError;

  const myLeadsCount = myLeadsData?.total ?? 0;
  const overallLeadsCount = overallLeadsData?.count ?? 0;

  const activeData =
    viewType === "my" ? myLeadsData?.leads || [] : overallLeadsData?.data || [];

  // Modals + Actions
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [editOpenLead, setEditOpenLead] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openFMTaskModal, setOpenFMTaskModal] = useState(false);

  const [rowAction, setRowAction] =
    useState<DataTableRowActionFinalMeasurement<ProcessedBookingLead> | null>(
      null
    );

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

  const deleteLeadMutation = useDeleteLead();

  // Process row data
  const rowData = useMemo<ProcessedBookingLead[]>(() => {
    if (!activeData || !Array.isArray(activeData)) return [];

    return (activeData as BookingLead[]).map((lead, index) => ({
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
          ?.map((pm) => pm.productType?.type)
          .filter(Boolean)
          .join(", ") || "-",
      productStructures:
        lead.leadProductStructureMapping
          ?.map((ps) => ps.productStructure?.type)
          .filter(Boolean)
          .join(", ") || "-",
      final_booking_amt: lead.final_booking_amt || 0,
      siteSupervisor: lead.siteSupervisors?.[0]?.user_name || "-",
      siteSupervisorId: lead.siteSupervisors?.[0]?.id ?? 0,
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      assignedTo: lead.assignedTo?.user_name || "",
      documentUrl: [],
      paymentInfo: null,
      paymentsText: lead.payments?.[0]?.payment_text || "-",
      bookingAmount: lead.payments?.[0]?.amount || 0,
      accountId: lead.account_id,
    }));
  }, [activeData]);

  // Columns
  const columns = useMemo(
    () => getTechCheckTableColumns({ setRowAction, userType }),
    [setRowAction, userType]
  );

  // Table setup
  const table = useReactTable({
    data: rowData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
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
      rowSelection,
      globalFilter,
      columnVisibility,
    },
  });

  useEffect(() => {
    if (!rowAction) return;
    if (rowAction.variant === "delete") setOpenDelete(true);
    if (rowAction.variant === "reassignlead") setAssignOpenLead(true);
    if (rowAction.variant === "edit") setEditOpenLead(true);
    if (rowAction.variant === "view") setOpenViewModal(true);
    if (rowAction.variant === "assignTask") setOpenFMTaskModal(true);
  }, [rowAction]);

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

  const handleRowClick = (row: ProcessedBookingLead) => {
    router.push(`/dashboard/production/tech-check/details/${row.id}`);
  };

  if (!vendorId) return <p>No vendor selected</p>;
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading leads</p>;

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
            {!["admin", "super_admin"].includes(
              userType?.toLowerCase() || ""
            ) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewType("my")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewType === "my"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Leads
                  <span className="ml-2 py-0.5 px-1.5 rounded-full bg-blue-100 text-xs text-blue-500">
                    {myLeadsCount}
                  </span>
                </button>

                <button
                  onClick={() => setViewType("overall")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewType === "overall"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Overall Leads
                  <span className="ml-2 py-0.5 px-1.5 rounded-full bg-blue-100 text-xs text-blue-500">
                    {overallLeadsCount}
                  </span>
                </button>
              </div>
            )}

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
              lead from your system.
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
      <BookingEditModal
        open={editOpenLead}
        onOpenChange={setEditOpenLead}
        data={rowAction?.row.original}
      />
      <AssignTaskFinalMeasurementForm
        open={openFMTaskModal}
        onOpenChange={setOpenFMTaskModal}
        data={rowAction?.row.original}
      />
    </>
  );
};

export default TechCheckStageTable;
