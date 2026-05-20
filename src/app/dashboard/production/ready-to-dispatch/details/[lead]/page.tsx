"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
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
  CalendarCheck2,
  Clock,
  CalendarOff,
  CalendarOffIcon,
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
  canAssignSR,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { useUpdateExpectedOrderLoginReadyDate } from "@/api/production/production-api";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import AssignTaskSiteReadinessForm from "@/components/production/ready-to-dispatch/assign-task-site-readiness-form";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useCurrentSitePhotosCount } from "@/api/production/useReadyToDispatchLeads";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

export default function ReadyToDispatchLeadDetails() {
  const { lead: leadId } = useParams();
  const searchParams = useSearchParams();
  const leadIdNum = Number(leadId);
  const instanceIdParam = searchParams.get("instance_id");
  const validInstanceId = instanceIdParam && !Number.isNaN(Number(instanceIdParam)) ? Number(instanceIdParam) : null;

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const { data: sitePhotoCountData } = useCurrentSitePhotosCount(
    vendorId,
    leadIdNum,
  );
  const hasSitePhotos = sitePhotoCountData?.hasPhotos;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const deleteLeadMutation = useDeleteLead();
  const { mutateAsync: updateExpectedDate } =
    useUpdateExpectedOrderLoginReadyDate();

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
      : canViewPaymentTab(userType);
  const canViewSiteHistory = canViewSiteHistoryTab(userType);
  const canViewChats =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.chat.enable_disable",
        )
      : true;
  const canViewDocuments =
    userType === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith("leads.open_leads.details_of_lead.documents_section."),
        )
      : true;
  const canShowTodoTab =
    userType === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith("production.production.ready_to_dispatch"),
        )
      : canAssignSR(userType);
  const handleExpectedDateChange = async (newDate?: string) => {
    if (!newDate || !vendorId || !userId || !leadIdNum) return;

    try {
      await updateExpectedDate({
        vendorId,
        leadId: leadIdNum,
        expected_order_login_ready_date: newDate,
        updated_by: userId,
      });
      toastManager.add({
        title: "Expected Order Login Ready Date updated successfully!",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["leadById", leadIdNum] });
    } catch (err: any) {
      toastManager.add({
        title: err?.message || "Failed to update expected order login date",
        type: "error",
      });
    }
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

  // 🔥 Auto-open To-Do modal for Sales Executive
  useEffect(() => {
    if (isChatNotification) return;
    if (userType === "sales-executive" && hasSitePhotos) {
      setPreviousTab("details"); // so closing modal returns to details
      setAssignOpen(true); // open modal on load
      setActiveTab("todo"); // switch tab to To-Do
    }
  }, [isChatNotification, userType, hasSitePhotos]);

  if (isLoading) {
    return <p className="p-6">Loading Ready-To-Dispatch lead details...</p>;
  }

  function formatDate(input: string | Date): string {
    const date = input instanceof Date ? input : new Date(input);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
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
              <DropdownMenuItem>
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            setPreviousTab(activeTab);
            setAssignOpen(true);
            setActiveTab("todo");
            return;
          }
          setActiveTab(val);
        }}
        className="w-full px-6 pt-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-3">
          <ScrollArea>
            <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
              {/* ✅ Ready To Dispatch Details */}
              <TabsTrigger value="details">
                <PencilLine size={16} className="mr-1 opacity-60" />
                Ready To Dispatch Details
              </TabsTrigger>

              {/* ✅ To-Do Task (Conditional Access) */}
              {canShowTodoTab ? (
                <TabsTrigger value="todo" onClick={() => setAssignOpen(true)}>
                  <PencilLine size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <TabsTrigger value="todo" disabled>
                      <PencilLine size={16} className="mr-1 opacity-60" />
                      To-Do Task
                    </TabsTrigger>
                  }
                  value={
                    userType === "custom"
                      ? "You don’t have permission to access To-Do Tasks."
                      : "Only Admin or Sales Executive can access this tab"
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

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="flex flex-col items-start">
            <p className="text-xs font-semibold">Expected Dispatch Date</p>

            {/* Stylish formatted date & time */}
            <div className="flex items-center w-44 justify-between border bg-muted rounded-md py-1.5 px-3 mt-1">
              <p className="text-sm font-semibold">
                {formatDate(lead?.expected_order_login_ready_date)}
              </p>
              <CalendarOffIcon size={16} />
            </div>
          </div>
        </div>

        <TabsContent value="details">
          <LeadDetailsGrouped
            status="readyToDispatch"
            defaultTab="readyToDispatch"
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="production"
            readyToDispatchInstanceId={validInstanceId}
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
              upToStage="production"
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

      <AssignTaskSiteReadinessForm
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setActiveTab(previousTab);
        }}
        data={{ id: leadIdNum, name: "" }}
        userType={userType}
      />

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
                  title: err?.message || "Failed to update lead status",
                  type: "error",
                });
              },
            },
          );
        }}
        loading={updateStatusMutation.isPending}
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
    </>
  );
}
