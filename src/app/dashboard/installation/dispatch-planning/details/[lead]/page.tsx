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
  Move,
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
  canDoDispatchPlanning,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  useDispatchReadinessStatus,
  useMoveLeadToDispatch,
} from "@/api/installation/useDispatchPlanning";
import { useQueryClient } from "@tanstack/react-query";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { toastError } from "@/lib/utils";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import { useBlockLead, useUnblockLead } from "@/hooks/useLeadsQueries";
import { Lock, LockOpen } from "lucide-react";

export default function DispatchPlanningLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const searchParams = useSearchParams();
  const leadIdNum = Number(leadId);
  const instanceIdParam = searchParams.get("instance_id");
  const validInstanceId = instanceIdParam && !Number.isNaN(Number(instanceIdParam)) ? Number(instanceIdParam) : null;
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userType?.toLowerCase() === "sales-executive" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [openMoveConfirm, setOpenMoveConfirm] = useState(false);

  const { data: readinessStatus, isLoading: readinessLoading } =
    useDispatchReadinessStatus(vendorId, leadIdNum);
  const moveMutation = useMoveLeadToDispatch();

  const isReadyForDispatch = readinessStatus?.is_ready_for_dispatch ?? false;
  const missingFields = readinessStatus?.missing_fields ?? [];

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

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

const [openBlockConfirm, setOpenBlockConfirm] = useState(false);

const blockLeadMutation = useBlockLead();
const unblockLeadMutation = useUnblockLead();

