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
import { useBlockLead, useLeadById, useUnblockLead, useRevokeFastProductionRequest } from "@/hooks/useLeadsQueries";
import CancelFastProductionModal from "@/components/generics/CancelFastProductionModal";
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
  FileText,
  Clock,
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

import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { toastManager } from "@/components/ui/toast";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import ClientDocumentationModal from "@/components/site-supervisor/final-measurement/client-documantation-modal";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

import {
  canUploadClientDocumentation,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";

import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";

import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

export default function ClientDocumentationLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  // UI STATES
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openClientDocModal, setOpenClientDocModal] = useState(false);

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

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const [activeTab, setActiveTab] = useState(
    userType === "sales-executive" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");

  // ACTIVITY STATUS — Only On Hold
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const lead = data?.data?.lead;
  const accountId = Number(lead?.account_id);

  const leadCode = lead?.lead_code || "";
  const clientName = `${lead?.firstname || ""} ${lead?.lastname || ""}`.trim();

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

  const isBlockActionPending =
    blockLeadMutation.isPending ||
    unblockLeadMutation.isPending;

  // Auto-open documentation modal
  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead) return;
    if (userType === "sales-executive" && !isChatNotification && !isLeadBlocked && !lead.is_draft) {
      setPreviousTab("details");
      setOpenClientDocModal(true);
      setActiveTab("todo");
    }
  }, [isLoading, isLeadBlockStatusLoading, lead, isChatNotification, userType, isLeadBlocked]);

  // DELETE LEAD
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
        onError: (err) =>
          toastManager.add({
            title: err?.message || "Failed to delete lead",
            type: "error",
          }),
      },
    );
    setOpenDelete(false);
  };


  if (isLoading && !lead) {
    return <p className="p-6">Loading client documentation details…</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
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
  const canAccessClientDocumentation =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "project.client_documentation.client_documentation_form.enable_disable",
      )
      : canUploadClientDocumentation(userType);



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
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between px-4 border-b backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <p className="font-bold">
                    {leadCode}
                    {clientName ? ` - ${clientName}` : ""}
                  </p>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center space-x-2">
          {!isAuditor && (
            <Button
              size="sm"
              className="hidden md:block"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          )}

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          {!isAuditor && <NotificationBell />}
          <AnimatedThemeToggler />

          {/* DROPDOWN */}
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
                  className="flex md:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assign Task
                </DropdownMenuItem>
                {/* ONLY MARK ON HOLD */}
                {/* Lead block handling added for DropdownMenu action */}
                {shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Clock className="m h-4 w-4" />
                        Mark On Hold
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      setActivityModalOpen(true);
                    }}
                  >
                    <Clock className="m h-4 w-4" />
                    Mark On Hold
                  </DropdownMenuItem>
                )}

                {/* CLIENT DOCUMENTATION */}
                {canAccessClientDocumentation ? (
                  // Lead block handling added for DropdownMenu action
                  shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <FileText size={20} />
                          Client Documentation
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem onClick={() => setOpenClientDocModal(true)}>
                      <FileText size={20} />
                      Client Documentation
                    </DropdownMenuItem>
                  )
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <div className="flex opacity-50 cursor-not-allowed px-2 py-1.5">
                        <FileText size={18} className="mr-2" />
                        Client Documentation
                      </div>
                    }
                    value={
                      shouldDisableBlockedActions
                        ? blockedTooltip
                        : "You don’t have permission."
                    }
                  />
                )}

                {/* EDIT */}
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

                {/* REASSIGN */}
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

                {/* DELETE */}
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

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            setPreviousTab(activeTab);
            setOpenClientDocModal(true);
            setActiveTab("todo");
            return;
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

            {!isAuditor && canAccessClientDocumentation ? (
              <TabsTrigger value="todo">
                <PencilLine size={16} className="mr-1 opacity-60" />
                To-Do Task
              </TabsTrigger>
            ) : !isAuditor && (
              <CustomeTooltip
                truncateValue={
                  <TabsTrigger value="" disabled>
                    <PencilLine size={16} className="mr-1 opacity-60" />
                    To-Do Task
                  </TabsTrigger>
                }
                value="Only Sales Executive can access this tab"
              />
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
            )}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* TAB SCREENS */}
        <TabsContent value="details">
          <LeadDetailsUtil
            status="finalMeasurement"
            leadId={leadIdNum}
            defaultTab="finalMeasurement"
          />
        </TabsContent>

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
              upToStage="clientDoc"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* MODALS */}
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

      <ClientDocumentationModal
        open={openClientDocModal}
        onOpenChange={(open) => {
          setOpenClientDocModal(open);
          if (!open) setActiveTab(previousTab);
        }}
        data={{ id: leadIdNum, ...lead, accountId }}
      />

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        isFastProductionEnabled={true}
        data={{ id: leadIdNum, name: "" }}
      />

      {/* DELETE LEAD */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      {/* MARK ON HOLD MODAL */}
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType="onHold"
        onSubmitRemark={(remark, dueDate) => {
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Vendor or user info missing!",
              type: "error",
            });
            return;
          }

          updateStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId,
                userId,
                status: "onHold",
                remark,
                createdBy: userId,
                dueDate,
              },
            },
            {
              onSuccess: () => {
                toastManager.add({
                  title: "Lead marked On Hold!",
                  type: "success",
                });
                setActivityModalOpen(false);

                queryClient.invalidateQueries({
                  queryKey: ["leadById", leadIdNum],
                });
              },
              onError: (err) => {
                toastManager.add({
                  title: err?.message || "Failed to update status",
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
    </>
  );
}
