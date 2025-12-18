"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";

import InitialSiteMeasuresMent from "@/components/sales-executive/Lead/initial-site-measurement-form";

import type { DataTableRowAction } from "@/types/data-table";
import {
  getVendorLeadsTableColumns,
  ProcessedTask,
} from "./tasks-table-columns";
import { useRouter } from "next/navigation";
import { useVendorUserTasks } from "@/hooks/useTasksQueries";
import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";
import FollowUpModal from "@/components/follow-up-modal";
import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import CustomTabs from "@/components/custom/customeTab";
import { extractTitleText } from "@/lib/utils";
import TaskTypeFilter from "@/components/data-table/data-table-task-filter";

const MyTaskTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );
  const shouldFetch = !!vendorId && !!userId;

  const [openMeasurement, setOpenMeasurement] = useState(false);
  const [openFinalMeasurement, setOpenFinalMeasurement] = useState(false);

  // Fetch leads
  const vendorUserTasksQuery = useVendorUserTasks(
    vendorId || 0,
    userId || 0,
    shouldFetch
  );

  const [openFollowUp, setOpenFollowUp] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    architechName: false,
    source: false,
    createdAt: false,
    altContact: false,
    productTypes: false,
    productStructures: false,
    designerRemark: false,
  });

  // Table state - Fixed: Use 'assignedAt' instead of 'createdAt'
  const [sorting, setSorting] = useState<SortingState>([
    { id: "assignedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "dueDate", value: "today" }, // Set default filter
  ]);
  const [rowSelection, setRowSelection] = useState({});

  const [rowAction, setRowAction] =
    useState<DataTableRowAction<ProcessedTask> | null>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState<string[]>([]);

  const router = useRouter();

  const handleRowDoubleClick = useCallback(
    (row: ProcessedTask) => {
      if (row.taskType === "Initial Site Measurement") {
        setRowAction({
          row: { original: row } as any,
          variant: "uploadmeasurement",
        });
        setOpenMeasurement(true);
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
        setOpenFollowUp(true); // ✅ Reuse same modal as Follow Up
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
          `/dashboard/installation/site-readiness/details/${row.leadId}?accountId=${row.accountId}`
        );
      } else if (row.taskType === "Miscellaneous") {
        router.push(
          `/dashboard/installation/under-installation/details/${row.leadId}?accountId=${row.accountId}&tab=misc&taskId=${row.id}`
        );
      } else if (row.taskType === "Production Ready") {
        const clearnRemark = extractTitleText(row.remark);

        console.log("Remark Text: ", clearnRemark);
        setRowAction({
          row: { original: row } as any,
          variant: "productionready",
        });
        router.push(
          `/dashboard/production/pre-post-prod/details/${row.leadId}?accountId=${row.accountId}&remark=${clearnRemark}`
        );
      } else {
        console.log("follow up is under development");
      }
    },
    [router]
  );

  // Process leads into table data - Memoized to prevent re-renders
  const rowData = useMemo<ProcessedTask[]>(() => {
    if (!vendorUserTasksQuery.data) return [];

    return vendorUserTasksQuery.data.map((task, index) => ({
      id: task.userLeadTask.id,
      lead_code: task.leadMaster.lead_code,
      leadId: task.leadMaster.id,
      accountId: task.leadMaster.account_id,
      srNo: index + 1,
      name: task.leadMaster.name,
      phoneNumber: task.leadMaster.phone_number,
      leadStatus: task.userLeadTask.status,
      siteType: task.leadMaster.site_type || "",
      productTypes: task.leadMaster.product_type.join(", "),
      productStructures: task.leadMaster.product_structure.join(", "),
      taskType: task.userLeadTask.task_type,
      dueDate: task.userLeadTask.due_date,
      site_map_link: task.leadMaster.site_map_link,
      assignedBy: task.userLeadTask.created_by,
      assignedByName: task.userLeadTask.created_by_name || "-",
      assignedAt: task.userLeadTask.created_at,
      remark: task.userLeadTask?.remark || "",
    }));
  }, [vendorUserTasksQuery.data]);

  console.log("My Task data: ", vendorUserTasksQuery.data);

  // Calculate task counts - Memoized to prevent re-renders
  const taskCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let counts = { today: 0, upcoming: 0, overdue: 0 };

    rowData.forEach((task) => {
      if (!task.dueDate) return;
      const dueDate = new Date(task.dueDate);
      if (isNaN(dueDate.getTime())) return;

      const taskDay = new Date(dueDate);
      taskDay.setHours(0, 0, 0, 0);

      if (taskDay.getTime() === today.getTime()) counts.today++;
      else if (taskDay < today) counts.overdue++;
      else counts.upcoming++;
    });

    return counts;
  }, [rowData]);

  // Setup columns - Memoized to prevent re-renders
  const columns = useMemo(
    () => getVendorLeadsTableColumns({ setRowAction, userType, router }),
    [setRowAction, userType, router]
  );

  // Custom filter function for due dates - Memoized to prevent re-creation
  const dueDateFilterFn = useCallback(
    (row: any, columnId: string, filterValue: string) => {
      if (!filterValue || filterValue === "all") return true;

      const dueDate = row.getValue(columnId);
      if (!dueDate) return false;

      const taskDate = new Date(dueDate);
      if (isNaN(taskDate.getTime())) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const taskDay = new Date(taskDate);
      taskDay.setHours(0, 0, 0, 0);

      switch (filterValue) {
        case "today":
          return taskDay.getTime() === today.getTime();
        case "overdue":
          return taskDay < today;
        case "upcoming":
          return taskDay > today;
        default:
          return true;
      }
    },
    []
  );

  const filteredRowData = useMemo(() => {
    if (taskTypeFilter.length === 0) return rowData;

    return rowData.filter((task) => taskTypeFilter.includes(task.taskType));
  }, [rowData, taskTypeFilter]);

  // Create table with custom filter - Memoized to prevent re-creation
  const table = useReactTable({
    data: filteredRowData,
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
    filterFns: {
      dueDateFilter: dueDateFilterFn,
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },
  });

  // Set up the dueDate column filter - Only run once
  useEffect(() => {
    const dueDateColumn = table.getColumn("dueDate");
    if (dueDateColumn && dueDateColumn.columnDef.filterFn !== dueDateFilterFn) {
      dueDateColumn.columnDef.filterFn = dueDateFilterFn;
    }
  }, [table, dueDateFilterFn]);

  const DueDateTabs = ({
    table,
    taskCounts,
  }: {
    table: any;
    taskCounts: { today: number; upcoming: number; overdue: number };
  }) => {
    const column = table.getColumn("dueDate");
    const currentFilter = (column?.getFilterValue() as string) || "today";

    const handleChange = (value: string) => {
      column?.setFilterValue(value);
    };

    return (
      <CustomTabs
        value={currentFilter}
        onChange={handleChange}
        tabs={[
          {
            value: "today",
            label: "Today",
            count: taskCounts.today,
            dotColor: "#3b82f6", // blue
          },
          {
            value: "upcoming",
            label: "Upcoming",
            count: taskCounts.upcoming,
            dotColor: "#22c55e", // green
          },
          {
            value: "overdue",
            label: "Overdue",
            count: taskCounts.overdue,
            dotColor: "#ef4444", // red
          },
        ]}
      />
    );
  };

  const mockProps = useMemo(
    () => ({
      shallow: true,
      debounceMs: 300,
      throttleMs: 50,
    }),
    []
  );

  const followUpVariant: "Follow Up" | "Pending Materials" | "Pending Work" =
    rowAction?.variant === "Pending Materials"
      ? "Pending Materials"
      : rowAction?.variant === "Pending Work"
      ? "Pending Work"
      : "Follow Up";

  return (
    <>
      <div className="py-2">
        {/* ================= HEADER ================= */}
        <div className="px-4 space-y-3 md:space-y-2 md:flex md:flex-col lg:flex-row lg:justify-between lg:items-end lg:space-y-0">
          {/* Title + Description (Desktop only) */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">My Task</h1>
            <p className="text-sm text-muted-foreground">
              Your active tasks for the day.
            </p>
          </div>

          {/* Due Date Tabs (Always visible – top aligned) */}
          <div className="w-full lg:w-auto">
            <DueDateTabs table={table} taskCounts={taskCounts} />
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
              <TaskTypeFilter
                selected={taskTypeFilter}
                onChange={setTaskTypeFilter}
                userType={userType || ""}
              />

              <DataTableDateFilter
                column={table.getColumn("assignedAt")!}
                title="Assigned At"
                multiple
              />

              <DataTableSortList table={table} />
              <DataTableFilterList table={table} />
              <DataTableViewOptions table={table} />
            </div>

            {/* Search at bottom */}
            <ClearInput
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search…"
              className="w-full sm:w-64 h-8"
            />
          </div>

          {/* ================= DESKTOP LAYOUT ================= */}
          <div className="hidden md:flex justify-between items-end">
            {/* Left: Search + Filters */}
            <div className="flex items-end gap-3">
              <ClearInput
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search…"
                className="h-8 w-64"
              />

              <TaskTypeFilter
                selected={taskTypeFilter}
                onChange={setTaskTypeFilter}
                userType={userType || ""}
              />

              <DataTableDateFilter
                column={table.getColumn("assignedAt")!}
                title="Assigned At"
                multiple
              />
            </div>

            {/* Right: Table controls */}
            <div className="flex items-center gap-2">
              <DataTableSortList table={table} />
              <DataTableFilterList table={table} />
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
