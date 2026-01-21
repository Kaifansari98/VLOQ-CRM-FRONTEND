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
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  UserPlus,
  MessageSquare,
  ClipboardCheck,
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
import { toast } from "react-toastify";
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
    (state) => state.auth.user?.user_type.user_type
  );

  const [openDelete, setOpenDelete] = useState(false);
  // Modals
  const [openMeasurement, setOpenMeasurement] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">(
    "onHold"
  );

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();

  useEffect(() => {
    if (isLoading || !lead || isChatNotification) return;
    if (activeTab !== "details") return;

    // ✅ Only open automatically if:
    // - Lead is not draft
    // - User has upload permission
    // - User is NOT admin or super-admin
    if (
      !lead.is_draft &&
      canUploadISM(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setOpenMeasurement(true);
    }
  }, [isLoading, isChatNotification, lead, userType, activeTab]);

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

          queryClient.invalidateQueries({
            queryKey: ["siteMeasurementLeads", vendorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          router.push("/dashboard/leads/initial-site-measurement");
        },
        onError: () => {
          toast.error("Failed to delete lead!");
        },
      }
    );
  };

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadForSalesExecutiveButton(userType);
  const canViewPayment = canViewPaymentTab(userType);

  console.log("assigned to", lead?.assignedTo?.id);

  if (isLoading) {
    return <p className="p-6">Loading lead details...</p>;
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
              {canUploadISM(userType) && !lead?.is_draft ? (
                <DropdownMenuItem onSelect={() => setOpenMeasurement(true)}>
                  <ClipboardCheck size={20} />
                  Upload Measurement
                </DropdownMenuItem>
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <CircleArrowOutUpRight className="h-4 w-4" />
                  <span>Lead Status</span>
                </DropdownMenuSubTrigger>

                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() => {
                      setActivityType("onHold");
                      setActivityModalOpen(true);
                    }}
                  >
                    <Clock className="h-4 w-4 " />
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

              {/* Edit */}
              {canEdit && (
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
                </DropdownMenuItem>
              )}

              {/* Reassign */}
              {canReassign && (
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users size={20} />
                  Reassign Lead
                </DropdownMenuItem>
              )}

              {/* Delete */}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
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
            <TabsTrigger value="tasks">
              <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
              To-Do Task
            </TabsTrigger>
            <TabsTrigger value="history">
              <BoxIcon size={16} className="mr-1 opacity-60" />
              Site History
            </TabsTrigger>
            {canViewPayment && (
              <TabsTrigger value="payments">
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

        {/* Tab contents */}
        <TabsContent value="details">
          <main className="flex-1 h-fit">
            <LeadDetailsUtil status="details" leadId={leadIdNum} />
          </main>
        </TabsContent>

        <TabsContent value="history">
          <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
        </TabsContent>

        {canViewPayment && (
          <TabsContent value="payments">
            <PaymentComingSoon />
          </TabsContent>
        )}

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
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
                toast.success("Lead status updated successfully!");
                queryClient.invalidateQueries({
                  queryKey: ["universal-stage-leads"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["leadStats"],
                });
                router.back();
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
