import { useDesigningStageLeads } from "@/hooks/designing-stage/designing-leads-hooks";
import { useAppSelector } from "@/redux/store";
import React, { useEffect, useMemo, useState } from "react";
import { useFeatureFlags } from "./feature-flags-provider";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { DataTableRowAction } from "@/types/data-table";
import {
  DesigningLead,
  ProcessedDesigningStageLead,
} from "@/types/designing-stage-types";
import { toast } from "react-toastify";
import { getDesigningStageColumn } from "./designing-stage-columns";
import { getSortedRowModel } from "@tanstack/react-table";
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
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTable } from "@/components/data-table/data-table";
import ViewLeadModal from "@/components/sales-executive/Lead/view-lead-moda";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";

const DesigningStageTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );
  const { data, isLoading, isError } = useDesigningStageLeads(vendorId!, 3);
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);
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

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<ProcessedDesigningStageLead> | null>(
      null
    );

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  useEffect(() => {
    if (rowAction?.variant === "delete" && rowAction.row) {
      setOpenDelete(true);
    }
    if (rowAction?.variant === "view" && rowAction.row) {
      console.log("Original Data row Leads: ", rowAction.row.original);
      setOpenView(true);
    }
  }, [rowAction]);

  const handleRowClick = (row: ProcessedDesigningStageLead) => {
    const tableRow = table.getRowModel().rows.find(r => r.original.id === row.id);
    if (tableRow) {
      setRowAction({ variant: "view", row: tableRow });
      setOpenView(true);
    }
  };  

  const rowData = useMemo<ProcessedDesigningStageLead[]>(() => {
    if (!data?.data) return [];

    return data.data.leads.map((lead: DesigningLead, index: number) => ({
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

      // 👇 FIX: must be string in ProcessedDesigningStageLead
      assignedTo: lead.assignedTo?.user_name || "",

      // 👇 FIX: required fields
      documentUrl: lead.documents || [],
      paymentInfo: lead.payments?.[0] || null, // or decide how you want to map
      accountId: lead.account_id,
      initial_site_measurement_date: lead.initial_site_measurement_date || "",
    }));
  }, [data?.data]);

  const columns = React.useMemo(
    () => getDesigningStageColumn({ setRowAction, userType }),
    [setRowAction, userType]
  );

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

  const mockProps = {
    shallow: true,
    debounceMs: 300,
    throttleMs: 50,
  };

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

  useEffect(() => {
    if (data) {
      console.log("📦 Designing Stage Leads:", data.data.leads);
      console.log("Row Data :", rowData);
    }
  }, [data]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching leads</p>;

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

      <EditLeadModal
        open={editOpenLead}
        onOpenChange={setEditOpenLead}
        leadData={rowAction?.row.original}
      />
    </>
  );
};

export default DesigningStageTable;