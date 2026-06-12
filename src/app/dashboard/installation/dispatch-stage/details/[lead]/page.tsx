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
import { useLeadById } from "@/hooks/useLeadsQueries";
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
  Truck,
  Clock,
  UserPlus,
  Move,
  MessageSquare,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
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
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canAccessTodoTaskTabDispatchStage,
  canDoMoveToUnderInstallation,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { useQueryClient } from "@tanstack/react-query";
import { useMoveLeadToUnderInstallation } from "@/api/installation/useUnderInstallationStageLeads";
import { useCheckReadyForPostDispatch } from "@/api/installation/useDispatchStageLeads";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { getErrorMessage } from "@/lib/utils";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import {
  useBlockLead,
  useMarkSmallOrderRequestResolved,
  useUnblockLead,
} from "@/hooks/useLeadsQueries";
import { Lock, LockOpen } from "lucide-react";

export default function DispatchPlanningLeadDetails() {
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
    (state) => state.auth?.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType;

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");

  const [openMoveConfirm, setOpenMoveConfirm] = useState(false);
  const moveMutation = useMoveLeadToUnderInstallation();
  const markResolvedMutation = useMarkSmallOrderRequestResolved();

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

  const { data: readiness } = useCheckReadyForPostDispatch(vendorId, leadIdNum);


  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = lead?.account_id;
  const isSmallOrderLead = lead?.is_small_order_request === true;
  const smallOrderRequestId = lead?.smallOrderRequest?.id ?? null;
  const isSmallOrderRequestResolved =
    lead?.smallOrderRequest?.is_request_resolved === true;
  const isPostDispatchSmallOrderLead =
    isSmallOrderLead &&
    lead?.smallOrderRequest?.request_source === "post_dispatch";
  const primaryActionLabel = isPostDispatchSmallOrderLead
    ? "Mark as Resolved"
    : "Move to Under Installation";
  const primaryActionCompletedLabel = isPostDispatchSmallOrderLead
    ? "Resolved"
    : "Completed";


  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
    isLoading: isLeadBlockStatusLoading,
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

  const canAccessButton =
    effectiveUserType === "custom"
      ? customPrivilegeCodes.includes(
        "installation.dispatch.move_to_under_installation.enable_disable_action",
      )
      : canDoMoveToUnderInstallation(effectiveUserType ?? "");

  const canMoveToUnderInstallation =
    canAccessButton &&
    !shouldDisableBlockedActions;

  const handlePrimaryActionConfirm = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor or user information!",
        type: "error",
      });
      return;
    }

    if (isPostDispatchSmallOrderLead) {
      if (!smallOrderRequestId) {
        toastManager.add({
          title: "Small order request record not found for this lead.",
          type: "error",
        });
        return;
      }

      markResolvedMutation.mutate(
        {
          vendorId,
          requestId: smallOrderRequestId,
          updatedBy: userId,
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Small order request marked as resolved successfully!",
              type: "success",
            });
            setOpenMoveConfirm(false);
            queryClient.invalidateQueries({
              queryKey: ["lead", leadIdNum, vendorId, userId],
            });
            queryClient.invalidateQueries({
              queryKey: ["smallOrderRequestsByLead"],
              exact: false,
            });
            queryClient.invalidateQueries({
              queryKey: ["universal-stage-leads"],
              exact: false,
            });
          },
          onError: (err: unknown) => {
            toastManager.add({
              title: getErrorMessage(err),
              type: "error",
            });
          },
        },
      );

      return;
    }

    moveMutation.mutate(
      { vendorId, leadId: leadIdNum, updated_by: userId },
      {
        onSuccess: () => {
          toastManager.add({
            title:
              "Lead successfully moved to Under Installation stage!",
            type: "success",
          });
          setOpenMoveConfirm(false);
          queryClient.invalidateQueries({
            queryKey: ["universal-stage-leads"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["vendorOverallLeads"],
          });
          router.push("/dashboard/installation/under-installation");
        },
        onError: (err: unknown) => {
          toastManager.add({
            title: getErrorMessage(err),
            type: "error",
          });
        },
      },
    );
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
  console.log("Parent 1: ", accountId);

  const canReassign = canReassignLeadButton(effectiveUserType ?? "");
  const canDelete = canDeleteLeadButton(effectiveUserType ?? "");
  const canEdit = canEditLeadButton(effectiveUserType ?? "");
  const canViewPayment =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.payment_information.enable_disable",
      )
      : canViewPaymentTab(effectiveUserType ?? "");
  const canViewSiteHistory =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.site_history.enable_disable",
      )
      : canViewSiteHistoryTab(effectiveUserType ?? "");
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
  const deleteLeadMutation = useDeleteLead();
  const canShowTodoTab =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith("installation.dispatch."),
      )
      : canAccessTodoTaskTabDispatchStage(effectiveUserType ?? "");

  // 🔥 Auto-open To-Do modal for Sales Executive
  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead || isChatNotification) return;
    if (userType === "factory" && !isLeadBlocked && !lead.is_draft) {
      setPreviousTab("details"); // so closing modal returns to details
      setActiveTab("todo"); // switch tab to To-Do
    }
  }, [isLoading, isLeadBlockStatusLoading, lead, isChatNotification, userType, isLeadBlocked]);
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
        onError: (err: unknown) =>
          toastManager.add({ title: getErrorMessage(err), type: "error" }),
      },
    );

    setOpenDelete(false);
  };

  if (isLoading && !lead) {
    return <p className="p-6">Loading lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  return (
    <>
      {/* Header */}
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

        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            {/* Move to Under Installation Button + Tooltip Logic */}
            {isPostDispatchSmallOrderLead && isSmallOrderRequestResolved ? (
              <Button
                size="sm"
                disabled
                variant="outline"
                className="hidden sm:block border-emerald-200 bg-emerald-500/10 text-emerald-600"
              >
                {primaryActionCompletedLabel}
              </Button>
            ) : shouldDisableBlockedActions ? (
              <CustomeTooltip
                value={blockedTooltip}
                truncateValue={
                  <Button
                    size="sm"
                    disabled
                    className="hidden sm:block"
                  >
                    {primaryActionLabel}
                  </Button>
                }
              />
            ) : isPostDispatchSmallOrderLead && !smallOrderRequestId ? (
              <CustomeTooltip
                value="Small order request record not found for this lead."
                truncateValue={
                  <Button
                    size="sm"
                    disabled
                    className="hidden sm:block"
                  >
                    {primaryActionLabel}
                  </Button>
                }
              />
            ) : readiness?.readyForPostDispatch ? (
              canAccessButton && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setOpenMoveConfirm(true)}
                  className="hidden sm:block"
                >
                  {primaryActionLabel}
                </Button>
              )
            ) : (
              canAccessButton && (
                <CustomeTooltip
                  truncateValue={
                    <Button
                      size="sm"
                      disabled
                      className="hidden sm:block"
                    >
                      {primaryActionLabel}
                    </Button>
                  }
                  value={
                    readiness?.message ||
                    "Lead is missing required information to proceed."
                  }
                />
              )
            )}

            {/* Assign Task Button */}
            <Button
              size="sm"
              className="hidden lg:flex"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          </div>

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          <NotificationBell />
          <AnimatedThemeToggler />

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

              {isPostDispatchSmallOrderLead && isSmallOrderRequestResolved ? (
                <DropdownMenuItem
                  disabled
                  className="sm:hidden"
                >
                  <Move size={20} />
                  {primaryActionCompletedLabel}
                </DropdownMenuItem>
              ) : shouldDisableBlockedActions ? (
                // Lead block handling added for DropdownMenu action
                <CustomeTooltip
                  value={blockedTooltip}
                  truncateValue={
                    <DropdownMenuItem
                      disabled
                      className="sm:hidden"
                    >
                      <Move size={20} />
                      {primaryActionLabel}
                    </DropdownMenuItem>
                  }
                />
              ) : isPostDispatchSmallOrderLead && !smallOrderRequestId ? (
                <CustomeTooltip
                  value="Small order request record not found for this lead."
                  truncateValue={
                    <DropdownMenuItem
                      disabled
                      className="sm:hidden"
                    >
                      <Move size={20} />
                      {primaryActionLabel}
                    </DropdownMenuItem>
                  }
                />
              ) : readiness?.readyForPostDispatch ? (
                canAccessButton && (
                  <DropdownMenuItem
                    onClick={() => setOpenMoveConfirm(true)}
                    className="sm:hidden"
                  >
                    <Move size={20} />
                    {primaryActionLabel}
                  </DropdownMenuItem>
                )
              ) : (
                canAccessButton && (
                  <CustomeTooltip
                    truncateValue={
                      <DropdownMenuItem
                        disabled
                        className="sm:hidden"
                      >
                        <Move size={20} />
                        {primaryActionLabel}
                      </DropdownMenuItem>
                    }
                    value={
                      readiness?.message ||
                      "Lead is missing required information to proceed."
                    }
                  />
                )
              )}
              {/* Lead block handling added for DropdownMenu action */}
              {shouldDisableBlockedActions ? (
                <CustomeTooltip
                  value={blockedTooltip}
                  truncateValue={
                    <DropdownMenuItem disabled>
                      <Clock className="mr h-4 w-4" />
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
                  <Clock className="mr h-4 w-4" />
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
        </div>
      </header>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            setPreviousTab(activeTab);
            setActiveTab("todo");
            return;
          }
          setActiveTab(val);
        }}
        className="w-full px-6 pt-4"
      >
        <ScrollArea>
          <div className="w-full h-full flex justify-between items-center mb-4">
            <div className="w-full flex items-center gap-2 justify-between">
              <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                {/* ✅ Dispatch Planning Details */}
                <TabsTrigger value="details">
                  <PencilLine size={16} className="mr-1 opacity-60" />
                  Dispatch Details
                </TabsTrigger>

                {/* ✅ To-Do Task (Conditional Access) */}
                {canShowTodoTab ? (
                  <TabsTrigger value="todo">
                    <PencilLine size={16} className="mr-1 opacity-60" />
                    To-Do Task
                  </TabsTrigger>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <TabsTrigger disabled value="todo">
                        <PencilLine size={16} className="mr-1 opacity-60" />
                        To-Do Task
                      </TabsTrigger>
                    }
                    value={
                      effectiveUserType?.toLowerCase() === "custom"
                        ? "You don’t have permission to access To-Do Tasks."
                        : "Only factory can access this tab"
                    }
                  />
                )}

                {/* ✅ Site History */}
                {canViewSiteHistory && (
                  <TabsTrigger value="history">
                    <History size={16} className="mr-1 opacity-60" />
                    History
                  </TabsTrigger>
                )}

                {/* ✅ Payment Info */}
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
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="details">
          {!isLoading && accountId && (
            <LeadDetailsGrouped
              status="dispatch"
              defaultTab="dispatch"
              leadId={leadIdNum}
              accountId={accountId}
              defaultParentTab="installation"
              dispatchInstanceId={validInstanceId}
            />
          )}
        </TabsContent>

        {canShowTodoTab && (
          <TabsContent value="todo">
            {!isLoading && accountId && (
              <LeadDetailsGrouped
                status="dispatch"
                defaultTab="dispatch"
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="installation"
                dispatchInstanceId={validInstanceId}
              />
            )}
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
              upToStage="dispatch"
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
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setActiveTab(previousTab);
        }}
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

      {/* Move to Under Installation Confirmation */}
      <AlertDialog open={openMoveConfirm} onOpenChange={setOpenMoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPostDispatchSmallOrderLead
                ? "Mark Small Order as Resolved?"
                : "Move Lead to Under Installation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPostDispatchSmallOrderLead ? (
                <>
                  This will mark the linked small order request as <b>resolved</b>.
                  Do you wish to continue?
                </>
              ) : (
                <>
                  This will move the current lead from <b>Dispatch Planning</b> to
                  the <b>Under Installation</b> stage. Do you wish to continue?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePrimaryActionConfirm}
              disabled={moveMutation.isPending || markResolvedMutation.isPending}
            >
              {moveMutation.isPending || markResolvedMutation.isPending
                ? isPostDispatchSmallOrderLead
                  ? "Saving..."
                  : "Moving..."
                : "Confirm Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        onSubmitRemark={(remark, dueDate) => {
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
                ...(activityType === "onHold" ? { dueDate } : {}),
              },
            },
            {
              onSuccess: () => {
                toastManager.add({
                  title: "Lead marked as On Hold!",
                  type: "success",
                });

                setActivityModalOpen(false);

                // Invalidate related queries to refresh UI
                queryClient.invalidateQueries({
                  queryKey: ["leadById", leadIdNum],
                });
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
