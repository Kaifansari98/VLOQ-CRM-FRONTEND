"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useVendorUserLeads,
  useVendorUserLeadsOpen,
} from "@/hooks/useLeadsQueries";
import { type Lead } from "@/api/leads";

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
import type {
  DataTableRowActionOpen,
} from "@/types/data-table";
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
import { useRouter } from "next/navigation";
import { getViewOpenLeadsTableColumns } from "./view-tables-coloumns";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";

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
  initial_site_measurement_date: string;
};

const ViewOpenLeadTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const vendorUserLeadsQuery = useVendorUserLeadsOpen(vendorId || 0);
  const router = useRouter();
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openAssignTask, setOpenAssignTak] = useState<boolean>(false);
  const [assignOpenLead, setAssignOpenLead] = useState<boolean>(false);
  const [editOpenLead, setEditOpenLead] = useState<boolean>(false);
  const deleteLeadMutation = useDeleteLead();
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
  // Row action state
  const [rowAction, setRowAction] =
    React.useState<DataTableRowActionOpen<ProcessedLead> | null>(null);

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
    if (rowAction?.variant === "assigntask" && rowAction.row) {
      setOpenAssignTak(true);
    }
  }, [rowAction]);

  const handleDeleteLead = async () => {
    if (!rowAction?.row) return;

    const leadId = rowAction.row.original.id;

    // ✅ Pre-check vendorId and userId
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

  const handleRowClick = (row: ProcessedLead) => {
    const leadId = row.id;
    router.push(`/dashboard/sales-executive/leadstable/details/${leadId}`);
  };

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [rowSelection, setRowSelection] = React.useState({});

  // Process leads into table data
  const rowData = useMemo<ProcessedLead[]>(() => {
    if (!vendorUserLeadsQuery.data) return [];

    console.log("vendor user leads: ", vendorUserLeadsQuery.data);

    return vendorUserLeadsQuery.data.map((lead: Lead, index: number) => ({
      id: lead.id,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      assign_to: lead.assignedTo?.user_name || "",
      contact: lead.country_code + " " + lead.contact_no || "",
      priority: lead.priority || "",
      siteAddress: lead.site_address || "",
      billingName: lead.billing_name || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      productTypes:
        lead.productMappings?.map((pm) => pm.productType.type).join(", ") || "",
      productStructures:
        lead.leadProductStructureMapping
          ?.map((psm) => psm.productStructure.type)
          .join(", ") || "",
      source: lead.source?.type || "",
      siteType: lead.siteType?.type || "",
      createdAt: lead.created_at || "",
      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      initial_site_measurement_date: lead.initial_site_measurement_date || "",
    }));
  }, [vendorUserLeadsQuery.data]);

  // Setup columns
  const columns = React.useMemo(
    () => getViewOpenLeadsTableColumns({ setRowAction, userType }),
    [setRowAction, userType]
  );

  // Create table with direct TanStack Table
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


  if (vendorUserLeadsQuery.error) {
    return (
      <div className="p-8 text-red-600">
        Error loading leads: {vendorUserLeadsQuery.error.message}
      </div>
    );
  }

  const mockProps = {
    shallow: true,
    debounceMs: 300,
    throttleMs: 50,
  };

  console.log("usertypes: ", userType);
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

      <AssignTaskSiteMeasurementForm
        open={openAssignTask}
        onOpenChange={setOpenAssignTak}
        data={rowAction?.row.original}
      />
    </>
  );
};

export default ViewOpenLeadTable;
