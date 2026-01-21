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
import {
  canDoSR,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  useCheckSiteReadinessCompletion,
  useMoveLeadToDispatchPlanning,
} from "@/api/installation/useSiteReadinessLeads";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";

export default function ReadyToDispatchLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type
  );

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userType?.toLowerCase() === "site-supervisor" ? "todo" : "details"
  );
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

  const deleteLeadMutation = useDeleteLead();

  useEffect(() => {
    if (isChatNotification) return;
    if (userType?.toLowerCase() === "site-supervisor") {
      setActiveTab("todo");
    }
  }, [isChatNotification, userType]);

  const { data: readinessStatus, isLoading: checkingStatus } =
    useCheckSiteReadinessCompletion(vendorId, leadIdNum);

  const moveToDispatchMutation = useMoveLeadToDispatchPlanning();

  const [openMoveConfirm, setOpenMoveConfirm] = useState(false);

  const isCompleted = readinessStatus?.is_site_readiness_completed ?? false;

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment = canViewPaymentTab(userType);

  const handleMoveToDispatch = async () => {
    try {
      await moveToDispatchMutation.mutateAsync({
        vendorId: vendorId!,
        leadId: leadIdNum,
        updated_by: userId!,
      });
      toast.success("Lead moved to Dispatch Planning successfully!");
      router.push("/dashboard/installation/dispatch-planning/");
      queryClient.invalidateQueries({
        queryKey: ["leadStats"],
      });

      queryClient.invalidateQueries({
        queryKey: ["universal-stage-leads"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["vendorOverallLeads"],
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to move lead");
    } finally {
      setOpenMoveConfirm(false);
    }
  };

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toast.error("Missing vendor or user info!");
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => toast.success("Lead deleted successfully!"),
        onError: (err) => toast.error("Failed to delete lead"),
      }
    );

    setOpenDelete(false);
  };

  if (isLoading) {
    return <p className="p-6">Loading Ready-To-Dispatch lead details...</p>;
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
          {/* ✅ Move to Dispatch Planning Button */}
          {isCompleted ? (
            <Button
              size="sm"
              variant="default"
              className="hidden sm:flex"
              onClick={() => setOpenMoveConfirm(true)}
              disabled={moveToDispatchMutation.isPending}
            >
              <Truck size={16} />
              Move to Dispatch Planning
            </Button>
          ) : (
            <CustomeTooltip
              truncateValue={
                <Button
                  size="sm"
                  disabled
                  variant="outline"
                  className="hidden sm:flex"
                >
                  Move to Dispatch Planning
                </Button>
              }
              value="Complete all 6 Site Readiness items and upload at least one current site photo to enable this action."
            />
          )}

          {/* Assign Task Button */}
          <Button
            size="sm"
            className="hidden lg:flex"
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
              <DropdownMenuItem className="lg:hidden">
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>

              {isCompleted ? (
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => setOpenMoveConfirm(true)}
                >
                  <Truck size={16} />
                  Move to Dispatch Planning
                </DropdownMenuItem>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="sm:hidden" disabled>
                      <Truck size={16} />
                      Move to Dispatch Planning
                    </DropdownMenuItem>
                  }
                  value="Complete all 6 Site Readiness items and upload at least one current site photo to enable this action."
                />
              )}
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
        onValueChange={(val) => setActiveTab(val)}
        className="w-full p-3 md:p-6 pt-4"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            {/* ✅ Site Readiness Details */}
            <TabsTrigger value="details">
              <Truck size={16} className="mr-1 opacity-60" />
              Site Readiness Details
            </TabsTrigger>

            {/* ✅ To-Do Task (Conditional Access) */}
            {canDoSR(userType) ? (
              <TabsTrigger value="todo">
                <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                To-Do Task
              </TabsTrigger>
            ) : (
              <CustomeTooltip
                truncateValue={
                  <TabsTrigger value="todo" disabled>
                    <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                    To-Do Task
                  </TabsTrigger>
                }
                value="Only Admin or Site Supervisor can access this tab"
              />
            )}

            {/* ✅ Site History */}
            <TabsTrigger value="history">
              <BoxIcon size={16} className="mr-1 opacity-60" />
              Site History
            </TabsTrigger>

            {/* ✅ Payment Info */}
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

          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="details">
          <LeadDetailsGrouped
            status="siteReadiness"
            defaultTab="siteReadiness"
            leadId={leadIdNum}
            accountId={accountId}
            maxVisibleStage="siteReadiness"
          />
        </TabsContent>

        {/* ✅ To-Do Task (Same as Site Readiness Details, but only for canAssignSR) */}
        {canDoSR(userType) && (
          <TabsContent value="todo">
            <LeadDetailsGrouped
              status="siteReadiness"
              defaultTab="siteReadiness"
              leadId={leadIdNum}
              accountId={accountId}
              maxVisibleStage="siteReadiness"
            />
          </TabsContent>
        )}

        <TabsContent value="history">
          <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
        </TabsContent>

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

      {/* Confirm Move to Dispatch Planning */}
      <AlertDialog open={openMoveConfirm} onOpenChange={setOpenMoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Lead to Dispatch Planning?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this lead to the Dispatch Planning
              stage? This action will update the lead’s workflow stage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToDispatch}
              disabled={moveToDispatchMutation.isPending}
            >
              {moveToDispatchMutation.isPending
                ? "Moving..."
                : "Move to Dispatch Planning"}
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
              onError: (err) => {
                toast.error(err || "Failed to update lead status");
              },
            }
          );
        }}
        loading={updateStatusMutation.isPending}
      />
    </>
  );
}
