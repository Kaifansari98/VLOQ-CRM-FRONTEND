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
import { useState } from "react";

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
  Hammer,
  // Under Installation icon,
  Clock,
  Handshake,
  CalendarOff,
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
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import { useQueryClient } from "@tanstack/react-query";
import {
  useFinalHandoverReady,
  useGetUsableHandover,
  useMoveToFinalHandover,
  useSetActualInstallationStartDate,
  useUnderInstallationDetails,
  useMiscellaneousResolutionStatus,
} from "@/api/installation/useUnderInstallationStageLeads";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import {
  canAccessTodoTaskTabUnderInstallationStage,
  canDeleteLeadButton,
  canEditLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import { useChatTabFromUrl } from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

export default function UnderInstallationLeadDetails() {
  const { lead: leadId } = useParams();
  const searchParams = useSearchParams();
  const leadIdNum = Number(leadId);
  const instanceIdParam = searchParams.get("instance_id");
  const validInstanceId = instanceIdParam && !Number.isNaN(Number(instanceIdParam)) ? Number(instanceIdParam) : null;
  const queryClient = useQueryClient();

  const router = useRouter();

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType;
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: underDetails } = useUnderInstallationDetails(
    vendorId,
    leadIdNum,
  );
  const { data: usableHandoverData, isLoading: isLoadingUsableHandover } =
    useGetUsableHandover(vendorId ?? 0, leadIdNum);
  const setStartMutation = useSetActualInstallationStartDate();
  const { data: finalReady } = useFinalHandoverReady(vendorId!, leadIdNum);

  const { data: miscStatus, isLoading: isLoadingMisc } =
    useMiscellaneousResolutionStatus(vendorId, leadIdNum);

  const [openStartModal, setOpenStartModal] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const moveMutation = useMoveToFinalHandover();
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

  const [activeTab, setActiveTab] = useState(
    userType === "site-supervisor" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = lead?.account_id;
  const canReassign = canReassignLeadButton(effectiveUserType ?? "");
  const canDelete = canDeleteLeadButton(effectiveUserType ?? "");
  const canEdit = canEditLeadButton(effectiveUserType ?? "");
  const deleteLeadMutation = useDeleteLead();
  const canAccessTodoTab = canAccessTodoTaskTabUnderInstallationStage(
    effectiveUserType ?? "",
  );
  const canStartInstallation =
    effectiveUserType === "custom"
      ? customPrivilegeCodes.includes(
          "installation.under_installation.start_installation.action",
        )
      : canAccessTodoTab;
  const canMoveToFinalHandover =
    effectiveUserType === "custom"
      ? customPrivilegeCodes.includes(
          "installation.under_installation.move_to_final_handover.enable_disable_action",
        )
      : true;
  const canRedirectToFinalHandover =
    effectiveUserType === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith("installation.final_handover."),
        )
      : true;
  const canViewPayment =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
      : canViewPaymentTab(effectiveUserType ?? "");
  const canViewSiteHistory = canViewSiteHistoryTab(effectiveUserType ?? "");
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

  const miscStatusReady = miscStatus?.all_resolved;
  const isUsableHandoverCompleted = Boolean(
    usableHandoverData?.usable_handover_completed,
  );

  console.log("miscStatus: ", miscStatus?.all_resolved);

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

  function formatInstallationDate(dateString: string) {
    const date = new Date(dateString);

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const fullDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${time} – ${dayName}, ${fullDate}`;
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
        <div className="flex items-center space-x-2">
          {/* ───────────────────────────────────────────── */}
          {/*  MOVE TO FINAL HANDOVER BUTTON WITH CONDITIONS */}
          {/* ───────────────────────────────────────────── */}
          {canMoveToFinalHandover &&
            (!underDetails?.actual_installation_start_date ? (
            // 1️⃣ Installation NOT started → block
            <CustomeTooltip
              truncateValue={
                <div className="opacity-60 cursor-not-allowed">
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="pointer-events-none hidden sm:flex"
                  >
                    Move to Final Handover
                  </Button>
                </div>
              }
              value="Start Installation first to move this lead to Final Handover."
            />
          ) : isLoadingUsableHandover ? (
            <CustomeTooltip
              truncateValue={
                <div className="opacity-60 cursor-not-allowed">
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="pointer-events-none hidden sm:flex"
                  >
                    Move to Final Handover
                  </Button>
                </div>
              }
              value="Checking usable handover completion status..."
            />
          ) : !isUsableHandoverCompleted ? (
            <CustomeTooltip
              truncateValue={
                <div className="opacity-60 cursor-not-allowed">
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="pointer-events-none hidden sm:flex"
                  >
                    Move to Final Handover
                  </Button>
                </div>
              }
              value="Mark Usable Handover as completed before moving to Final Handover."
            />
          ) : isLoadingMisc ? (
            // 2️⃣ Checking misc status → block
            <CustomeTooltip
              truncateValue={
                <div className="opacity-60 cursor-not-allowed">
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="pointer-events-none hidden sm:flex"
                  >
                    Move to Final Handover
                  </Button>
                </div>
              }
              value="Checking miscellaneous status..."
            />
          ) : !miscStatusReady ? (
            // 3️⃣ Misc pending/awaiting → block
            <CustomeTooltip
              truncateValue={
                <div className="opacity-60 cursor-not-allowed">
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="pointer-events-none hidden sm:flex"
                  >
                    Move to Final Handover
                  </Button>
                </div>
              }
              value="All miscellaneous items must be Resolved or Rejected before moving to Final Handover."
            />
          ) : !finalReady?.isReady ? (
            // 2️⃣ Installation started but NOT eligible → show WHY
            <CustomeTooltip
              truncateValue={
                <div className="opacity-60 cursor-not-allowed">
                  <Button
                    variant="default"
                    size="sm"
                    disabled
                    className="pointer-events-none hidden sm:flex"
                  >
                    Move to Final Handover
                  </Button>
                </div>
              }
              value={
                finalReady?.message ||
                "Lead is not ready for Final Handover yet."
              }
            />
          ) : (
            // 3️⃣ Eligible → allow moving
            <Button
              variant="default"
              size="sm"
              className="hidden sm:flex"
              onClick={() => {
                setShowMoveModal(true);
              }}
            >
              Move to Final Handover
            </Button>
          ))}

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
              {canMoveToFinalHandover &&
                (!underDetails?.actual_installation_start_date ? (
                // 1️⃣ Installation NOT started → block
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Handshake size={20} />
                      Move to Final Handover
                    </DropdownMenuItem>
                  }
                  value="Start Installation first to move this lead to Final Handover."
                />
              ) : isLoadingUsableHandover ? (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Handshake size={20} />
                      Move to Final Handover
                    </DropdownMenuItem>
                  }
                  value="Checking usable handover completion status..."
                />
              ) : !isUsableHandoverCompleted ? (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Handshake size={20} />
                      Move to Final Handover
                    </DropdownMenuItem>
                  }
                  value="Mark Usable Handover as completed before moving to Final Handover."
                />
              ) : isLoadingMisc ? (
                // 2️⃣ Checking misc status → block
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Handshake size={20} />
                      Move to Final Handover
                    </DropdownMenuItem>
                  }
                  value="Checking miscellaneous status..."
                />
              ) : !miscStatusReady ? (
                // 3️⃣ Misc pending/awaiting → block
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Handshake size={20} />
                      Move to Final Handover
                    </DropdownMenuItem>
                  }
                  value="All miscellaneous items must be Resolved or Rejected before moving to Final Handover."
                />
              ) : !finalReady?.isReady ? (
                // 2️⃣ Installation started but NOT eligible → show WHY
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Handshake size={20} />
                      Move to Final Handover
                    </DropdownMenuItem>
                  }
                  value={
                    finalReady?.message ||
                    "Lead is not ready for Final Handover yet."
                  }
                />
              ) : (
                // 3️⃣ Eligible → allow moving
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => {
                    setShowMoveModal(true);
                  }}
                >
                  <Handshake size={20} />
                  Move to Final Handover
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() => {
                  setActivityType("onHold");
                  setActivityModalOpen(true);
                }}
              >
                <Clock className=" h-4 w-4" />
                Mark On Hold
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
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

      {/* 🔹 Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val)}
        className="w-full p-3 md:p-6"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between mb-3">
          <ScrollArea>
            <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
              {/* Under Installation Details */}
              <TabsTrigger value="details">
                <Hammer size={16} className="mr-1 opacity-60" />
                Under Installation Details
              </TabsTrigger>

              {/* To-Do Tab — Disabled */}
              {canAccessTodoTab ? (
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
                  value="Only Site Supervisor can access this tab"
                />
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

            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex">
            {!underDetails?.actual_installation_start_date ? (
              canStartInstallation ? (
                // ✅ User allowed — normal working button
                <Button size="sm" onClick={() => setOpenStartModal(true)}>
                  Start Installation
                </Button>
              ) : (
                // ❌ No access — show tooltip + disabled button
                <CustomeTooltip
                  value="You do not have permission to access this action."
                  truncateValue={
                    <Button
                      size="sm"
                      disabled
                      className="cursor-not-allowed opacity-60"
                    >
                      Start Installation
                    </Button>
                  }
                />
              )
            ) : (
              // Existing installation date display block (unchanged)
              <div className="flex flex-col items-start">
                <p className="text-xs font-semibold">Installation Started On</p>
                <div className="flex justify-between gap-2 items-center bg-muted py-2 px-3 rounded-md ">
                  <p className="text-sm">
                    {formatInstallationDate(
                      underDetails.actual_installation_start_date,
                    )}
                  </p>
                  <CalendarOff size={16} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔹 Start Installation Button / Date Display */}

        {/* TAB CONTENTS */}

        <TabsContent value="details">
          <main className="flex-1 h-fit">
            {!isLoading && accountId && (
              <LeadDetailsGrouped
                status="underInstallation"
                defaultTab="underInstallation"
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="installation"
                underInstallationInstanceId={validInstanceId}
              />
            )}
          </main>
        </TabsContent>

        <TabsContent value="todo">
          <main className="flex-1 h-fit">
            {!isLoading && accountId && (
              <LeadDetailsGrouped
                status="underInstallation"
                defaultTab="underInstallation"
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="installation"
                underInstallationInstanceId={validInstanceId}
              />
            )}
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

        {canViewDocuments && (
          <TabsContent value="documents">
            <ProjectDocumentsTimeline
              leadId={leadIdNum}
              vendorId={vendorId ?? 0}
              upToStage="underInstallation"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* 🔹 ldals */}
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

      <AlertDialog open={openStartModal} onOpenChange={setOpenStartModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Installation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark the installation as started? (Date &
              time will be recorded)
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setStartMutation.mutate({
                  vendorId: vendorId!,
                  leadId: leadIdNum,
                  updated_by: userId!,
                  actual_installation_start_date: new Date().toISOString(),
                });
                setOpenStartModal(false);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Move Lead to Final Handover?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to mark this lead as <b>Final Handover</b>?
            This action will update the lead’s stage.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (!lead?.vendor_id || !userId) {
                  toastManager.add({
                    title: "Missing vendor or user information!",
                    type: "error",
                  });
                  return;
                }

                moveMutation.mutate(
                  {
                    vendorId: lead.vendor_id,
                    leadId: lead.id,
                    updated_by: userId,
                  },
                  {
                    onSuccess: () => {
                      // ✅ Correct key now
                      queryClient.removeQueries({
                        queryKey: ["lead-status", leadIdNum, vendorId],
                      });

                      queryClient.removeQueries({
                        queryKey: ["leadById", leadIdNum],
                      });

                      queryClient.invalidateQueries({
                        queryKey: ["leadStats"],
                        exact: false,
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["universal-stage-leads"],
                        exact: false,
                      });

                      if (canRedirectToFinalHandover) {
                        router.push("/dashboard/installation/final-handover");
                      } else {
                        router.push("/dashboard/installation/under-installation");
                      }
                    },
                  },
                );
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
                  queryKey: ["leadById"],
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
    </>
  );
}
