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
  Zap,
} from "lucide-react";

import FastProductionDetailsModal from "@/components/sales-executive/Lead/fast-production-details-modal";

import {
  useBlockLead,
  useUnblockLead,
  useRevokeFastProductionRequest,
} from "@/hooks/useLeadsQueries";
import CancelFastProductionModal from "@/components/generics/CancelFastProductionModal";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

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
import { useRouter } from "next/navigation";
import { useFinalMeasurement, useFinalMeasurementLeadById } from "@/hooks/final-measurement/use-final-measurement";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";

import {
  canUploadFinalMeasurements,
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

export default function FinalMeasurementLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const isCustomVendorFlow = useAppSelector(
    (state) => state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isCustomDocNomenclatureEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.is_custom_doc_nomenclature_enabled === true,
  );

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType;

  // UI STATES
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userType === "site-supervisor" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");
  const [openFinalDocModal, setOpenFinalDocModal] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // Only MARK ON HOLD
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);
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

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const accountId = lead?.account_id;

  const router = useRouter();
  const [moveConfirmOpen, setMoveConfirmOpen] = useState(false);
  const finalMeasurementMutation = useFinalMeasurement();
  const { data: finalMeasurementData } = useFinalMeasurementLeadById(
    vendorId ?? 0,
    leadIdNum,
  );
  
  const sitePhotos = finalMeasurementData?.sitePhotos ?? [];
  const measurementDocs = finalMeasurementData?.measurementDocs ?? [];
  const hasAtLeastOneDocUploaded = sitePhotos.length > 0 || measurementDocs.length > 0;
  const showMoveButton = hasAtLeastOneDocUploaded && isCustomVendorFlow && handlesLargeScaleProjects;

  const handleMoveToClientDocument = () => {
    finalMeasurementMutation.mutate(
      {
        lead_id: leadIdNum,
        account_id: lead?.account_id ?? 0,
        vendor_id: vendorId ?? 0,
        created_by: userId ?? 0,
        critical_discussion_notes: "N/A",
        final_measurement_docs: [],
        site_photos: [],
        final_measurement_doc_instance_ids: [],
        site_photo_instance_ids: [],
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Lead moved to Client Document stage successfully!",
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
          setMoveConfirmOpen(false);
          router.push(`/dashboard/project/final-measurement`);
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.message || "Failed to move lead to Client Document stage",
            type: "error",
          });
        },
      }
    );
  };

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const normalizedLead = lead
    ? {
        id: lead.id,
        accountId: lead.account_id,
        name: `${lead.firstname || ""} ${lead.lastname || ""}`,
      }
    : undefined;

  const deleteLeadMutation = useDeleteLead();
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
    blockLeadMutation.isPending || unblockLeadMutation.isPending;

  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead) return;
    if (userType === "site-supervisor" && !isChatNotification && !isLeadBlocked && !lead.is_draft) {
      setPreviousTab("details");
      setOpenFinalDocModal(true);
      setActiveTab("todo");
    }
  }, [isLoading, isLeadBlockStatusLoading, lead, isChatNotification, userType, isLeadBlocked]);

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
            queryKey: ["leadBlockStatus", vendorId, leadIdNum],
          });
        },
      },
    );
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
    return <p className="p-6">Loading final measurement lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

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
  const canAccessFinalMeasurementTodo =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.final_measurement.fm_action_upload_of_fm.enable_disable",
        )
      : canUploadFinalMeasurements(effectiveUserType ?? "");

  return (
    <>
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
              className="hidden md:flex"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          )}

          {showMoveButton && (
            <Button
              size="sm"
              onClick={() => setMoveConfirmOpen(true)}
              disabled={finalMeasurementMutation.isPending}
              className="hidden md:flex"
            >
              {finalMeasurementMutation.isPending ? "Moving..." : "Move to Client Document"}
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
              {/* ✔ ONLY MARK ON HOLD */}
              <DropdownMenuItem
                className="flex md:hidden"
                onSelect={() => setAssignOpen(true)}
              >
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>

              {showMoveButton && (
                <DropdownMenuItem
                  className="flex md:hidden"
                  onSelect={() => setMoveConfirmOpen(true)}
                  disabled={finalMeasurementMutation.isPending}
                >
                  <FileText size={20} />
                  {finalMeasurementMutation.isPending ? "Moving..." : "Move to Client Document"}
                </DropdownMenuItem>
              )}
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
                <DropdownMenuItem onSelect={() => setActivityModalOpen(true)}>
                  <Clock className="mh-4 w-4" />
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
                  {isLeadBlocked ? "Unblock Lead" : "Block Lead"}
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

              {(lead?.is_fast_production === true || lead?.has_pending_fast_production_request === true) && (
                <DropdownMenuItem
                  onSelect={() => setFastProductionDetailsOpen(true)}
                >
                  <Zap className="h-4 w-4 mr-2 text-orange-500 fill-orange-500" />
                  Fast Production Details
                </DropdownMenuItem>
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

              {/* Final Documentation */}
              {canAccessFinalMeasurementTodo ? (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <FileText size={20} />
                        Final Documentation
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onClick={() => setOpenFinalDocModal(true)}>
                    <FileText size={20} />
                    Final Documentation
                  </DropdownMenuItem>
                )
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem disabled>
                      <FileText size={18} />
                      Final Documentation
                    </DropdownMenuItem>
                  }
                  value={
                    shouldDisableBlockedActions
                      ? blockedTooltip
                      : "Only Site Supervisor can access this option"
                  }
                />
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

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            setPreviousTab(activeTab);
            setOpenFinalDocModal(true);
            setActiveTab("todo");
            return;
          }
          setActiveTab(val);
        }}
        className="w-full p-3 md:p-6 pt-4"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>

        {!isAuditor && canAccessFinalMeasurementTodo ? (
  shouldDisableBlockedActions ? (
    <CustomeTooltip
      value={blockedTooltip}
      truncateValue={
        <TabsTrigger value="todo" disabled>
          <PencilLine size={16} className="mr-1 opacity-60" />
          To-Do Task
        </TabsTrigger>
      }
    />
  ) : (
    <TabsTrigger value="todo">
      <PencilLine size={16} className="mr-1 opacity-60" />
      To-Do Task
    </TabsTrigger>
  )
) : !isAuditor && (
  <CustomeTooltip
    value="Only Site Supervisor can access this tab"
    truncateValue={
      <TabsTrigger value="todo" disabled>
        <PencilLine size={16} className="mr-1 opacity-60" />
        To-Do Task
      </TabsTrigger>
    }
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

        {/* CONTENT */}
        <TabsContent value="details">
          <LeadDetailsUtil
            status="finalMeasurement"
            leadId={leadIdNum}
            defaultTab={
              isCustomDocNomenclatureEnabled && hasAtLeastOneDocUploaded
                ? "finalMeasurement"
                : "booking"
            }
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
              upToStage="ism"
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

      {canAccessFinalMeasurementTodo && (
        <FinalMeasurementModal
          open={openFinalDocModal}
          onOpenChange={(open) => {
            setOpenFinalDocModal(open);
            if (!open) setActiveTab(previousTab);
          }}
          data={normalizedLead}
        />
      )}

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        isFastProductionEnabled={true}
        data={{ id: leadIdNum, name: "" }}
      />

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

      {/* ONLY MARK ON HOLD MODAL */}
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType="onHold"
        onSubmitRemark={(remark, dueDate) => {
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Vendor or User info missing!",
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
                status: "onHold",
                remark,
                createdBy: userId,
                dueDate,
              },
            },
            {
              onSuccess: () => {
                toastManager.add({
                  title: "Lead marked as On Hold!",
                  type: "success",
                });
                window.location.assign("/dashboard/leads/leadstable?tab=onHold");
              },
              onError: (err) => {
                toastManager.add({
                  title: err?.message || "Failed to update lead status!",
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

      <FastProductionDetailsModal
        open={fastProductionDetailsOpen}
        onOpenChange={setFastProductionDetailsOpen}
        leadId={leadIdNum}
      />

      <AlertDialog open={moveConfirmOpen} onOpenChange={setMoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Client Document stage?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transition this lead to the Client Document stage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalMeasurementMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToClientDocument}
              disabled={finalMeasurementMutation.isPending}
            >
              {finalMeasurementMutation.isPending ? "Moving..." : "Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
