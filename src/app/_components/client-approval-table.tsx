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

import { getClientApprovalTableColumns } from "./client-approval-column";
import {
  useClientApprovalLeads,
  useVendorOverallClientApprovalLeads,
} from "@/hooks/client-approval-stage/use-client-approval";
import {
  ClientApprovalLead,
  ProcessedClientApprovalLead,
} from "@/types/client-approval";

// import ViewClientApprovalModal from "@/components/site-supervisor/client-approval/view-client-approval";

const ClientApprovalLeadsTable = () => {
  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  // Feature flags
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const router = useRouter();

  const isAdmin =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super_admin";

  // 🟢 My / Overall tab
  const [viewType, setViewType] = useState<"my" | "overall">("my");

  // Queries
  const myLeadsQuery = useClientApprovalLeads();
  const overallLeadsQuery = useVendorOverallClientApprovalLeads(
    vendorId!,
    userId!
  );

  // Derived data
  const activeData =
    viewType === "my"
      ? myLeadsQuery.data?.data || []
      : overallLeadsQuery.data?.data || [];

  const myCount = myLeadsQuery.data?.count ?? 0;
  const overallCount = overallLeadsQuery.data?.count ?? 0;

  const isLoading =
    viewType === "my" ? myLeadsQuery.isLoading : overallLeadsQuery.isLoading;
  const isError =
    viewType === "my" ? myLeadsQuery.isError : overallLeadsQuery.isError;

  // const { data, isLoading, isError } = useClientApprovalLeads();
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openViewApprovalModal, setOpenViewApprovalModal] =
    useState<boolean>(false);

  const [rowAction, setRowAction] =
    useState<DataTableRowActionClientDocumentation<ProcessedClientApprovalLead> | null>(
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
    email: false,
    productStructures: false,
    designerRemark: false,
  });

  // Mutations
  const deleteLeadMutation = useDeleteLead();

  // Derived row data
  const rowData = useMemo<ProcessedClientApprovalLead[]>(() => {
    if (!Array.isArray(activeData)) return [];
    return (activeData as ClientApprovalLead[]).map((lead, index) => ({
      id: lead.id,
      srNo: index + 1,
      lead_code: lead.lead_code,
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
  }, [activeData]);

  // Columns
  const columns = useMemo(
    () => getClientApprovalTableColumns({ setRowAction, userType }),
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
    if (rowAction.variant === "view") setOpenViewApprovalModal(true);
    if (rowAction.variant === "delete") setOpenDelete(true);
    if (rowAction.variant === "reassignlead") setAssignOpenLead(true);
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

  const handleRowClick = (row: ProcessedClientApprovalLead) => {
    router.push(`/dashboard/site-supervisor/client-approval/details/${row.id}`);
  };

  // Early returns
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
            {/* 🧭 My Leads / Overall Leads Tabs */}
            {!isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setViewType("my")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-in-out ${
                    viewType === "my"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Leads
                  {myLeadsQuery.data && (
                    <span className="ml-3 py-0.5 px-1.5 rounded-full bg-blue-100 text-xs text-blue-500 opacity-100">
                      {myCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setViewType("overall")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-in-out ${
                    viewType === "overall"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Overall Leads
                  {overallLeadsQuery.data && (
                    <span className="ml-3 py-0.5 px-1.5 rounded-full bg-blue-100 text-xs text-blue-500 opacity-100">
                      {overallCount}
                    </span>
                  )}
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

      {/* <ViewClientApprovalModal
        open={openViewApprovalModal}
        onOpenChange={setOpenViewApprovalModal}
        data={rowAction?.row.original}
      /> */}

      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={rowAction?.row.original}
      />
    </>
  );
};

export default ClientApprovalLeadsTable;
