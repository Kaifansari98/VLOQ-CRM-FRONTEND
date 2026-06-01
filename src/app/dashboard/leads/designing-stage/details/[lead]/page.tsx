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
import { useLeadById } from "@/hooks/useLeadsQueries";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
  Clock,
  ClipboardCheck,
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  CircleArrowOutUpRight,
  UserIcon,
  MessageSquare,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
} from "lucide-react";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
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
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import BookingModal from "@/components/sales-executive/designing-stage/booking-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useDesigningStageCounts } from "@/hooks/designing-stage/designing-leads-hooks";
import CustomeTooltip from "@/components/custom-tooltip";
import {
  canMoveToBookingStage,
  canReassignLeadButton,
  canDeleteLeadButton,
  canEditLeadForSalesExecutiveButton,
  canAccessDessingTodoTab,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
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

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function DesigningStageLead() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdateActivityStatus();
  const deleteLeadMutation = useDeleteLead();

  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: countsData } = useDesigningStageCounts(vendorId, leadIdNum);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const eligibleBookingDaysValue = useAppSelector(
    (state) => state.auth.user?.vendor?.eligible_booking_days ?? null,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const canUploadQuotation =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.quotation.upload")
      : true;

  const canUploadMeetings =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.meetings.upload")
      : true;

  const canUploadDesigns =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.designs.upload")
      : true;

  const canAccessTodoTab =
    userType?.toLowerCase() === "custom"
      ? (canUploadQuotation || canUploadMeetings || canUploadDesigns)
      : canAccessDessingTodoTab(userType);

  const canMoveToBooking =
    countsData?.QuotationDoc > 0 && countsData?.DesignsDoc > 0;
  const canViewSiteHistory =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.site_history.enable_disable",
        )
      : canViewSiteHistoryTab(userType);
  const canPerformMoveToBooking =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.designing_stage.move_to_booking.action",
        )
      : canMoveToBookingStage(userType);
  const canMarkOnHold =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.designing_stage.details.mark_on_hold",
        )
      : true;
  const canMarkAsLost =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.designing_stage.details.mark_as_lost",
        )
      : true;
  const canSeeLeadStatusMenu = canMarkOnHold || canMarkAsLost;

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const isChatNotification = useIsChatNotification();
  const normalizedUserType = userType?.toLowerCase() ?? "";
  const isSuperAdmin = normalizedUserType === "super-admin";
  const eligibleBookingDays =
    eligibleBookingDaysValue == null
      ? null
      : Number(eligibleBookingDaysValue);
  const leadCreatedAt = lead?.created_at ? new Date(lead.created_at) : null;
  const hasEligibleBookingWindow =
    typeof eligibleBookingDays === "number" &&
    Number.isFinite(eligibleBookingDays) &&
    eligibleBookingDays > 0;
  const bookingEligibleOn =
    leadCreatedAt &&
    !Number.isNaN(leadCreatedAt.getTime()) &&
    hasEligibleBookingWindow
      ? addDays(startOfDay(leadCreatedAt), eligibleBookingDays + 1)
      : null;
  const isBookingLockedByEligibleDays =
    !isSuperAdmin &&
    !!bookingEligibleOn &&
    startOfDay(new Date()) < bookingEligibleOn;
  const bookingLockTooltip =
    isBookingLockedByEligibleDays && bookingEligibleOn
      ? `Booking is locked for ${eligibleBookingDays} full day${eligibleBookingDays === 1 ? "" : "s"} and will unlock on ${formatDisplayDate(bookingEligibleOn)}.`
      : "";
  const moveToBookingTooltip = !canMoveToBooking
    ? "Requires at least 1 Quotation and 1 Design"
    : isBookingLockedByEligibleDays
      ? bookingLockTooltip
      : !canPerformMoveToBooking
        ? "You don't have permission to move this lead to booking stage"
        : "";
  const canOpenBookingModal =
    canMoveToBooking &&
    canPerformMoveToBooking &&
    !isBookingLockedByEligibleDays;

  useEffect(() => {
    if (isLoading || isChatNotification) return;

    // Auto-open only when booking is actually allowed for this user.
    if (
      canOpenBookingModal &&
      normalizedUserType !== "admin" &&
      normalizedUserType !== "super-admin"
    ) {
      setBookingOpenLead(true);
    }
  }, [
    isLoading,
    isChatNotification,
    normalizedUserType,
    canOpenBookingModal,
  ]);

  const canReassign =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.designing_stage.details.reassign_lead",
        )
      : canReassignLeadButton(userType);
  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.details.delete")
      : canDeleteLeadButton(userType);
  const canEdit =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.details.edit")
      : canEditLeadForSalesExecutiveButton(userType);
  const canViewPayment =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
      : canViewPaymentTab(userType);
  const canViewChats =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.chat.enable_disable",
        )
      : true;
  const canViewDocuments =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith(
            "leads.open_leads.details_of_lead.documents_section.",
          ),
        )
      : true;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [bookingOpenLead, setBookingOpenLead] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<
    "onHold" | "lostApproval" | "lost"
  >("onHold");
  const shouldDirectlyMarkLost =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin";

  // tabs state
  const [activeTab, setActiveTab] = useState(
    userType === "sales-executive" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  useChatTabFromUrl(setActiveTab, "meetings");

  if (isLoading && !lead) {
    return <p className="p-6">Loading lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

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

          // ✅ Invalidate related queries
          queryClient.invalidateQueries({
            queryKey: ["designingStageLeads", vendorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          // ✅ Redirect back to table
          router.push("/dashboard/leads/designing-stage");
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

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {/* <BreadcrumbItem> */}
              {/* <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/leads/designing-stage">
                    Designing Stage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator /> */}
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
          <div>
            {/* Move to Booking */}
            {!canMoveToBooking || isBookingLockedByEligibleDays ? (
              <CustomeTooltip
                truncateValue={
                  <div className="flex items-center opacity-50 cursor-not-allowed px-2">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Move To Booking
                  </div>
                }
                value={moveToBookingTooltip}
                contentClassName="max-w-80 text-center"
              />
            ) : canPerformMoveToBooking ? (
              <Button
                size="sm"
                className="hidden md:block"
                onClick={() => setBookingOpenLead(true)}
              >
                Move To Booking
              </Button>
            ) : (
              <CustomeTooltip
                truncateValue={
                  <div className="hidden md:flex items-center opacity-50 cursor-not-allowed px-2">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Move To Booking
                  </div>
                }
                value={moveToBookingTooltip}
                contentClassName="max-w-80 text-center"
              />
            )}
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

          {/* 🔹 Dropdown for actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative bg-accent p-1.5 rounded-sm"
              >
                <EllipsisVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="flex md:hidden"
                onClick={() => setAssignOpen(true)}
              >
                <UserIcon className="h-4 w-4" />
                Assign Task
              </DropdownMenuItem>
              {/* Move to Booking */}
              {canOpenBookingModal ? (
                <DropdownMenuItem onClick={() => setBookingOpenLead(true)}>
                  <ClipboardCheck className="h-4 w-4" />
                  Move To Booking
                </DropdownMenuItem>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <div className="flex items-center opacity-50 cursor-not-allowed px-2">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Move To Booking
                    </div>
                  }
                  value={moveToBookingTooltip}
                  contentClassName="max-w-80 text-center"
                />
              )}

              {/* Lead Status submenu */}
              {canSeeLeadStatusMenu && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CircleArrowOutUpRight className="mr-2 h-4 w-4" />
                    Lead Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {canMarkOnHold && (
                      <DropdownMenuItem
                        onSelect={() => {
                          setActivityType("onHold");
                          setActivityModalOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4" />
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
                        <XCircle className="h-4 w-4" />
                        Mark As Lost
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}

              {canReassign && (
                <DropdownMenuItem onSelect={() => setAssignOpenLead(true)}>
                  <Users className="h-4 w-4" />
                  Reassign Lead
                </DropdownMenuItem>
              )}

              {/* Edit Lead */}

              {canEdit && (
                <DropdownMenuItem onSelect={() => setOpenEditModal(true)}>
                  <SquarePen className="h-4 w-4" />
                  Edit Lead
                </DropdownMenuItem>
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
                    <XCircle className="h-4 w-4 text-red-500" />
                    Delete Lead
                  </DropdownMenuItem>
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
            if (canMoveToBooking) {
              // ✅ If booking possible → open BookingModal directly
              if (canOpenBookingModal) {
                setBookingOpenLead(true);
              } else {
                setActiveTab("details");
              }
            } else {
              // ✅ Otherwise behave like Lead Details tab
              setActiveTab("details");
            }
          } else {
            setActiveTab(val);
          }
        }}
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

                {canAccessTodoTab ? (
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
                    value="Only Sales Executive can access this tab"
                  />
                )}
                {canViewSiteHistory && (
                  <TabsTrigger value="history">
                    <History size={16} className="mr-1 opacity-60" />
                    History
                  </TabsTrigger>
                )}
                {canViewPayment && (
                  <TabsTrigger value="team">
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
            </div>
          </div>
        </ScrollArea>

        {/* 🔹 Tab Contents */}
        <TabsContent value="details">
          <main className="flex-1 h-fit  ">
            <LeadDetailsUtil
              status="designing"
              leadId={leadIdNum}
              defaultTab="designing"
            />
          </main>
        </TabsContent>

        <TabsContent value="todo">
          <main className="flex-1 h-fit ">
            <LeadDetailsUtil
              status="designing"
              leadId={leadIdNum}
              defaultTab="designing"
            />
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
              upToStage="ism"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* ✅ Modals */}
      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp={true}
        data={{ id: leadIdNum, name: "" }}
      />

      <EditLeadModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        leadData={{ id: leadIdNum }}
      />

      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={{ id: leadIdNum, assignTo: lead?.assignedTo }}
      />

      <BookingModal
        open={bookingOpenLead}
        onOpenChange={setBookingOpenLead}
        data={{ id: leadIdNum, accountId: Number(accountId) }}
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
                  title:
                    activityType === "onHold"
                      ? "Lead marked as On Hold!"
                      : activityType === "lost"
                        ? "Lead marked as Lost!"
                        : "Lead sent for Lost Approval!",
                  type: "success",
                });
                setActivityModalOpen(false);
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
