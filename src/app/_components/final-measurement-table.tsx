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

import { useQueryClient } from "@tanstack/react-query";
import { useCompletedUpdateTask, useCancelledUpdateTask } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";

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
import { getFinalMeasurementLeadsTableColumns } from "./final-measurement-columns";
import {
  FinalMeasurementLead,
  ProcessedFinalMeasurementLead,
} from "@/types/final-measurement";
import { useFinalMeasurementLeads } from "@/hooks/final-measurement/use-final-measurement";
import FinalMeasurementEditModal from "@/components/site-supervisor/final-measurement/final-measurement-edit-modal";
import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";
import RescheduleModal from "@/components/sales-executive/siteMeasurement/reschedule-modal";

const FinalMeasurementLeadsTable = () => {
  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  // Feature flags
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();

  const { data, isLoading, isError } = useFinalMeasurementLeads(
    vendorId!,
    userId!
  );
  console.log("Booking Leads Data:", data);
  // Local state
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [openClientDocModal, setOpenClientDocModal] = useState<boolean>(false);
  const [openFinalModal, setOpenFinalModal] = useState(false);
  const [openCompletedModal, setOpenCompletedModal] = useState<boolean>(false);
  const [openCancelModal, setOpenCancelModal] = useState<boolean>(false);
  const [openRescheduleModal, setOpenRescheduleModal] =
    useState<boolean>(false);

  const [rowAction, setRowAction] =
    useState<DataTableRowActionFinalMeasurement<ProcessedFinalMeasurementLead> | null>(
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
    productTypes: false,
    productStructures: false,
    designerRemark: false,
  });

  // Mutations
  const deleteLeadMutation = useDeleteLead();

  // Derived: formatted row data
  const rowData = useMemo<ProcessedFinalMeasurementLead[]>(() => {
    if (!data?.data) return [];
  
    console.log("Final Measurement Leads:- ", data.data);
  
    return data.data.map((lead: FinalMeasurementLead, index: number) => {
      const followStatus = lead.tasks?.[0]?.status ?? "";
      console.log(`Lead ID: ${lead.id}, followStatus:`, followStatus);
  
      return {
      id: lead.id,
      taskId: lead.tasks?.[0]?.id ?? 0,
      srNo: index + 1,
      name: `${lead.firstname || ""} ${lead.lastname || ""}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      siteAddress: lead.site_address || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      assignedTo: lead.assignedTo?.user_name || "",
      final_booking_amt: lead.final_booking_amt,
      accountId: lead.account_id,
      followStatus,
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
        };
      });
    }, [data]);

  // Columns
  const columns = useMemo(
    () => getFinalMeasurementLeadsTableColumns({ setRowAction, userType }),
    [setRowAction, userType]
  );

  const completedUpdateMutation = useCompletedUpdateTask();
  const cancelledUpdateMutation = useCancelledUpdateTask();
  const queryClient = useQueryClient();

  const handleMarkCompleted = () => {
    if (!rowAction?.row) return;

    const lead = rowAction.row.original;

    completedUpdateMutation.mutate(
      {
        leadId: lead?.id || 0,
        taskId: lead?.taskId || 0,
        payload: {
          status: "completed",
          updated_by: userId || 0,
          closed_at: new Date().toISOString(),
          closed_by: userId || 0,
        },
      },
      {
        onSuccess: () => {
          toast.success("Lead marked as completed!");
          setOpenCompletedModal(false);

          // Invalidate query to refresh data
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["siteMeasurementLeads", vendorId],
            });
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "❌ Failed to update lead");
        },
      }
    );
  };

  const handleCancelLead = () => {
    if (!rowAction?.row) return;

    const lead = rowAction.row.original;

    cancelledUpdateMutation.mutate(
      {
        leadId: lead.id,
        taskId: lead.taskId || 0,
        payload: {
          status: "cancelled",
          updated_by: userId || 0,
          closed_by: userId || 0,
          closed_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Lead cancelled successfully!");
          setOpenCancelModal(false);

          // Invalidate query to refresh data
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["siteMeasurementLeads", vendorId],
            });
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to cancel lead");
        },
      }
    );
  };

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
    if (rowAction.variant === "view") setOpenEditModal(true);
    if (rowAction.variant === "clientdoc") setOpenClientDocModal(true);
    if (rowAction.variant === "finalMeasu") setOpenFinalModal(true);
    if (rowAction?.variant === "completed" && rowAction.row) {
      setOpenCompletedModal(true);
    }
    if (rowAction?.variant === "cancel" && rowAction.row) {
      setOpenCancelModal(true);
    }
    if (rowAction?.variant === "reschedule" && rowAction.row) {
      setOpenRescheduleModal(true);
    }
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

  const handleRowClick = (row: ProcessedFinalMeasurementLead) => {
    router.push(`/dashboard/site-supervisor/final-measurement/details/${row.id}`);
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

      {/* Completed Modal */}
      <AlertDialog
        open={openCompletedModal}
        onOpenChange={setOpenCompletedModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Lead as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this lead as completed? This action
              can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkCompleted}
              disabled={completedUpdateMutation.isPending}
            >
              {completedUpdateMutation.isPending
                ? "Processing..."
                : "Completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Modal */}
      <AlertDialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this lead? This action can’t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelLead}
              disabled={cancelledUpdateMutation.isPending}
            >
              {cancelledUpdateMutation.isPending
                ? "Processing..."
                : "Completed"}
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

      <FinalMeasurementEditModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        data={rowAction?.row.original}
      />

      {/* <ClientDocumantationModal
        open={openClientDocModal}
        onOpenChange={setOpenClientDocModal}
        data={rowAction?.row.original}
      /> */}

      <FinalMeasurementModal
        open={openFinalModal}
        onOpenChange={setOpenFinalModal}
        data={rowAction?.row.original}
      />

      <RescheduleModal
        open={openRescheduleModal}
        onOpenChange={setOpenRescheduleModal}
        data={rowAction?.row.original}
      />
    </>
  );
};

export default FinalMeasurementLeadsTable;