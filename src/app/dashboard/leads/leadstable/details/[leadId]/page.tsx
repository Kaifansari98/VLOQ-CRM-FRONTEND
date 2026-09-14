"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { useAppSelector } from "@/redux/store";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  SquarePen,
  Users,
  XCircle,
  Clock,
  EllipsisVertical,
  HouseIcon,
  CircleArrowOutUpRight,
  UserPlus,
  MessageSquare,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
  Lock,
  LockOpen,
  Zap,
  Store as StoreIcon,
} from "lucide-react";
import ChangeStoreModal from "@/components/sales-executive/Lead/change-store-modal";

import FastProductionDetailsModal from "@/components/sales-executive/Lead/fast-production-details-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { toastManager } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
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
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { useQueryClient } from "@tanstack/react-query";
import {
  useBlockLead,
  useLeadBlockStatus,
  useLeadById,
  useUnblockLead,
  useRevokeFastProductionRequest,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import CancelFastProductionModal from "@/components/generics/CancelFastProductionModal";
import {
  canAssignISM,
  canReassignLeadButton,
  canDeleteLedForSalesExecutiveButton,
  canEditLeadForSalesExecutiveButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import PaymentComingSoon from "@/components/generics/PaymentComingSoon";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import SiteVisitsTab from "@/components/tabScreens/SiteVisitsTab";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import AddVisitModal from "@/components/sales-executive/Lead/add-visit-modal";
import { formatBlockedAt } from "@/lib/utils";
import MoveToDesigningStageModal from "@/components/sales-executive/Lead/move-to-designing-stage-modal";
import { useFranchisesByVendorId } from "@/api/franchise";


export default function LeadDetails() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = Number(searchParams.get("accountId")) || 0;

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id,
  );
  const isClientVisitEnabled = useAppSelector(
    (s) => s.auth.user?.vendor?.is_client_visit_enabled === true,
  );
  const isOnlineLeadFeatureEnabled = useAppSelector(
    (s) => s.auth.user?.vendor?.is_online_lead_feature_enabled === true,
  );
  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(
    vendorId,
    !!vendorId,
  );
  const isB2b = useMemo(() => {
    const activeFranchise = franchisesForB2b.find(
      (franchise) => franchise.id === franchiseId,
    );
    return activeFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, franchiseId]);
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const vendorCustomUserTypeMode = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);
  const deleteLeadMutation = useDeleteLead();
  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const { data: leadBlockStatus, isLoading: isLeadBlockStatusLoading } = useLeadBlockStatus(leadIdNum, vendorId);
  const lead = data?.data?.lead;
  const isDraftLead = !!lead?.is_draft;
  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const LeadStage = lead?.statusType?.type;
  console.log("Lead Stage :- ", LeadStage);

  const uiDisabled = isLoading || !lead;
  const isLeadBlocked = leadBlockStatus?.is_blocked ?? !!lead?.is_blocked;

  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadIdNum,
    vendorId,
    handlesLargeScaleProjects,
  );
  const boqInstances = useMemo(
    () =>
      (structureInstancesData?.data || []).filter(
        (item: any) =>
          item?.isLargeScaleProjectInstance === true ||
          item?.product_item_code_id,
      ),
    [structureInstancesData?.data],
  );
  const boqRequiredTooltip =
    "Add at least one Bill of Quantity item to this lead before moving it to the Designing Stage.";
  const isBoqMissingForDesign =
    handlesLargeScaleProjects && boqInstances.length === 0;

  const hasB2bReqTypes = useMemo(() => {
    if (!isB2b || !lead) return true;
    const reqs = (lead as any)?.leadB2BReqMappings;
    return Array.isArray(reqs) && reqs.length > 0;
  }, [isB2b, lead]);

  const hasB2bProcessBriefs = useMemo(() => {
    if (!isB2b || !lead) return true;
    const briefs = (lead as any)?.leadProcessBriefs;
    return Array.isArray(briefs) && briefs.length > 0;
  }, [isB2b, lead]);

  const isB2bPrerequisiteMissingForDesign = useMemo(() => {
    return isB2b && (!hasB2bReqTypes || !hasB2bProcessBriefs);
  }, [isB2b, hasB2bReqTypes, hasB2bProcessBriefs]);

  const b2bPrerequisiteTooltip = useMemo(() => {
    if (!isB2bPrerequisiteMissingForDesign) return "";
    if (!hasB2bReqTypes && !hasB2bProcessBriefs) {
      return "Please select at least one Requirement Type and one Process Brief before moving to the Designing Stage.";
    }
    if (!hasB2bReqTypes) {
      return "Please select at least one Requirement Type before moving to the Designing Stage.";
    }
    if (!hasB2bProcessBriefs) {
      return "Please select at least one Process Brief before moving to the Designing Stage.";
    }
    return "";
  }, [isB2bPrerequisiteMissingForDesign, hasB2bReqTypes, hasB2bProcessBriefs]);

  const blockedAtTooltip = isLeadBlocked
    ? (leadBlockStatus?.lead_blocked_at || lead?.lead_blocked_at)
      ? `This lead has been blocked at ${formatBlockedAt(
          leadBlockStatus?.lead_blocked_at ?? lead?.lead_blocked_at
        )}`
      : "Lead is blocked"
    : "";

  const moveToDesignTooltip = isLeadBlocked
    ? blockedAtTooltip
    : isBoqMissingForDesign
      ? boqRequiredTooltip
      : isB2bPrerequisiteMissingForDesign
        ? b2bPrerequisiteTooltip
        : "";

  const isMoveToDesignDisabled =
    isLeadBlocked || uiDisabled || isBoqMissingForDesign || isB2bPrerequisiteMissingForDesign;

  const isBlockActionPending =
    blockLeadMutation.isPending || unblockLeadMutation.isPending;

  const updateActivityStatusMutation = useUpdateActivityStatus();

  // modals
  const [assignOpen, setAssignOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [changeStoreOpen, setChangeStoreOpen] = useState(false);
  const [moveToDesigningOpen, setMoveToDesigningOpen] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval" | "lost">(
    "onHold",
  );
  const [openCancelFastProduction, setOpenCancelFastProduction] = useState(false);
  const [fastProductionDetailsOpen, setFastProductionDetailsOpen] = useState(false);
  const revokeFastProductionMutation = useRevokeFastProductionRequest();

  const handleCancelFastProduction = (remark: string) => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Missing vendor, user, or lead info",
        type: "error",
      });
      return;
    }
    revokeFastProductionMutation.mutate(
      {
        leadId: leadIdNum,
        vendorId,
        userId,
        remark,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Fast production status cancelled successfully!",
            type: "success",
          });
          setOpenCancelFastProduction(false);
          queryClient.invalidateQueries({
            queryKey: ["lead", leadIdNum, vendorId, userId],
          });
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.response?.data?.message || err?.message || "Failed to cancel fast production",
            type: "error",
          });
        },
      }
    );
  };

  const normalizedUserType = userType?.trim().toLowerCase();
  const isAuditor = normalizedUserType === "auditor";
  const isSuperAdmin = normalizedUserType === "super-admin";
  const isCaller = normalizedUserType === "telecaller" || normalizedUserType === "telecaller-team-lead" || normalizedUserType === "telecaller team lead";
  const isCallerAndDraft = isCaller && isDraftLead;

  const shouldDirectlyMarkLost =
    normalizedUserType === "admin" ||
    normalizedUserType === "super-admin" ||
    normalizedUserType === "sales-executive";
  const canReassign =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.reassign_lead",
      )
      : canReassignLeadButton(userType));
  const canAccessAssignTask =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.assign_task.ism_assign_task",
      ) ||
      customPrivilegeCodes.includes(
        "leads.open_leads.assign_task.follow_up_task",
      )
      : canAssignISM(userType));
  const canDelete =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes("leads.open_leads.details_of_lead.delete")
      : canDeleteLedForSalesExecutiveButton(userType));
  const canMarkOnHold =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.mark_on_hold",
      )
      : true);
  const canMarkAsLost =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.mark_as_lost",
      )
      : true);
  const canEdit =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes("leads.open_leads.details_of_lead.edit")
      : canEditLeadForSalesExecutiveButton(userType));
  const canViewPayment =
    isAuditor ||
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.payment_information.enable_disable",
      )
      : canViewPaymentTab(userType));
  const canViewSiteHistory =
    isAuditor ||
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.site_history.enable_disable",
      )
      : canViewSiteHistoryTab(userType));
  const canViewChats =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.chat.enable_disable",
      )
      : true;
  const canMoveToDesigningStage =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.move_to_designing_stage",
        )
      : true;
  const canAddVisit =
    !isCaller &&
    (normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.add_visit",
        )
      : true);

  const handleToggleLeadBlock = () => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Vendor, user, or lead information is missing!",
        type: "error",
      });
      return;
    }

    const mutation = isLeadBlocked ? unblockLeadMutation : blockLeadMutation;
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
            queryKey: ["lead", leadIdNum, vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadBlockStatus", vendorId, leadIdNum],
          });
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpen", vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpen", vendorId, userId, null],
          });
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpenuniversal-stage-leads"],
          });
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update lead block status!",
            type: "error",
          });
        },
      },
    );
  };

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Vendor or User information is missing!",
        type: "error",
      });
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Lead deleted successfully!",
            type: "success",
          });
          setOpenDelete(false);

          // ✅ Invalidate both queries so they refetch
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpenuniversal-stage-leads"],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          // ✅ Redirect to table after invalidation
          router.push("/dashboard/leads/leadstable");
        },
        onError: (error: any) => {
          toastManager.add({
            title: error?.message || "Failed to delete lead!",
            type: "error",
          });
        },
      },
    );
  };

  const hasAutoOpenedAssign = useRef(false);
  const isChatNotification = useIsChatNotification();

  useEffect(() => {
    if (!lead) return;
    if (isLeadBlockStatusLoading) return;
    if (isChatNotification) return;
    if (hasAutoOpenedAssign.current) return;
    if (isOnlineLeadFeatureEnabled) return;

    if (
      !lead.is_draft &&
      !isLeadBlocked &&
      canAccessAssignTask &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      hasAutoOpenedAssign.current = true; // ✅ lock it
      setAssignOpen(true);
      setActiveTab("projects");
    }
  }, [
    isChatNotification,
    lead?.id,
    userType,
    canAccessAssignTask,
    isLeadBlocked,
    isLeadBlockStatusLoading,
    isOnlineLeadFeatureEnabled,
  ]);

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);

  return (
    <>
      {/* Header */}
      
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <p className="font-bold">
                    {leadCode || "Loading…"}
                    {leadCode && (clientName ? ` - ${clientName}` : "")}
                  </p>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center space-x-2">
          {canMoveToDesigningStage && (vendorCustomUserTypeMode === true || isB2b) && !isAuditor && (
            <CustomeTooltip
              value={moveToDesignTooltip}
              truncateValue={
                <span>
                  <Button
                    size="sm"
                    className="hidden sm:flex"
                    onClick={() => setMoveToDesigningOpen(true)}
                    disabled={isMoveToDesignDisabled}
                  >
                    Move to Designing Stage
                  </Button>
                </span>
              }
            />
          )}

          {canAddVisit && isClientVisitEnabled && !isAuditor && (
            <CustomeTooltip
              value={blockedAtTooltip}
              truncateValue={
                <span>
                  <Button
                    size="sm"
                    className="hidden sm:flex"
                    onClick={() => setVisitOpen(true)}
                    disabled={isLeadBlocked || uiDisabled}
                  >
                    Add Visit
                  </Button>
                </span>
              }
            />
          )}


          {canAccessAssignTask &&
            (isDraftLead ? (
              <CustomeTooltip
                truncateValue={
                  <Button size="sm" className="hidden sm:flex" disabled>
                    Assign Task
                  </Button>
                }
                value="This action cannot be performed because the lead is still in Draft mode."
              />
            ) : (
              <Button
                size="sm"
                className="hidden sm:flex"
                onClick={() => setAssignOpen(true)}
                disabled={uiDisabled}
              >
                Assign Task
              </Button>
            ))}

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          {!isAuditor && <NotificationBell />}
          <AnimatedThemeToggler />

          {/* Dropdown */}
          {!isAuditor && !isCaller && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative bg-accent p-1.5 rounded-sm"
              >
                <EllipsisVertical size={22} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canMoveToDesigningStage && (isB2b) && (
                    <CustomeTooltip
                      value={moveToDesignTooltip}
                      truncateValue={
                        <DropdownMenuItem
                          className="sm:hidden"
                          onClick={() => setMoveToDesigningOpen(true)}
                          disabled={isMoveToDesignDisabled}
                        >
                          <UserPlus size={20} />
                          Move to Designing Stage
                        </DropdownMenuItem>
                      }
                    />
                  )}
              {canAddVisit && isClientVisitEnabled && (
                <>
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => setVisitOpen(true)}
                  disabled={uiDisabled}
                >
                  <FolderOpen size={20} />
                  Add Visit
                </DropdownMenuItem>
                </>
              )}

              {canAccessAssignTask && (
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assign Task
                </DropdownMenuItem>
              )}

              {canEdit &&
                (isLeadBlocked ? (
                  <CustomeTooltip
                    value={blockedAtTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <SquarePen className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                    <SquarePen className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                ))}

              {canReassign &&
                (isLeadBlocked ? (
                  <CustomeTooltip
                    value={blockedAtTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Users className="h-4 w-4" />
                        Reassign Lead
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                    <Users className="h-4 w-4" />
                    Reassign Lead
                  </DropdownMenuItem>
                ))}

              {isSuperAdmin && (
                <CustomeTooltip
                  value={blockedAtTooltip}
                  side="left"
                  contentClassName="max-w-64"
                  truncateValue={
                    <DropdownMenuItem
                      onSelect={() => setOpenBlockConfirm(true)}
                      disabled={uiDisabled || isBlockActionPending}
                    >
                      {isLeadBlocked ? (
                        <LockOpen className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {isLeadBlocked ? "Unblock Lead" : "Block Lead"}
                    </DropdownMenuItem>
                  }
                />
              )}

              {isSuperAdmin && lead?.is_fast_production === true && (
                <DropdownMenuItem
                  onSelect={() => setOpenCancelFastProduction(true)}
                  disabled={uiDisabled || isLeadBlocked}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Fast Production
                </DropdownMenuItem>
              )}

              {(lead?.is_fast_production === true || lead?.has_pending_fast_production_request === true) && (
                <DropdownMenuItem
                  onSelect={() => setFastProductionDetailsOpen(true)}
                >
                  <Zap className="h-4 w-4 mr-2 text-orange-500 fill-orange-500" />
                  Fast Production Details
                </DropdownMenuItem>
              )}

              {isLeadBlocked ? (
                <CustomeTooltip
                  value={blockedAtTooltip}
                  truncateValue={
                    <DropdownMenuItem disabled>
                      <CircleArrowOutUpRight className="h-4 w-4" />
                      Lead Status
                    </DropdownMenuItem>
                  }
                />
              ) : (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <CircleArrowOutUpRight className="h-4 w-4" />
                    <span>Lead Status</span>
                  </DropdownMenuSubTrigger>

                  {!uiDisabled && (
                    <DropdownMenuSubContent>
                      {canMarkOnHold && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setActivityType("onHold");
                            setActivityModalOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Mark On Hold
                        </DropdownMenuItem>
                      )}

                      {canMarkAsLost && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setActivityType("lost");
                            setActivityModalOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Mark As Lost
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  )}
                </DropdownMenuSub>
              )}

              {isOnlineLeadFeatureEnabled && isSuperAdmin && (
                <DropdownMenuItem
                  onSelect={() => setChangeStoreOpen(true)}
                  disabled={uiDisabled || isLeadBlocked}
                >
                  <StoreIcon className="h-4 w-4 mr-2" />
                  Store Transfer
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  {canDelete &&
                    (isLeadBlocked ? (
                      <CustomeTooltip
                        value={blockedAtTooltip}
                        truncateValue={
                          <DropdownMenuItem disabled>
                            Delete
                          </DropdownMenuItem>
                        }
                      />
                    ) : (
                      <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
                        Delete
                      </DropdownMenuItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </header>

      {/* 🔹 Tabs bar above content */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "projects") {
            if (isDraftLead || uiDisabled) return; // ✅ block in draft/loading
            setAssignOpen(true);
            return;
          }
          setActiveTab(val);
        }}
        className="w-full px-6 pt-4"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>

            {canAccessAssignTask &&
              (isDraftLead ? (
                <CustomeTooltip
                  truncateValue={
                    <TabsTrigger value="projects" disabled>
                      <PencilLine size={16} className="mr-1 opacity-60" />
                      To-Do Task
                    </TabsTrigger>
                  }
                  value="This action cannot be performed because the lead is still in Draft mode."
                />
              ) : (
                <TabsTrigger value="projects" disabled={uiDisabled}>
                  <PencilLine size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ))}

            {canViewSiteHistory && (
              <TabsTrigger value="history" disabled={uiDisabled}>
                <History size={16} className="mr-1 opacity-60" />
                History
              </TabsTrigger>
            )}
            {canViewPayment && (
              <TabsTrigger value="team" disabled={uiDisabled}>
                <IndianRupee size={16} className="mr-1 opacity-60" />
                Payment
              </TabsTrigger>
            )}
            {canViewChats && (
              <TabsTrigger value="chats" disabled={uiDisabled}>
                <MessageSquare size={16} className="mr-1 opacity-60" />
                Chats
              </TabsTrigger>
            )}

            {isClientVisitEnabled && (
              <TabsTrigger value="site-visits" disabled={uiDisabled}>
                <FolderOpen size={16} className="mr-1 opacity-60" />
                Site Visits
              </TabsTrigger>
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* 🔹 Tab Contents */}
        <TabsContent value="details">
          <main className="flex-1 h-fit">
            <LeadDetailsUtil status="details" leadId={leadIdNum} />
          </main>
        </TabsContent>

        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

        {canViewPayment && (
          <TabsContent value="team">
            <PaymentComingSoon />
          </TabsContent>
        )}

        {canViewChats && (
          <TabsContent value="chats">
            <LeadWiseChatScreen leadId={leadIdNum} />
          </TabsContent>
        )}

        {isClientVisitEnabled && (
          <TabsContent value="site-visits">
            <SiteVisitsTab leadId={leadIdNum} />
          </TabsContent>
        )}
      </Tabs>

      {/* ✅ Modals */}
      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) {
            // when modal closes, go back to details tab
            setActiveTab("details");
          }
        }}
        data={{ id: leadIdNum, name: "" }}
      />
      {isClientVisitEnabled && (
        <AddVisitModal
          open={visitOpen}
          onOpenChange={setVisitOpen}
          leadId={leadIdNum}
          vendorId={vendorId ?? 0}
          userId={userId ?? 0}
        />
      )}
      <MoveToDesigningStageModal
        open={moveToDesigningOpen}
        onOpenChange={setMoveToDesigningOpen}
        data={{
          id: leadIdNum,
          accountId: accountId || lead?.account_id || 0,
          franchiseId: lead?.franchise_id ?? null,
        }}
      />
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
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        vendorId={vendorId}
        franchiseId={lead?.franchise_id ?? franchiseId}
        leadId={leadIdNum}
        onSubmitRemark={(remark, dueDate, selection) => {
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Missing vendor/user info",
              type: "error",
            });
            return;
          }
          const status =
            activityType === "onHold"
              ? "onHold"
              : "lost";
          updateActivityStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId,
                userId,
                status,
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
                    status === "onHold"
                      ? "Lead marked as On Hold!"
                      : finalStatus === "lostApproval"
                        ? "Lead sent for Lost Approval!"
                        : "Lead marked as Lost!",
                  type: "success",
                });
                if (status === "onHold") {
                  window.location.assign("/dashboard/leads/leadstable?tab=onHold");
                  return;
                }
                setActivityModalOpen(false);
              },
            },
          );
        }}
        loading={updateActivityStatusMutation.isPending}
      />

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

      <AlertDialog open={openBlockConfirm} onOpenChange={setOpenBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLeadBlocked ? "Unblock Lead?" : "Block Lead?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isLeadBlocked
                ? "This will unblock the lead and allow it to proceed normally."
                : "This will block the lead and mark the block time in the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlockActionPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleLeadBlock}
              disabled={isBlockActionPending}
            >
              {isBlockActionPending
                ? isLeadBlocked
                  ? "Unblocking..."
                  : "Blocking..."
                : isLeadBlocked
                  ? "Unblock"
                  : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CancelFastProductionModal
        open={openCancelFastProduction}
        onOpenChange={setOpenCancelFastProduction}
        onSubmit={handleCancelFastProduction}
        loading={revokeFastProductionMutation.isPending}
      />

      <FastProductionDetailsModal
        open={fastProductionDetailsOpen}
        onOpenChange={setFastProductionDetailsOpen}
        leadId={leadIdNum}
      />

      <ChangeStoreModal
        open={changeStoreOpen}
        onOpenChange={setChangeStoreOpen}
        leadId={leadIdNum}
        currentStoreId={lead?.franchise_id}
      />
    </>
  );
}
