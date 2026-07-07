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
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { useQueries } from "@tanstack/react-query";

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
  postVendorAllTasksFilter,
  postVendorUserTasks,
  useVendorAllTasksFilter,
  useVendorUserTasksFilter,
} from "@/hooks/useTasksQueries";
import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";
import FollowUpModal from "@/components/follow-up-modal";
import MiscTaskModal from "@/components/misc-task-modal";
import BookingDoneIsmForm from "@/components/sales-executive/Lead/booking-done-ism-form";
import BookingDoneApprovalModal from "@/components/tasks/BookingDoneApprovalModal";
import { TaskDetailsModal } from "./task-details-modal";
import ClearInput from "@/components/origin-input";
import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import CustomTabs from "@/components/custom/customeTab";
import { extractTitleText, mapTaskTableFiltersToPayload, formatBlockedAt } from "@/lib/utils";
import { toastManager } from "@/components/ui/toast";
import TaskTypeFilter from "@/components/data-table/data-table-task-filter";
import OrderLoginApprovalModal from "@/components/tasks/OrderLoginApprovalModal";
import DispatchPlanningApprovalModal from "@/components/tasks/DispatchPlanningApprovalModal";
import ApprovalRequestActionModal from "@/components/tasks/ApprovalRequestActionModal";
import FastProductionRequestActionModal from "@/components/tasks/FastProductionRequestActionModal";
import SmallOrderRequestActionModal from "@/components/tasks/SmallOrderRequestActionModal";
import InitialSiteMeasurementTaskModal from "@/components/tasks/InitialSiteMeasurementTaskModal";
import FinalMeasurementTaskModal from "@/components/tasks/FinalMeasurementTaskModal";
import OrderLoginCompletedTaskModal from "@/components/tasks/OrderLoginCompletedTaskModal";
import PreProdCompletedTaskModal from "@/components/tasks/PreProdCompletedTaskModal";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useVendorSelfAssignTaskTypes } from "@/hooks/useSelfAssignTaskTypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ListFilter, XCircle } from "lucide-react";
import SelfAssignTaskModal from "@/components/self-assign-task-modal";

