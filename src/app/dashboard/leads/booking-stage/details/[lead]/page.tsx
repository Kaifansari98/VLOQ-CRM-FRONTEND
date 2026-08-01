"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
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
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  Clock,
  UserIcon,
  UserPlus,
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
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import AssignTaskFinalMeasurementForm from "@/components/sales-executive/Lead/assign-task-final-measurement-form";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { toastManager } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useSkipFinalMeasurement } from "@/hooks/final-measurement/use-final-measurement";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canAssignFM,
  canDeleteLeadButton,
  canEditLeadForSalesExecutiveButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";

// --- NEW imports for Activity Status flow
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

import {
  useBlockLead,
  useUnblockLead,
  useRevokeFastProductionRequest,
} from "@/hooks/useLeadsQueries";
import CancelFastProductionModal from "@/components/generics/CancelFastProductionModal";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

export default function BookingStageLeadsDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);
  const [openCancelFastProduction, setOpenCancelFastProduction] = useState(false);
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

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const accountId = lead?.account_id;

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

  const isChatNotification = useIsChatNotification();

  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead) return;
    if (isChatNotification) {
      setAssignOpen(false);
      return;
    }
    if (userType?.toLowerCase() === "sales-executive" && !isLeadBlocked && !lead.is_draft) {
      setAssignOpen(true);
    } else {
      setAssignOpen(false);
    }
  }, [isLoading, isLeadBlockStatusLoading, lead, isChatNotification, userType, isLeadBlocked]);

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const deleteLeadMutation = useDeleteLead();
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
        onError: () =>
          toastManager.add({ title: "Failed to delete lead", type: "error" }),
      },
    );

    setOpenDelete(false);
  };

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);

  // --- Activity status state & hooks (new)
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();
  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const router = useRouter();
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const skipFinalMeasurementMutation = useSkipFinalMeasurement();

  const isCustomVendorFlowFromAuth = useAppSelector(
    (state) =>
      state.auth?.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const handlesLargeScaleProjectsFromAuth = useAppSelector(
    (state) => state.auth?.user?.vendor?.handlesLargeScaleProjects === true,
  );

  const isCustomVendorFlow =
    isCustomVendorFlowFromAuth ||
    lead?.createdBy?.vendor?.is_this_vendor_is_custom_usertype_only === true ||
    lead?.assignedTo?.vendor?.is_this_vendor_is_custom_usertype_only === true;
  const handlesLargeScaleProjects =
    handlesLargeScaleProjectsFromAuth ||
    lead?.createdBy?.vendor?.handlesLargeScaleProjects === true ||
    lead?.assignedTo?.vendor?.handlesLargeScaleProjects === true;

  const showSkipButton = isCustomVendorFlow && handlesLargeScaleProjects;

  const handleSkipFinalMeasurement = () => {
    skipFinalMeasurementMutation.mutate(
      {
        lead_id: leadIdNum,
        account_id: lead?.account_id ?? 0,
        vendor_id: vendorId ?? 0,
        created_by: userId ?? 0,
        critical_discussion_notes: "Skipped Final Measurement Stage.",
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Final measurement stage skipped and moved to Client Document!",
            type: "success",
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["universal-stage-leads"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["allLeadDocuments"],
          });
          setSkipConfirmOpen(false);
          router.push(`/dashboard/leads/booking-stage`);
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.message || "Failed to skip final measurement stage",
            type: "error",
          });
        },
      }
    );
  };

  const isBlockActionPending =
    blockLeadMutation.isPending ||
    unblockLeadMutation.isPending;

  if (isLoading && !lead) {
    return <p className="p-6">Loading lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadForSalesExecutiveButton(userType);
  const canViewPayment =
    isAuditor ||
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.payment_information.enable_disable",
      )
      : canViewPaymentTab(userType));
  const canViewSiteHistory =
    isAuditor ||
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.site_history.enable_disable",
      )
      : canViewSiteHistoryTab(userType));
  const canViewChats =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.chat.enable_disable",
      )
      : true;
  const canViewDocuments =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith("leads.open_leads.details_of_lead.documents_section."),
      )
      : true;
  const canAccessMarkOnHold =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.booking_done.details.mark_on_hold")
      : true;
  const canAccessEditLead =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.booking_done.details.edit")
      : canEdit;
  const canAccessReassignLead =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.booking_done.details.reassign_lead")
      : canReassign;
  const canAccessDeleteLead =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.booking_done.details.delete")
      : canDelete;
  const canAccessAssignTask =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.booking_done.assign_task.final_measurement",
      ) ||
      customPrivilegeCodes.includes(
        "leads.booking_done.assign_task.follow_up",
      ) ||
      customPrivilegeCodes.includes(
        "leads.booking_done.assign_task.bookingdone_ism",
      )
      : canAssignFM(userType);




  const handleToggleLeadBlock = () => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Vendor, user, or lead information is missing!",
        type: "error",
      });
      return;
    }

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
        },
      },
    );
  };
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
          {!isAuditor && (
            canAccessAssignTask ? (
              <Button
                className="hidden md:block"
                size="sm"
                onClick={() => setAssignOpen(true)}
              >
                Assign Task
              </Button>
            ) : (
              <CustomeTooltip
                truncateValue={
                  <Button className="hidden md:block" size="sm" disabled>
                    Assign Task
                  </Button>
                }
                value="You don't have permission to assign Final Measurement tasks."
              />
            )
          )}

          {showSkipButton && (
            <Button
              className="hidden md:block"
              size="sm"
              onClick={() => setSkipConfirmOpen(true)}
              disabled={skipFinalMeasurementMutation.isPending}
            >
              {skipFinalMeasurementMutation.isPending ? "Skipping..." : "Skip Final Measurement"}
            </Button>
          )}

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
              {canAccessAssignTask ? (
                <DropdownMenuItem
                  className="flex md:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assign Task
                </DropdownMenuItem>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="flex md:hidden" disabled>
                      <UserPlus size={20} />
                      Assign Task
                    </DropdownMenuItem>
                  }
                  value="You don't have permission to assign Final Measurement tasks."
                />
              )}

              {showSkipButton && (
                <DropdownMenuItem
                  className="flex md:hidden"
                  onSelect={() => setSkipConfirmOpen(true)}
                  disabled={skipFinalMeasurementMutation.isPending}
                >
                  <UserPlus size={20} />
                  {skipFinalMeasurementMutation.isPending ? "Skipping..." : "Skip Final Measurement"}
                </DropdownMenuItem>
              )}
              {/* --- NEW: Lead Status submenu (Mark On Hold / Mark As Lost) */}
              {canAccessMarkOnHold && (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
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
                )
              )}

              {canAccessEditLead && (
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

              {userType?.toLowerCase() === "super-admin" && lead?.is_fast_production === true && (
                <DropdownMenuItem
                  onSelect={() => setOpenCancelFastProduction(true)}
                  disabled={revokeFastProductionMutation.isPending || isLeadBlocked}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Fast Production
                </DropdownMenuItem>
              )}
              {canAccessReassignLead && (
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

              {canAccessDeleteLead && (
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
        onValueChange={(val) => {
          if (val === "projects") {
            // instead of switching tab, open modal
            setAssignOpen(true);
            return; // stay on details
          }
          setActiveTab(val);
        }}
        className="w-full p-3 md:p-6"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>
            {!isAuditor && canAccessAssignTask && (
              <TabsTrigger value="projects">
                <PencilLine size={16} className="mr-1 opacity-60" />
                To-Do Task
              </TabsTrigger>
            )}
            {canViewSiteHistory && (
              <TabsTrigger value="history">
                <History size={16} className="mr-1 opacity-60" />
                History
              </TabsTrigger>
            )}
            {canViewPayment && (
              <TabsTrigger value="team">
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Contents */}
        <TabsContent value="details">
          <main className="h-auto overflow-visible">
            <LeadDetailsUtil
              status="booking"
              leadId={leadIdNum}
              defaultTab="booking"
            />
          </main>
        </TabsContent>

        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

        {canViewPayment && (
          <TabsContent value="team">
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
              upToStage="ism"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <AssignTaskFinalMeasurementForm
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setActiveTab("details");
        }}
        isFastProductionEnabled={true}
        data={{
          id: leadIdNum,
          name: "",
          accountId: accountId!, // ✅ PASS IT HERE
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

      {/* --- NEW: ActivityStatusModal */}
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
              onError: (err) => {
                toastManager.add({
                  title: err || "Failed to update lead status",
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
                ? "This will unblock the lead and allow it to proceed normally."
                : "This will block the lead and mark the block time in the system."}
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

      <CancelFastProductionModal
        open={openCancelFastProduction}
        onOpenChange={setOpenCancelFastProduction}
        onSubmit={handleCancelFastProduction}
        loading={revokeFastProductionMutation.isPending}
      />

      <AlertDialog open={skipConfirmOpen} onOpenChange={setSkipConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip Final Measurement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the Final Measurement stage and move directly to the Client Document stage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={skipFinalMeasurementMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSkipFinalMeasurement}
              disabled={skipFinalMeasurementMutation.isPending}
            >
              {skipFinalMeasurementMutation.isPending ? "Skipping..." : "Skip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
