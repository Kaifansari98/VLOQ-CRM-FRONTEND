"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAppSelector } from "@/redux/store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

import InitialSiteMeasuresMent from "@/components/sales-executive/Lead/initial-site-measurement-form";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

import { useFeatureFlags } from "./feature-flags-provider";
import type { DataTableRowAction } from "@/types/data-table";
import { getVendorLeadsTableColumns, ProcessedTask } from "./tasks-table-columns";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Loader from "@/components/utils/loader";
import { useVendorUserTasks } from "@/hooks/useTasksQueries";
import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";

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

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);
  const [assignOpenLead, setAssignOpenLead] = useState<boolean>(false);
  const [editOpenLead, setEditOpenLead] = useState<boolean>(false);
  const deleteLeadMutation = useDeleteLead();
  const [globalFilter, setGlobalFilter] = useState("");
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

  // Table state - Fixed: Use 'assignedAt' instead of 'createdAt'
  const [sorting, setSorting] = useState<SortingState>([
    { id: "assignedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "dueDate", value: "today" } // Set default filter
  ]);
  const [rowSelection, setRowSelection] = useState({});

  const [rowAction, setRowAction] = useState<DataTableRowAction<ProcessedTask> | null>(null);
  
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
    if (rowAction?.variant === "uploadmeasurement" && rowAction.row) {
      console.log("Uploading measurement for row:", rowAction.row.original);
      setOpenMeasurement(true);
    }
  }, [rowAction]);

  const handleDeleteLead = useCallback(async () => {
    if (!rowAction?.row) return;

    const leadId = rowAction.row.original.id;

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
  }, [rowAction, vendorId, userId, deleteLeadMutation]);

  const router = useRouter();

  const handleRowClick = useCallback((row: ProcessedTask) => {
    const leadId = row.id;
    router.push(`/dashboard/sales-executive/leadstable/details/${leadId}`);
  }, [router]);

  const handleRowDoubleClick = useCallback((row: ProcessedTask) => {
    if (row.taskType === "Initial Site Measurement") {
      setRowAction({ row: { original: row } as any, variant: "uploadmeasurement" });
      setOpenMeasurement(true);
    } else if (row.taskType === "Final Measurements") {
      setRowAction({ row: { original: row } as any, variant: "uploadfinalmeasurement" });
      setOpenFinalMeasurement(true); }
     else {
      const leadId = row.id;
      router.push(`/dashboard/sales-executive/leadstable/details/${leadId}`);
    }
  }, [router]);  
  

  // Process leads into table data - Memoized to prevent re-renders
  const rowData = useMemo<ProcessedTask[]>(() => {
    if (!vendorUserTasksQuery.data) return [];
  
    return vendorUserTasksQuery.data.map((task, index) => ({
      id: task.userLeadTask.id,
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
      assignedBy: task.userLeadTask.created_by,
      assignedByName: task.userLeadTask.created_by_name || "-",
      assignedAt: task.userLeadTask.created_at,
    }));
  }, [vendorUserTasksQuery.data]);  

  console.log("Row data :- ",rowData);

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
  const dueDateFilterFn = useCallback((row: any, columnId: string, filterValue: string) => {
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
  }, []);

  // Create table with custom filter - Memoized to prevent re-creation
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

  // Memoized components to prevent re-renders
  const DueDateFilter = useMemo(() => {
    return ({ table }: { table: any }) => {
      const column = table.getColumn("dueDate");
      const currentValue = (column?.getFilterValue() as string) ?? "";
    
      return (
        <Select
          value={currentValue}
          onValueChange={(value) => {
            column?.setFilterValue(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter Due Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      );
    };
  }, []);

  const DueDateTabs = useMemo(() => {
    return ({ table, taskCounts }: { 
      table: any; 
      taskCounts: { today: number; upcoming: number; overdue: number } 
    }) => {
      const column = table.getColumn("dueDate");
      const currentFilter = (column?.getFilterValue() as string) || "today";

      const handleTabChange = useCallback((value: string) => {
        column?.setFilterValue(value);
      }, [column]);

      return (
        <div className="flex items-center justify-start h-full">
          <Tabs value={currentFilter} onValueChange={handleTabChange} className="w-fit h-full">
            <TabsList className="grid grid-cols-3 p-1 rounded-lg w-fit h-full min-h-[40px]">
              <TabsTrigger 
                value="today" 
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm h-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">Today</span>
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full min-w-[20px] text-center">
                    {taskCounts.today}
                  </span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="upcoming" 
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm h-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Upcoming</span>
                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-600 rounded-full min-w-[20px] text-center">
                    {taskCounts.upcoming}
                  </span>
                </div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="overdue" 
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm h-full"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs">Overdue</span>
                  <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full min-w-[20px] text-center">
                    {taskCounts.overdue}
                  </span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      );
    };
  }, []);

  const mockProps = useMemo(() => ({
    shallow: true,
    debounceMs: 300,
    throttleMs: 50,
  }), []);

  const isInitialLoading = vendorUserTasksQuery.isLoading && !vendorUserTasksQuery.data;
  const isFetching = vendorUserTasksQuery.isFetching;

  return (
    <div className="relative space-y-4">
      <DataTable
          table={table}
          // onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick} // 👈 add this
        >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            <DueDateFilter table={table} />
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
            <DueDateTabs table={table} taskCounts={taskCounts}/>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
      
      {/* Refetch overlay loader */}
      {isFetching && !isInitialLoading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-40 rounded-md">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader size={24} />
            <span className="text-sm text-gray-600">Refreshing tasks...</span>
          </div>
        </div>
      )}

      <InitialSiteMeasuresMent
        open={openMeasurement}
        onOpenChange={setOpenMeasurement}
        data={{
          id: rowAction?.row.original.leadId || 0,         // ✅ leadId
          accountId: rowAction?.row.original.accountId || 0, // ✅ accountId
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
    </div>
  );
};

export default MyTaskTable;