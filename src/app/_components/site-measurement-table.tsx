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
import type { DataTableRowAction } from "@/types/data-table";
import { getSiteMeasurementColumn } from "./site-measurment-columns";
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
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { toast } from "react-toastify";
import { useInitialSiteMeasurement } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import {
  Document,
  ProcessedSiteMeasurementLead,
  SiteMeasurmentLead,
  Upload,
} from "@/types/site-measrument-types";
import SiteMesurementModal from "@/components/sales-executive/siteMeasurement/site-mesurement-modal";
import { useRouter } from "next/navigation";
import { useMoveToDesigningStage } from "@/api/designingStageQueries";
import { useQueryClient } from "@tanstack/react-query";

const SiteMeasurementTable = () => {
  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  // Feature flags
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();
  // State hooks
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openMoveCnfrm, setOpenMoveCnfrm] = useState<boolean>(false);
  const [assignOpenLead, setAssignOpenLead] = useState<boolean>(false);
  const [editOpenLead, setEditOpenLead] = useState<boolean>(false);
  const [openMesurement, setOpenMesurement] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      architechName: false,
      billingName: false,
      source: false,
      createdAt: false,
      altContact: false,
      productTypes: false,
      productStructures: false,
      designerRemark: false,
    });
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ProcessedSiteMeasurementLead> | null>(
      null
    );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const leadId = Number(rowAction?.row.id);

  // Query hooks - always called, but conditionally with null/undefined params
  const { data, error, isLoading, isError } = useInitialSiteMeasurement(
    vendorId || 0
  );

  // Custom hooks
  const deleteLeadMutation = useDeleteLead();

  const { mutate: moveToDesigningStage, isPending: isMovePending } =
    useMoveToDesigningStage();
  const queryClient = useQueryClient();

  const handleMoveToDesigningStage = () => {
    if (!leadId || !vendorId || !userId) {
      toast.error("❌ Missing required data to move lead");
      return;
    }

    moveToDesigningStage(
      { lead_id: leadId, vendor_id: vendorId, user_id: userId },
      {
        onSuccess: (res) => {
          toast.success("Lead moved to Designing Stage successfully!");
          queryClient.invalidateQueries({
            queryKey: ["siteMeasurementLeads", vendorId, 2],
          });
        },
        onError: (err) => {
          console.error("❌ API error:", err);
          toast.error("Failed to move lead. Please try again.");
        },
      }
    );
  };

  // Effects
  useEffect(() => {
    if (rowAction?.variant === "delete" && rowAction.row) {
      setOpenDelete(true);
    }
    if (rowAction?.variant === "reassignlead" && rowAction.row) {
      console.log("Original Data row Leads: ", rowAction.row.original);
      setAssignOpenLead(true);
    }
    if (rowAction?.variant === "edit" && rowAction.row) {
      console.log("Original Edit Data row Leads: ", rowAction.row.original);
      setEditOpenLead(true);
    }

    if (rowAction?.variant === "move" && rowAction.row) {
      console.log("Original Edit Data row Leads: ", rowAction.row.id);
      setOpenMoveCnfrm(true);
    }

    if (rowAction?.variant === "measurement" && rowAction.row) {
      console.log("Original Edit Data row Leads: ", rowAction.row.original);
      setOpenMesurement(true);
    }
  }, [rowAction]);

  // Memoized values
  const rowData = useMemo<ProcessedSiteMeasurementLead[]>(() => {
    if (!data?.data) return [];

    return data.data.map((lead: SiteMeasurmentLead, index: number) => {
      const allDocumentUrls: Document[] = Array.isArray(lead.documents)
        ? lead.documents
            .filter(
              (doc): doc is Document => !!doc.doc_og_name && !!doc.signed_url
            )
            .map((doc) => ({
              id: doc.id,
              doc_og_name: doc.doc_og_name,
              doc_sys_name: doc.doc_sys_name,
              signed_url: doc.signed_url,
              file_type: doc.file_type,
              is_image: doc.is_image,
              created_at: doc.created_at,
              doc_type_id: doc.doc_type_id,
            }))
        : [];

      return {
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
        assignedTo: lead.assignedTo?.user_name || "Unassigned",
        productTypes: "",
        productStructures: "",
        documentUrl: allDocumentUrls,
        paymentInfo:
          lead.uploads.find((item: Upload) => item.paymentInfo !== null)
            ?.paymentInfo || null,
        accountId: lead.account.id || "",
      };
    });
  }, [data]);

  const columns = React.useMemo(
    () => getSiteMeasurementColumn({ setRowAction, userType }),
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

  // Effect for logging
  useEffect(() => {
    console.log("📌 RowData:", rowData);
    console.log(
      "📌 Extracted Documents:",
      rowData.map((row) => ({
        id: row.id,
        name: row.name,
        documentUrls: row.documentUrl,
      }))
    );
  }, [rowData]);

  // 🔥 NOW HANDLE CONDITIONAL RENDERING AFTER ALL HOOKS

  // Early returns for error states
  if (!vendorId) {
    return <p>No vendor selected</p>;
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    console.log("API Error:", error);
    return <p>Something went wrong</p>;
  }

  // Success state logging
  console.log("API Success:", data);
  console.log("Initial Site Measurement Data: ", data);
  console.log("Processed Row Data: ", rowData);
  console.log("usertypes: ", userType);

  // Event handlers
  const handleDeleteLead = async () => {
    if (!rowAction?.row) return;

    const leadId = rowAction.row.original.id;

    if (!vendorId || !userId) {
      toast.error("Vendor or User information is missing!");
      return;
    }

    deleteLeadMutation.mutate(
      {
        leadId,
        vendorId,
        userId,
      },
      {
        onSuccess: () => {
          toast.success("Lead deleted successfully!");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to delete lead!");
        },
      }
    );

    setOpenDelete(false);
    setRowAction(null);
  };

  const mockProps = {
    shallow: true,
    debounceMs: 300,
    throttleMs: 50,
  };

  const handleRowClick = (row: ProcessedSiteMeasurementLead) => {
    const lead = row.id;
    router.push(
      `/dashboard/sales-executive/initial-site-measurement/details/${lead}`
    );
  };

  // Main render
  return (
    <>
      <DataTable table={table} onRowClick={handleRowClick}>
        {enableAdvancedFilter ? (
          <>
            <DataTableAdvancedToolbar table={table}>
              <DataTableSortList table={table} align="start" />
              {filterFlag === "advancedFilters" ? (
                <DataTableFilterList
                  table={table}
                  shallow={mockProps.shallow}
                  debounceMs={mockProps.debounceMs}
                  throttleMs={mockProps.throttleMs}
                  align="start"
                />
              ) : (
                <DataTableFilterMenu
                  table={table}
                  shallow={mockProps.shallow}
                  debounceMs={mockProps.debounceMs}
                  throttleMs={mockProps.throttleMs}
                />
              )}
            </DataTableAdvancedToolbar>
          </>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>

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

      <AlertDialog open={openMoveCnfrm} onOpenChange={setOpenMoveCnfrm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the lead to Designing Stage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMovePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToDesigningStage}
              disabled={isMovePending}
            >
              {isMovePending ? "Processing..." : "Yes, Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SiteMesurementModal
        open={openMesurement}
        onOpenChange={setOpenMesurement}
        data={rowAction?.row.original}
      />

      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={rowAction?.row.original}
      />

      <EditLeadModal
        open={editOpenLead}
        onOpenChange={setEditOpenLead}
        leadData={rowAction?.row.original}
      />
    </>
  );
};

export default SiteMeasurementTable;
