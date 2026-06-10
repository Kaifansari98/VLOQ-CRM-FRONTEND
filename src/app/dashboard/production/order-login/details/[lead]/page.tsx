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
import { useLeadById, useLeadSuperAdminApprovalLockIns } from "@/hooks/useLeadsQueries";
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
  ArrowUpRight,
  Clock,
  UserPlus,
  MessageSquare,
  User2,
  Layers3,
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
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useBlockLead, useUnblockLead } from "@/hooks/useLeadsQueries";
import { Lock, LockOpen } from "lucide-react";

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
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType = userType;

  const { data: readiness, isLoading: readinessLoading } =
    useLeadProductionReadiness(
      vendorId,
      leadIdNum,
      validInstanceId ?? undefined,
    );
  const {
    data: orderLoginLockIns = [],
    isLoading: orderLoginLockInsLoading,
  } = useLeadSuperAdminApprovalLockIns(vendorId, leadIdNum, "order_login");

  // derive convenience flags & message
  const lacksProdFiles = readiness ? !readiness.productionFiles?.hasAny : false;
  const canMove = readiness?.readyForProduction === true;
  const canMoveToProductionStage =
    userType === "custom"
      ? customPrivilegeCodes.includes(
        "production.order_login.move_to_production.enable_disable",
      )
      : canMoveToProduction(effectiveUserType);
  const canViewTodoTask =
    userType === "custom"
      ? customPrivilegeCodes.includes(
        "production.order_login.approved_documents.view",
      ) ||
      customPrivilegeCodes.includes(
        "production.order_login.production_files.view",
      ) ||
      customPrivilegeCodes.includes(
        "production.order_login.order_login_details.enable_disable",
      )
      : canWorkTodoTaskOrderLoginStage(effectiveUserType);
  const canViewOrderLoginTabByDefault =
    userType === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith("production.order_login."),
      )
      : canOrderLogin(effectiveUserType);
  const canViewSiteHistory =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.site_history.enable_disable",
      )
      : canViewSiteHistoryTab(effectiveUserType) &&
      effectiveUserType?.toLowerCase() !== "admin";
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

  const hasPendingOrderLoginApproval = orderLoginLockIns.some((lockIn) => {
    const pendingTasks = Array.isArray(lockIn.pending_tasks)
      ? lockIn.pending_tasks
      : [];

    if (validInstanceId) {
      return pendingTasks.some((task) => task.instance_id === validInstanceId);
    }

    if (pendingTasks.length > 0) {
      return true;
    }

    return !lockIn.is_approved;
  });
  const isOrderLoginApprovalPending =
    orderLoginLockInsLoading || hasPendingOrderLoginApproval;
  const orderLoginApprovalTooltip = orderLoginLockInsLoading
    ? "Checking accounts approval status"
    : "Accounts approval for Order Login is still pending";

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
  const smallOrderTypeKey =
    lead?.smallOrderRequest?.requestType?.type_key ?? null;
  const shouldRequireProductionFiles =
    !lead?.is_small_order_request ||
    ["additional_panel", "one_cabinet"].includes(
      String(smallOrderTypeKey ?? "").toLowerCase(),
    );
  const effectiveLacksProdFiles = shouldRequireProductionFiles && lacksProdFiles;
  const disabledReason = readinessLoading
    ? "Checking production prerequisites..."
    : !readiness
      ? "Production readiness data unavailable"
      : effectiveLacksProdFiles
        ? "Production files are required before moving forward"
        : "";
  const moveToProductionDisabledReason = isOrderLoginApprovalPending
    ? orderLoginApprovalTooltip
    : disabledReason || "Not eligible to move to Production yet";

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
      ? (
        instances.find((instance: any) => instance.id === validInstanceId) ??
        lead?.productStructureInstances?.find(
          (instance: any) => instance.id === validInstanceId,
        )
      )?.quantity_index
      : null;
  const displayLeadCode =
    leadCode && instanceSuffix ? `${leadCode}.${instanceSuffix}` : leadCode;
  const instanceName = validInstanceId
    ? ((
      instances.find((instance: any) => instance.id === validInstanceId) ??
      lead?.productStructureInstances?.find(
        (instance: any) => instance.id === validInstanceId,
      )
    )?.title ?? "")
    : "";
  const accountId = Number(lead?.account_id);




  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
  } = useLeadAccessControl({
    leadId: leadIdNum,
    userType,
    lead,
  });

  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const isBlockActionPending =
    blockLeadMutation.isPending ||
    unblockLeadMutation.isPending;
  const deleteLeadMutation = useDeleteLead();



  const handleToggleLeadBlock = () => {
    if (!vendorId || !userId || !leadIdNum) return;

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
    return <p className="p-6">Loading order login lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  const canReassign = canReassignLeadButton(effectiveUserType ?? "");
  const canDelete = canDeleteLeadButton(effectiveUserType ?? "");
  const canEdit = canEditLeadButton(effectiveUserType ?? "");
  const canViewPayment =
    effectiveUserType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.payment_information.enable_disable",
      )
      : canViewPaymentTab(effectiveUserType ?? "");
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
                  <div className="flex flex-wrap items-center gap-2">
                    {displayLeadCode ? (
                      <>
                        {/* Dot + Lead Code */}
                        <span className="inline-flex items-center gap-1.5 font-semibold text-sm text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {displayLeadCode}
                        </span>

                        {clientName && (
                          <>
                            {/* Separator */}
                            <span className="text-muted-foreground">|</span>

                            {/* Client Name */}
                            <span className="inline-flex items-center gap-1.5 font-medium text-sm text-foreground">
                              <User2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {clientName}
                            </span>
                          </>
                        )}

                        {instanceName && (
                          <>
                            {/* Separator */}
                            <span className="text-muted-foreground">-</span>

                            {/* Instance Name */}
                            <span className="inline-flex items-center gap-1.5 font-medium text-xs text-muted-foreground">
                              <Layers3 className="w-3 h-3" />
                              {instanceName}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Loading…
                      </span>
                    )}
                  </div>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
          <div className="flex items-center justify-end gap-2">
            {/* ✅ Show only if user has permission */}
            {canMoveToProductionStage &&
              (() => {

                if (shouldDisableBlockedActions) {
                  return (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <Button
                          variant="outline"
                          disabled
                          className="hidden md:flex"
                        >
                          <ArrowUpRight size={16} />
                          Move To Production
                        </Button>
                      }
                    />
                  );
                }

                if (canMove && !isOrderLoginApprovalPending) {
                  return (
                    <Button
                      size="sm"
                      onClick={() => setOpenMoveToProduction(true)}
                    >
                      <ArrowUpRight size={16} />
                      Move To Production
                    </Button>
                  );
                }

                return (
                  <CustomeTooltip
                    value={
                      moveToProductionDisabledReason
                    }
                    truncateValue={
                      <Button
                        variant="outline"
                        disabled
                        className="hidden md:flex"
                      >
                        <ArrowUpRight size={16} />
                        Move To Production
                      </Button>
                    }
                  />
                );
              })()}
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
                (() => {

                  if (shouldDisableBlockedActions) {
                    // Lead block handling added for DropdownMenu action
                    return (
                      <CustomeTooltip
                        value={blockedTooltip}
                        truncateValue={
                          <DropdownMenuItem
                            disabled
                            className="md:hidden"
                          >
                            <ArrowUpRight size={16} />
                            Move To Production
                          </DropdownMenuItem>
                        }
                      />
                    );
                  }

                  if (canMove && !isOrderLoginApprovalPending) {
                    return (
                      <DropdownMenuItem
                        className="md:hidden"
                        onClick={() =>
                          setOpenMoveToProduction(true)
                        }
                      >
                        <ArrowUpRight size={16} />
                        Move To Production
                      </DropdownMenuItem>
                    );
                  }

                  return (
                    <CustomeTooltip
                      value={
                        moveToProductionDisabledReason
                      }
                      truncateValue={
                        <DropdownMenuItem
                          className="md:hidden"
                          disabled
                        >
                          <ArrowUpRight size={16} />
                          Move To Production
                        </DropdownMenuItem>
                      }
                    />
                  );
                })()}
              {/* --- NEW: Lead Status submenu (Mark On Hold / Mark As Lost) */}
              {/* Lead block handling added for DropdownMenu action */}
              {shouldDisableBlockedActions ? (
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
                    <PencilLine size={16} className="mr-1" />
                    To-Do Task
                  </TabsTrigger>
                ) : (
                  // Restricted Tab With Tooltip Message
                  <CustomeTooltip
                    value={
                      userType === "custom"
                        ? "You don’t have permission to access To-Do Tasks."
                        : "Only Backend access to this tab."
                    }
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
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="details">
          <LeadDetailsGrouped
            status="orderLogin"
            defaultTab={
              canViewOrderLoginTabByDefault ? "orderLogin" : "techcheck"
            }
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
            defaultTab={
              canViewOrderLoginTabByDefault ? "orderLogin" : "techcheck"
            }
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
              upToStage="techCheck"
            />
          </TabsContent>
        )}
      </Tabs>

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
                  title: err?.message || "Failed to update lead status",
                  type: "error",
                });
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
          ? "This will unblock the lead and allow normal actions."
          : "This will block the lead and disable lead actions."}
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
    </>
  );
}
