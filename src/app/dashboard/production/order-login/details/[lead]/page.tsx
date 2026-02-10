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
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
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
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  ArrowUpRight,
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
  canOrderLogin,
  canMoveToProduction,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canWorkTodoTaskOrderLoginStage,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import MoveToProductionModal from "@/components/production/order-login-stage/MoveToProductionModal";
import { useLeadProductionReadiness } from "@/api/production/order-login";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import { useChatTabFromUrl } from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";

export default function OrderLoginLeadDetails() {
  const { lead: leadId } = useParams();
  const searchParams = useSearchParams();
  const leadIdNum = Number(leadId);
  const instanceId = searchParams.get("instance_id");
  const instanceIdNum = instanceId ? Number(instanceId) : null;
  const validInstanceId =
    instanceIdNum && !Number.isNaN(instanceIdNum) ? instanceIdNum : null;

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type,
  );

  const { data: readiness, isLoading: readinessLoading } =
    useLeadProductionReadiness(vendorId, leadIdNum, validInstanceId ?? undefined);

  // derive convenience flags & message
  const lacksProdFiles = readiness ? !readiness.productionFiles?.hasAny : false;
  const canMove = readiness?.readyForProduction === true;
  const canMoveToProductionStage = canMoveToProduction(userType);
  const canViewTodoTask = canWorkTodoTaskOrderLoginStage(userType);
  const canViewSiteHistory = canViewSiteHistoryTab(userType);

  const disabledReason = readinessLoading
    ? "Checking production prerequisites..."
    : !readiness
      ? "Production readiness data unavailable"
      : lacksProdFiles
        ? "Production files are required before moving forward"
        : "";

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userType === "backend" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  const [openMoveToProduction, setOpenMoveToProduction] = useState(false);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const { data: instancesResponse } = useLeadProductStructureInstances(
    leadIdNum,
    vendorId,
  );

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();
  const lead = data?.data?.lead;

  const client_required_order_login_complition_date =
    lead?.client_required_order_login_complition_date;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const instances = Array.isArray(instancesResponse?.data)
    ? instancesResponse?.data
    : instancesResponse?.data?.data || [];
  const totalInstanceCount =
    instances.length || lead?.productStructureInstances?.length || 0;
  const instanceSuffix =
    validInstanceId && totalInstanceCount > 1
      ? (instances.find(
          (instance: any) => instance.id === validInstanceId,
        ) ??
          lead?.productStructureInstances?.find(
            (instance: any) => instance.id === validInstanceId,
          ))?.quantity_index
      : null;
  const displayLeadCode =
    leadCode && instanceSuffix ? `${leadCode}.${instanceSuffix}` : leadCode;
  const instanceName = validInstanceId
    ? (instances.find((instance: any) => instance.id === validInstanceId) ??
        lead?.productStructureInstances?.find(
          (instance: any) => instance.id === validInstanceId,
        ))?.title ?? ""
    : "";
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
      },
    );

    setOpenDelete(false);
  };

  if (isLoading) {
    return <p className="p-6">Loading order login lead details...</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment = canViewPaymentTab(userType);
  return (
    <>
      {/* Header */}
      <header className="flex shrink-0 flex-col gap-2 px-4 py-2 border-b md:h-16 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <p className="font-bold text-sm sm:text-base break-words">
                    {displayLeadCode || "Loading…"}
                    {displayLeadCode && (clientName ? ` - ${clientName}` : "")}
                    {instanceName ? ` • ${instanceName}` : ""}
                  </p>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
          <div className="flex items-center justify-end gap-2">
            {/* ✅ Show only if user has permission */}
            {canMoveToProductionStage &&
              (canMove ? (
                <Button
                  size="sm"
                  variant="default"
                  className="hidden md:flex items-center gap-1  "
                  onClick={() => setOpenMoveToProduction(true)}
                >
                  <ArrowUpRight size={16} />
                  Move To Production
                </Button>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <Button
                      variant="outline"
                      className="hidden md:flex"
                      disabled={true}
                    >
                      <ArrowUpRight size={16} />
                      Move To Production
                    </Button>
                  }
                  value={
                    disabledReason || "Not eligible to move to Production yet"
                  }
                />
              ))}
          </div>
          <Button
            size="sm"
            className="hidden lg:block"
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
              <DropdownMenuItem
                className="lg:hidden"
                onClick={() => setAssignOpen(true)}
              >
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>

              {canMoveToProductionStage &&
                (canMove ? (
                  <DropdownMenuItem
                    className="md:hidden"
                    onClick={() => setOpenMoveToProduction(true)}
                  >
                    <ArrowUpRight size={16} />
                    Move To Production
                  </DropdownMenuItem>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <DropdownMenuItem className="md:hidden" disabled={true}>
                        <ArrowUpRight size={16} />
                        Move To Production
                      </DropdownMenuItem>
                    }
                    value={
                      disabledReason || "Not eligible to move to Production yet"
                    }
                  />
                ))}
              {/* --- NEW: Lead Status submenu (Mark On Hold / Mark As Lost) */}
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
        className="w-full p-3 md:p-6"
      >
        <ScrollArea>
          <div className="w-full h-full flex justify-between items-center">
            <div>
              <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                <TabsTrigger value="details">
                  <HouseIcon size={16} className="mr-1 opacity-60" />
                  Lead Details
                </TabsTrigger>

                {canViewTodoTask ? (
                  // Actual Tab
                  <TabsTrigger value="todo">
                    <PanelsTopLeftIcon size={16} className="mr-1" />
                    To-Do Task
                  </TabsTrigger>
                ) : (
                  // Restricted Tab With Tooltip Message
                  <CustomeTooltip
                    value="Only Backend access to this tab."
                    truncateValue={
                      <TabsTrigger value="todo" disabled>
                        <PanelsTopLeftIcon
                          size={16}
                          className="mr-1 opacity-60"
                        />
                        To-Do Task
                      </TabsTrigger>
                    }
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
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="details">
          <LeadDetailsGrouped
            status="orderLogin"
            defaultTab={canOrderLogin(userType) ? "orderLogin" : "techcheck"}
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="production"
            orderLoginInstanceId={
              instanceIdNum && !Number.isNaN(instanceIdNum)
                ? instanceIdNum
                : null
            }
          />
        </TabsContent>

        <TabsContent value="todo">
          <LeadDetailsGrouped
            status="orderLogin"
            defaultTab={canOrderLogin(userType) ? "orderLogin" : "techcheck"}
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="production"
            orderLoginInstanceId={
              instanceIdNum && !Number.isNaN(instanceIdNum)
                ? instanceIdNum
                : null
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

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
      </Tabs>

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
            },
          );
        }}
        loading={updateStatusMutation.isPending}
      />

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
        onlyFollowUp
        data={{ id: leadIdNum, name: "" }}
      />

      <MoveToProductionModal
        open={openMoveToProduction}
        onOpenChange={setOpenMoveToProduction}
        data={{ id: Number(leadId), accountId, instanceId: validInstanceId }}
        client_required_order_login_complition_date={
          client_required_order_login_complition_date
        }
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
    </>
  );
}
