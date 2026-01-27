"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter } from "next/navigation";
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
  CheckCircle2, // Final Handover Icon
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  Clock,
  MessageSquare,
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

import { toast } from "react-toastify";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
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
  useIsTotalProjectAmountPaid,
} from "@/api/installation/useFinalHandoverStageLeads";
import { toastError } from "@/lib/utils";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import { useChatTabFromUrl } from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";

export default function FinalHandoverLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type
  );

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [activeTab, setActiveTab] = useState(
    userType === "site-supervisor" ? "todo" : "details"
  );
  useChatTabFromUrl(setActiveTab);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment = canViewPaymentTab(userType);
  const canViewSiteHistory = canViewSiteHistoryTab(userType);
  const canAccessTodoTab =
    canAccessTodoTaskTabUnderFinalHandoverStage(userType);
  const isSiteSupervisor = userType?.toLowerCase() === "site-supervisor";

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = lead?.account_id;

  const { data: readiness, isLoading: readinessLoading } =
    useFinalHandoverReadiness(vendorId!, leadIdNum);
  const { mutate: moveProjectCompleted, isPending: movingProject } =
    useMoveProjectCompleted();
  const {
    data: paymentStatus,
    isLoading: paymentStatusLoading,
    refetch: refetchPaymentStatus,
  } = useIsTotalProjectAmountPaid(vendorId!, leadIdNum);

  const [openProjectCompleteConfirm, setOpenProjectCompleteConfirm] =
    useState(false);
  const [validatingPayment, setValidatingPayment] = useState(false);

  const isReady = readiness?.can_move_to_final_handover;
  const canMarkCompleted = isReady && paymentStatus?.is_paid;

  const tooltipMessage = (() => {
    if (readinessLoading) return "Checking project readiness...";
    if (!readiness) return "Unable to verify readiness.";

    if (!readiness.docs_complete)
      return "Upload all Final Handover documents before completing the project.";

    if (!readiness.pending_tasks_clear)
      return "Resolve all pending work tasks before marking project as completed.";

    return "";
  })();

  const completionBlockMessage = (() => {
    if (readinessLoading || paymentStatusLoading)
      return "Checking readiness and payment status...";
    if (!isReady) return tooltipMessage;
    if (!paymentStatus) return "Unable to verify payment status.";
    if (!paymentStatus.is_paid) {
      return isSiteSupervisor
        ? "Payment pending. Please contact admin."
        : `Pending amount remaining: ${paymentStatus.pending_amount.toLocaleString()}`;
    }
    return "";
  })();

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
        onError: (err: unknown) => toastError(err),
      }
    );

    setOpenDelete(false);
  };

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
          {/* {!paymentStatusLoading &&
              paymentStatus &&
              !paymentStatus.is_paid && (
                <div className="text-xs leading-tight text-right">
                  <div className="font-semibold">Pending amount</div>
                  <div>
                    {paymentStatus.pending_amount.toLocaleString()} /{" "}
                    {paymentStatus.total_project_amount.toLocaleString()}
                  </div>
                </div>
              )} */}

          {canMarkCompleted ? (
            <Button
              className="hidden md:flex items-center gap-2"
              onClick={() => setOpenProjectCompleteConfirm(true)}
            >
              <CheckCircle2 size={18} />
              Mark Project as Completed
            </Button>
          ) : (
            <CustomeTooltip
              value={completionBlockMessage}
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
          )}

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
              {canMarkCompleted ? (
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
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setActivityType("onHold");
                  setActivityModalOpen(true);
                }}
              >
                <Clock className="mh-4 w-4" />
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
        className="w-full px-6 pt-4"
      >
        <div className="w-full flex justify-between">
          <div>
            <ScrollArea>
              <div className="w-full h-full flex justify-between items-center mb-4">
                <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                  {/* Final Handover Details */}
                  <TabsTrigger value="details">
                    <CheckCircle2 size={16} className="mr-1 opacity-60" />
                    Final Handover Details
                  </TabsTrigger>

                  {/* To-Do Tab (still disabled) */}

                  {canAccessTodoTab ? (
                    <TabsTrigger value="todo">
                      <PanelsTopLeftIcon
                        size={16}
                        className="mr-1 opacity-60"
                      />
                      To-Do Task
                    </TabsTrigger>
                  ) : (
                    <CustomeTooltip
                      truncateValue={
                        <div className="flex items-center opacity-50 cursor-not-allowed px-2 py-1.5 text-sm">
                          <PanelsTopLeftIcon
                            size={16}
                            className="mr-1 opacity-60"
                          />
                          To-Do Task
                        </div>
                      }
                      value="Only Site Supervisor can access this tab"
                    />
                  )}

                  {/* Site History */}
                  {canViewSiteHistory && (
                    <TabsTrigger value="history">
                      <BoxIcon size={16} className="mr-1 opacity-60" />
                      Site History
                    </TabsTrigger>
                  )}

                  {/* Payment */}
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
              />
            )}
          </main>
        </TabsContent>

        <TabsContent value="todo">
          <main className="flex-1 h-fit">
            {!isLoading && accountId && (
              <LeadDetailsGrouped
                status="finalHandover"
                defaultTab="finalHandover"
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="installation"
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

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
      </Tabs>

      {/* 🔹 Modals */}
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
              onError: (err: any) => {
                toast.error(err?.message || "Failed to update lead status");
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
              disabled={movingProject || validatingPayment}
              onClick={async () => {
                try {
                  setValidatingPayment(true);
                  const { data: latestPayment } = await refetchPaymentStatus();
                  const payment = latestPayment ?? paymentStatus;

                  if (!payment || !payment.is_paid) {
                    const pending =
                      payment?.pending_amount !== undefined
                        ? payment.pending_amount
                        : 0;
                    toast.error(
                      payment
                        ? isSiteSupervisor
                          ? "Payment pending. Please contact admin."
                          : `Pending amount remaining: ${pending.toLocaleString()}`
                        : "Unable to verify payment status."
                    );
                    setValidatingPayment(false);
                    setOpenProjectCompleteConfirm(false);
                    return;
                  }

                  moveProjectCompleted(
                    {
                      vendorId: vendorId!,
                      leadId: leadIdNum,
                      updated_by: userId!,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Project marked as Completed!");
                        setOpenProjectCompleteConfirm(false);
                        queryClient.invalidateQueries();
                        router.push("/dashboard/installation/final-handover");
                      },
                      onError: (err: any) =>
                        toast.error(
                          err?.message || "Failed to mark project completed"
                        ),
                      onSettled: () => setValidatingPayment(false),
                    }
                  );
                } catch (err: any) {
                  toast.error(
                    err?.message || "Unable to validate payment status"
                  );
                  setValidatingPayment(false);
                  setOpenProjectCompleteConfirm(false);
                }
              }}
            >
              {movingProject || validatingPayment ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
