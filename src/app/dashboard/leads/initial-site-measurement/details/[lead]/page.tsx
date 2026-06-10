"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useEffect, useState } from "react";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  CircleArrowOutUpRight,
  Clock,
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
  HouseIcon,
  UserPlus,
  MessageSquare,
  ClipboardCheck,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
  LockOpen,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
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
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import InitialSiteMeasuresMent from "@/components/sales-executive/Lead/initial-site-measurement-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLeadById } from "@/hooks/useLeadsQueries";
import {
  canUploadISM,
  canReassignLeadButton,
  canEditLeadForSalesExecutiveButton,
  canDeleteLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import PaymentComingSoon from "@/components/generics/PaymentComingSoon";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import {
  useLeadBlockStatus,
  useBlockLead,
  useUnblockLead,
} from "@/hooks/useLeadsQueries";
import { formatBlockedAt } from "@/lib/utils";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

export default function SiteMeasurementLead() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdateActivityStatus();
  const deleteLeadMutation = useDeleteLead();

  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const searchParams = useSearchParams();
  const accountId = Number(searchParams.get("accountId")) || 0;

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [openDelete, setOpenDelete] = useState(false);
  // Modals
  const [openMeasurement, setOpenMeasurement] = useState(false);
  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">(
    "onHold",
  );

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();
  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
    isPending: isBlockActionPending,
    isLoading: isLeadBlockStatusLoading
  } = useLeadAccessControl({
    leadId: leadIdNum,
    userType,
    lead,
  });

  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();




  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead || isChatNotification) return;
    if (activeTab !== "details") return;

    // ✅ Only open automatically if:
    // - Lead is not draft
    // - Lead is not blocked
    // - User has upload permission
    // - User is NOT admin or super-admin
    if (
      !lead.is_draft &&
      !isLeadBlocked &&
      canUploadISM(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setOpenMeasurement(true);
    }
  }, [isLoading, isLeadBlockStatusLoading, isChatNotification, lead, userType, activeTab, isLeadBlocked]);

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Vendor or User information is missing!",
        type: "error",
      });
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Lead deleted successfully!",
            type: "success",
          });
          setOpenDelete(false);

          queryClient.invalidateQueries({
            queryKey: ["siteMeasurementLeads", vendorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          router.push("/dashboard/leads/initial-site-measurement");
        },
        onError: () => {
          toastManager.add({ title: "Failed to delete lead!", type: "error" });
        },
      },
    );
  };


  const handleToggleLeadBlock = () => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Vendor, user, or lead information is missing!",
        type: "error",
      });
      return;
    }

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
            queryKey: ["lead", leadIdNum, vendorId, userId],
          });
        },
      },
    );
  };



  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const canReassign =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.ism_leads.ism_details.reassign_lead",
      )
      : canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadForSalesExecutiveButton(userType);
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
      : canViewSiteHistoryTab(userType);
  const canViewChats =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.chat.enable_disable",
      )
      : true;
  const canAccessTodoTask =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.ism_leads.ism_details.upload_measurement",
      )
      : true;
  const canMarkOnHold =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.ism_leads.ism_details.mark_on_hold",
      )
      : true;
  const canMarkAsLost =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.ism_leads.ism_details.mark_as_lost",
      )
      : true;
  const canSeeLeadStatusMenu = canMarkOnHold || canMarkAsLost;

  console.log("assigned to", lead?.assignedTo?.id);

  if (isLoading && !lead) {
    return <p className="p-6">Loading lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background">
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
              <DropdownMenuItem
                className="bloack md:hidden"
                onClick={() => setAssignOpen(true)}
              >
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>
              {canUploadISM(userType) && !lead?.is_draft && canAccessTodoTask ? (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <ClipboardCheck size={20} /> Upload Measurement
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onSelect={() => setOpenMeasurement(true)}>
                    <ClipboardCheck size={20} />
                    Upload Measurement
                  </DropdownMenuItem>
                )
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem disabled>
                      <ClipboardCheck size={20} /> Upload Measurement
                    </DropdownMenuItem>
                  }
                  value={
                    lead?.is_draft
                      ? "This action cannot be performed because the lead is still in Draft mode."
                      : "You don't have permission to upload measurements."
                  }
                />
              )}

              {/* Lead Status */}
              {canSeeLeadStatusMenu && (
                // Lead block handling added to prevent submenu opening
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <CircleArrowOutUpRight className="h-4 w-4" />
                        Lead Status
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <CircleArrowOutUpRight className="h-4 w-4" />
                      <span>Lead Status</span>
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent>
                      {canMarkOnHold && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setActivityType("onHold");
                            setActivityModalOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4 " />
                          Mark On Hold
                        </DropdownMenuItem>
                      )}

                      {canMarkAsLost && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setActivityType("lostApproval");
                            setActivityModalOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Mark As Lost
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )
              )}

              {/* Edit */}
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

                  {isLeadBlocked
                    ? "Unblock Lead"
                    : "Block Lead"}
                </DropdownMenuItem>
              )}

              {/* Reassign */}
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

              {/* Delete */}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  {/* Lead block handling added for DropdownMenu action */}
                  {shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          Delete
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
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
        onValueChange={(val) => {
          if (val === "tasks") {
            setOpenMeasurement(true); // open modal
            return; // don't change tab
          }
          setActiveTab(val);
        }}
        className="w-full px-6 pt-4"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>
            {canAccessTodoTask &&
              (shouldDisableBlockedActions ? (
                <CustomeTooltip
                  value={blockedTooltip}
                  truncateValue={
                    <TabsTrigger value="tasks" disabled>
                      <PencilLine size={16} className="mr-1 opacity-60" />
                      To-Do Task
                    </TabsTrigger>
                  }
                />
              ) : (
                <TabsTrigger value="tasks">
                  <PencilLine size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ))}
            {canViewSiteHistory && (
              <TabsTrigger value="history">
                <History size={16} className="mr-1 opacity-60" />
                History
              </TabsTrigger>
            )}
            {canViewPayment && (
              <TabsTrigger value="payments">
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
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab contents */}
        <TabsContent value="details">
          <main className="flex-1 h-fit">
            <LeadDetailsUtil status="details" leadId={leadIdNum} />
          </main>
        </TabsContent>

        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

        {canViewPayment && (
          <TabsContent value="payments">
            <PaymentComingSoon />
          </TabsContent>
        )}

        {canViewChats && (
          <TabsContent value="chats">
            <LeadWiseChatScreen leadId={leadIdNum} />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        data={{ id: leadIdNum, name: "" }}
      />
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
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        onSubmitRemark={(remark, dueDate) => {
          if (!vendorId || !userId || !accountId) return;
          updateStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId,
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
                  title: "Lead status updated successfully!",
                  type: "success",
                });
                queryClient.invalidateQueries({
                  queryKey: ["universal-stage-leads"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["leadStats"],
                });
                router.back();
              },
            },
          );
        }}
        loading={updateStatusMutation.isPending}
      />
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lead.
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
                ? "This will unblock the lead and allow it to proceed normally."
                : "This will block the lead and mark the block time in the system."}
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
                ? isLeadBlocked
                  ? "Unblocking..."
                  : "Blocking..."
                : isLeadBlocked
                  ? "Unblock"
                  : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InitialSiteMeasuresMent
        open={openMeasurement}
        onOpenChange={(open) => {
          setOpenMeasurement(open);
          if (!open) {
            setActiveTab("details"); // return to details tab
          }
        }}
        data={{ id: leadIdNum, accountId, name: "" }}
      />
    </>
  );
}
