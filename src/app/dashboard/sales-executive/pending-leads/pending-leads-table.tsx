"use client";

import { useAppSelector } from "@/redux/store";
import {
  useOnHoldLeads,
  useLostLeads,
  useLostApprovalLeads,
  useUpdateActivityStatus,
} from "@/hooks/useActivityStatus";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
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
import React from "react";
import type { Lead } from "@/api/leads";
import {
  getPendingLeadsColumns,
  PendingLeadRow,
} from "./pending-leads-columns";
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
import RevertRemarkModal from "@/components/generics/RevertRemarkModal";
import { useRevertActivityStatus } from "@/hooks/useActivityStatus";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useQueryClient } from "@tanstack/react-query";
import { useFeatureFlags } from "@/app/_components/feature-flags-provider";

export default function PendingLeadsTable({
  tab,
}: {
  tab: "onHold" | "lostApproval" | "lost";
}) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const router = useRouter();

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data: onHoldData = [], isLoading: onHoldLoading } = useOnHoldLeads(
    vendorId!
  );
  const { data: lostData = [], isLoading: lostLoading } = useLostLeads(
    vendorId!
  );
  const { data: lostApprovalData = [], isLoading: lostApprovalLoading } =
    useLostApprovalLeads(vendorId!);

  const [activeLead, setActiveLead] = React.useState<PendingLeadRow | null>(
    null
  );
  const [openConfirm, setOpenConfirm] = React.useState(false);
  const [openRemark, setOpenRemark] = React.useState(false);
  const [openActivityStatus, setOpenActivityStatus] = React.useState(false);

  // ✅ Table state management
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [rowAction, setRowAction] = React.useState<
    { row: PendingLeadRow; variant: "revert" | "lost" } | null
  >(null);

  // ✅ Process rowAction and reset it
  React.useEffect(() => {
    if (!rowAction) return;

    if (rowAction.variant === "revert") {
      setActiveLead(rowAction.row);
      setOpenConfirm(true);
    }

    if (rowAction.variant === "lost") {
      setActiveLead(rowAction.row);
      setOpenActivityStatus(true);
    }

    // Reset after processing
    setRowAction(null);
  }, [rowAction]);

  const markAsLostMutation = useUpdateActivityStatus();
  const revertMutation = useRevertActivityStatus();

  // Lead → PendingLeadRow
  const processLeads = React.useCallback((leads: Lead[]): PendingLeadRow[] => {
    return leads.map((lead, index) => ({
      id: lead.id,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      priority: lead.priority || "",
      siteAddress: lead.site_address || "",
      billingName: lead.billing_name || "",
      architechName: lead.archetech_name || "",
      designerRemark: lead.designer_remark || "",
      activity_status: lead.activity_status || "",
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
      accountId: (lead as any).account?.id ?? (lead as any).account_id ?? 0,
    }));
  }, []);

  const onHoldProcessed = React.useMemo(
    () => processLeads(onHoldData),
    [onHoldData, processLeads]
  );
  const lostProcessed = React.useMemo(
    () => processLeads(lostData),
    [lostData, processLeads]
  );
  const lostApprovalProcessed = React.useMemo(
    () => processLeads(lostApprovalData),
    [lostApprovalData, processLeads]
  );

  // Get data based on tab
  const tableData = React.useMemo(() => {
    switch (tab) {
      case "onHold":
        return onHoldProcessed;
      case "lostApproval":
        return lostApprovalProcessed;
      case "lost":
        return lostProcessed;
      default:
        return [];
    }
  }, [tab, onHoldProcessed, lostApprovalProcessed, lostProcessed]);

  const columns = React.useMemo(
    () =>
      getPendingLeadsColumns({
        tab,
        onRevert: (lead) => {
          setRowAction({ row: lead, variant: "revert" });
        },
        onMarkAsLost: (lead) => {
          setRowAction({ row: lead, variant: "lost" });
        },
      }),
    [tab]
  );

  const onConfirmRevert = () => {
    setOpenConfirm(false);
    setOpenRemark(true);
  };

  const onSubmitRemark = (remark: string) => {
    if (!activeLead || !vendorId || !userId) {
      toast.error("Missing vendor/user/lead info");
      return;
    }

    revertMutation.mutate(
      {
        leadId: activeLead.id,
        payload: {
          vendorId,
          accountId: activeLead.accountId || 0,
          userId,
          remark,
          createdBy: userId,
        },
      },
      {
        onSuccess: () => {
          setOpenRemark(false);
          setActiveLead(null);
          // Invalidate queries based on current tab
          if (tab === "onHold") {
            queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
          } else if (tab === "lostApproval") {
            queryClient.invalidateQueries({ queryKey: ["lostApprovalLeads"] });
          } else if (tab === "lost") {
            queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
          }
        },
      }
    );
  };

  const handleRowDoubleClick = React.useCallback(
    (row: PendingLeadRow) => {
      const leadId = row.id;
      const accountId = row.accountId;
      router.push(
        `/dashboard/sales-executive/pending-leads/details/${leadId}?accountId=${accountId}`
      );
    },
    [router]
  );

  // ✅ Create table with proper state management
  const table = useReactTable({
    data: tableData,
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

  const isLoading = 
    (tab === "onHold" && onHoldLoading) ||
    (tab === "lostApproval" && lostApprovalLoading) ||
    (tab === "lost" && lostLoading);

  const mockProps = React.useMemo(
    () => ({
      shallow: true,
      debounceMs: 300,
      throttleMs: 50,
    }),
    []
  );

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <DataTable table={table} onRowDoubleClick={handleRowDoubleClick}>
        {enableAdvancedFilter ? (
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
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} />
          </DataTableToolbar>
        )}
      </DataTable>

      {/* Confirmation Dialog */}
      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Revert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert this lead back to active status?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRevert}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remark Modal */}
      <RevertRemarkModal
        open={openRemark}
        onOpenChange={setOpenRemark}
        onSubmitRemark={onSubmitRemark}
        loading={revertMutation.isPending}
      />

      {/* Activity Status Modal */}
      <ActivityStatusModal
        open={openActivityStatus}
        onOpenChange={setOpenActivityStatus}
        statusType="lost"
        onSubmitRemark={(remark) => {
          if (!activeLead || !vendorId || !userId) return;

          markAsLostMutation.mutate(
            {
              leadId: activeLead.id,
              payload: {
                vendorId,
                accountId: activeLead.accountId || 0,
                userId,
                status: "lost",
                remark,
                createdBy: userId,
              },
            },
            {
              onSuccess: () => {
                toast.success("Lead marked as Lost!");
                setOpenActivityStatus(false);
                setActiveLead(null);
                queryClient.invalidateQueries({ queryKey: ["lostApprovalLeads"] });
                queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
              },
            }
          );
        }}
        loading={markAsLostMutation.isPending}
      />
    </>
  );
}