function FranchiseFilter({
  value,
  defaultValue,
  options,
  onChange,
}: {
  value?: number;
  defaultValue?: number;
  options: { id: number; label: string; count?: number; isLoading?: boolean }[];
  onChange: (value: number) => void;
}) {
  const selectedOption = options.find((option) => option.id === value);
  const isFiltered =
    value != null && defaultValue != null && value !== defaultValue;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {isFiltered ? (
            <div
              role="button"
              aria-label="Reset franchise filter"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                if (defaultValue != null) onChange(defaultValue);
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
            >
              <XCircle className="h-4 w-4" />
            </div>
          ) : (
            <ListFilter className="h-4 w-4 shrink-0" />
          )}
          <span className="flex items-center gap-1.5 truncate">
            <span className="truncate">Filter by Franchaise</span>
            {selectedOption && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                />
                <Badge
                  variant="secondary"
                  className="font-normal px-1.5 py-0 h-5 text-xs truncate max-w-[180px] flex items-center gap-1.5"
                >
                  <span className="truncate">{selectedOption.label}</span>
                  <span className="text-muted-foreground">
                    {selectedOption.isLoading ? "…" : (selectedOption.count ?? 0)}
                  </span>
                </Badge>
              </>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground ${value === option.id ? "bg-accent text-accent-foreground font-medium" : ""
              }`}
          >
            <span className="truncate">{option.label}</span>
            <span className="shrink-0 text-muted-foreground">
              {option.isLoading ? "…" : (option.count ?? 0)}
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function prioritizeFastProductionTasks<
  T extends { isFastProductionRequestTask?: boolean },
>(
  rows: T[],
) {
  return [...rows].sort((a, b) => {
    if (a.isFastProductionRequestTask === b.isFastProductionRequestTask) {
      return 0;
    }
    return a.isFastProductionRequestTask ? -1 : 1;
  });
}

const MyTaskTable = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const franchiseId = useAppSelector((state) => state.auth.user?.franchise_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined,
  );
  const isAuditor = userType?.toLowerCase() === "auditor";
  const isAdminUser =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin" ||
    isAuditor;
  const isSuperAdmin = userType?.toLowerCase() === "super-admin" || isAuditor;
  const { data: franchises = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId && isSuperAdmin,
  );
  const franchiseOptions = useMemo(
    () =>
      franchises.map((franchise) => ({
        id: franchise.id,
        label: franchise.franchise_name,
        isHeadOffice: franchise.is_head_office === true,
      })),
    [franchises],
  );
  const defaultFranchiseId = useMemo(() => {
    if (!isSuperAdmin) return franchiseId ?? undefined;
    return (
      franchiseOptions.find((franchise) => franchise.isHeadOffice)?.id ??
      franchiseOptions[0]?.id ??
      franchiseId ??
      undefined
    );
  }, [franchiseId, franchiseOptions, isSuperAdmin]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<
    number | undefined
  >(franchiseId ?? undefined);
  const showFranchiseFilter =
    isSuperAdmin && franchiseOptions.length > 1;

  useEffect(() => {
    if (defaultFranchiseId == null) return;
    setSelectedFranchiseId((current) =>
      current === defaultFranchiseId ? current : defaultFranchiseId,
    );
  }, [defaultFranchiseId]);

  const [openMeasurement, setOpenMeasurement] = useState(false);
  const [openMeasurementTaskModal, setOpenMeasurementTaskModal] =
    useState(false);
  const [openFinalMeasurementTaskModal, setOpenFinalMeasurementTaskModal] =
    useState(false);
  const [openFinalMeasurement, setOpenFinalMeasurement] = useState(false);
  const [openBookingDoneIsm, setOpenBookingDoneIsm] = useState(false);
  const [openBookingDoneApproval, setOpenBookingDoneApproval] = useState(false);
  const [openOrderLoginApproval, setOpenOrderLoginApproval] = useState(false);
  const [openDispatchPlanningApproval, setOpenDispatchPlanningApproval] =
    useState(false);
  const [openApprovalRequestAction, setOpenApprovalRequestAction] =
    useState(false);
  const [openFastProductionRequestAction, setOpenFastProductionRequestAction] =
    useState(false);
  const [openSmallOrderRequestAction, setOpenSmallOrderRequestAction] =
    useState(false);

  // ✅ SEPARATE TASK TYPE FILTERS
  const [myTaskTypeFilter, setMyTaskTypeFilter] = useState<string[]>([]);
  const [overallTaskTypeFilter, setOverallTaskTypeFilter] = useState<string[]>(
    [],
  );

  // ✅ SEPARATE PAGINATION
  const [myPagination, setMyPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const [overallPagination, setOverallPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
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
  const [openSelfAssignTask, setOpenSelfAssignTask] = useState(false);
  const [openOrderLoginCompleted, setOpenOrderLoginCompleted] =
    useState(false);
  const [openPreProdCompleted, setOpenPreProdCompleted] = useState(false);
  const [openMiscTaskModal, setOpenMiscTaskModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const showScopeToggle = isAdminUser && !isAuditor;
  const {
    data: selfAssignTaskTypes = [],
  } = useVendorSelfAssignTaskTypes(vendorId, !!vendorId);
  const selfAssignTaskTypeNames = useMemo(
    () =>
      new Set(
        selfAssignTaskTypes
          .map((taskType) => taskType.type?.trim())
          .filter((taskType): taskType is string => !!taskType),
      ),
    [selfAssignTaskTypes],
  );

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
      franchise_id: selectedFranchiseId!,

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
    selectedFranchiseId,
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
      franchise_id: selectedFranchiseId!,

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
    selectedFranchiseId,
  ]);

  console.log("My Task Payload:", myTaskPayload);
  console.log("Overall Task Payload:", overallTaskPayload);

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

  const franchiseCountBasePayload = useMemo<TaskFilterPayload>(() => {
    const activePayload = viewScope === "overall" ? overallTaskPayload : myTaskPayload;
    return {
      ...activePayload,
      page: 1,
      limit: 1,
      due_filter: undefined,
    };
  }, [myTaskPayload, overallTaskPayload, viewScope]);

  const franchiseCountQueries = useQueries({
    queries: franchiseOptions.map((franchise) => ({
      queryKey: [
        "taskFranchiseCount",
        viewScope,
        vendorId,
        userId,
        franchise.id,
        franchiseCountBasePayload.created_at,
        franchiseCountBasePayload.global_search,
        franchiseCountBasePayload.task_type,
        franchiseCountBasePayload.due_filter,
        franchiseCountBasePayload.date_range,
        franchiseCountBasePayload.assignat_range,
        franchiseCountBasePayload.assign_by,
        franchiseCountBasePayload.assign_to,
        franchiseCountBasePayload.site_map_link,
        franchiseCountBasePayload.site_type,
        franchiseCountBasePayload.product_type,
        franchiseCountBasePayload.product_structure,
      ],
      queryFn: async () => {
        const payload = {
          ...franchiseCountBasePayload,
          franchise_id: franchise.id,
        };

        if (viewScope === "overall") {
          return postVendorAllTasksFilter(vendorId!, payload);
        }

        return postVendorUserTasks(vendorId!, userId!, payload);
      },
      enabled:
        showFranchiseFilter &&
        !!vendorId &&
        (viewScope === "overall" || !!userId),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const franchiseFilterOptions = useMemo(
    () =>
      franchiseOptions.map((franchise, index) => ({
        id: franchise.id,
        label: franchise.label,
        count:
          (franchiseCountQueries[index]?.data?.summary?.today ?? 0) +
          (franchiseCountQueries[index]?.data?.summary?.upcoming ?? 0) +
          (franchiseCountQueries[index]?.data?.summary?.overdue ?? 0),
        isLoading: franchiseCountQueries[index]?.isLoading,
      })),
    [franchiseCountQueries, franchiseOptions],
  );

  console.log("vendorUserData:", vendorUserData);
  console.log("vendorAllData:", vendorAllData);
  const activeTaskData =
    viewScope === "overall"
      ? (vendorAllData?.data ?? [])
      : (vendorUserData?.data ?? []);

  // Set initial view scope
  useEffect(() => {
    if (isAuditor) {
      setViewScope("overall");
      setOverallPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      setViewScope("my");
      setMyPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [isAdminUser, isAuditor]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const taskIdParam = Number(searchParams.get("taskId"));
  const hasAutoOpenedRef = useRef(false);

  const handleRowDoubleClick = useCallback(
    (row: ProcessedTask) => {
      if (row.leadStatus?.toLowerCase() === "completed" || isCompletedTabActive) {
        setRowAction({
          row: { original: row } as any,
          variant: "taskdetails" as any,
        });
        setOpenDetailModal(true);
        return;
      }

      if (isAuditor) {
        const opensModal = [
          "Initial Site Measurement",
          "BookingDone - ISM",
          "Booking Done Approval",
          "Order Login Approval",
          "Dispatch Planning Approval",
          "Approval Request",
          "Request Fast Production",
          "Small order request",
          "Final Measurements",
          "Follow Up",
          "Pending Materials",
          "Pending Work",
          "Order Login Completed",
          "Pre Prod Completed",
        ].includes(row.taskType) ||
          selfAssignTaskTypeNames.has(row.taskType) ||
          (row.taskType === "Miscellaneous" && (row.remark || "").toLowerCase().includes("required delivery date"));

        if (opensModal) {
          toastManager.add({
            title: "Auditors cannot perform actions on tasks.",
            type: "error",
          });
          return;
        }
      }

      const isBlocked = row.is_blocked;
      const isFollowUpTask = row.taskType === "Follow Up";

      if (isBlocked && !isFollowUpTask) {
        const blockTime = row.lead_blocked_at ? ` at ${formatBlockedAt(row.lead_blocked_at)}` : "";
        toastManager.add({
          title: `This lead has been blocked${blockTime}. Only follow up tasks are allowed.`,
          type: "error",
        });
        return;
      }
      if (row.taskType === "Initial Site Measurement") {
        setRowAction({
          row: { original: row } as any,
          variant: "initialsitemeasurementtask",
        });
        setOpenMeasurementTaskModal(true);
      } else if (row.taskType === "BookingDone - ISM") {
        setRowAction({
          row: { original: row } as any,
          variant: "bookingdoneism",
        });
        setOpenBookingDoneIsm(true);
      } else if (row.taskType === "Booking Done Approval") {
        setRowAction({
          row: { original: row } as any,
          variant: "bookingdoneapproval",
        });
        setOpenBookingDoneApproval(true);
      } else if (row.taskType === "Order Login Approval") {
        setRowAction({
          row: { original: row } as any,
          variant: "orderloginapproval",
        });
        setOpenOrderLoginApproval(true);
      } else if (row.taskType === "Dispatch Planning Approval") {
        setRowAction({
          row: { original: row } as any,
          variant: "dispatchplanningapproval",
        });
        setOpenDispatchPlanningApproval(true);
      } else if (row.taskType === "Approval Request") {
        setRowAction({
          row: { original: row } as any,
          variant: "view",
        });
        setOpenApprovalRequestAction(true);
      } else if (row.taskType === "Request Fast Production") {
        setRowAction({
          row: { original: row } as any,
          variant: "view",
        });
        setOpenFastProductionRequestAction(true);
      } else if (row.taskType === "Small order request") {
        setRowAction({
          row: { original: row } as any,
          variant: "smallorderrequest",
        });
        setOpenSmallOrderRequestAction(true);
      } else if (row.taskType === "Final Measurements") {
        setRowAction({
          row: { original: row } as any,
          variant: "finalmeasurementtask",
        });
        setOpenFinalMeasurementTaskModal(true);
      } else if (row.taskType === "Follow Up") {
        setRowAction({
          row: { original: row } as any,
          variant: "Follow Up",
        });
        setOpenFollowUp(true);
      } else if (row.taskType === "Dispatch") {
        setRowAction({
          row: { original: row } as any,
          variant: "Dispatch",
        });
        router.push(
          `/dashboard/installation/dispatch-planning/details/${row.leadId}?accountId=${row.accountId}`,
        );
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
      } else if (selfAssignTaskTypeNames.has(row.taskType)) {
        setRowAction({
          row: { original: row } as any,
          variant: "selfassigntask",
        });
        setOpenSelfAssignTask(true);
      } else if (row.taskType === "Assign a Site Supervisor") {
        router.push(
          `/dashboard/leads/booking-stage/details/${row.leadId}?accountId=${row.accountId}`,
        );
      } else if (row.taskType === "Site Readiness") {
        setRowAction({
          row: { original: row } as any,
          variant: "sitereadinessstage",
        });
        router.push(
          `/dashboard/installation/site-readiness/details/${row.leadId}?accountId=${row.accountId}`,
        );
      } else if (row.taskType === "Miscellaneous") {
        const isDeliveryTask = (row.remark || "")
          .toLowerCase()
          .includes("required delivery date");

        if (isDeliveryTask) {
          setRowAction({
            row: { original: row } as any,
            variant: "miscellaneous",
          });
          setOpenMiscTaskModal(true);
        } else {
          router.push(
            `/dashboard/installation/under-installation/details/${row.leadId}?accountId=${row.accountId}&tab=misc&taskId=${row.id}`,
          );
        }
      } else if (row.taskType === "Production Ready") {
        const clearnRemark = extractTitleText(row.remark);
        setRowAction({
          row: { original: row } as any,
          variant: "productionready",
        });
        router.push(
          `/dashboard/production/pre-post-prod/details/${row.leadId}?accountId=${row.accountId}&instance_id=${row.instance_id}&remark=${clearnRemark}&tab=preProduction`,
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

        const params = new URLSearchParams({
          accountId: String(row.accountId),
          tab: "orderLogin",
        });
        if (row.instance_id) {
          params.set("instance_id", String(row.instance_id));
        }
        router.push(`${basePath}?${params.toString()}`);
      } else if (row.taskType === "Order Login Completed") {
        setRowAction({
          row: { original: row } as any,
          variant: "orderlogincompleted",
        });
        setOpenOrderLoginCompleted(true);
      } else if (row.taskType === "Pre Prod Completed") {
        setRowAction({
          row: { original: row } as any,
          variant: "preprodcompleted",
        });
        setOpenPreProdCompleted(true);
      } else if (
        row.taskType === "1st Servicing" ||
        row.taskType === "2nd Servicing" ||
        row.taskType === "3rd Servicing"
      ) {
        router.push(
          `/dashboard/installation/final-handover/details/${row.leadId}?accountId=${row.accountId}&tab=servicing&source=servicing`,
        );
      } else {
        console.log("follow up is under development");
      }
    },
    [router, selfAssignTaskTypeNames, isAuditor],
  );

  // Process leads into table data
  const rowData = useMemo<ProcessedTask[]>(() => {
    const sourceData =
      viewScope === "overall"
        ? (vendorAllData?.data ?? [])
        : (vendorUserData?.data ?? []);

    if (!sourceData) return [];

    const rows = sourceData.map((task) => ({
      id: task.userLeadTask.id,
      lead_code: task.leadMaster.lead_code,
      leadId: task.leadMaster.id,
      accountId: task.leadMaster.account_id,
      srNo: 0,
      name: task.leadMaster.name,
      phoneNumber: task.leadMaster.phone_number,
      leadStatus: task.userLeadTask.status,
      leadStage: task.leadMaster.lead_status ?? "",
      siteType: task.leadMaster.site_type || "",
      furnitureType: task.leadMaster.product_type.join(", "),
      furnitueStructures: task.leadMaster.product_structure,
      taskType: task.userLeadTask.task_type,
      dueDate: task.userLeadTask.due_date,
      site_map_link: task.leadMaster.site_map_link,
      assignedBy: task.userLeadTask.created_by,
      assignedByName: task.userLeadTask.created_by_name || "-",
      assignedToName: task.userLeadTask.assigned_to_name || null,
      assignedAt: task.userLeadTask.created_at,
      remark: task.userLeadTask?.remark || "",
      instance_id: task.userLeadTask?.instance_id,
      is_blocked: (task.leadMaster as any).is_blocked ?? false,
      lead_blocked_at: (task.leadMaster as any).lead_blocked_at ?? null,
      isFastProductionRequestTask:
        task.userLeadTask.task_type === "Request Fast Production",
    }));

    return prioritizeFastProductionTasks(rows).map((row, index) => ({
      ...row,
      srNo: index + 1,
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
            dotColor: "orange",
            count: summary?.upcoming ?? 0,
          },
          {
            value: "overdue",
            label: "Overdue",
            dotColor: "red",
            count: summary?.overdue ?? 0,
          },
          {
            value: "completed",
            label: "Completed",
            dotColor: "#16a34a",
            count: summary?.completed ?? 0,
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
    (activeColumnFilters.find((f) => f.id === "dueDate")?.value as string) ||
    "today";
  const isOverallView = viewScope === "overall";
  const isCompletedTabActive = dueDateFilterLabel === "completed";
  const headerDescription = (() => {
    const scopeText = isOverallView ? "Your teams" : "Your";
    if (dueDateFilterLabel === "upcoming")
      return `${scopeText} upcoming tasks.`;
    if (dueDateFilterLabel === "overdue") return `${scopeText} overdue tasks.`;
    if (dueDateFilterLabel === "completed")
      return `${scopeText} completed tasks.`;
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
  const showDueDateRangeFilter = !isTodayTabActive && !isCompletedTabActive;

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
          rowClassName={(row) =>
            row.isFastProductionRequestTask
              ? "relative border-l-4 border-l-orange-500 bg-[linear-gradient(90deg,rgba(255,237,213,0.96)_0%,rgba(255,244,230,0.92)_38%,rgba(255,255,255,1)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_34px_-24px_rgba(234,88,12,0.58)] hover:bg-[linear-gradient(90deg,rgba(255,224,178,0.72)_0%,rgba(255,237,213,0.78)_42%,rgba(255,255,255,1)_100%)] dark:border-l-orange-400 dark:bg-[linear-gradient(90deg,rgba(124,45,18,0.5)_0%,rgba(67,20,7,0.28)_36%,rgba(15,23,42,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(251,146,60,0.08),0_18px_38px_-24px_rgba(249,115,22,0.45)] dark:hover:bg-[linear-gradient(90deg,rgba(154,52,18,0.62)_0%,rgba(88,28,12,0.34)_38%,rgba(15,23,42,0.98)_100%)]"
              : undefined
          }
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

              {showDueDateRangeFilter && (
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
              {showFranchiseFilter && (
                <FranchiseFilter
                  value={selectedFranchiseId}
                  defaultValue={defaultFranchiseId}
                  options={franchiseFilterOptions}
                  onChange={setSelectedFranchiseId}
                />
              )}
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

              {showDueDateRangeFilter && (
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
              {showFranchiseFilter && (
                <FranchiseFilter
                  value={selectedFranchiseId}
                  defaultValue={defaultFranchiseId}
                  options={franchiseFilterOptions}
                  onChange={setSelectedFranchiseId}
                />
              )}
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

      <InitialSiteMeasurementTaskModal
        open={openMeasurementTaskModal}
        onOpenChange={setOpenMeasurementTaskModal}
        onComplete={() => setOpenMeasurement(true)}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
          dueDate: rowAction?.row.original.dueDate,
          remark: rowAction?.row.original.remark,
        }}
      />

      <MiscTaskModal
        open={openMiscTaskModal}
        onOpenChange={setOpenMiscTaskModal}
        data={
          rowAction?.row?.original && rowAction?.variant === "miscellaneous"
            ? {
              leadId: rowAction.row.original.leadId,
              accountId: rowAction.row.original.accountId,
              taskId: rowAction.row.original.id,
              dueDate: rowAction.row.original.dueDate,
              remark: rowAction.row.original.remark,
            }
            : undefined
        }
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

      <FinalMeasurementTaskModal
        open={openFinalMeasurementTaskModal}
        onOpenChange={setOpenFinalMeasurementTaskModal}
        onComplete={() => setOpenFinalMeasurement(true)}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
          dueDate: rowAction?.row.original.dueDate,
          remark: rowAction?.row.original.remark,
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

      <BookingDoneApprovalModal
        open={openBookingDoneApproval}
        onOpenChange={setOpenBookingDoneApproval}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
        }}
      />

      <OrderLoginApprovalModal
        open={openOrderLoginApproval}
        onOpenChange={setOpenOrderLoginApproval}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
        }}
      />

      <DispatchPlanningApprovalModal
        open={openDispatchPlanningApproval}
        onOpenChange={setOpenDispatchPlanningApproval}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
        }}
      />

      <ApprovalRequestActionModal
        open={openApprovalRequestAction}
        onOpenChange={setOpenApprovalRequestAction}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
          dueDate: rowAction?.row.original.dueDate,
          remark: rowAction?.row.original.remark,
        }}
      />

      <FastProductionRequestActionModal
        open={openFastProductionRequestAction}
        onOpenChange={setOpenFastProductionRequestAction}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
          remark: rowAction?.row.original.remark,
        }}
      />

      <SmallOrderRequestActionModal
        open={openSmallOrderRequestAction}
        onOpenChange={setOpenSmallOrderRequestAction}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          taskId: rowAction?.row.original.id || 0,
          remark: rowAction?.row.original.remark,
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

      <SelfAssignTaskModal
        open={openSelfAssignTask}
        onOpenChange={setOpenSelfAssignTask}
        data={{
          id: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          taskId: rowAction?.row.original.id || 0,
          taskType: rowAction?.row.original.taskType || "",
          remark: rowAction?.row.original.remark,
          dueDate: rowAction?.row.original.dueDate,
        }}
      />

      <OrderLoginCompletedTaskModal
        open={openOrderLoginCompleted}
        onOpenChange={setOpenOrderLoginCompleted}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          taskId: rowAction?.row.original.id || 0,
          instanceId: rowAction?.row.original.instance_id || undefined,
        }}
      />

      <PreProdCompletedTaskModal
        open={openPreProdCompleted}
        onOpenChange={setOpenPreProdCompleted}
        data={{
          leadId: rowAction?.row.original.leadId || 0,
          accountId: rowAction?.row.original.accountId || 0,
          taskId: rowAction?.row.original.id || 0,
          instanceId: rowAction?.row.original.instance_id || undefined,
        }}
      />
      <TaskDetailsModal
        taskId={rowAction?.row.original.id || null}
        open={openDetailModal}
        onOpenChange={setOpenDetailModal}
      />
    </>
  );
};

export default MyTaskTable;
