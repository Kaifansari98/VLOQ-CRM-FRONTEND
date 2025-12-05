"use client";

import { useAppSelector } from "@/redux/store";
import {
  useOnHoldLeads,
  useLostLeads,
  useLostApprovalLeads,
  useUpdateActivityStatus,
} from "@/hooks/useActivityStatus";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
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
import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export default function PendingLeadsTable({
  tab,
  stageTitle = "Pending Leads",
  stageDescription = "",
}: {
  tab: "onHold" | "lostApproval" | "lost";
  stageTitle: string;
  stageDescription?: string;
}) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const router = useRouter();

  const { data: onHoldData = [], isLoading: onHoldLoading } = useOnHoldLeads(
    vendorId!
  );
  const { data: lostData = [], isLoading: lostLoading } = useLostLeads(
    vendorId!
  );
  const { data: lostApprovalData = [], isLoading: lostApprovalLoading } =
    useLostApprovalLeads(vendorId!);

  console.log("On Hold data: ", onHoldData);
  console.log("Lost data: ", lostData);
  console.log("Lost Approval data: ", lostApprovalData);

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

  const [rowAction, setRowAction] = React.useState<{
    row: PendingLeadRow;
    variant: "revert" | "lost";
  } | null>(null);

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
      lead_code: lead.lead_code,
      srNo: index + 1,
      name: `${lead.firstname} ${lead.lastname}`.trim(),
      email: lead.email || "",
      contact: `${lead.country_code || ""} ${lead.contact_no || ""}`.trim(),
      siteAddress: lead.site_address || "",
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
      createdAt: lead.created_at ? new Date(lead.created_at).getTime() : "",

      updatedAt: lead.updated_at || "",
      altContact: lead.alt_contact_no || "",
      status: lead.statusType?.type || "",
      initial_site_measurement_date: lead.initial_site_measurement_date || "",
      accountId: (lead as any).account?.id ?? (lead as any).account_id ?? 0,
      site_map_link: lead.site_map_link || "",
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

  // -----------------------------------------------
  // 🔥 Replace this:
  // if (isLoading) {
  //   return <p>Loading...</p>;
  // }
  // -----------------------------------------------

  // ✅ New loading state with Skeleton
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={columns.length} // dynamic column count
        rowCount={10} // adjust as needed
      />
    );
  }

  const handleRowClick = (row: PendingLeadRow) => {
    router.push(
      `/dashboard/leads/leadstable/pendingleaddetails/${row.id}?accountId=${row.accountId}&tab=${tab}`
    );
  };

  return (
    <>
      <DataTable
        table={table}
        className="py-2 px-4"
        onRowDoubleClick={handleRowClick}
      >
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold">{stageTitle}</h1>
          <p className="text-sm text-muted-foreground">{stageDescription}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <ClearInput
              value={globalFilter ?? ""}
              // onChange={(e) => {
              //   setGlobalFilter(e.target.value);
              //   setPagination({ ...pagination, pageIndex: 0 });
              // }}
              placeholder="Search…"
              className="w-full h-8 sm:w-64"
            />

            <DataTableDateFilter
              column={table.getColumn("createdAt")!}
              title="Created At"
              multiple
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DataTableSortList table={table} />
            <DataTableFilterList table={table} />
            <DataTableViewOptions table={table} />
          </div>
        </div>
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
                queryClient.invalidateQueries({
                  queryKey: ["lostApprovalLeads"],
                });
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
