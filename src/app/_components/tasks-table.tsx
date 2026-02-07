"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
import { Button } from "@/components/ui/button";

import InitialSiteMeasuresMent from "@/components/sales-executive/Lead/initial-site-measurement-form";

import type { DataTableRowAction } from "@/types/data-table";
import {
  getVendorLeadsTableColumns,
  ProcessedTask,
} from "./tasks-table-columns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TaskFilterPayload,
  useVendorAllTasksFilter,
  useVendorUserTasksFilter,
} from "@/hooks/useTasksQueries";
import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";
import FollowUpModal from "@/components/follow-up-modal";
import BookingDoneIsmForm from "@/components/sales-executive/Lead/booking-done-ism-form";
import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import CustomTabs from "@/components/custom/customeTab";
import { extractTitleText, mapTaskTableFiltersToPayload } from "@/lib/utils";
import TaskTypeFilter from "@/components/data-table/data-table-task-filter";

const MyTaskTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined,
  );
  const isAdminUser =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin";

  const [openMeasurement, setOpenMeasurement] = useState(false);
  const [openFinalMeasurement, setOpenFinalMeasurement] = useState(false);
  const [openBookingDoneIsm, setOpenBookingDoneIsm] = useState(false);

  // ✅ SEPARATE TASK TYPE FILTERS
  const [myTaskTypeFilter, setMyTaskTypeFilter] = useState<string[]>([]);
  const [overallTaskTypeFilter, setOverallTaskTypeFilter] = useState<string[]>(
    [],
  );

  // ✅ SEPARATE PAGINATION
  const [myPagination, setMyPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [overallPagination, setOverallPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  // ✅ SEPARATE SORTING
  const [mySorting, setMySorting] = useState<SortingState>([
    { id: "assignedAt", desc: true },
  ]);

  const [overallSorting, setOverallSorting] = useState<SortingState>([
    { id: "assignedAt", desc: true },
  ]);

  // ✅ SEPARATE COLUMN FILTERS
  const [myColumnFilters, setMyColumnFilters] = useState<ColumnFiltersState>([
    { id: "dueDate", value: "today" },
  ]);

  const [overallColumnFilters, setOverallColumnFilters] =
    useState<ColumnFiltersState>([{ id: "dueDate", value: "today" }]);

  // ✅ SEPARATE GLOBAL FILTERS
  const [myGlobalFilter, setMyGlobalFilter] = useState("");
  const [overallGlobalFilter, setOverallGlobalFilter] = useState("");

  const [viewScope, setViewScope] = useState<"my" | "overall">("my");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [rowAction, setRowAction] =
    useState<DataTableRowAction<ProcessedTask> | null>(null);
  const [openFollowUp, setOpenFollowUp] = useState(false);

  const showScopeToggle = isAdminUser;

  // ✅ ACTIVE STATE SELECTION
  const activePagination =
    viewScope === "my" ? myPagination : overallPagination;
  const activeSorting = viewScope === "my" ? mySorting : overallSorting;
  const activeColumnFilters =
    viewScope === "my" ? myColumnFilters : overallColumnFilters;
  const activeGlobalFilter =
    viewScope === "my" ? myGlobalFilter : overallGlobalFilter;
  const activeTaskTypeFilter =
    viewScope === "my" ? myTaskTypeFilter : overallTaskTypeFilter;

  // ✅ MY TASKS PAYLOAD - FIXED
  const myTaskPayload: TaskFilterPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = mySorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTaskTableFiltersToPayload(myColumnFilters);

    return {
      page: myPagination.pageIndex + 1,
      limit: myPagination.pageSize,
      created_at: sortOrder,
      global_search: myGlobalFilter || "",

      // ✅ FIX: Add task_type from state
      task_type: mappedFilters.task_type,

      // Rest of filters from mapTaskTableFiltersToPayload
      due_filter: mappedFilters.due_filter,
      site_map_link: mappedFilters.site_map_link ?? null,
      site_type: mappedFilters.site_type,
      product_type: mappedFilters.product_type,
      product_structure: mappedFilters.product_structure,
      assign_to: mappedFilters.assign_to ?? null,
      date_range: mappedFilters.date_range ?? null,
      assignat_range: mappedFilters.assignat_range ?? null,
    };
  }, [
    myPagination,
    mySorting,
    myGlobalFilter,
    myColumnFilters,
    myTaskTypeFilter, // ✅ ADD DEPENDENCY
  ]);

  // ✅ OVERALL TASKS PAYLOAD - FIXED
  const overallTaskPayload: TaskFilterPayload = useMemo(() => {
    const sortOrder: "asc" | "desc" = overallSorting[0]?.desc ? "desc" : "asc";
    const mappedFilters = mapTaskTableFiltersToPayload(overallColumnFilters);

    return {
      page: overallPagination.pageIndex + 1,
      limit: overallPagination.pageSize,
      created_at: sortOrder,
      global_search: overallGlobalFilter || "",

      // ✅ FIX: Add task_type from state
      task_type: mappedFilters.task_type,

      due_filter: mappedFilters.due_filter,
      site_map_link: mappedFilters.site_map_link ?? null,
      site_type: mappedFilters.site_type,
      product_type: mappedFilters.product_type,
      product_structure: mappedFilters.product_structure,
      assign_by: mappedFilters.assign_by ?? null,
      assign_to: mappedFilters.assign_to ?? null,
      date_range: mappedFilters.date_range ?? null,
      assignat_range: mappedFilters.assignat_range ?? null,
    };
  }, [
    overallPagination,
    overallSorting,
    overallGlobalFilter,
    overallColumnFilters,
    overallTaskTypeFilter, // ✅ ADD DEPENDENCY
  ]);


  // Fetch tasks using new hooks
  const {
    data: vendorUserData,
    isLoading: isVendorUserLoading,
    isFetching: isVendorUserFetching,
  } = useVendorUserTasksFilter(vendorId || 0, userId || 0, myTaskPayload);

  const {
    data: vendorAllData,
    isLoading: isVendorAllLoading,
    isFetching: isVendorAllFetching,
  } = useVendorAllTasksFilter(vendorId || 0, overallTaskPayload);

  const activeTaskData =
    viewScope === "overall"
      ? (vendorAllData?.data ?? [])
      : (vendorUserData?.data ?? []);

  // Set initial view scope
  useEffect(() => {
    setViewScope("my");
    setMyPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [isAdminUser]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam = Number(searchParams.get("taskId"));
  const hasAutoOpenedRef = useRef(false);

  const handleRowDoubleClick = useCallback(
    (row: ProcessedTask) => {
      if (row.taskType === "Initial Site Measurement") {
        setRowAction({
          row: { original: row } as any,
          variant: "uploadmeasurement",
        });
        setOpenMeasurement(true);
      } else if (row.taskType === "BookingDone - ISM") {
        setRowAction({
          row: { original: row } as any,
          variant: "bookingdoneism",
        });
        setOpenBookingDoneIsm(true);
      } else if (row.taskType === "Final Measurements") {
        setRowAction({
          row: { original: row } as any,
          variant: "uploadfinalmeasurement",
        });
        setOpenFinalMeasurement(true);
      } else if (row.taskType === "Follow Up") {
        setRowAction({
          row: { original: row } as any,
          variant: "Follow Up",
        });
        setOpenFollowUp(true);
      } else if (row.taskType === "Pending Materials") {
        setRowAction({
          row: { original: row } as any,
          variant: "Pending Materials",
        });
        setOpenFollowUp(true);
      } else if (row.taskType === "Pending Work") {
        setRowAction({
          row: { original: row } as any,
          variant: "Pending Work",
        });
        setOpenFollowUp(true);
      } else if (row.taskType === "Site Readiness") {
        setRowAction({
          row: { original: row } as any,
          variant: "sitereadinessstage",
        });
        router.push(
          `/dashboard/installation/site-readiness/details/${row.leadId}?accountId=${row.accountId}`,
        );
      } else if (row.taskType === "Miscellaneous") {
        router.push(
          `/dashboard/installation/under-installation/details/${row.leadId}?accountId=${row.accountId}&tab=misc&taskId=${row.id}`,
        );
      } else if (row.taskType === "Production Ready") {
        const clearnRemark = extractTitleText(row.remark);
        setRowAction({
          row: { original: row } as any,
          variant: "productionready",
        });
        router.push(
          `/dashboard/production/pre-post-prod/details/${row.leadId}?accountId=${row.accountId}&remark=${clearnRemark}`,
        );
      } else if (row.taskType === "Order Login") {
        const stage = (row.leadStage || "").toLowerCase();
        const basePath = stage.includes("order login")
          ? `/dashboard/production/order-login/details/${row.leadId}`
          : stage.includes("tech")
          ? `/dashboard/production/tech-check/details/${row.leadId}`
          : stage.includes("production")
          ? `/dashboard/production/pre-post-prod/details/${row.leadId}`
          : stage.includes("ready")
          ? `/dashboard/production/ready-to-dispatch/details/${row.leadId}`
          : stage.includes("site readiness")
          ? `/dashboard/installation/site-readiness/details/${row.leadId}`
          : stage.includes("dispatch planning")
          ? `/dashboard/installation/dispatch-planning/details/${row.leadId}`
          : stage.includes("dispatch")
          ? `/dashboard/installation/dispatch-stage/details/${row.leadId}`
          : stage.includes("under installation")
          ? `/dashboard/installation/under-installation/details/${row.leadId}`
          : stage.includes("final handover")
          ? `/dashboard/installation/final-handover/details/${row.leadId}`
          : `/dashboard/production/order-login/details/${row.leadId}`;

        router.push(`${basePath}?accountId=${row.accountId}&tab=orderLogin`);
      } else {
        
      }
    },
    [router],
  );

  // Process leads into table data
  const rowData = useMemo<ProcessedTask[]>(() => {
    const sourceData =
      viewScope === "overall"
        ? (vendorAllData?.data ?? [])
        : (vendorUserData?.data ?? []);

    if (!sourceData) return [];

    return sourceData.map((task, index) => ({
      id: task.userLeadTask.id,
      lead_code: task.leadMaster.lead_code,
      leadId: task.leadMaster.id,
      accountId: task.leadMaster.account_id,
      srNo: index + 1,
      name: task.leadMaster.name,
      phoneNumber: task.leadMaster.phone_number,
      leadStatus: task.userLeadTask.status,
      leadStage: task.leadMaster.lead_status ?? "",
      siteType: task.leadMaster.site_type || "",
      furnitureType: task.leadMaster.product_type.join(", "),
      furnitueStructures: task.leadMaster.product_structure.join(", "),
      taskType: task.userLeadTask.task_type,
      dueDate: task.userLeadTask.due_date,
      site_map_link: task.leadMaster.site_map_link,
      assignedBy: task.userLeadTask.created_by,
      assignedByName: task.userLeadTask.created_by_name || "-",
      assignedToName: task.userLeadTask.assigned_to_name || null,
      assignedAt: task.userLeadTask.created_at,
      remark: task.userLeadTask?.remark || "",
    }));
  }, [vendorAllData?.data, vendorUserData?.data, viewScope]);

  // Setup columns
  const columns = useMemo(
    () =>
      getVendorLeadsTableColumns({
        setRowAction,
        userType,
        router,
        showAssignedTo: viewScope === "overall",
      }),
    [setRowAction, userType, router, viewScope],
  );

  // Auto-open task from URL parameter
  useEffect(() => {
    if (hasAutoOpenedRef.current) return;
    if (!Number.isFinite(taskIdParam)) return;
    if (!rowData.length) return;
    if (
      userType?.toLowerCase() === "admin" ||
      userType?.toLowerCase() === "super-admin"
    ) {
      return;
    }

    const match = rowData.find((row) => row.id === taskIdParam);
    if (!match) return;

    hasAutoOpenedRef.current = true;
    handleRowDoubleClick(match);
  }, [handleRowDoubleClick, rowData, taskIdParam, userType]);

  const totalPages =
    viewScope === "overall"
      ? (vendorAllData?.pagination?.totalPages ?? 1)
      : (vendorUserData?.pagination?.totalPages ?? 1);

  // Create table instance
  const table = useReactTable({
    data: rowData,
    columns,
    onSortingChange: viewScope === "my" ? setMySorting : setOverallSorting,
    onColumnFiltersChange:
      viewScope === "my" ? setMyColumnFilters : setOverallColumnFilters,
    onPaginationChange:
      viewScope === "my" ? setMyPagination : setOverallPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange:
      viewScope === "my" ? setMyGlobalFilter : setOverallGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    globalFilterFn: "includesString",

    state: {
      pagination: activePagination,
      sorting: activeSorting,
      columnFilters: activeColumnFilters,
      rowSelection,
      globalFilter: activeGlobalFilter,
      columnVisibility,
    },
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
  });

  const myTaskTotal =
    (vendorUserData?.summary?.overdue ?? 0) +
    (vendorUserData?.summary?.today ?? 0) +
    (vendorUserData?.summary?.upcoming ?? 0);

  const overallTaskTotal = vendorAllData?.summary
    ? (vendorAllData?.summary?.overdue ?? 0) +
      (vendorAllData?.summary?.today ?? 0) +
      (vendorAllData?.summary?.upcoming ?? 0)
    : 0;

  const DueDateTabs = () => {
    const current =
      (activeColumnFilters.find((f) => f.id === "dueDate")?.value as string) ||
      "today";

    const handleChange = (value: string) => {
      const newFilter = [{ id: "dueDate", value }];

      if (viewScope === "my") {
        setMyColumnFilters(newFilter);
        setMyPagination((p) => ({ ...p, pageIndex: 0 }));
      } else {
        setOverallColumnFilters(newFilter);
        setOverallPagination((p) => ({ ...p, pageIndex: 0 }));
      }
    };

    const summary =
      viewScope === "overall"
        ? vendorAllData?.summary
        : vendorUserData?.summary;

    return (
      <CustomTabs
        value={current}
        onChange={handleChange}
        tabs={[
          {
            value: "today",
            label: "Today",
            dotColor: "blue",
            count: summary?.today ?? 0,
          },
          {
            value: "upcoming",
            label: "Upcoming",
            dotColor: "green",
            count: summary?.upcoming ?? 0,
          },
          {
            value: "overdue",
            label: "Overdue",
            dotColor: "red",
            count: summary?.overdue ?? 0,
          },
        ]}
      />
    );
  };

  const followUpVariant: "Follow Up" | "Pending Materials" | "Pending Work" =
    rowAction?.variant === "Pending Materials"
      ? "Pending Materials"
      : rowAction?.variant === "Pending Work"
        ? "Pending Work"
        : "Follow Up";

  const dueDateFilterLabel =
    (table.getColumn("dueDate")?.getFilterValue() as string) || "today";
  const isOverallView = viewScope === "overall";
  const headerDescription = (() => {
    const scopeText = isOverallView ? "Your teams" : "Your";
    if (dueDateFilterLabel === "upcoming")
      return `${scopeText} upcoming tasks.`;
    if (dueDateFilterLabel === "overdue") return `${scopeText} overdue tasks.`;
    return `${scopeText} active tasks for the day.`;
  })();

  // ✅ HANDLE VIEW SWITCH
  const handleViewSwitch = (newView: "my" | "overall") => {
    setViewScope(newView);
    if (newView === "my") {
      setMyPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      setOverallPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  };

  const isTodayTabActive = dueDateFilterLabel === "today";

  return (
    <>
      <div className="py-2">
        {/* ================= HEADER ================= */}
        <div className="px-4 space-y-3 md:space-y-2 md:flex md:flex-col lg:flex-row lg:justify-between lg:items-end lg:space-y-0">
          {/* Title + Description (Desktop only) */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">
              {viewScope === "overall" ? "Overall Tasks" : "My Task"}
            </h1>
            <p className="text-sm text-muted-foreground">{headerDescription}</p>
          </div>

          {/* Due Date Tabs (Always visible – top aligned) */}
          <div className="w-full lg:w-auto">
            <DueDateTabs />
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <DataTable
          table={table}
          onRowDoubleClick={handleRowDoubleClick}
          className="pt-3 px-4"
        >
          {/* ================= MOBILE LAYOUT ================= */}
          <div className="flex flex-col gap-4 md:hidden">
            {/* Filters block */}
            <div className="flex flex-wrap gap-2">
              {showScopeToggle && (
                <>
                  <Button
                    size="sm"
                    variant={viewScope === "my" ? "default" : "secondary"}
                    onClick={() => handleViewSwitch("my")}
                  >
                    My Tasks {myTaskTotal}
                  </Button>
                  <Button
                    size="sm"
                    variant={viewScope === "overall" ? "default" : "secondary"}
                    onClick={() => handleViewSwitch("overall")}
                  >
                    Overall Tasks {overallTaskTotal}
                  </Button>
                </>
              )}

              {!isTodayTabActive && (
                <DataTableDateFilter
                  column={table.getColumn("dueDate")!}
                  title="DueDate"
                  multiple
                />
              )}

              <DataTableDateFilter
                column={table.getColumn("assignedAt")!}
                title="AssignedAt"
                multiple
              />
              {/* <DataTableFilterList table={table} /> */}
              <DataTableViewOptions table={table} />
            </div>

            {/* Search at bottom */}
            <ClearInput
              value={activeGlobalFilter ?? ""}
              onChange={(e) => {
                if (viewScope === "my") {
                  setMyGlobalFilter(e.target.value);
                } else {
                  setOverallGlobalFilter(e.target.value);
                }
              }}
              placeholder="Search…"
              className="w-full sm:w-64 h-8"
            />
          </div>

          {/* ================= DESKTOP LAYOUT ================= */}
          <div className="hidden md:flex justify-between items-end">
            {/* Left: Search + Filters */}
            <div className="flex items-end gap-3">
              <ClearInput
                value={activeGlobalFilter ?? ""}
                onChange={(e) => {
                  if (viewScope === "my") {
                    setMyGlobalFilter(e.target.value);
                  } else {
                    setOverallGlobalFilter(e.target.value);
                  }
                }}
                placeholder="Search…"
                className="h-8 w-64"
              />

              {!isTodayTabActive && (
                <DataTableDateFilter
                  column={table.getColumn("dueDate")!}
                  title="DueDate"
                  multiple
                />
              )}

              <DataTableDateFilter
                column={table.getColumn("assignedAt")!}
                title="AssignedAt"
                multiple
              />
            </div>

            {/* Right: Table controls */}
            <div className="flex items-center gap-2">
              {showScopeToggle && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={viewScope === "my" ? "default" : "secondary"}
                    onClick={() => handleViewSwitch("my")}
                  >
                    My Tasks {myTaskTotal}
                  </Button>
                  <Button
                    size="sm"
                    variant={viewScope === "overall" ? "default" : "secondary"}
                    onClick={() => handleViewSwitch("overall")}
                  >
                    Overall Tasks {overallTaskTotal}
                  </Button>
                </div>
              )}
              {/* <DataTableFilterList table={table} /> */}
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </DataTable>
      </div>

      {/* ================= MODALS ================= */}
      <InitialSiteMeasuresMent
        open={openMeasurement}
        onOpenChange={setOpenMeasurement}
        data={{
          id: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          name: rowAction?.row.original.name || "",
        }}
      />

      <FinalMeasurementModal
        open={openFinalMeasurement}
        onOpenChange={setOpenFinalMeasurement}
        data={{
          id: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          name: rowAction?.row.original.name,
        }}
      />

      <BookingDoneIsmForm
        open={openBookingDoneIsm}
        onOpenChange={setOpenBookingDoneIsm}
        data={{
          id: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          name: rowAction?.row.original.name || "",
        }}
      />

      <FollowUpModal
        open={openFollowUp}
        onOpenChange={setOpenFollowUp}
        variant={followUpVariant}
        data={{
          id: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          taskId: rowAction?.row.original.id || 0,
          remark: rowAction?.row.original.remark,
          dueDate: rowAction?.row.original.dueDate,
        }}
      />
    </>
  );
};

export default MyTaskTable;