const isBlockActionPending =
  blockLeadMutation.isPending ||
  unblockLeadMutation.isPending;

  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead || isChatNotification) return;
    if (userType?.toLowerCase() === "sales-executive" && !isLeadBlocked && !lead.is_draft) {
      setActiveTab("todo");
    }
  }, [isLoading, isLeadBlockStatusLoading, lead, isChatNotification, userType, isLeadBlocked]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

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
        onError: () =>
          toastManager.add({ title: "Failed to delete lead", type: "error" }),
      },
    );

    setOpenDelete(false);
  };




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

        queryClient.invalidateQueries({
          queryKey: ["leadById", leadIdNum],
        });
      },
    },
  );
};
  if (isLoading && !lead) {
    return <p className="p-6">Loading Dispatch Planning lead details...</p>;
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
  const canMoveToDispatch =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin" ||
    userType?.toLowerCase() === "sales-executive" ||
    (userType?.toLowerCase() === "custom" &&
      customPrivilegeCodes.includes(
        "installation.dispatch_planning.move_to_dispatch.enable_disable",
      ));
  const canShowTodoTab =
    !isAuditor &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith("installation.dispatch_planning."),
        )
      : canDoDispatchPlanning(userType));

  console.log("user can move to dispatch :- ", canMoveToDispatch);
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
          <div className="flex items-center gap-2">
            {/* Move to Dispatch Button */}
           {!isAuditor && (
             shouldDisableBlockedActions ? (
              <CustomeTooltip
                value={blockedTooltip}
                truncateValue={
                  <span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="hidden sm:block"
                    >
                      Move to Dispatch
                    </Button>
                  </span>
                }
              />
            ) : canMoveToDispatch ? (
              isReadyForDispatch ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setOpenMoveConfirm(true)}
                  disabled={moveMutation.isPending}
                  className="hidden sm:block cursor-pointer"
                >
                  {moveMutation.isPending
                    ? "Moving..."
                    : "Move to Dispatch"}
                </Button>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <Button
                      size="sm"
                      variant="outline"
                      className="hidden sm:block"
                      disabled
                    >
                      Move to Dispatch
                    </Button>
                  }
                  value={
                    readinessLoading
                      ? "Checking dispatch readiness..."
                      : `Cannot move yet. Missing: ${
                          missingFields.join(", ") || "data"
                        }`
                  }
                />
              )
            ) : (
              <CustomeTooltip
                truncateValue={
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden sm:block"
                    disabled
                  >
                    Move to Dispatch
                  </Button>
                }
                value="You do not have permission to move this lead to Dispatch."
              />
            )
           )}

            {/* Assign Task Button */}
            {!isAuditor && (
              <Button
                size="sm"
                className="hidden sm:flex"
                onClick={() => setAssignOpen(true)}
              >
                Assign Task
              </Button>
            )}
          </div>

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
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assing Task
                </DropdownMenuItem>

                {shouldDisableBlockedActions ? (
                  // Lead block handling added for DropdownMenu action
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Move size={20} />
                        Move to Dispatch
                      </DropdownMenuItem>
                    }
                  />
                ) : canMoveToDispatch ? (
                  isReadyForDispatch ? (
                    <DropdownMenuItem onClick={() => setOpenMoveConfirm(true)}>
                      <Move size={20} />
                      Move to Dispatch
                    </DropdownMenuItem>
                  ) : (
                    <CustomeTooltip
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <Move size={20} />
                          Move to Dispatch
                        </DropdownMenuItem>
                      }
                      value={
                        readinessLoading
                          ? "Checking dispatch readiness..."
                          : `Cannot move yet. Missing: ${
                              missingFields.join(", ") || "data"
                            }`
                      }
                    />
                  )
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Move size={20} />
                        Move to Dispatch
                      </DropdownMenuItem>
                    }
                    value="You do not have permission to move this lead to Dispatch."
                  />
                )}
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
                      setActivityType("onHold");
                      setActivityModalOpen(true);
                    }}
                  >
                    <Clock className="m h-4 w-4" />
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


  {userType === "super-admin" && (
    <>
      

      <DropdownMenuItem
        onClick={() => setOpenBlockConfirm(true)}
      >
        {isLeadBlocked ? (
          <>
            <LockOpen size={16} />
            Unblock Lead
          </>
        ) : (
          <>
            <Lock size={16} />
            Block Lead
          </>
        )}
      </DropdownMenuItem>
    </>
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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val)}
        className="w-full p-3 md:p-6 space-y-2"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            {/* ✅ Dispatch Planning Details */}
            <TabsTrigger value="details">
              <PencilLine size={16} className="mr-1 opacity-60" />
              Dispatch Planning Details
            </TabsTrigger>

            {/* ✅ To-Do Task (Conditional Access) */}
            {!isAuditor && (
              canShowTodoTab ? (
                <TabsTrigger value="todo">
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
                    userType?.toLowerCase() === "custom"
                      ? "You don’t have permission to access To-Do Tasks."
                      : "Only Admin or Sales Executive can access this tab"
                  }
                />
              )
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

        <TabsContent value="details">
          <LeadDetailsGrouped
            status="dispatchPlanning"
            defaultTab="dispatchPlanning"
            leadId={leadIdNum}
            accountId={accountId}
            defaultParentTab="installation"
            dispatchPlanningInstanceId={validInstanceId}
          />
        </TabsContent>

        {canShowTodoTab && (
          <TabsContent value="todo">
            <LeadDetailsGrouped
              status="dispatchPlanning"
              defaultTab="dispatchPlanning"
              leadId={leadIdNum}
              accountId={accountId}
              defaultParentTab="installation"
              dispatchPlanningInstanceId={validInstanceId}
            />
          </TabsContent>
        )}

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
              upToStage="siteReadiness"
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

      {/* ✅ Move to Dispatch Confirmation Modal */}
      <AlertDialog open={openMoveConfirm} onOpenChange={setOpenMoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move to Dispatch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this lead to the Dispatch stage?
              <br />
              Once moved, this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await moveMutation.mutateAsync({
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    payload: { updated_by: userId! },
                  });
                  toastManager.add({
                    title: "Lead successfully moved to Dispatch stage 🚚",
                    type: "success",
                  });
                  queryClient.invalidateQueries({ queryKey: ["leadStats"] });
                  queryClient.invalidateQueries({
                    queryKey: ["universal-stage-leads"],
                    exact: false,
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["vendorOverallLeads"],
                  });
                  router.push("/dashboard/installation/dispatch-stage/");
                  setOpenMoveConfirm(false);
                } catch (err: unknown) {
                  toastError(err);
                }
              }}
            >
              Confirm & Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        vendorId={vendorId}
        franchiseId={lead?.franchise_id ?? null}
        leadId={leadIdNum}
        onSubmitRemark={(remark, dueDate, selection) => {
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
                ...(dueDate ? { dueDate } : {}),
                ...(selection ?? {}),
              },
            },
            {
              onSuccess: (res: any) => {
                const finalStatus = res?.data?.activity_status ?? res?.data?.lead?.activity_status;
                toastManager.add({
                  title:
                    activityType === "onHold"
                      ? "Lead marked as On Hold!"
                      : finalStatus === "lostApproval"
                        ? "Lead sent for Lost Approval!"
                        : "Lead marked as Lost!",
                  type: "success",
                });
                window.location.assign("/dashboard/leads/leadstable?tab=onHold");
              },
              onError: (err) => {
                toastManager.add({
                  title: err || "Failed to update lead status",
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
          ? "This will unblock the lead and allow normal actions."
          : "This will block the lead and disable all actions except Assign Task."}
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>
        Cancel
      </AlertDialogCancel>

      <AlertDialogAction
        onClick={handleToggleLeadBlock}
        disabled={isBlockActionPending}
      >
        {isBlockActionPending
          ? "Processing..."
          : isLeadBlocked
            ? "Unblock Lead"
            : "Block Lead"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </>
  );
}
