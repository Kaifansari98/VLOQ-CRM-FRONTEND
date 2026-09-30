"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import {
  useBlockLead,
  useLeadById,
  useSmallOrderRequestsByLead,
  useUnblockLead,
} from "@/hooks/useLeadsQueries";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

import {
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
  CheckCircle2,
  // Final Handover Icon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  Clock,
  MessageSquare,
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
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import CustomeTooltip from "@/components/custom-tooltip";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import {
  canAccessTodoTaskTabUnderFinalHandoverStage,
  canDeleteLeadButton,
  canEditLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import {
  useFinalHandoverReadiness,
  useMoveProjectCompleted,
} from "@/api/installation/useFinalHandoverStageLeads";
import { useMiscellaneousResolutionStatus } from "@/api/installation/useUnderInstallationStageLeads";
import { toastError } from "@/lib/utils";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import { useChatTabFromUrl } from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import SmallOrderRequestModal from "@/components/installation/small-order/SmallOrderRequestModal";

export default function FinalHandoverLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const searchParams = useSearchParams();
  const leadIdNum = Number(leadId);
  const instanceIdParam = searchParams.get("instance_id");
  const validInstanceId = instanceIdParam && !Number.isNaN(Number(instanceIdParam)) ? Number(instanceIdParam) : null;
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType;
  const isAuditor = userType?.trim().toLowerCase() === "auditor";

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openSmallOrderModal, setOpenSmallOrderModal] = useState(false);

  const [activeTab, setActiveTab] = useState(
    userType === "site-supervisor" ? "todo" : "details"
  );
  useChatTabFromUrl(setActiveTab);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");



  const updateStatusMutation = useUpdateActivityStatus();

  const canReassign = canReassignLeadButton(effectiveUserType ?? "");
  const canDelete = canDeleteLeadButton(effectiveUserType ?? "");
  const canEdit = canEditLeadButton(effectiveUserType ?? "");
  const canViewPayment =
    isAuditor || (
      effectiveUserType?.toLowerCase() === "custom"
        ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
        : canViewPaymentTab(effectiveUserType ?? "")
    );
  const canViewSiteHistory =
    isAuditor || (
      effectiveUserType?.toLowerCase() === "custom"
        ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.site_history.enable_disable",
        )
        : canViewSiteHistoryTab(effectiveUserType ?? "")
    );
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
  const canAccessTodoTab =
    !isAuditor && (
      effectiveUserType?.toLowerCase() === "custom"
        ? customPrivilegeCodes.some((code) =>
          code.startsWith("installation.final_handover."),
        )
        : canAccessTodoTaskTabUnderFinalHandoverStage(effectiveUserType ?? "")
    );
  const normalizedUserType = userType?.toLowerCase() ?? "";
  const normalizedEffectiveUserType = effectiveUserType?.toLowerCase() ?? "";
  const canCreateSmallOrder = [
    "sales-executive",
    "admin",
    "super-admin",
  ].includes(normalizedEffectiveUserType);
  const isSiteSupervisor = normalizedUserType === "site-supervisor";




  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const isBlockActionPending =
    blockLeadMutation.isPending ||
    unblockLeadMutation.isPending;
  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const { data: smallOrderRequestsResponse } = useSmallOrderRequestsByLead(
    vendorId,
    leadIdNum,
  );
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = lead?.account_id;
  const leadStatusTag = lead?.statusType?.tag;
  const isSmallOrderLead = !!lead?.productMappings?.some(
    (mapping: any) => mapping.productType?.tag === "Type 7",
  );
  const resolvedApprovedSmallOrderCount = (smallOrderRequestsResponse?.data ?? [])
    .filter((request) => request.status === "approved")
    .length;
  const hasReachedSmallOrderLimit = resolvedApprovedSmallOrderCount >= 2;
  const usableHandoverCompletedAt = lead?.usable_handover_completed_at
    ? new Date(lead.usable_handover_completed_at)
    : null;
  const isSmallOrderCreationExpired =
    usableHandoverCompletedAt != null &&
    !Number.isNaN(usableHandoverCompletedAt.getTime()) &&
    (() => {
      const expiryDate = new Date(usableHandoverCompletedAt);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      return new Date() > expiryDate;
    })();
  const smallOrderCreationTooltip = hasReachedSmallOrderLimit
    ? "Maximum Partial Order limit reached for this project."
    : isSmallOrderCreationExpired
      ? "Partial Order creation period has expired."
      : "";
  const allowServicingTabFromDeliveredProjects = !isSmallOrderLead;
  const hasAnyUploadPrivilege =
    normalizedUserType === "custom" &&
    [
      "installation.final_handover.warranty_card_photos.upload",
      "installation.final_handover.final_site_photos.upload",
      "installation.final_handover.handover_booklet.upload",
      "installation.final_handover.final_handover_form.upload",
      "installation.final_handover.qc_documents.upload",
      "installation.final_handover.amc_documents.upload",
    ].some((code) => customPrivilegeCodes.includes(code));

  const canShowMarkCompleted =
    (["super-admin", "site-supervisor"].includes(normalizedEffectiveUserType) ||
      hasAnyUploadPrivilege) &&
    leadStatusTag !== "Type 17";


  const {
    isLeadBlocked,
    shouldDisableBlockedActions,
    blockedTooltip,
  } = useLeadAccessControl({
    leadId: leadIdNum,
    userType,
    lead,
  });

  const blockedReason = shouldDisableBlockedActions
    ? blockedTooltip
    : "";
  const shouldDisableSmallOrderCreation =
    shouldDisableBlockedActions ||
    hasReachedSmallOrderLimit ||
    isSmallOrderCreationExpired;

  const { data: readiness, isLoading: readinessLoading } =
    useFinalHandoverReadiness(vendorId!, leadIdNum);
  const { mutate: moveProjectCompleted, isPending: movingProject } =
    useMoveProjectCompleted();

  const { data: miscStatus, isLoading: isLoadingMisc } = useMiscellaneousResolutionStatus(vendorId, leadIdNum);
  const isMiscPending = miscStatus?.all_resolved === false;

  const [openProjectCompleteConfirm, setOpenProjectCompleteConfirm] =
    useState(false);

  const isReady = readiness?.can_move_to_final_handover;
  const canMarkCompleted = isReady && !isMiscPending;

  const tooltipMessage = (() => {
    if (readinessLoading) return "Checking project readiness...";
    if (!readiness) return "Unable to verify readiness.";

    if (!readiness.docs_complete)
      return readiness.requires_amc_documents
        ? "Upload all Final Handover documents including AMC Contract Documents before completing the project."
        : "Upload all Final Handover documents before completing the project.";

    if (!readiness.pending_tasks_clear)
      return "Resolve all pending work tasks before marking project as completed.";

    return "";
  })();

  const completionBlockMessage = (() => {
    if (readinessLoading || isLoadingMisc)
      return "Checking readiness and miscellaneous status...";
    if (isMiscPending) return "Miscellaneous items are pending, cannot complete project.";
    if (!isReady) return tooltipMessage;
    return "";
  })();

  const deleteLeadMutation = useDeleteLead();

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toastManager.add({ title: "Missing vendor or user info!", type: "error" });
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => toastManager.add({ title: "Lead deleted successfully!", type: "success" }),
        onError: (err: unknown) => toastError(err),
      }
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
            queryKey: [
              "leadBlockStatus",
              vendorId,
              leadIdNum,
            ],
          });

          queryClient.invalidateQueries({
            queryKey: ["leadById", leadIdNum],
          });
        },
      }
    );
  };

  if (isLoading && !lead) {
    return <p className="p-6">Loading lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  return (
    <>
      {/* 🔹 Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
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

        {/* 🔹 Header Actions */}
        <div className="flex items-center space-x-3">
          {!isAuditor && (
            <Button
              size="sm"
              className="hidden md:flex"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          )}

          {!isAuditor && canShowMarkCompleted &&
            (canMarkCompleted && !shouldDisableBlockedActions ? (
              <Button
                className="hidden md:flex items-center gap-2"
                onClick={() => setOpenProjectCompleteConfirm(true)}
              >
                <CheckCircle2 size={18} />
                Mark Project as Completed
              </Button>
            ) : (
              <CustomeTooltip
                value={
                  shouldDisableBlockedActions
                    ? blockedTooltip
                    : completionBlockMessage
                }
                truncateValue={
                  <div>
                    <Button
                      disabled
                      className="bg-gray-200 text-gray-500 border border-gray-300 cursor-not-allowed hidden md:flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Mark Project as Completed
                    </Button>
                  </div>
                }
              />
            ))}

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
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
                <DropdownMenuItem
                  className="md:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <Users size={18} />
                  Assign Task
                </DropdownMenuItem>
                {canShowMarkCompleted &&
                  (shouldDisableBlockedActions ? (
                    // Lead block handling added for DropdownMenu action
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled className="md:hidden">
                          <CheckCircle2 size={18} />
                          Mark Project as Completed
                        </DropdownMenuItem>
                      }
                    />
                  ) : canMarkCompleted ? (
                    <DropdownMenuItem
                      className="md:hidden"
                      onClick={() => setOpenProjectCompleteConfirm(true)}
                    >
                      <CheckCircle2 size={18} />
                      Mark Project as Completed
                    </DropdownMenuItem>
                  ) : (
                    <CustomeTooltip
                      value={completionBlockMessage}
                      truncateValue={
                        <DropdownMenuItem disabled className="md:hidden">
                          <CheckCircle2 size={18} />
                          Mark Project as Completed
                        </DropdownMenuItem>
                      }
                    />
                  ))}
                {/* Lead block handling added for DropdownMenu action */}
                {shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Clock className="mh-4 w-4" />
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
                    <Clock className="mh-4 w-4" />
                    Mark On Hold
                  </DropdownMenuItem>
                )}
                {canCreateSmallOrder &&
                  (shouldDisableSmallOrderCreation ? (
                    <CustomeTooltip
                      value={
                        shouldDisableBlockedActions
                          ? blockedTooltip
                          : smallOrderCreationTooltip
                      }
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <BoxIcon size={20} />
                           Create Partial Order
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem
                      onSelect={() => {
                        setOpenSmallOrderModal(true);
                      }}
                    >
                      <BoxIcon size={20} />
                      Create Partial Order
                    </DropdownMenuItem>
                  ))}

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


                {userType === "super-admin" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setOpenBlockConfirm(true)}
                    >
                      {isLeadBlocked ? (
                        <>
                          <LockOpen size={18} />
                          Unblock Lead
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Block Lead
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
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

      {/* 🔹 Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val)}
        className="w-full px-6 pt-4"
      >
        <div className="w-full flex justify-between overflow-hidden mb-4">
          <div className="w-full max-w-full overflow-hidden">
            <ScrollArea className="w-full max-w-full">
              <div className="w-max flex items-center pb-3">
                <TabsList className="h-auto gap-2 px-1.5 py-1.5 flex-nowrap w-max">
                  {/* Final Handover Details */}
                  <TabsTrigger value="details">
                    <CheckCircle2 size={16} className="mr-1 opacity-60" />
                    Final Handover Details
                  </TabsTrigger>

                  {/* To-Do Tab (still disabled) */}

                  {!isAuditor && (
                    canAccessTodoTab ? (
                      <TabsTrigger value="todo">
                        <PencilLine
                          size={16}
                          className="mr-1 opacity-60"
                        />
                        To-Do Task
                      </TabsTrigger>
                    ) : (
                      <CustomeTooltip
                        truncateValue={
                          <div className="flex items-center opacity-50 cursor-not-allowed px-2 py-1.5 text-sm">
                            <PencilLine
                              size={16}
                              className="mr-1 opacity-60"
                            />
                            To-Do Task
                          </div>
                        }
                        value={
                          effectiveUserType?.toLowerCase() === "custom"
                            ? "You don’t have permission to access To-Do Tasks."
                            : "Only Site Supervisor can access this tab"
                        }
                      />
                    )
                  )}

                  {/* Site History */}
                  {canViewSiteHistory && (
                    <TabsTrigger value="history">
                      <History size={16} className="mr-1 opacity-60" />
                      History
                    </TabsTrigger>
                  )}

                  {/* Payment */}
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
                  )}
                </TabsList>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* TAB CONTENTS */}

        <TabsContent value="details">
          <main className="flex-1 h-fit">
            {!isLoading && accountId && (
              <LeadDetailsGrouped
                status="finalHandover"
                defaultTab="finalHandover"
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="installation"
                finalHandoverInstanceId={validInstanceId}
                allowServicingTabFromDeliveredProjects={
                  allowServicingTabFromDeliveredProjects
                }
              />
            )}
          </main>
        </TabsContent>

        {canAccessTodoTab && (
          <TabsContent value="todo">
            <main className="flex-1 h-fit">
              {!isLoading && accountId && (
                <LeadDetailsGrouped
                  status="finalHandover"
                  defaultTab="finalHandover"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultParentTab="installation"
                  finalHandoverInstanceId={validInstanceId}
                  allowServicingTabFromDeliveredProjects={
                    allowServicingTabFromDeliveredProjects
                  }
                />
              )}
            </main>
          </TabsContent>
        )}

        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

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
              upToStage="finalHandover"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* 🔹 Modals */}
      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={{ id: leadIdNum, assignTo: lead?.assignedTo }}
      />

      <SmallOrderRequestModal
        open={openSmallOrderModal}
        onOpenChange={setOpenSmallOrderModal}
        source="final_handover"
        leadId={leadIdNum}
      />

      <EditLeadModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        leadData={{ id: leadIdNum }}
      />

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp={true}
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

      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        vendorId={vendorId}
        franchiseId={lead?.franchise_id ?? null}
        leadId={leadIdNum}
        onSubmitRemark={(remark, dueDate, selection) => {
          if (!vendorId || !userId) {
            toastManager.add({ title: "Vendor or User info is missing!", type: "error" });
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
                toastManager.add({ title: err?.message || "Failed to update lead status", type: "error" });
              },
            }
          );
        }}
        loading={updateStatusMutation.isPending}
      />

      <AlertDialog
        open={openProjectCompleteConfirm}
        onOpenChange={setOpenProjectCompleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Project as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will move this project to “Completed” stage
              permanently. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={movingProject}
              onClick={() => {
                moveProjectCompleted(
                  {
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    updated_by: userId!,
                  },
                  {
                    onSuccess: () => {
                      toastManager.add({ title: "Project marked as Completed!", type: "success" });
                      setOpenProjectCompleteConfirm(false);
                      queryClient.invalidateQueries();
                      router.push("/dashboard/installation/final-handover");
                    },
                    onError: (err: any) =>
                      toastManager.add({ title: err?.message || "Failed to mark project completed", type: "error" }),
                  }
                );
              }}
            >
              {movingProject ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>





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
                : "This will block the lead and prevent all restricted actions."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleToggleLeadBlock}
              disabled={isBlockActionPending}
            >
              {isBlockActionPending
                ? "Processing..."
                : isLeadBlocked
                  ? "Unblock Lead"
                  : "Block Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
