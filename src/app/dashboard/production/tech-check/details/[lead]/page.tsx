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
import { Fragment, useEffect, useState } from "react";
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
  CheckCircle2,
  AlertCircle,
  CircleCheckBig,
  Settings2,
  UploadIcon,
  Clock,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import CustomeTooltip from "@/components/custom-tooltip";

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
import { toast } from "react-toastify";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canMoveToOrderLogin,
  canTechCheck,
  canUploadRevisedClientDocumentationFiles,
  canViewThreeVerticalDocsOptionInTechCheck,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import {
  useApproveMultipleDocuments,
  useApproveTechCheck,
  useRejectTechCheck,
} from "@/api/tech-check";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import BaseModal from "@/components/utils/baseModal";
import { cn } from "@/lib/utils";
import TextAreaInput from "@/components/origin-text-area";
import UploadMoreClientDocumentationModal from "@/components/site-supervisor/client-documentation/uploadmore-client-documentaition-modal";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import MoveToOrderLoginModal from "@/components/production/tech-check-stage/MoveToOrderLoginModal";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";

export default function ClientApprovalLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id) || 0;
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type
  );

  const { mutate: approveTechCheckMutate, isPending: approving } =
    useApproveTechCheck();
  const { mutate: rejectTechCheckMutate, isPending: rejecting } =
    useRejectTechCheck();

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const [assignOpen, setAssignOpen] = useState(false);

  const [openFinalApproveConfirm, setOpenFinalApproveConfirm] = useState(false);
  const [openRejectDocsModal, setOpenRejectDocsModal] = useState(false);

  const [openUploadDocsModal, setOpenUploadDocsModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");
  const [openOrderLoginModal, setOpenOrderLoginModal] = useState(false);
  const isChatNotification = useIsChatNotification();

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  // ✅ Auto-open To-Do modal when screen loads (only for allowed roles)
  useEffect(() => {
    if (isChatNotification) return;
    if (
      canTechCheck(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setOpenRejectDocsModal(true);
    }
  }, [isChatNotification, userType]);

  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [openRemarkModal, setOpenRemarkModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [openFinalRejectConfirm, setOpenFinalRejectConfirm] = useState(false);
  const [openApproveConfirmModal, setOpenApproveConfirmModal] = useState(false);

  const { mutate: approveMultipleDocsMutate, isPending: approvingDocs } =
    useApproveMultipleDocuments();

  const { data: clientDocsData } = useClientDocumentationDetails(
    vendorId!,
    leadIdNum,
    userId! 
  );

  const pptDocs = clientDocsData?.documents?.ppt ?? [];
  const pythaDocs = clientDocsData?.documents?.pytha ?? [];

  const docs = [...pptDocs, ...pythaDocs];

  const hasRejectedDocs = docs.some((d) => d.tech_check_status === "REJECTED");

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const no_of_client_documents_initially_submitted =
    lead?.no_of_client_documents_initially_submitted;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const accountId = Number(lead?.account_id);

  const deleteLeadMutation = useDeleteLead();
  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toast.error("Missing vendor or user info!");
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => toast.success("Lead deleted successfully!"),
        onError: (err) => toast.error(err?.message || "Failed to delete lead"),
      }
    );

    setOpenDelete(false);
  };

  if (isLoading) {
    return <p className="p-6">Loading client approval lead details...</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment = canViewPaymentTab(userType);
  const canViewSiteHistory = canViewSiteHistoryTab(userType);

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
          <Button
            size="sm"
            className="hidden md:block"
            onClick={() => setAssignOpen(true)}
          >
            Assign Task
          </Button>

          {/* ✅ Move To Order Login Button (Role & Status Based) */}
          <div className="hidden lg:flex">
            {canMoveToOrderLogin(userType) &&
              (() => {
                const approvedPPT = pptDocs.filter(
                  (d) => d.tech_check_status === "APPROVED"
                ).length;

                const approvedPytha = pythaDocs.filter(
                  (d) => d.tech_check_status === "APPROVED"
                ).length;

                const approvedCount = approvedPPT + approvedPytha;

                const pendingCount = docs.filter(
                  (d) =>
                    !d.tech_check_status ||
                    d.tech_check_status === "PENDING" ||
                    d.tech_check_status === "REVISED"
                ).length;

                // Disabled if:
                // 1. No approved docs
                // 2. Still some pending docs
                // 3. No PPT approved
                // 4. No Pytha approved
                const isDisabled =
                  approvedCount <
                    (no_of_client_documents_initially_submitted || 0) ||
                  pendingCount > 0 ||
                  approvedPPT === 0 ||
                  approvedPytha === 0;

                if (isDisabled) {
                  let tooltipMsg = "";

                  if (
                    no_of_client_documents_initially_submitted &&
                    approvedCount < no_of_client_documents_initially_submitted
                  ) {
                    tooltipMsg =
                      userType === "sales-executive"
                        ? `Once Tech Check is completed, then only lead can be move to Order Login.`
                        : `You must approve all initially submitted client documents (${no_of_client_documents_initially_submitted}) before moving to Order Login.`;
                  } else if (approvedPPT === 0) {
                    tooltipMsg =
                      "At least one PPT file must be approved before moving to Order Login.";
                  } else if (approvedPytha === 0) {
                    tooltipMsg =
                      "At least one Pytha file must be approved before moving to Order Login.";
                  } else if (pendingCount > 0) {
                    tooltipMsg = `You still have ${pendingCount} pending document${
                      pendingCount > 1 ? "s" : ""
                    }. Please review all before proceeding.`;
                  }

                  return (
                    <CustomeTooltip
                      truncateValue={
                        <Button
                          disabled
                          className="bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed flex items-center gap-2"
                        >
                          <CircleCheckBig size={16} />
                          Move To Order Login
                        </Button>
                      }
                      value={tooltipMsg}
                    />
                  );
                }

                return (
                  <Button
                    size="sm"
                    onClick={() => setOpenOrderLoginModal(true)}
                    variant="default"
                  >
                    <CircleCheckBig size={16} />
                    Move To Order Login
                  </Button>
                );
              })()}
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
              <DropdownMenuItem
                className="md:hidden"
                onClick={() => setAssignOpen(true)}
              >
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>

              {canEdit && (
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
                </DropdownMenuItem>
              )}

              {canMoveToOrderLogin(userType) &&
                (() => {
                  const approvedPPT = pptDocs.filter(
                    (d) => d.tech_check_status === "APPROVED"
                  ).length;

                  const approvedPytha = pythaDocs.filter(
                    (d) => d.tech_check_status === "APPROVED"
                  ).length;

                  const approvedCount = approvedPPT + approvedPytha;

                  const pendingCount = docs.filter(
                    (d) =>
                      !d.tech_check_status ||
                      d.tech_check_status === "PENDING" ||
                      d.tech_check_status === "REVISED"
                  ).length;

                  // Disabled if:
                  // 1. No approved docs
                  // 2. Still some pending docs
                  // 3. No PPT approved
                  // 4. No Pytha approved
                  const isDisabled =
                    approvedCount <
                      (no_of_client_documents_initially_submitted || 0) ||
                    pendingCount > 0 ||
                    approvedPPT === 0 ||
                    approvedPytha === 0;

                  if (isDisabled) {
                    let tooltipMsg = "";

                    if (
                      no_of_client_documents_initially_submitted &&
                      approvedCount < no_of_client_documents_initially_submitted
                    ) {
                      tooltipMsg = `You must approve all initially submitted client documents (${no_of_client_documents_initially_submitted}) before moving to Order Login.`;
                    } else if (approvedPPT === 0) {
                      tooltipMsg =
                        "At least one PPT file must be approved before moving to Order Login.";
                    } else if (approvedPytha === 0) {
                      tooltipMsg =
                        "At least one Pytha file must be approved before moving to Order Login.";
                    } else if (pendingCount > 0) {
                      tooltipMsg = `You still have ${pendingCount} pending document${
                        pendingCount > 1 ? "s" : ""
                      }. Please review all before proceeding.`;
                    }

                    return (
                      <CustomeTooltip
                        truncateValue={
                          <DropdownMenuItem disabled>
                            <CircleCheckBig size={16} />
                            Move To Order Login
                          </DropdownMenuItem>
                        }
                        value={tooltipMsg}
                      />
                    );
                  }

                  return (
                    <DropdownMenuItem
                      onClick={() => setOpenOrderLoginModal(true)}
                    >
                      <CircleCheckBig size={16} />
                      Move To Order Login
                    </DropdownMenuItem>
                  );
                })()}

              {/* --- NEW: Lead Status submenu (Mark On Hold / Mark As Lost) */}
              {canViewThreeVerticalDocsOptionInTechCheck(userType) && (
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

              {canReassign && (
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users size={20} />
                  Reassign Lead
                </DropdownMenuItem>
              )}

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
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            if (!canTechCheck(userType)) {
              toast.error("You don’t have permission to access To-Do Tasks");
              return; // 🚫 block unauthorized users
            }

            setOpenRejectDocsModal(true);
            return;
          }
          setActiveTab(val);
        }}
        className="w-full p-3 md:p-6"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-3">
          {/* ---------------- Tabs (Scrollable on mobile only) ---------------- */}
          <ScrollArea>
            <TabsList className="flex h-auto gap-2 mb-3 px-1.5 py-1.5">
              <TabsTrigger value="details">
                <HouseIcon size={16} className="mr-1 opacity-60" />
                Lead Details
              </TabsTrigger>

              {canTechCheck(userType) ? (
                <TabsTrigger value="todo">
                  <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <TabsTrigger value="" disabled>
                      <PanelsTopLeftIcon size={16} />
                      To-Do Task
                    </TabsTrigger>
                  }
                  value="You don’t have permission to access To-Do Tasks."
                />
              )}

              {canViewSiteHistory && (
                <TabsTrigger value="history">
                  <BoxIcon size={16} className="mr-1 opacity-60" />
                  Site History
                </TabsTrigger>
              )}

              {canViewPayment && (
                <TabsTrigger value="payment">
                  <UsersRoundIcon size={16} className="mr-1 opacity-60" />
                  Payment Information
                </TabsTrigger>
              )}
              <TabsTrigger value="chats">
                <MessageSquare size={16} className="mr-1 opacity-60" />
                Chats
              </TabsTrigger>
            </TabsList>

            {/* Scrollbar ONLY for tabs */}
            <ScrollBar orientation="horizontal" className="lg:hidden" />
          </ScrollArea>

          {/* ---------------- Actions ---------------- */}
          <div className="flex sm:flex-row gap-2">
            {canTechCheck(userType) && (
              <Button
                variant="outline"
                onClick={() => setOpenRejectDocsModal(true)}
                className="w-max"
              >
                <Settings2 className="mr-1" size={16} />
                Tech-Check Workflow
              </Button>
            )}

            {(() => {
              const canUpload =
                canUploadRevisedClientDocumentationFiles(userType);

              if (!canUpload || !hasRejectedDocs) {
                return (
                  <CustomeTooltip
                    truncateValue={
                      <Button disabled className="w-max">
                        <UploadIcon size={16} />
                        Upload Revised Docs
                      </Button>
                    }
                    value={
                      !canUpload
                        ? "You don’t have permission to upload revised client documentation."
                        : "No rejected client documentation found."
                    }
                  />
                );
              }

              return (
                <Button
                  onClick={() => setOpenUploadDocsModal(true)}
                  variant="outline"
                  className="w-max"
                >
                  <UploadIcon size={16} />
                  Upload Revised Docs
                </Button>
              );
            })()}
          </div>
        </div>

        <TabsContent value="details">
          <LeadDetailsGrouped
            status="techcheck"
            defaultTab="techcheck"
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="production"
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

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
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
      {/* 🪟 (B) Approve Final Confirmation */}
      <AlertDialog
        open={openFinalApproveConfirm}
        onOpenChange={setOpenFinalApproveConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this Tech Check? The lead will
              move to Order Login stage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              // onClick={() => {
              //   approveTechCheckMutate({
              //     vendorId: vendorId!,
              //     leadId: leadIdNum,
              //     userId: userId!,
              //     assignToUserId: selectedBackendUserId, // 👈 NEW
              //     accountId: accountId, // 👈 NEW
              //   });

              //   setOpenFinalApproveConfirm(false);
              // }}
              disabled={approving}
            >
              {approving ? "Approving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* 🪟 (C) Approve/Reject Docs Modal (Enhanced Dual Action with Dark Mode) */}
      <BaseModal
        open={openRejectDocsModal}
        onOpenChange={setOpenRejectDocsModal}
        title="Review Client Documentation"
        size="lg"
        description="Select documents to approve or reject. Review each document carefully before taking action."
      >
        <div className="space-y-6">
          {/* -------- Premium CRM Stats Summary -------- */}
          <div className="px-3 md:px-6 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Total Docs */}
              <div
                className="
        bg-white dark:bg-neutral-900 
        rounded-xl p-4 
        border border-border 
        hover:bg-muted/60 dark:hover:bg-neutral-800/60 
        transition-all duration-200
      "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
            w-10 h-10 rounded-lg 
            bg-blue-500/10 dark:bg-blue-500/20 
            flex items-center justify-center
          "
                  >
                    <FileText
                      className="text-blue-600 dark:text-blue-400"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {docs.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approved */}
              <div
                className="
        bg-white dark:bg-neutral-900 
        rounded-xl p-4 
        border border-border 
        hover:bg-muted/60 dark:hover:bg-neutral-800/60 
        transition-all duration-200
      "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
            w-10 h-10 rounded-lg 
            bg-green-500/10 dark:bg-green-500/20 
            flex items-center justify-center
          "
                  >
                    <CheckCircle2
                      className="text-green-600 dark:text-green-400"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {
                        docs.filter((d) => d.tech_check_status === "APPROVED")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected */}
              <div
                className="
        bg-white dark:bg-neutral-900 
        rounded-xl p-4 
        border border-border 
        hover:bg-muted/60 dark:hover:bg-neutral-800/60 
        transition-all duration-200
      "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
            w-10 h-10 rounded-lg 
            bg-amber-500/10 dark:bg-amber-500/20 
            flex items-center justify-center
          "
                  >
                    <AlertCircle
                      className="text-amber-600 dark:text-amber-400"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Selected
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedDocs.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div
                className="
        bg-white dark:bg-neutral-900 
        rounded-xl p-4 
        border border-border 
        hover:bg-muted/60 dark:hover:bg-neutral-800/60 
        transition-all duration-200
      "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
            w-10 h-10 rounded-lg 
            bg-red-500/10 dark:bg-red-500/20 
            flex items-center justify-center
          "
                  >
                    <XCircle
                      className="text-red-600 dark:text-red-400"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {
                        docs.filter((d) => d.tech_check_status === "REJECTED")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document List */}
          {docs.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 mx-6">
              <FileText
                className="mx-auto text-gray-400 dark:text-gray-600 mb-3"
                size={48}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                No client documentation found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Documents will appear here once uploaded
              </p>
            </div>
          ) : (
            <div className="space-y-3 px-6">
              <div className="flex flex-col justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
                  Document List
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to select documents, then choose to approve or reject
                </p>
              </div>

              {/* List View - FIXED VERSION with Dark Mode */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {(() => {
                  // Separate and sort documents - PENDING first, then APPROVED, then REJECTED
                  const pending = docs
                    .filter(
                      (d) =>
                        !d.tech_check_status ||
                        d.tech_check_status === "PENDING" ||
                        d.tech_check_status === "REVISED"
                    )
                    .sort((a, b) => {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      return dateB - dateA;
                    });

                  const approved = docs
                    .filter((d) => d.tech_check_status === "APPROVED")
                    .sort((a, b) => {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      return dateB - dateA;
                    });

                  const rejected = docs
                    .filter((d) => d.tech_check_status === "REJECTED")
                    .sort((a, b) => {
                      const dateA = new Date(a.created_at).getTime();
                      const dateB = new Date(b.created_at).getTime();
                      return dateB - dateA;
                    });

                  const sortedDocs = [...pending, ...approved, ...rejected];

                  return sortedDocs.map((doc, index) => {
                    const isRejected = doc.tech_check_status === "REJECTED";
                    const isApproved = doc.tech_check_status === "APPROVED";
                    const isPending =
                      !doc.tech_check_status ||
                      doc.tech_check_status === "PENDING" ||
                      doc.tech_check_status === "REVISED";
                    const isSelected = selectedDocs.includes(doc.id);
                    const isDisabled = isRejected || isApproved;

                    const isFirstApproved =
                      isApproved &&
                      index > 0 &&
                      sortedDocs[index - 1].tech_check_status !== "APPROVED";

                    const isFirstRejected =
                      isRejected &&
                      index > 0 &&
                      sortedDocs[index - 1].tech_check_status !== "REJECTED";

                    // Format date
                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      return date.toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    };

                    return (
                      <Fragment key={doc.id}>
                        {/* Divider for approved section */}
                        {isFirstApproved && (
                          <div className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-white"></div>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full border">
                              Already Approved Documents
                            </span>
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-white"></div>
                          </div>
                        )}

                        {/* Divider for rejected section */}
                        {isFirstRejected && (
                          <div className="flex items-center gap-3 py-3">
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-white"></div>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full border">
                              Already Rejected Documents
                            </span>
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-white"></div>
                          </div>
                        )}

                        <div
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center  sm:justify-between relative rounded-lg border-2 p-4 transition-all duration-200 group  gap-4",
                            isDisabled
                              ? "cursor-not-allowed opacity-75"
                              : "cursor-pointer",
                            isRejected
                              ? ""
                              : isApproved
                              ? ""
                              : isSelected
                              ? "border-zinc-900 dark:border-white dark:bg-zinc-950/30"
                              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700"
                          )}
                          onClick={() => {
                            if (isDisabled) return;
                            setSelectedDocs((prev) =>
                              prev.includes(doc.id)
                                ? prev.filter((d) => d !== doc.id)
                                : [...prev, doc.id]
                            );
                          }}
                        >
                          {/* File Icon */}
                          <div className="flex gap-2   items-center">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                isRejected
                                  ? "bg-red-100 dark:bg-red-900/50"
                                  : isApproved
                                  ? "bg-green-100 dark:bg-green-900/50"
                                  : isSelected
                                  ? "bg-amber-100 dark:bg-amber-900/50"
                                  : "bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                              )}
                            >
                              <FileText
                                className={
                                  isRejected
                                    ? "text-red-500 dark:text-red-400"
                                    : isApproved
                                    ? "text-green-500 dark:text-green-400"
                                    : isSelected
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-blue-500 dark:text-blue-400"
                                }
                                size={24}
                              />
                            </div>

                            {/* Document Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-semibold text-sm line-clamp-2",
                                  isDisabled
                                    ? "text-gray-500 dark:text-gray-400"
                                    : "text-gray-900 dark:text-white"
                                )}
                              >
                                {doc.doc_og_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Uploaded: {formatDate(doc.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <CheckCircle2 size={14} />
                                Approved
                              </span>
                            )}

                            {isRejected && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <XCircle size={14} />
                                Rejected
                              </span>
                            )}

                            {!isDisabled && isSelected && (
                              <div className="w-6 h-6 rounded-full bg-amber-500 dark:bg-amber-600 flex items-center justify-center shadow-md">
                                <CheckCircle2
                                  className="text-white"
                                  size={16}
                                />
                              </div>
                            )}

                            {!isDisabled && !isSelected && (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors"></div>
                            )}
                          </div>
                        </div>
                      </Fragment>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 py-5 px-3 md:py-4 md:px-6">
            <div className="text-sm border py-1 px-3 rounded-md bg-muted ">
              {selectedDocs.length > 0 ? (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {selectedDocs.length}
                  </span>{" "}
                  document{selectedDocs.length !== 1 ? "s" : ""} selected
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No documents selected
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                disabled={selectedDocs.length === 0}
                onClick={() => {
                  if (selectedDocs.length === 0) {
                    toast.error("Please select at least one document.");
                    return;
                  }
                  setOpenRejectDocsModal(false);
                  setOpenRemarkModal(true);
                }}
              >
                <XCircle size={16} />
                Reject Selected ({selectedDocs.length})
              </Button>
              <Button
                variant="default"
                disabled={selectedDocs.length === 0}
                onClick={() => {
                  if (selectedDocs.length === 0) {
                    toast.error("Please select at least one document.");
                    return;
                  }
                  setOpenRejectDocsModal(false);
                  setOpenApproveConfirmModal(true);
                }}
              >
                <CheckCircle2 size={16} />
                Approve Selected ({selectedDocs.length})
              </Button>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* 🪟 (D) Remark Input Modal - Enhanced */}
      <BaseModal
        open={openRemarkModal}
        onOpenChange={setOpenRemarkModal}
        title="Add Rejection Remark"
        size="md"
        description="Provide a detailed reason for rejecting the selected documents."
      >
        <div className="space-y-6 p-5">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <p className="font-medium">
                Selected Documents: {selectedDocs.length}
              </p>
              <p className="text-xs">
                Your remark will be sent to the client for all selected
                documents.
              </p>
            </div>
          </div>

          {/* Selected Documents Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Documents to Reject</h4>
            <div className="max-h-32 overflow-y-auto space-y-1.5 p-3 rounded-lg border">
              {docs
                .filter((doc) => selectedDocs.includes(doc.id))
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 text-xs px-3 py-2 rounded-md border"
                  >
                    <FileText size={14} className="flex-shrink-0" />
                    <span className="truncate font-medium">
                      {doc.doc_og_name}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Remark Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <TextAreaInput
              value={remark}
              onChange={(value) => setRemark(value)}
              maxLength={500}
              placeholder="Enter detailed reason for rejection (e.g., 'Document is unclear', 'Missing required information', 'Incorrect format')..."
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end pt-4">
            {/* <p className="text-xs text-gray-500">
                  This action will notify the client
                </p> */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenRemarkModal(false);
                  setRemark("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  if (!remark.trim()) {
                    toast.error("Remark is required.");
                    return;
                  }
                  setOpenRemarkModal(false);
                  setOpenFinalRejectConfirm(true);
                }}
              >
                Continue to Confirm
              </Button>
            </div>
          </div>
        </div>
      </BaseModal>
      {/* 🪟 (E) Final Confirmation Modal for Reject */}
      <AlertDialog
        open={openFinalRejectConfirm}
        onOpenChange={setOpenFinalRejectConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the selected documents?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                rejectTechCheckMutate({
                  vendorId: vendorId!,
                  leadId: leadIdNum,
                  userId: userId!,
                  payload: { rejectedDocs: selectedDocs, remark },
                });

                setOpenFinalRejectConfirm(false);
                setSelectedDocs([]);
                setRemark("");
              }}
              disabled={rejecting}
            >
              {rejecting ? "Rejecting..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🪟 New: Approve Confirmation Modal */}
      <AlertDialog
        open={openApproveConfirmModal}
        onOpenChange={setOpenApproveConfirmModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Selected Documents?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to approve {selectedDocs.length} document
              {selectedDocs.length !== 1 ? "s" : ""}. This action will mark them
              as approved and they will be processed accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setOpenApproveConfirmModal(false);
                setOpenRejectDocsModal(true);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                approveMultipleDocsMutate({
                  vendorId: vendorId!,
                  leadId: leadIdNum,
                  userId: userId!,
                  approvedDocs: selectedDocs,
                });

                setOpenApproveConfirmModal(false);
                setSelectedDocs([]);
              }}
              disabled={approvingDocs}
              className=""
            >
              {approvingDocs ? "Approving..." : "Confirm Approval"}
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
            toast.error("Vendor or User info is missing!");
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
                toast.success("Lead marked as On Hold!");

                setActivityModalOpen(false);

                // Invalidate related queries to refresh UI
                queryClient.invalidateQueries({
                  queryKey: ["leadById", leadIdNum],
                });
              },
              onError: (err) => {
                toast.error(err?.message || "Failed to update lead status");
              },
            }
          );
        }}
        loading={updateStatusMutation.isPending}
      />

      <UploadMoreClientDocumentationModal
        open={openUploadDocsModal}
        onOpenChange={setOpenUploadDocsModal}
        data={{
          leadId: leadIdNum,
          accountId: accountId,
        }}
      />

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        data={{ id: leadIdNum, name: "" }}
      />

      <MoveToOrderLoginModal
        open={openOrderLoginModal}
        onOpenChange={setOpenOrderLoginModal}
        data={{
          id: leadIdNum,
          accountId: accountId,
        }}
      />
    </>
  );
}
