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

import { useFeatureFlags } from "./feature-flags-provider";
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
import { getBookingLeadsTableColumns } from "./booking-stage-columns";
import { useBookingLeads } from "@/hooks/booking-stage/use-booking";
import BookingEditModal from "@/components/sales-executive/booking-stage/bookint-edit-form";
import AssignTaskFinalMeasurementForm from "@/components/sales-executive/Lead/assign-task-final-measurement-form";

const BookingStageLeadsTable = () => {
  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  // Feature flags
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();

  // React Query hook
  const { data, error, isLoading, isError } = useBookingLeads(vendorId!, userId!);
  console.log("Booking Leads Data:", data);
  // Local state
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openViewModal, setOpenViewModal] = useState<boolean>(false);
  const [editOpenLead, setEditOpenLead] = useState(false);
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
    billingName: false,
    source: false,
    createdAt: false,
    altContact: false,
    productTypes: false,
    productStructures: false,
    designerRemark: false,
  });

  // Mutations
  const deleteLeadMutation = useDeleteLead();

  // Derived: formatted row data
  const rowData = useMemo<ProcessedBookingLead[]>(() => {
    if (!data?.data) return [];

    return data.data.map((lead: BookingLead, index: number) => ({
      id: lead.id,
      srNo: index + 1,
      name: `${lead.firstname || ""} ${lead.lastname || ""}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      priority: lead.priority || "",
      siteAddress: lead.site_address || "",
      billingName: lead.billing_name || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      assignedTo: lead.assignedTo?.user_name || "",

      siteSupervisor: lead.siteSupervisors?.[0]?.user_name || "-",
      siteSupervisorId: lead.siteSupervisors?.[0]?.id,
      bookingAmount: lead.payments?.[0].amount || 0,
      paymentsText: lead.payments?.[0].payment_text || "-",
      final_booking_amt: lead.final_booking_amt,
      accountId: lead.account_id,
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
    }));
  }, [data]);

  // Columns
  const columns = useMemo(
    () => getBookingLeadsTableColumns({ setRowAction, userType }),
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

  // Effects
  useEffect(() => {
    if (!rowAction) return;
    if (rowAction.variant === "delete") setOpenDelete(true);
    if (rowAction.variant === "reassignlead") setAssignOpenLead(true);
    if (rowAction.variant === "edit") setEditOpenLead(true);
    if (rowAction.variant === "view") setOpenViewModal(true);
    // if (rowAction.variant === "finalMeasu") setOpenFinalModal(true);
    if (rowAction.variant === "assignTask" && rowAction.row) setOpenFMTaskModal(true);
  }, [rowAction]);

  // Handlers
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
    router.push(`/dashboard/sales-executive/booking-stage/details/${row.id}`);
  };

  // Early returns
  if (!vendorId) return <p>No vendor selected</p>;
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error loading leads</p>;

  // Render
  return (
    <>
      <DataTable table={table} onRowDoubleClick={handleRowClick}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                table={table}
                shallow
                debounceMs={300}
                throttleMs={50}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow
                debounceMs={300}
                throttleMs={50}
              />
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

      {/* <FinalMeasurementModal
        open={openFinalModal}
        onOpenChange={setOpenFinalModal}
        data={rowAction?.row.original}
      /> */}
    </>
  );
};

export default BookingStageLeadsTable;
