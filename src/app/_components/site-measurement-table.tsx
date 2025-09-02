"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useVendorUserLeads } from "@/hooks/useLeadsQueries";
import { deleteLead, type Lead } from "@/api/leads";

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
import ViewLeadModal from "@/components/sales-executive/view-lead-moda";
import AssignLeadModal from "@/components/sales-executive/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/lead-edit-form-modal";
import { toast } from "react-toastify";
import { useInitialSiteMeasurement } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import ViewInitialSiteMeasurmentLead from "@/components/sales-executive/siteMeasurement/view-site-measurement";
import { SiteMeasurmentLead } from "@/types/site-measrument-types";

// Define processed lead type for table
export type ProcessedLead = {
  id: number;
  srNo: number;
  name: string;
  email: string;
  contact: string;
  priority: string;
  siteAddress: string;
  billingName: string;
  architechName: string;
  designerRemark: string;
  productTypes: string;
  productStructures: string;
  siteType: string;
  createdAt: string;
  updatedAt: string;
  altContact?: string;
  source: string;
  status: string;
  assignedTo: string;
  documentUrl: string[];
};

const SiteMeasurementTable = () => {
  // 🔥 ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY CONDITIONAL LOGIC

  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  // Feature flags
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  // State hooks
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);
  const [assignOpenLead, setAssignOpenLead] = useState<boolean>(false);
  const [editOpenLead, setEditOpenLead] = useState<boolean>(false);
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
    React.useState<DataTableRowAction<ProcessedLead> | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  // Query hooks - always called, but conditionally with null/undefined params
  const { data, error, isLoading, isError } = useInitialSiteMeasurement(
    vendorId || 0, // Provide default value to avoid conditional hook calls
    2
  );

  // Custom hooks
  const deleteLeadMutation = useDeleteLead();

  // Effects
  useEffect(() => {
    if (rowAction?.variant === "delete" && rowAction.row) {
      setOpenDelete(true);
    }
    if (rowAction?.variant === "view" && rowAction.row) {
      console.log("Original Data row Leads: ", rowAction.row.original);
      setOpenView(true);
    }
    if (rowAction?.variant === "reassignlead" && rowAction.row) {
      console.log("Original Data row Leads: ", rowAction.row.original);
      setAssignOpenLead(true);
    }
    if (rowAction?.variant === "edit" && rowAction.row) {
      console.log("Original Edit Data row Leads: ", rowAction.row.original);
      setEditOpenLead(true);
    }
  }, [rowAction]);

  // Memoized values
  const rowData = useMemo<ProcessedLead[]>(() => {
    // Fix: API returns data directly under 'data' property, not nested
    if (!data?.data) return [];

    return data.data.map((lead: SiteMeasurmentLead, index: number) => {
      // Extract all document URLs from uploads
      const allDocumentUrls: string[] = [];

      // Check if uploads exist and iterate through them
      if (lead.uploads && Array.isArray(lead.uploads)) {
        lead.uploads.forEach((upload) => {
          // Check if documents exist in this upload
          if (upload.documents && Array.isArray(upload.documents)) {
            upload.documents.forEach((doc) => {
              if (doc.doc_sys_name) {
                allDocumentUrls.push(doc.doc_sys_name);
              }
            });
          }
        });
      }

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
        productTypes: "", // You might need to map this from lead.summary or other fields
        productStructures: "", // You might need to map this from lead.summary or other fields
        documentUrl: allDocumentUrls, // Now properly mapped as string array
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

  // Main render
  return (
    <>
      <DataTable table={table}>
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

      <ViewInitialSiteMeasurmentLead
        open={openView}
        onOpenChange={setOpenView}
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
