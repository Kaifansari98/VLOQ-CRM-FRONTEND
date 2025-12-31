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
import { toast } from "react-toastify";
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
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import PaymentComingSoon from "@/components/generics/PaymentComingSoon";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import { useChatTabFromUrl, useIsChatNotification } from "@/hooks/useChatTabFromUrl";

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
    (state) => state.auth.user?.user_type.user_type
  );

  const canAccessTodoTab = canAccessDessingTodoTab(userType);
  const canMoveToBooking =
    countsData?.QuotationDoc > 0 && countsData?.DesignsDoc > 0;

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const isChatNotification = useIsChatNotification();

  useEffect(() => {
    if (isLoading || isChatNotification) return;

    // ✅ Only auto-open if user can move to booking, but not admin/super-admin
    if (
      canMoveToBookingStage(userType) &&
      canMoveToBooking &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setBookingOpenLead(true);
    }
  }, [isLoading, isChatNotification, userType, canMoveToBooking]);

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadForSalesExecutiveButton(userType);

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [bookingOpenLead, setBookingOpenLead] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">(
    "onHold"
  );

  // tabs state
  const [activeTab, setActiveTab] = useState(
    userType === "sales-executive" ? "todo" : "details"
  );
  useChatTabFromUrl(setActiveTab);

  if (isLoading) {
    return <p className="p-6">Loading lead details...</p>;
  }

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toast.error("Vendor or User information is missing!");
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => {
          toast.success("Lead deleted successfully!");
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
          toast.error(error?.message || "Failed to delete lead!");
        },
      }
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
            {!canMoveToBooking ? (
              <CustomeTooltip
                truncateValue={
                  <div className="flex items-center opacity-50 cursor-not-allowed px-2">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Move To Booking
                  </div>
                }
                value="Requires at least 1 Quotation and 1 Design"
              />
            ) : (
              <Button
                size="sm"
                className="hidden md:block"
                onClick={() => setBookingOpenLead(true)}
              >
                Move To Booking
              </Button>
            )}
          </div>
          <Button
            size="sm"
            className="hidden lg:block"
            onClick={() => setAssignOpen(true)}
          >
            Assign Task
          </Button>
          <NotificationBell />
          <AnimatedThemeToggler />

          {/* 🔹 Dropdown for actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <EllipsisVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex md:hidden" onClick={() => setAssignOpen(true)}>
                <UserIcon className="h-4 w-4" />
                Assign Task
              </DropdownMenuItem>
              {/* Move to Booking */}
              {canMoveToBookingStage(userType) && canMoveToBooking ? (
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
                  value={
                    !canMoveToBooking
                      ? "Requires at least 1 Quotation and 1 Design"
                      : "You don't have permission to move this lead to booking stage"
                  }
                />
              )}

              {/* Lead Status submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <CircleArrowOutUpRight className="mr-2 h-4 w-4" />
                  Lead Status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() => {
                      setActivityType("onHold");
                      setActivityModalOpen(true);
                    }}
                  >
                    <Clock className="h-4 w-4" />
                    Mark On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setActivityType("lostApproval");
                      setActivityModalOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Mark As Lost
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

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
              setBookingOpenLead(true);
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
                    <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                    To-Do Task
                  </TabsTrigger>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <TabsTrigger value="todo" disabled>
                        <PanelsTopLeftIcon
                          size={16}
                          className="mr-1 opacity-60"
                        />
                        To-Do Task
                      </TabsTrigger>
                    }
                    value="Only Sales Executive can access this tab"
                  />
                )}
                <TabsTrigger value="history">
                  <BoxIcon size={16} className="mr-1 opacity-60" />
                  Site History
                </TabsTrigger>
                <TabsTrigger value="team">
                  <UsersRoundIcon size={16} className="mr-1 opacity-60" />
                  Payment Information
                </TabsTrigger>
                <TabsTrigger value="chats">
                  <MessageSquare size={16} className="mr-1 opacity-60" />
                  Chats
                </TabsTrigger>
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

        <TabsContent value="history">
          <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
        </TabsContent>

        <TabsContent value="team">
          <PaymentComingSoon />
        </TabsContent>

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
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
                toast.success(
                  activityType === "onHold"
                    ? "Lead marked as On Hold!"
                    : "Lead sent for Lost Approval!"
                );
                setActivityModalOpen(false);
              },
            }
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
