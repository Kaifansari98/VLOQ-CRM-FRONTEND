"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import {
  useLeadById,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  Factory,
  CalendarCheck2,
  Clock,
  CheckCircle2,
  UserPlus,
  Truck,
  MessageSquare,
  User2,
  Layers3,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
  LockOpen,
  Lock,
} from "lucide-react";

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
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { toastManager } from "@/components/ui/toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  handledproductionDefaultTab,
  canMoveToReadyToDispatch,
  canViewAndWorkEditProcutionExpectedDate,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canAccessTodoTaskTabProductionStage,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import CustomeDatePicker from "@/components/date-picker";
import {
  useLatestOrderLoginByLead,
  useMarkProductionCompleted,
  usePostProductionCompleteness,
  useUpdateExpectedOrderLoginReadyDate,
} from "@/api/production/production-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useCheckPostProductionReady } from "@/api/production/production-api";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import { useMoveLeadToReadyToDispatch } from "@/api/production/useReadyToDispatchLeads";
import { useMoveLeadToDispatchPlanning } from "@/api/installation/useSiteReadinessLeads";
import { useRouter } from "next/navigation";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import { useChatTabFromUrl } from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useBlockLead, useUnblockLead } from "@/hooks/useLeadsQueries";
import { fetchLeadLogs } from "@/api/leads";
import BaseModal from "@/components/utils/baseModal";
import TextAreaInput from "@/components/origin-text-area";
export default function ProductionLeadDetails() {
  const router = useRouter();
  const { lead: leadId, remark } = useParams();
  const searchParams = useSearchParams();
  const leadIdNum = Number(leadId);
  console.log("Remark param:", remark);
  const instanceId = searchParams.get("instance_id");
  const instanceIdNum = instanceId ? Number(instanceId) : null;
  const validInstanceId =
    instanceIdNum && !Number.isNaN(instanceIdNum) ? instanceIdNum : null;

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType;
  const isAuditor = effectiveUserType?.trim().toLowerCase() === "auditor";
  const normalizedUserType = effectiveUserType?.trim().toLowerCase() ?? "";
  const isSuperAdmin = normalizedUserType === "super-admin";

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const [openReadyToDispatch, setOpenReadyToDispatch] = useState(false);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");
  const [showMasterErdRemarkModal, setShowMasterErdRemarkModal] = useState(false);
  const [pendingMasterErdDate, setPendingMasterErdDate] = useState<
    string | undefined
  >(undefined);
  const [masterErdRemark, setMasterErdRemark] = useState("");
  const [factoryErdLocked, setFactoryErdLocked] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const moveLeadMutation = useMoveLeadToReadyToDispatch();
  const moveLeadToDispatchPlanningMutation = useMoveLeadToDispatchPlanning();

  const { data, isLoading, isError } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const smallOrderTypeKey =
    lead?.smallOrderRequest?.requestType?.type_key ?? null;
  const isSmallOrderLead = lead?.is_small_order_request === true;
  const isSmallOrderSingleUploadFlow =
    isSmallOrderLead &&
    [
      "additional_panel",
      "one_cabinet",
      "additional_hardware",
      "additional_accessory",
    ].includes(String(smallOrderTypeKey ?? "").toLowerCase());
  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadIdNum,
    vendorId,
  );

  // 🔍 Check Post Prouction Readiness
  const { data: postProductionStatus } = useCheckPostProductionReady(
    vendorId,
    leadIdNum,
    instanceIdNum,
  );

  const { data: latestOrderLoginData } = useLatestOrderLoginByLead(
    vendorId,
    Number(leadIdNum),
    validInstanceId ?? undefined,
  );
  const { data: masterErdChangeLogData } = useQuery({
    queryKey: ["master-erd-change-log", vendorId, leadIdNum],
    queryFn: () =>
      fetchLeadLogs({
        leadId: leadIdNum,
        vendorId: vendorId!,
        limit: 1,
        historyType: "Lead",
        search: validInstanceId
          ? "Instance ERD changed to"
          : "Expected Order Login ready date changed to",
      }),
    enabled: !!vendorId && !!leadIdNum,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });



  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
  } = useLeadAccessControl({
    leadId: leadIdNum,
    userType,
    lead,
  });

  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const isBlockActionPending =
    blockLeadMutation.isPending ||
    unblockLeadMutation.isPending;




  const canMoveReadyToDispatchStage =
    userType === "custom"
      ? customPrivilegeCodes.includes(
        "production.production.ready_to_dispatch.enable_disable",
      )
      : canMoveToReadyToDispatch(effectiveUserType);
  const canUpdateExpectedDate =
    canViewAndWorkEditProcutionExpectedDate(effectiveUserType);
  const canViewMarkCompletedButton =
    userType === "custom"
      ? customPrivilegeCodes.includes(
        "production.production.mark_as_completed.enable_disable",
      )
      : effectiveUserType?.toLowerCase() === "factory" ||
      effectiveUserType?.toLowerCase() === "super-admin";

  const canShowTodoTab =
    userType === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith("production.production."),
      )
      : canAccessTodoTaskTabProductionStage(effectiveUserType);

  const latestOrderLoginDate =
    latestOrderLoginData?.data?.estimated_completion_date ?? null;

  const instances = Array.isArray(instancesResponse?.data)
    ? instancesResponse?.data
    : instancesResponse?.data?.data || [];

  const currentInstance = validInstanceId
    ? instances.find(
      (instance: any) => Number(instance?.id) === validInstanceId,
    )
    : null;

  useEffect(() => {
    if (
      !latestOrderLoginDate ||
      !postProductionStatus?.all_order_login_dates_added ||
      !lead?.id // ✅ Wait for lead data to be loaded
    )
      return;

    // 1️⃣ Compute 3-day buffered date (day precision only)
    const baseDate = new Date(latestOrderLoginDate);
    baseDate.setDate(baseDate.getDate() + 3);
    const computedDate = baseDate.toISOString().split("T")[0];

    // 2️⃣ Normalize expected date and latest order login date to day strings
    const expectedDate = validInstanceId
      ? currentInstance?.production_erd_date
        ? new Date(currentInstance.production_erd_date)
          .toISOString()
          .split("T")[0]
        : undefined
      : lead?.expected_order_login_ready_date
        ? new Date(lead.expected_order_login_ready_date)
          .toISOString()
          .split("T")[0]
        : undefined;

    const latestDate = new Date(latestOrderLoginDate)
      .toISOString()
      .split("T")[0];

    // 3️⃣ Hit API ONLY in these specific cases:
    const shouldHitApi =
      // Only auto-set when missing. Do not silently change an already-set ERD.
      !expectedDate;

    // ✅ REMOVED Case 3 (expectedDate === computedDate) because this causes repeated API calls

    if (shouldHitApi) {
      // Determine the correct date to set
      const dateToSet = !expectedDate
        ? computedDate // If missing, set 3-day buffer
        : computedDate; // If smaller, set to latest order login date + 3 days buffer

      handleExpectedDateChange(dateToSet);
    }

    // ✅ Only depend on the actual data values, not the lead object itself
  }, [
    latestOrderLoginDate,
    postProductionStatus?.all_order_login_dates_added,
    lead?.expected_order_login_ready_date, // ✅ Only this specific field
    currentInstance?.production_erd_date,
    lead?.id, // ✅ To ensure lead is loaded
    validInstanceId,
  ]);

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const noOfBoxes = lead?.no_of_boxes;

  const canReassign = canReassignLeadButton(effectiveUserType ?? "");
  const canDelete = canDeleteLeadButton(effectiveUserType ?? "");
  const canEdit = canEditLeadButton(effectiveUserType ?? "");
  const canViewPayment =
    isAuditor ||
    (effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.payment_information.enable_disable",
      )
      : canViewPaymentTab(effectiveUserType ?? ""));
  const canViewSiteHistory =
    isAuditor ||
    (effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.site_history.enable_disable",
      )
      : canViewSiteHistoryTab(effectiveUserType ?? ""));
  const canViewChats =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.chat.enable_disable",
      )
      : true;
  const canViewDocuments =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith("leads.open_leads.details_of_lead.documents_section."),
      )
      : true;

  const productionDefaultTab = handledproductionDefaultTab(
    effectiveUserType ?? "",
  );
  const canViewProductionTabByDefault =
    isAuditor ||
    (userType === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith("production.production."),
      )
      : productionDefaultTab);

  const deleteLeadMutation = useDeleteLead();

  const { mutateAsync: updateExpectedDate } =
    useUpdateExpectedOrderLoginReadyDate();

  const { data: completeness } = usePostProductionCompleteness(
    vendorId,
    leadIdNum,
  );

  const { data: instanceCompleteness } = usePostProductionCompleteness(
    vendorId,
    leadIdNum,
    validInstanceId ?? undefined,
  );

  const totalInstanceCount = instances.length;
  const instanceSuffix =
    validInstanceId && totalInstanceCount > 1
      ? instances.find(
        (instance: any) => Number(instance?.id) === validInstanceId,
      )?.quantity_index
      : null;
  const displayLeadCode =
    leadCode && instanceSuffix ? `${leadCode}.${instanceSuffix}` : leadCode;
  const instanceName = validInstanceId
    ? (instances.find(
      (instance: any) => Number(instance?.id) === validInstanceId,
    )?.title ?? "")
    : "";

  const incompleteInstances = instances.filter(
    (instance: any) => instance?.is_production_completed !== true,
  );

  const hasInstances = instances.length > 0;
  const allInstancesCompleted = hasInstances
    ? incompleteInstances.length === 0
    : true;

  const incompleteTitles =
    incompleteInstances
      ?.map((instance: any) => instance?.title)
      .filter(Boolean) || [];

  const missingPrerequisites: string[] = [];
  const missingDocsOrRemarks: string[] = [];

  if (validInstanceId) {
    if (isSmallOrderSingleUploadFlow) {
      const hasAnyPostProductionUpload =
        !!instanceCompleteness?.qc_photos ||
        !!instanceCompleteness?.hardware_docs ||
        !!instanceCompleteness?.woodwork_docs;

      if (!hasAnyPostProductionUpload) {
        missingDocsOrRemarks.push(
          "Any one of QC photos, Hardware packing docs, or Woodwork packing docs",
        );
      }
    } else {
      if (!instanceCompleteness?.qc_photos) {
        missingDocsOrRemarks.push("QC photos");
      }
      if (!instanceCompleteness?.hardware_docs) {
        missingDocsOrRemarks.push("Hardware packing docs");
      }
      if (!instanceCompleteness?.woodwork_docs) {
        missingDocsOrRemarks.push("Woodwork packing docs");
      }
    }
  }

  if (validInstanceId && currentInstance) {
    if (!currentInstance?.no_of_boxes || currentInstance?.no_of_boxes <= 0) {
      missingPrerequisites.push("Set No. of Boxes");
    }

    if (currentInstance?.is_order_login_completed !== true) {
      missingPrerequisites.push("Order Login cards completion");
    }
  }

  const canMarkProductionCompleted =
    !!validInstanceId &&
    !currentInstance?.is_production_completed &&
    missingDocsOrRemarks.length === 0 &&
    missingPrerequisites.length === 0;

  const pendingProductionRequirements = isSmallOrderSingleUploadFlow
    ? [
        ...((missingDocsOrRemarks.length > 0
          ? [
              "Any one of QC photos, Hardware packing docs, or Woodwork packing docs",
            ]
          : []) as string[]),
        ...missingPrerequisites,
      ]
    : [...missingDocsOrRemarks, ...missingPrerequisites];

  const productionCompletedTooltip = !validInstanceId
    ? "instance_id is required to mark production completed."
    : currentInstance?.is_production_completed
      ? `Production already completed for this instance.${incompleteTitles.length
        ? ` Pending Instances: ${incompleteTitles.join(", ")}`
        : ""
      }`
      : pendingProductionRequirements.length
        ? `Pending: ${pendingProductionRequirements.join(", ")}`
        : incompleteTitles.length
          ? `Other pending instances: ${incompleteTitles.join(", ")}`
          : "Ready to mark production completed.";

  const markProductionCompletedMutation = useMarkProductionCompleted(
    vendorId,
    leadIdNum,
    validInstanceId,
  );

  const handleExpectedDateChange = async (newDate?: string) => {
    if (!newDate || !vendorId || !userId || !leadIdNum) return;

    const existingDisplayedErd = validInstanceId
      ? currentInstance?.production_erd_date
        ? new Date(currentInstance.production_erd_date).toISOString().split("T")[0]
        : null
      : lead?.expected_order_login_ready_date
        ? new Date(lead.expected_order_login_ready_date).toISOString().split("T")[0]
        : null;
    const isDisplayedErdChange =
      !!existingDisplayedErd && existingDisplayedErd !== newDate;
    const isFactoryLockedForDisplayedErd =
      normalizedUserType === "factory" &&
      !!existingDisplayedErd &&
      (factoryErdLocked || hasMasterErdBeenChangedOnce);

    if (isFactoryLockedForDisplayedErd) {
      toastManager.add({
        title:
          "Factory can change this Expected Ready Date only once after setting it.",
        type: "error",
      });
      return;
    }

    if (isDisplayedErdChange && !isSuperAdmin) {
      setPendingMasterErdDate(newDate);
      setShowMasterErdRemarkModal(true);
      return;
    }

    try {
      await updateExpectedDate({
        vendorId,
        leadId: leadIdNum,
        expected_order_login_ready_date: newDate,
        updated_by: userId,
        instance_id: validInstanceId,
      });

      toastManager.add({
        title: "Expected Order Login Ready Date updated successfully!",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["lead", leadIdNum] });
      queryClient.invalidateQueries({
        queryKey: ["lead-product-structure-instances", leadIdNum, vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["postProductionReady", vendorId, leadIdNum],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "latestOrderLogin",
          vendorId,
          leadIdNum,
          validInstanceId ?? undefined,
        ],
      });
      if (normalizedUserType === "factory" && isDisplayedErdChange) {
        setFactoryErdLocked(true);
      }
    } catch (err: any) {
      toastManager.add({
        title: err?.message || "Failed to update expected order login date",
        type: "error",
      });
    }
  };

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor or user info!",
        type: "error",
      });
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () =>
          toastManager.add({
            title: "Lead deleted successfully!",
            type: "success",
          }),
        onError: (err: any) =>
          toastManager.add({
            title: err?.message || "Failed to delete lead",
            type: "error",
          }),
      },
    );

    setOpenDelete(false);
  };


  const handleToggleLeadBlock = () => {
    if (!vendorId || !userId || !leadIdNum) return;

    const mutation = isLeadBlocked
      ? unblockLeadMutation
      : blockLeadMutation;

    mutation.mutate(
      {
        vendorId,
        leadId: leadIdNum,
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: isLeadBlocked
              ? "Lead unblocked successfully!"
              : "Lead blocked successfully!",
            type: "success",
          });

          setOpenBlockConfirm(false);

          queryClient.invalidateQueries({
            queryKey: ["leadBlockStatus", vendorId, leadIdNum],
          });

          queryClient.invalidateQueries({
            queryKey: ["leadById", leadIdNum],
          });
        },
      },
    );
  };

  const handleReadyToDispatchClick = async () => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Missing vendor or user information!",
        type: "error",
      });
      return;
    }

    setOpenReadyToDispatch(true);
  };

  if (isLoading && !lead) {
    return <p className="p-6">Loading production lead details...</p>;
  }

  if (isError || !lead) {
    console.error("[ProductionLeadDetails] Lead fetch failed or missing", {
      leadIdNum,
      vendorId,
      userId,
      isError,
      hasLead: !!lead,
    });
    return <p className="p-6">Failed to load lead details. Please try again.</p>;
  }

  console.info("[ProductionLeadDetails] Rendering with lead data", {
    leadIdNum,
    accountId: lead?.account_id,
    computedAccountId: Number(lead?.account_id),
    validInstanceId,
    instancesCount: instances.length,
    instanceIds: instances.map((i: any) => i?.id),
    leadStatus: lead?.status_id,
    userType,
  });

  const hasMasterErdBeenChangedOnce =
    (masterErdChangeLogData?.data?.length ?? 0) > 0;
  const displayedErdValue = validInstanceId
    ? currentInstance?.production_erd_date
    : lead?.expected_order_login_ready_date;
  const isMasterErdLocked =
    normalizedUserType === "factory" &&
    !!displayedErdValue &&
    (factoryErdLocked || hasMasterErdBeenChangedOnce);

  const disabledReason = shouldDisableBlockedActions
    ? blockedTooltip
    : isMasterErdLocked
      ? "Master ERD can only be changed once after setting. Please contact Super Admin for further changes."
    : !canUpdateExpectedDate
      ? "You do not have permission to update this date."
      : completeness?.any_exists
        ? "Cannot change the date because lead is currently in post-production."
        : !postProductionStatus?.all_order_login_dates_added
          ? "Please ensure all Order Login expected completion dates are added before setting this."
          : undefined;
  return (
    <>
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-2 px-4 py-2 border-b md:h-16 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <div className="flex flex-wrap items-center gap-2">
                    {displayLeadCode ? (
                      <>
                        {/* Dot + Lead Code */}
                        <span className="inline-flex items-center gap-1.5 font-semibold text-sm text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {displayLeadCode}
                        </span>

                        {clientName && (
                          <>
                            {/* Separator */}
                            <span className="text-muted-foreground">|</span>

                            {/* Client Name */}
                            <span className="inline-flex items-center gap-1.5 font-medium text-sm text-foreground">
                              <User2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {clientName}
                            </span>
                          </>
                        )}

                        {instanceName && (
                          <>
                            {/* Separator */}
                            <span className="text-muted-foreground">-</span>

                            {/* Instance Name */}
                            <span className="inline-flex items-center gap-1.5 font-medium text-xs text-muted-foreground">
                              <Layers3 className="w-3 h-3" />
                              {instanceName}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Loading…
                      </span>
                    )}
                  </div>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex w-full items-center justify-end gap-2 md:w-auto">
          {canViewMarkCompletedButton &&
            canMoveReadyToDispatchStage &&
            (shouldDisableBlockedActions ? (
              <CustomeTooltip
                value={blockedTooltip}
                truncateValue={
                  allInstancesCompleted ? (
                    <Button
                      size="sm"
                      className="hidden md:flex"
                      variant="default"
                      disabled
                    >
                      Ready To Dispatch
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="hidden md:flex"
                      disabled
                    >
                      Mark Completed
                    </Button>
                  )
                }
              />
            ) : allInstancesCompleted ? (
              <Button
                size="sm"
                className="hidden md:flex"
                variant="default"
                disabled={moveLeadToDispatchPlanningMutation.isPending}
                onClick={handleReadyToDispatchClick}
              >
                Ready To Dispatch
              </Button>
            ) : (
              <CustomeTooltip
                truncateValue={
                  currentInstance?.is_production_completed ? (
                    <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="hidden md:flex"
                      disabled={!canMarkProductionCompleted}
                      onClick={async () => {
                        if (!canMarkProductionCompleted) {
                          return;
                        }

                        if (!vendorId || !leadIdNum || !userId) {
                          toastManager.add({
                            title: "Missing vendor or user info!",
                            type: "error",
                          });
                          return;
                        }

                        try {
                          await markProductionCompletedMutation.mutateAsync({
                            updatedBy: userId,
                          });

                          toastManager.add({
                            title: "Production marked completed!",
                            type: "success",
                          });
                        } catch (err: any) {
                          toastManager.add({
                            title:
                              err?.response?.data?.message ||
                              err?.message ||
                              "Failed to mark production completed",
                            type: "error",
                          });
                        }
                      }}
                    >
                      Mark Completed
                    </Button>
                  )
                }
                value={productionCompletedTooltip}
              />
            ))}

          {!isAuditor && (
            <Button
              size="sm"
              className="hidden lg:flex"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          )}

          {!isAuditor && <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />}
          {!isAuditor && <NotificationBell />}
          <AnimatedThemeToggler />

          {!isAuditor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative bg-accent p-1.5 rounded-sm"
                >
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem className="lg:hidden">
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>

              {canViewMarkCompletedButton &&
                canMoveReadyToDispatchStage &&
                (shouldDisableBlockedActions ? (
                  // Lead block handling added for DropdownMenu action
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem className="md:hidden" disabled>
                        <Truck size={20} />
                        {allInstancesCompleted
                          ? "Ready To Dispatch"
                          : "Mark Completed"}
                      </DropdownMenuItem>
                    }
                  />
                ) : allInstancesCompleted ? (
                  <DropdownMenuItem
                    className="md:hidden"
                    onClick={handleReadyToDispatchClick}
                  >
                    <Truck size={20} />
                    Ready To Dispatch
                  </DropdownMenuItem>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      currentInstance?.is_production_completed ? (
                        <DropdownMenuItem className="md:hidden" disabled>
                          <CheckCircle2
                            size={18}
                            className="text-emerald-600"
                          />
                          Completed
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="md:hidden"
                          disabled={!canMarkProductionCompleted}
                          onClick={async () => {
                            if (!canMarkProductionCompleted) {
                              return;
                            }
                            if (!vendorId || !leadIdNum || !userId) {
                              toastManager.add({
                                title: "Missing vendor or user info!",
                                type: "error",
                              });
                              return;
                            }
                            try {
                              await markProductionCompletedMutation.mutateAsync(
                                {
                                  updatedBy: userId,
                                },
                              );
                              toastManager.add({
                                title: "Production marked completed!",
                                type: "success",
                              });
                            } catch (err: any) {
                              toastManager.add({
                                title:
                                  err?.response?.data?.message ||
                                  err?.message ||
                                  "Failed to mark production completed",
                                type: "error",
                              });
                            }
                          }}
                        >
                          <Truck size={20} />
                          Mark Completed
                        </DropdownMenuItem>
                      )
                    }
                    value={productionCompletedTooltip}
                  />
                ))}

              {/* --- NEW: Lead Status submenu (Mark On Hold / Mark As Lost) */}
              {/* Lead block handling added for DropdownMenu action */}
              {shouldDisableBlockedActions ? (
                <CustomeTooltip
                  value={blockedTooltip}
                  truncateValue={
                    <DropdownMenuItem disabled>
                      <Clock className=" h-4 w-4" />
                      Mark On Hold
                    </DropdownMenuItem>
                  }
                />
              ) : (
                <DropdownMenuItem
                  onSelect={() => {
                    setActivityType("onHold");
                    setActivityModalOpen(true);
                  }}
                >
                  <Clock className=" h-4 w-4" />
                  Mark On Hold
                </DropdownMenuItem>
              )}

              {canEdit && (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <SquarePen size={20} />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                    <SquarePen size={20} />
                    Edit
                  </DropdownMenuItem>
                )
              )}

              {canReassign && (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Users size={20} />
                        Reassign Lead
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                    <Users size={20} />
                    Reassign Lead
                  </DropdownMenuItem>
                )
              )}

              {userType?.toLowerCase() === "super-admin" && (
                <DropdownMenuItem
                  onSelect={() => setOpenBlockConfirm(true)}
                  disabled={isBlockActionPending}
                >
                  {isLeadBlocked ? (
                    <LockOpen className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}

                  {isLeadBlocked
                    ? "Unblock Lead"
                    : "Block Lead"}
                </DropdownMenuItem>
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  {/* Lead block handling added for DropdownMenu action */}
                  {shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <XCircle size={20} className="text-red-500" />
                          Delete
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem onClick={() => setOpenDelete(true)}>
                      <XCircle size={20} className="text-red-500" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val)}
        className="w-full p-3 md:p-6"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-3">
          <ScrollArea className="w-full lg:flex-1 lg:min-w-0">
            <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
              <TabsTrigger value="details">
                <Factory size={16} className="mr-1 opacity-60" />
                Production Details
              </TabsTrigger>
              {!isAuditor && (
                canShowTodoTab ? (
                  <TabsTrigger value="todo">
                    <PencilLine size={16} className="mr-1 opacity-60" />
                    To-Do Task
                  </TabsTrigger>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <TabsTrigger value="todo" disabled>
                        <PencilLine size={16} className="mr-1 opacity-60" />
                        To-Do Task
                      </TabsTrigger>
                    }
                    value={
                      userType === "custom"
                        ? "You don’t have permission to access To-Do Tasks."
                        : "Only factory user can access this tab"
                    }
                  />
                )
              )}
              {canViewSiteHistory && (
                <TabsTrigger value="history">
                  <History size={16} className="mr-1 opacity-60" />
                  History
                </TabsTrigger>
              )}
              {canViewPayment && (
                <TabsTrigger value="payment">
                  <IndianRupee size={16} className="mr-1 opacity-60" />
                  Payment
                </TabsTrigger>
              )}
              {canViewChats && (
                <TabsTrigger value="chats">
                  <MessageSquare size={16} className="mr-1 opacity-60" />
                  Chats
                </TabsTrigger>
              )}
              {canViewDocuments && (
                <TabsTrigger value="documents">
                  <FolderOpen size={16} className="mr-1 opacity-60" />
                  Documents
                </TabsTrigger>
              )}{" "}
            </TabsList>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          {(() => {
            const savedDateValue = validInstanceId
              ? currentInstance?.production_erd_date
              : lead?.expected_order_login_ready_date;

            const expectedDateValue =
              savedDateValue ||
              (postProductionStatus?.all_order_login_dates_added &&
                latestOrderLoginDate
                ? (() => {
                  const baseDate = new Date(latestOrderLoginDate);
                  baseDate.setDate(baseDate.getDate() + 3); // ⏱ Add 3-day buffer
                  return baseDate.toISOString().split("T")[0];
                })()
                : undefined);

            if (isAuditor && !savedDateValue) return null;

            return (
              <div className="w-60 flex flex-col shrink-0">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1 ml-1">
                  <CalendarCheck2 size={12} />
                  Expected Ready Date of Order
                </label>
                <CustomeDatePicker
                  value={expectedDateValue}
                  onChange={handleExpectedDateChange}
                  restriction="futureOnly"
                  minDate={
                    latestOrderLoginDate
                      ? latestOrderLoginDate.split("T")[0] // ✅ user can only pick dates >= latest order login date
                      : undefined
                  }
                  disabledReason={isAuditor ? "Auditor cannot edit this field." : disabledReason}
                />
              </div>
            );
          })()}
        </div>

        {/* 🔹 Details Tab */}
        <TabsContent value="details">
          <LeadDetailsGrouped
            status="production"
            defaultTab={canViewProductionTabByDefault ? "production" : "techcheck"}
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="production"
            productionInstanceId={validInstanceId}
          />
        </TabsContent>

        {/* 🔹 To-Do Tab — use SAME component as Details */}
        <TabsContent value="todo">
          <LeadDetailsGrouped
            status="production"
            defaultTab={canViewProductionTabByDefault ? "production" : "techcheck"}
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="production"
            productionInstanceId={validInstanceId}
          />
        </TabsContent>

        {/* 🔹 Site History */}
        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

        {/* 🔹 Payment */}
        {canViewPayment && (
          <TabsContent value="payment">
            <PaymentInformation accountId={accountId} />
          </TabsContent>
        )}

        {canViewChats && (
          <TabsContent value="chats">
            <LeadWiseChatScreen leadId={leadIdNum} />
          </TabsContent>
        )}

        {canViewDocuments && (
          <TabsContent value="documents">
            <ProjectDocumentsTimeline
              leadId={leadIdNum}
              vendorId={vendorId ?? 0}
              upToStage="production"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={{ id: leadIdNum, assignTo: lead?.assignedTo }}
      />

      <EditLeadModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        leadData={{ id: leadIdNum }}
      />

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        data={{ id: leadIdNum, name: "" }}
      />

      {/* Delete Dialog */}
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

      {/* ✅ Ready To Dispatch Confirmation */}
      <AlertDialog
        open={openReadyToDispatch}
        onOpenChange={setOpenReadyToDispatch}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSmallOrderLead
                ? "Move to Dispatch Planning?"
                : "Move to Ready To Dispatch?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSmallOrderLead
                ? "This will move the small-order lead from Production directly to the Dispatch Planning stage. Are you sure you want to continue?"
                : "This will move the lead from Production to the Ready-To-Dispatch stage. Are you sure you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                moveLeadMutation.isPending ||
                moveLeadToDispatchPlanningMutation.isPending
              }
              onClick={async () => {
                if (!vendorId || !userId || !leadIdNum) {
                  toastManager.add({
                    title: "Missing vendor or user information!",
                    type: "error",
                  });
                  return;
                }

                try {
                  if (isSmallOrderLead) {
                    await moveLeadToDispatchPlanningMutation.mutateAsync({
                      vendorId,
                      leadId: leadIdNum,
                      updated_by: userId,
                    });

                    toastManager.add({
                      title: "Lead moved to Dispatch Planning successfully!",
                      type: "success",
                    });
                  } else {
                    await moveLeadMutation.mutateAsync({
                      vendorId,
                      leadId: leadIdNum,
                      updated_by: userId,
                    });

                    toastManager.add({
                      title: "Lead moved to Ready-To-Dispatch successfully!",
                      type: "success",
                    });
                  }
                  setOpenReadyToDispatch(false);

                  queryClient.invalidateQueries({
                    queryKey: ["leadById", leadIdNum],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["leadStats", vendorId, userId],
                  });

                  queryClient.invalidateQueries({
                    queryKey: ["universal-stage-leads"],
                    exact: false,
                  });

                  setTimeout(() => {
                    router.push(
                      isSmallOrderLead
                        ? "/dashboard/installation/dispatch-planning"
                        : "/dashboard/production/ready-to-dispatch",
                    );
                  }, 400);
                } catch (err: any) {
                  toastManager.add({
                    title:
                      err?.response?.data?.message ||
                      err?.message ||
                      (isSmallOrderLead
                        ? "Failed to move lead to Dispatch Planning"
                        : "Failed to move lead to Ready-To-Dispatch"),
                    type: "error",
                  });
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        vendorId={vendorId}
        franchiseId={lead?.franchise_id ?? null}
        leadId={leadIdNum}
        onSubmitRemark={(remark, dueDate, selection) => {
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Vendor or User info is missing!",
              type: "error",
            });
            return;
          }
          updateStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId: Number(accountId),
                userId,
                status: activityType,
                remark,
                createdBy: userId,
                ...(dueDate ? { dueDate } : {}),
                ...(selection ?? {}),
              },
            },
            {
              onSuccess: (res: any) => {
                const finalStatus = res?.data?.activity_status ?? res?.data?.lead?.activity_status;
                toastManager.add({
                  title:
                    activityType === "onHold"
                      ? "Lead marked as On Hold!"
                      : finalStatus === "lostApproval"
                        ? "Lead sent for Lost Approval!"
                        : "Lead marked as Lost!",
                  type: "success",
                });
                window.location.assign("/dashboard/leads/leadstable?tab=onHold");
              },
              onError: (err: any) => {
                toastManager.add({
                  title: err?.message || "Failed to update lead status",
                  type: "error",
                });
              },
            },
          );
        }}
        loading={updateStatusMutation.isPending}
      />

      <BaseModal
        open={showMasterErdRemarkModal}
        onOpenChange={(open) => {
          setShowMasterErdRemarkModal(open);
          if (!open) {
            setPendingMasterErdDate(undefined);
            setMasterErdRemark("");
          }
        }}
        size="md"
        title="Change Master ERD"
        description="Please provide the reason for changing the master Expected Ready Date of Order."
      >
        <div className="space-y-4 px-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Reason *</label>
            <TextAreaInput
              value={masterErdRemark}
              onChange={(value) => setMasterErdRemark(value)}
              placeholder="Enter reason for changing master ERD..."
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowMasterErdRemarkModal(false);
                setPendingMasterErdDate(undefined);
                setMasterErdRemark("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!pendingMasterErdDate || !vendorId || !userId || !leadIdNum) return;
                if (!masterErdRemark.trim()) {
                  toastManager.add({
                    title: "Please enter a reason for changing the master ERD",
                    type: "error",
                  });
                  return;
                }

                try {
                  await updateExpectedDate({
                    vendorId,
                    leadId: leadIdNum,
                    expected_order_login_ready_date: pendingMasterErdDate,
                    updated_by: userId,
                    instance_id: validInstanceId,
                    change_remark: masterErdRemark.trim(),
                  });

                  toastManager.add({
                    title: "Expected Order Login Ready Date updated successfully!",
                    type: "success",
                  });
                  queryClient.invalidateQueries({ queryKey: ["lead", leadIdNum] });
                  queryClient.invalidateQueries({
                    queryKey: ["lead-product-structure-instances", leadIdNum, vendorId],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["postProductionReady", vendorId, leadIdNum],
                  });
                  queryClient.invalidateQueries({
                    queryKey: [
                      "latestOrderLogin",
                      vendorId,
                      leadIdNum,
                      validInstanceId ?? undefined,
                    ],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["master-erd-change-log", vendorId, leadIdNum],
                  });
                  if (normalizedUserType === "factory") {
                    setFactoryErdLocked(true);
                  }
                  setShowMasterErdRemarkModal(false);
                  setPendingMasterErdDate(undefined);
                  setMasterErdRemark("");
                } catch (err: any) {
                  toastManager.add({
                    title: err?.message || "Failed to update expected order login date",
                    type: "error",
                  });
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </BaseModal>



      <AlertDialog
        open={openBlockConfirm}
        onOpenChange={setOpenBlockConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLeadBlocked
                ? "Unblock Lead?"
                : "Block Lead?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {isLeadBlocked
                ? "This will unblock the lead and allow normal actions."
                : "This will block the lead and disable lead actions."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBlockActionPending}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleToggleLeadBlock}
              disabled={isBlockActionPending}
            >
              {isBlockActionPending
                ? "Processing..."
                : isLeadBlocked
                  ? "Unblock"
                  : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
