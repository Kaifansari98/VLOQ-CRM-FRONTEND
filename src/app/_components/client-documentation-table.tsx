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
import type { DataTableRowActionClientDocumentation } from "@/types/data-table";
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
import ClientDocumantationModal from "@/components/site-supervisor/final-measurement/client-documantation-modal";
import { getClientDocumentationTableColumns } from "./client-documentation-column";
import { useClientDocumentationLeads } from "@/hooks/client-documentation/use-clientdocumentation";
import {
  ClientDocumentationLead,
  ProcessedClientDocumentationLead,
} from "@/types/client-documentation";
import ViewClientDocumentationModal from "@/components/site-supervisor/client-documentation/view-client-documentation";

const ClientDocumentationLeadsTable = () => {
  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  // Feature flags
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();

  const { data, isLoading, isError } = useClientDocumentationLeads();
  console.log("Booking Leads Data:", data);
  // Local state
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [openClientDocModal, setOpenClientDocModal] = useState<boolean>(false);
  const [openViewClientDocModal, setOpenViewClientDocModal] =
    useState<boolean>(false);
  const [rowAction, setRowAction] =
    useState<DataTableRowActionClientDocumentation<ProcessedClientDocumentationLead> | null>(
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
  const rowData = useMemo<ProcessedClientDocumentationLead[]>(() => {
    if (!data?.data) return [];

    console.log("Final Measurement Leads:- ", data.data);
    return data.data.map((lead: ClientDocumentationLead, index: number) => ({
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
    () => getClientDocumentationTableColumns({ setRowAction, userType }),
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
    if (rowAction.variant === "view") setOpenViewClientDocModal(true);
    if (rowAction.variant === "delete") setOpenDelete(true);
    if (rowAction.variant === "reassignlead") setAssignOpenLead(true);
    if (rowAction.variant === "clientdoc") setOpenClientDocModal(true);
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

  const handleRowClick = (row: ProcessedClientDocumentationLead) => {
    router.push(`/dashboard/site-supervisor/client-documentation/details/${row.id}`);
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

      <ViewClientDocumentationModal
        open={openViewClientDocModal}
        onOpenChange={setOpenViewClientDocModal}
        data={rowAction?.row.original}
      />

      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={rowAction?.row.original}
      />

      <ClientDocumantationModal
        open={openClientDocModal}
        onOpenChange={setOpenClientDocModal}
        data={rowAction?.row.original}
      />
    </>
  );
};

export default ClientDocumentationLeadsTable;