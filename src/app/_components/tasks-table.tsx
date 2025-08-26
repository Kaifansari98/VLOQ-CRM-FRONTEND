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
import { getVendorLeadsTableColumns } from "./tasks-table-columns";
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
  source: string;
  siteType: string;
  createdAt: string;
  updatedAt: string;
};

const VendorLeadsTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );
  const shouldFetch = !!vendorId && !!userId;
  // Fetch leads
  const vendorUserLeadsQuery = useVendorUserLeads(
    vendorId || 0,
    userId || 0,
    shouldFetch
  );
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);
  const [assignOpenLead, setAssignOpenLead] = useState<boolean>(false);
  const deleteLeadMutation = useDeleteLead();

  // Row action state
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ProcessedLead> | null>(null);

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
  }, [rowAction]);

  const handleDeleteLead = async () => {
    if (rowAction?.row) {
      const leadId = rowAction.row.original.id;
      deleteLeadMutation.mutate({
        leadId,
        vendorId: vendorId!,
        userId: userId!,
      });
    }
    setOpenDelete(false);
    setRowAction(null);
  };

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Process leads into table data
  const rowData = useMemo<ProcessedLead[]>(() => {
    if (!vendorUserLeadsQuery.data) return [];

    return vendorUserLeadsQuery.data.map((lead: Lead, index: number) => ({
      id: lead.id,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      contact: lead.contact_no || "",
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
    }));
  }, [vendorUserLeadsQuery.data]);

  // Setup columns
  const columns = React.useMemo(
    () => getVendorLeadsTableColumns({ setRowAction, userType }),
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // // DEBUG: Log sorting state
  // React.useEffect(() => {
  //   // console.log("🔍 Sorting state:", sorting);
  //   console.log(
  //     "🔍 Table rows:",
  //     table.getRowModel().rows.map((r) => ({
  //       srNo: r.original.srNo,
  //       name: r.original.name,
  //     }))
  //   );
  // }, [sorting, table]);

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

      <ViewLeadModal
        open={openView}
        onOpenChange={setOpenView}
        data={rowAction?.row.original}
      />
      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={rowAction?.row.original}
      />
    </>
  );
};

export default VendorLeadsTable;
