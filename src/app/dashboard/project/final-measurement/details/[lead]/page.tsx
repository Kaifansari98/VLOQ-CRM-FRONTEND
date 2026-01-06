"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
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
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  FileText,
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

import FinalMeasurementModal from "@/components/sales-executive/booking-stage/final-measurement-modal";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";

import {
  canUploadFinalMeasurements,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
} from "@/components/utils/privileges";

import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";

import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";

export default function FinalMeasurementLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  // UI STATES
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userType === "site-supervisor" ? "todo" : "details"
  );
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");
  const [openFinalDocModal, setOpenFinalDocModal] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  // Only MARK ON HOLD
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userType === "site-supervisor" && !isChatNotification) {
      setPreviousTab("details");
      setOpenFinalDocModal(true);
      setActiveTab("todo");
    }
  }, [isChatNotification, userType]);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const accountId = lead?.account_id;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const normalizedLead = lead
    ? {
        id: lead.id,
        accountId: lead.account_id,
        name: `${lead.firstname || ""} ${lead.lastname || ""}`,
      }
    : undefined;

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
      }
    );

    setOpenDelete(false);
  };

  if (isLoading) {
    return <p className="p-6">Loading final measurement lead details...</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between px-4 border-b backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <p className="font-bold">
                    {leadCode}
                    {clientName ? ` - ${clientName}` : ""}
                  </p>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            className="hidden md:flex"
            onClick={() => setAssignOpen(true)}
          >
            Assign Task
          </Button>

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
              {/* ✔ ONLY MARK ON HOLD */}
              <DropdownMenuItem
                className="flex md:hidden"
                onSelect={() => setAssignOpen(true)}
              >
                <UserPlus size={20} />
                Assign Task
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActivityModalOpen(true)}>
                <Clock className="mh-4 w-4" />
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

              {/* Final Documentation */}
              {canUploadFinalMeasurements(userType) ? (
                <DropdownMenuItem onClick={() => setOpenFinalDocModal(true)}>
                  <FileText size={20} />
                  Final Documentation
                </DropdownMenuItem>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem disabled>
                      <FileText size={18} />
                      Final Documentation
                    </DropdownMenuItem>
                  }
                  value="Only Site Supervisor can access this option"
                />
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

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            setPreviousTab(activeTab);
            setOpenFinalDocModal(true);
            setActiveTab("todo");
            return;
          }
          setActiveTab(val);
        }}
        className="w-full p-3 md:p-6 pt-4"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>

            {canUploadFinalMeasurements(userType) ? (
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
                value="Only Site Supervisor can access this tab"
              />
            )}

            <TabsTrigger value="history">
              <BoxIcon size={16} className="mr-1 opacity-60" />
              Site History
            </TabsTrigger>

            <TabsTrigger value="payment">
              <UsersRoundIcon size={16} className="mr-1 opacity-60" />
              Payment Information
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare size={16} className="mr-1 opacity-60" />
              Chats
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* CONTENT */}
        <TabsContent value="details">
          <LeadDetailsUtil
            status="booking"
            leadId={leadIdNum}
            defaultTab="booking"
          />
        </TabsContent>

        <TabsContent value="history">
          <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentInformation accountId={accountId} />
        </TabsContent>

        <TabsContent value="chats">
          <LeadWiseChatScreen leadId={leadIdNum} />
        </TabsContent>
      </Tabs>

      {/* MODALS */}
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

      {canUploadFinalMeasurements(userType) && (
        <FinalMeasurementModal
          open={openFinalDocModal}
          onOpenChange={(open) => {
            setOpenFinalDocModal(open);
            if (!open) setActiveTab(previousTab);
          }}
          data={normalizedLead}
        />
      )}

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        data={{ id: leadIdNum, name: "" }}
      />

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      {/* ONLY MARK ON HOLD MODAL */}
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType="onHold"
        onSubmitRemark={(remark, dueDate) => {
          if (!vendorId || !userId) {
            toast.error("Vendor or User info missing!");
            return;
          }

          updateStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId: Number(accountId),
                userId,
                status: "onHold",
                remark,
                createdBy: userId,
                dueDate,
              },
            },
            {
              onSuccess: () => {
                toast.success("Lead marked as On Hold!");
                setActivityModalOpen(false);

                queryClient.invalidateQueries({
                  queryKey: ["leadById", leadIdNum],
                });
              },
              onError: (err) => {
                toast.error(err?.message || "Failed to update lead status!");
              },
            }
          );
        }}
        loading={updateStatusMutation.isPending}
      />
    </>
  );
}
