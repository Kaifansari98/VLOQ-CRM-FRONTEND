"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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

import ClientDocumentationModal from "@/components/site-supervisor/final-measurement/client-documantation-modal";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";

import {
  canReassingLead,
  canDeleteLead,
  canUploadClientDocumentation,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
} from "@/components/utils/privileges";

import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";

export default function ClientDocumentationLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  // UI STATES
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openClientDocModal, setOpenClientDocModal] = useState(false);

  const [activeTab, setActiveTab] = useState("details");
  const [prevTab, setPrevTab] = useState("details");

  // ACTIVITY STATUS — Only On Hold
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const lead = data?.data?.lead;
  const accountId = Number(lead?.account_id);

  const leadCode = lead?.lead_code || "";
  const clientName = `${lead?.firstname || ""} ${lead?.lastname || ""}`.trim();

  // Auto-open documentation modal
  useEffect(() => {
    if (
      canUploadClientDocumentation(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setOpenClientDocModal(true);
    }
  }, [userType]);

  // DELETE LEAD
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
        onError: (err: any) =>
          toast.error(err?.message || "Failed to delete lead"),
      }
    );
    setOpenDelete(false);
  };

  if (isLoading) {
    return <p className="p-6">Loading client documentation details…</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
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

          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign Task
            </Button>

            <AnimatedThemeToggler />

            {/* DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {/* ONLY MARK ON HOLD */}
                <DropdownMenuItem
                  onSelect={() => {
                    setActivityModalOpen(true);
                  }}
                >
                  <Clock className="m h-4 w-4" />
                  Mark On Hold
                </DropdownMenuItem>

                {/* CLIENT DOCUMENTATION */}
                {canUploadClientDocumentation(userType) ? (
                  <DropdownMenuItem onClick={() => setOpenClientDocModal(true)}>
                    <FileText size={20} />
                    Client Documentation
                  </DropdownMenuItem>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <div className="flex opacity-50 cursor-not-allowed px-2 py-1.5">
                        <FileText size={18} className="mr-2" />
                        Client Documentation
                      </div>
                    }
                    value="You don’t have permission."
                  />
                )}

                {/* EDIT */}
                {canEdit && (
                  <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                    <SquarePen size={20} />
                    Edit
                  </DropdownMenuItem>
                )}

                {/* REASSIGN */}
                {canReassign && (
                  <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                    <Users size={20} />
                    Reassign Lead
                  </DropdownMenuItem>
                )}

                {/* DELETE */}
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
              if (!canUploadClientDocumentation(userType)) {
                toast.error("You don’t have permission.");
                return;
              }
              setPrevTab(activeTab);
              setOpenClientDocModal(true);
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

              {canUploadClientDocumentation(userType) ? (
                <TabsTrigger value="todo">
                  <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <div className="opacity-50 cursor-not-allowed px-2 py-1.5 flex text-sm">
                      <PanelsTopLeftIcon
                        size={16}
                        className="mr-1 opacity-60"
                      />
                      To-Do Task
                    </div>
                  }
                  value="You don’t have permission."
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
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* TAB SCREENS */}
          <TabsContent value="details">
            <LeadDetailsUtil
              status="finalMeasurement"
              leadId={leadIdNum}
              defaultTab="finalMeasurement"
            />
          </TabsContent>

          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentInformation accountId={accountId} />
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

        <ClientDocumentationModal
          open={openClientDocModal}
          onOpenChange={(open) => {
            setOpenClientDocModal(open);
            if (!open) setActiveTab(prevTab);
          }}
          data={{ id: leadIdNum, ...lead, accountId }}
        />

        <AssignTaskSiteMeasurementForm
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onlyFollowUp
          data={{ id: leadIdNum, name: "" }}
        />

        {/* DELETE LEAD */}
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

        {/* MARK ON HOLD MODAL */}
        <ActivityStatusModal
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          statusType="onHold"
          onSubmitRemark={(remark, dueDate) => {
            if (!vendorId || !userId) {
              toast.error("Vendor or user info missing!");
              return;
            }

            updateStatusMutation.mutate(
              {
                leadId: leadIdNum,
                payload: {
                  vendorId,
                  accountId,
                  userId,
                  status: "onHold",
                  remark,
                  createdBy: userId,
                  dueDate,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Lead marked On Hold!");
                  setActivityModalOpen(false);

                  queryClient.invalidateQueries({
                    queryKey: ["leadById", leadIdNum],
                  });
                },
                onError: (err: any) => {
                  toast.error(err?.message || "Failed to update status");
                },
              }
            );
          }}
          loading={updateStatusMutation.isPending}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
