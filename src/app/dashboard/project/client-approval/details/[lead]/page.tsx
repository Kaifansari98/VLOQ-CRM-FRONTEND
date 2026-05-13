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
  FileText,
  Clock,
  UserPlus,
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

import ClientApprovalModal from "@/components/site-supervisor/client-approval/client-approval-modal";
import RequestToTechCheckModal from "@/components/site-supervisor/client-approval/request-to-tech-check-modal";

import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canRequestToTeckCheck,
  canUploadClientApproval,
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

// ⭐ NEW IMPORTS — ONLY Mark On Hold
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

export default function ClientApprovalLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  // UI States
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [openClientApprovalModal, setOpenClientApprovalModal] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openRequestToTechCheckModal, setOpenRequestToTechCheckModal] =
    useState(false);

  // ⭐ Activity Status — ONLY ON HOLD
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const [activeTab, setActiveTab] = useState(
    userType === "sales-executive" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");

  const is_client_approval_submitted = lead?.is_client_approval_submitted;

  // Auto-open documentation modal
  /* ---------- DEFAULT MODAL ON MOUNT ---------- */
  useEffect(() => {
    if (isLoading || isChatNotification) return;

    // Auto-open only for Sales Executive
    if (userType === "sales-executive") {
      if (is_client_approval_submitted) {
        setOpenRequestToTechCheckModal(true);
      } else {
        setOpenClientApprovalModal(true);
      }

      setActiveTab("todo");
    }
  }, [isLoading, isChatNotification, userType, is_client_approval_submitted]);

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

  if (isLoading) {
    return <p className="p-6">Loading Client Approval Lead details…</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
      : canViewPaymentTab(userType);
  const canViewSiteHistory =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.site_history.enable_disable",
        )
      : canViewSiteHistoryTab(userType) && userType?.toLowerCase() !== "admin";
  const canViewChats =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.chat.enable_disable",
        )
      : true;
  const canAccessClientApprovalForm =
    userType === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_approval.client_approval_form.enable_disable",
        )
      : canUploadClientApproval(userType);
  const isCustomUser = userType === "custom";
  const canRequestToTechCheckAccess = isCustomUser
    ? customPrivilegeCodes.includes(
        "project.client_approval.client_approval_screenshots.upload",
      )
    : canRequestToTeckCheck(userType);

  return (
    <>
      {/* HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
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

        {/* ACTION BUTTONS */}
        <div className="flex items-center space-x-2">
          {/* Tech Check */}
          {!is_client_approval_submitted ? (
            <CustomeTooltip
              truncateValue={
                <Button
                  className="hidden lg:block"
                  size="sm"
                  disabled
                  variant="secondary"
                >
                  Request To Tech Check
                </Button>
              }
              value="Submit approval first"
            />
          ) : canRequestToTechCheckAccess ? (
            <Button
              size="sm"
              className="hidden lg:block"
              onClick={() => setOpenRequestToTechCheckModal(true)}
            >
              Request To Tech Check
            </Button>
          ) : isCustomUser ? (
            <Button
              className="hidden lg:block"
              size="sm"
              disabled
              variant="secondary"
            >
              Request To Tech Check
            </Button>
          ) : (
            <CustomeTooltip
              truncateValue={
                <Button
                  className="hidden lg:block"
                  size="sm"
                  disabled
                  variant="secondary"
                >
                  Request To Tech Check
                </Button>
              }
              value="Only Sales Executive can request to Tech Check"
            />
          )}

          <Button
            size="sm"
            className="hidden md:block"
            onClick={() => setAssignOpen(true)}
          >
            Assign Task
          </Button>

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          <NotificationBell />
          <AnimatedThemeToggler />

          {/* DROPDOWN */}
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
                onSelect={() => setAssignOpen(true)}
              >
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>
              {/* ⭐ ONLY MARK ON HOLD */}
              <DropdownMenuItem onSelect={() => setActivityModalOpen(true)}>
                <Clock className="m h-4 w-4" />
                Mark On Hold
              </DropdownMenuItem>

              {/* CLIENT APPROVAL */}
              {!is_client_approval_submitted ? (
                canAccessClientApprovalForm ? (
                  <DropdownMenuItem
                    onClick={() => setOpenClientApprovalModal(true)}
                  >
                    <FileText size={20} />
                    Client Approval
                  </DropdownMenuItem>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <FileText size={20} />
                        Client Approval
                      </DropdownMenuItem>
                    }
                    value="Only Sales-executive access this option"
                  />
                )
              ) : canRequestToTechCheckAccess ? (
                <DropdownMenuItem
                  className="lg:hidden"
                  onClick={() => setOpenRequestToTechCheckModal(true)}
                >
                  <FileText size={20} />
                  Request To Tech Check
                </DropdownMenuItem>
              ) : isCustomUser ? (
                <DropdownMenuItem className="lg:hidden" disabled>
                  <FileText size={20} />
                  Request To Tech Check
                </DropdownMenuItem>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="lg:hidden" disabled>
                      <FileText size={20} />
                      Request To Tech Check
                    </DropdownMenuItem>
                  }
                  value="Only Sales Executive can request to Tech Check"
                />
              )}

              {/* EDIT */}

              {canEdit && (
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
                </DropdownMenuItem>
              )}

              {/* REASSIGN */}
              {canReassign && (
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users size={20} />
                  Reassign Lead
                </DropdownMenuItem>
              )}

              {/* DELETE */}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setOpenDelete(true)}>
                    <XCircle size={20} className="text-red-500" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          // When user selects "todo"
          if (val === "todo") {
            // Save previous tab (common in both functions)
            setPreviousTab(activeTab);

            // First logic: access privilege + tech-check flow
            if (canRequestToTechCheckAccess) {
              if (!is_client_approval_submitted) {
                setOpenClientApprovalModal(true);
              } else {
                setOpenRequestToTechCheckModal(true);
              }
            } else {
              // Second logic: open client document modal
              setOpenClientApprovalModal(true);
            }

            // Keep tab on "todo"
            setActiveTab("todo");
            return;
          }

          // Default case for normal tab switching
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

            {canAccessClientApprovalForm ? (
              <TabsTrigger value="todo">
                <PencilLine size={16} className="mr-1 opacity-60" />
                To-Do Task
              </TabsTrigger>
            ) : (
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

            <TabsTrigger value="documents">
              <FolderOpen size={16} className="mr-1 opacity-60" />
              Documents
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="details">
          <main className="flex-1 h-fit">
            <LeadDetailsUtil
              status={
                is_client_approval_submitted
                  ? "clientApproval"
                  : "clientdocumentation"
              }
              leadId={leadIdNum}
              accountId={accountId}
              defaultTab={
                is_client_approval_submitted
                  ? "clientApproval"
                  : "clientdocumentation"
              }
            />
          </main>
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

        <TabsContent value="documents">
          <ProjectDocumentsTimeline
            leadId={leadIdNum}
            vendorId={vendorId ?? 0}
            upToStage="clientApproval"
          />
        </TabsContent>
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

      <ClientApprovalModal
        open={openClientApprovalModal}
        onOpenChange={(open) => {
          setOpenClientApprovalModal(open);
          if (!open) setActiveTab(previousTab);
        }}
        data={{ id: leadIdNum, accountId }}
      />

      <RequestToTechCheckModal
        open={openRequestToTechCheckModal}
        onOpenChange={(open) => {
          setOpenRequestToTechCheckModal(open);
          if (!open) setActiveTab(previousTab);
        }}
        data={{ id: leadIdNum, accountId }}
      />

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        data={{ id: leadIdNum, name: "" }}
      />

      {/* DELETE CONFIRMATION */}
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
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ⭐ ONLY MARK ON HOLD */}
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType="onHold"
        loading={updateStatusMutation.isPending}
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
                  title: "Lead marked On Hold",
                  type: "success",
                });
                setActivityModalOpen(false);

                queryClient.invalidateQueries({
                  queryKey: ["leadById", leadIdNum],
                });
              },
              onError: (err) =>
                toastManager.add({
                  title: err?.message || "Failed to update status",
                  type: "error",
                }),
            },
          );
        }}
      />
    </>
  );
}
