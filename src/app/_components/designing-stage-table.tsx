"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import {
  useDesigningStageLeads,
  useVendorDesigningLeads,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useFeatureFlags } from "./feature-flags-provider";
import { useDeleteLead } from "@/hooks/useDeleteLead";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";

import { DataTableRowAction } from "@/types/data-table";
import {
  DesigningLead,
  ProcessedDesigningStageLead,
} from "@/types/designing-stage-types";

import { getDesigningStageColumn } from "./designing-stage-columns";
import { ProcessedSiteMeasurementLead } from "@/types/site-measrument-types";

import { toast } from "react-toastify";
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

import ViewLeadModal from "@/components/sales-executive/Lead/view-lead-modal";
import BookingModal from "@/components/sales-executive/designing-stage/booking-modal";
import SiteMesurementModal from "@/components/sales-executive/siteMeasurement/site-mesurement-modal";

const DesigningStageTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const router = useRouter();
  const [viewType, setViewType] = useState<"my" | "overall">("my");

  // Pagination state 🧭
  const [pagination, setPagination] = React.useState({
    pageIndex: 0, // starts at 0 for TanStack
    pageSize: 10,
  });

  // 🟢 Fetch My Leads
  const {
    data: myLeadsData,
    isLoading: isMyLoading,
    isError: isMyError,
  } = useDesigningStageLeads(
    vendorId!,
    userId!,
    pagination.pageIndex + 1, // backend is 1-indexed
    pagination.pageSize
  );

  // 🔵 Fetch Overall Leads
  const {
    data: overallLeadsData,
    isLoading: isOverallLoading,
    isError: isOverallError,
  } = useVendorDesigningLeads(vendorId!, userId!);

  const isLoading = viewType === "my" ? isMyLoading : isOverallLoading;
  const isError = viewType === "my" ? isMyError : isOverallError;

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  // Dialog + Row action states
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [bookingOpenLead, setBookingOpenLead] = useState(false);
  const [openMeasurementModal, setOpenMeasurementModal] = useState(false);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ProcessedDesigningStageLead> | null>(
      null
    );

  const deleteLeadMutation = useDeleteLead();

  // Table-level states
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
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

  // ⚙️ Handle Row Actions
  useEffect(() => {
    if (rowAction?.variant === "delete" && rowAction.row) setOpenDelete(true);
    if (rowAction?.variant === "view" && rowAction.row) setOpenView(true);
    if (rowAction?.variant === "booking" && rowAction.row)
      setBookingOpenLead(true);
    if (rowAction?.variant === "measurement-modal" && rowAction.row)
      setOpenMeasurementModal(true);
  }, [rowAction]);

  // 🧭 Navigate to lead detail
  const handleRowClick = (row: ProcessedDesigningStageLead) => {
    router.push(
      `/dashboard/sales-executive/designing-stage/details/${row.id}?accountId=${row.accountId}`
    );
  };

  // ✅ Counts
  const myLeadsCount = myLeadsData?.data?.count ?? 0;
  const overallLeadsCount = overallLeadsData?.count ?? 0;

  // ✅ Active dataset
  const activeData =
    viewType === "my"
      ? myLeadsData?.data?.leads || []
      : overallLeadsData?.data || [];

  // 🧩 Transform API → UI
  const rowData = useMemo<ProcessedDesigningStageLead[]>(() => {
    if (!activeData || !Array.isArray(activeData)) return [];
    return (activeData as DesigningLead[]).map((lead, index) => ({
      id: lead.id,
      srNo: index + 1,
      lead_code: lead.lead_code,
      name: `${lead.firstname || ""} ${lead.lastname || ""}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      siteAddress: lead.site_address || "",
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
      assignedTo: lead.assignedTo?.user_name || "Unassigned",
      documentUrl: lead.documents || [],
      paymentInfo: lead.payments?.[0] || null,
      accountId: lead.account_id,
      initial_site_measurement_date: lead.initial_site_measurement_date || "",
    }));
  }, [activeData]);

  const columns = useMemo(
    () => getDesigningStageColumn({ setRowAction, userType }),
    [setRowAction, userType]
  );

  // 🧮 React Table
  const table = useReactTable({
    data: rowData,
    columns,
    manualPagination: true,
    pageCount: myLeadsData?.data?.pagination?.totalPages ?? -1,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    globalFilterFn: "includesString",
  });

  // 🗑️ Delete
  const handleDeleteLead = async () => {
    if (!rowAction?.row) return;
    const leadId = rowAction.row.original.id;

    if (!vendorId || !userId) {
      toast.error("Vendor or User information is missing!");
      return;
    }

    deleteLeadMutation.mutate(
      { leadId, vendorId, userId },
      {
        onSuccess: () => toast.success("Lead deleted successfully!"),
        onError: (error: any) =>
          toast.error(error?.message || "Failed to delete lead!"),
      }
    );

    setOpenDelete(false);
    setRowAction(null);
  };

  // 🌀 Loading states
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching leads</p>;

  // 🧱 UI
  const mockProps = { shallow: true, debounceMs: 300, throttleMs: 50 };

  return (
    <>
      <DataTable table={table} onRowDoubleClick={handleRowClick}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList table={table} {...mockProps} align="start" />
            ) : (
              <DataTableFilterMenu table={table} {...mockProps} />
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
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-100 text-xs text-blue-500">
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
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-100 text-xs text-blue-500">
                    {overallLeadsCount}
                  </span>
                </button>
              </div>
            )}
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>

      {/* Dialogs */}
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

      <BookingModal
        open={bookingOpenLead}
        onOpenChange={setBookingOpenLead}
        data={rowAction?.row.original}
      />

      <SiteMesurementModal
        open={openMeasurementModal}
        onOpenChange={setOpenMeasurementModal}
        data={
          rowAction?.row.original
            ? ({
                ...rowAction.row.original,
                documentUrl: rowAction.row.original.documentUrl.map((doc) => ({
                  ...doc,
                  signed_url: doc.signedUrl,
                  file_type: "unknown",
                  is_image: false,
                })),
              } as ProcessedSiteMeasurementLead)
            : undefined
        }
      />
    </>
  );
};

export default DesigningStageTable;
