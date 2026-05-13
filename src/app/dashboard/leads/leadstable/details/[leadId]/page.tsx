"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { useAppSelector } from "@/redux/store";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  SquarePen,
  Users,
  XCircle,
  Clock,
  EllipsisVertical,
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  CircleArrowOutUpRight,
  UserPlus,
  MessageSquare,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { toastManager } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
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
import { useLeadById } from "@/hooks/useLeadsQueries";
import {
  canAssignISM,
  canReassignLeadButton,
  canDeleteLedForSalesExecutiveButton,
  canEditLeadForSalesExecutiveButton,
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
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

export default function LeadDetails() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = Number(searchParams.get("accountId")) || 0;

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const [openDelete, setOpenDelete] = useState(false);
  const deleteLeadMutation = useDeleteLead();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const isDraftLead = !!lead?.is_draft;
  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const LeadStage = lead?.statusType?.type;
  console.log("Lead Stage :- ", LeadStage);

  const uiDisabled = isLoading || !lead;

  const updateActivityStatusMutation = useUpdateActivityStatus();

  // modals
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval" | "lost">(
    "onHold",
  );

  const normalizedUserType = userType?.trim().toLowerCase();
  const shouldDirectlyMarkLost =
    normalizedUserType === "admin" || normalizedUserType === "super-admin";
  const canReassign =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.reassign_lead",
        )
      : canReassignLeadButton(userType);
  const canAccessAssignTask =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.assign_task.ism_assign_task",
        ) ||
        customPrivilegeCodes.includes(
          "leads.open_leads.assign_task.follow_up_task",
        )
      : canAssignISM(userType);
  const canDelete =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes("leads.open_leads.details_of_lead.delete")
      : canDeleteLedForSalesExecutiveButton(userType);
  const canMarkOnHold =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.mark_on_hold",
        )
      : true;
  const canMarkAsLost =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.mark_as_lost",
        )
      : true;
  const canEdit =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes("leads.open_leads.details_of_lead.edit")
      : canEditLeadForSalesExecutiveButton(userType);
  const canViewPayment =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
      : canViewPaymentTab(userType);
  const canViewSiteHistory =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.site_history.enable_disable",
        )
      : canViewSiteHistoryTab(userType) && userType?.toLowerCase() !== "admin";

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

          // ✅ Invalidate both queries so they refetch
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpenuniversal-stage-leads"],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          // ✅ Redirect to table after invalidation
          router.push("/dashboard/leads/leadstable");
        },
        onError: (error: any) => {
          toastManager.add({
            title: error?.message || "Failed to delete lead!",
            type: "error",
          });
        },
      },
    );
  };

  const hasAutoOpenedAssign = useRef(false);
  const isChatNotification = useIsChatNotification();

  useEffect(() => {
    if (!lead) return;
    if (isChatNotification) return;
    if (hasAutoOpenedAssign.current) return;

    if (
      !lead.is_draft &&
      canAccessAssignTask &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      hasAutoOpenedAssign.current = true; // ✅ lock it
      setAssignOpen(true);
      setActiveTab("projects");
    }
  }, [isChatNotification, lead?.id, userType, canAccessAssignTask]);

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);

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
          {canAccessAssignTask &&
            (isDraftLead ? (
              <CustomeTooltip
                truncateValue={
                  <Button size="sm" disabled>
                    Assign Task
                  </Button>
                }
                value="This action cannot be performed because the lead is still in Draft mode."
              />
            ) : (
              <Button
                size="sm"
                className="hidden sm:flex"
                onClick={() => setAssignOpen(true)}
                disabled={uiDisabled}
              >
                Assign Task
              </Button>
            ))}

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          <NotificationBell />
          <AnimatedThemeToggler />

          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative bg-accent p-1.5 rounded-sm"
              >
                <EllipsisVertical size={22} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canAccessAssignTask && (
                <DropdownMenuItem
                  className="sm:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assign Task
                </DropdownMenuItem>
              )}

              {canEdit && (
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen className=" h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}

              {canReassign && (
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users className="h-4 w-4" />
                  Reassign Lead
                </DropdownMenuItem>
              )}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <CircleArrowOutUpRight className="h-4 w-4" />
                  <span>Lead Status</span>
                </DropdownMenuSubTrigger>

                {!uiDisabled && (
                  <DropdownMenuSubContent>
                    {canMarkOnHold && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setActivityType("onHold");
                          setActivityModalOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark On Hold
                      </DropdownMenuItem>
                    )}

                    {canMarkAsLost && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setActivityType(
                            shouldDirectlyMarkLost ? "lost" : "lostApproval",
                          );
                          setActivityModalOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark As Lost
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                )}
              </DropdownMenuSub>

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  {uiDisabled ? (
                    <CustomeTooltip
                      truncateValue={
                        <DropdownMenuItem disabled>Delete</DropdownMenuItem>
                      }
                      value="Please wait while the lead loads."
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

      {/* 🔹 Tabs bar above content */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "projects") {
            if (isDraftLead || uiDisabled) return; // ✅ block in draft/loading
            setAssignOpen(true);
            return;
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

            {canAccessAssignTask &&
              (isDraftLead ? (
                <CustomeTooltip
                  truncateValue={
                    <TabsTrigger value="projects" disabled>
                      <PencilLine size={16} className="mr-1 opacity-60" />
                      To-Do Task
                    </TabsTrigger>
                  }
                  value="This action cannot be performed because the lead is still in Draft mode."
                />
              ) : (
                <TabsTrigger value="projects" disabled={uiDisabled}>
                  <PencilLine size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ))}

            {canViewSiteHistory && (
              <TabsTrigger value="history" disabled={uiDisabled}>
                <History size={16} className="mr-1 opacity-60" />
                History
              </TabsTrigger>
            )}
            {canViewPayment && (
              <TabsTrigger value="team" disabled={uiDisabled}>
                <IndianRupee size={16} className="mr-1 opacity-60" />
                Payment
              </TabsTrigger>
            )}
            <TabsTrigger value="chats" disabled={uiDisabled}>
              <MessageSquare size={16} className="mr-1 opacity-60" />
              Chats
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* 🔹 Tab Contents */}
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
          <TabsContent value="team">
            <PaymentComingSoon />
          </TabsContent>
        )}

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
      </Tabs>

      {/* ✅ Modals */}
      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) {
            // when modal closes, go back to details tab
            setActiveTab("details");
          }
        }}
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
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Missing vendor/user info",
              type: "error",
            });
            return;
          }
          const status =
            activityType === "onHold"
              ? "onHold"
              : activityType === "lost"
                ? "lost"
                : "lostApproval";
          updateActivityStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId,
                userId,
                status,
                remark,
                createdBy: userId,
                ...(status === "onHold" ? { dueDate } : {}),
              },
            },
            {
              onSuccess: () => {
                toastManager.add({
                  title:
                    status === "onHold"
                      ? "Lead marked as On Hold!"
                      : status === "lost"
                        ? "Lead marked as Lost!"
                        : "Lead sent for Lost Approval!",
                  type: "success",
                });
                setActivityModalOpen(false);
              },
            },
          );
        }}
        loading={updateActivityStatusMutation.isPending}
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
