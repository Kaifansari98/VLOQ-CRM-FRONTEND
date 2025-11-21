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

import ClientApprovalModal from "@/components/site-supervisor/client-approval/client-approval-modal";
import RequestToTechCheckModal from "@/components/site-supervisor/client-approval/request-to-tech-check-modal";

import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canReassingLead,
  canDeleteLead,
  canRequestToTeckCheck,
  canUploadClientApproval,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
} from "@/components/utils/privileges";

import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

// ⭐ NEW IMPORTS — ONLY Mark On Hold
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";

export default function ClientApprovalLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type
  );

  // UI States
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [openClientApprovalModal, setOpenClientApprovalModal] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openRequestToTechCheckModal, setOpenRequestToTechCheckModal] =
    useState(false);

  // ⭐ Activity Status — ONLY ON HOLD
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const [activeTab, setActiveTab] = useState(
    userType === "sales-executive" ? "todo" : "details"
  );
  const [previousTab, setPreviousTab] = useState("details");

  const is_client_approval_submitted = lead?.is_client_approval_submitted;

  // Auto-open documentation modal
  /* ---------- DEFAULT MODAL ON MOUNT ---------- */
  useEffect(() => {
    if (isLoading) return; // wait for lead data
    if (userType !== "sales-executive") return; // only for SE

    if (is_client_approval_submitted) {
      setOpenRequestToTechCheckModal(true);
    } else {
      setOpenClientApprovalModal(true);
    }
    setActiveTab("todo");
  }, [isLoading, userType, is_client_approval_submitted]);

  // Auto-open approval modal
  useEffect(() => {
    if (
      !isLoading &&
      !is_client_approval_submitted &&
      canUploadClientApproval(userType)
    ) {
      setOpenClientApprovalModal(true);
    }
  }, [isLoading, userType, is_client_approval_submitted]);

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
    return <p className="p-6">Loading Client Approval Lead details…</p>;
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

          {/* ACTION BUTTONS */}
          <div className="flex items-center space-x-2">
            {/* Tech Check */}
            {!is_client_approval_submitted ? (
              <CustomeTooltip
                truncateValue={
                  <Button size="sm" disabled variant="secondary">
                    Request To Tech Check
                  </Button>
                }
                value="Submit approval first"
              />
            ) : canRequestToTeckCheck(userType) ? (
              <Button
                size="sm"
                onClick={() => setOpenRequestToTechCheckModal(true)}
              >
                Request To Tech Check
              </Button>
            ) : (
              <CustomeTooltip
                truncateValue={
                  <Button size="sm" disabled variant="secondary">
                    Request To Tech Check
                  </Button>
                }
                value="No permission"
              />
            )}

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
                {/* ⭐ ONLY MARK ON HOLD */}
                <DropdownMenuItem onSelect={() => setActivityModalOpen(true)}>
                  <Clock className="m h-4 w-4" />
                  Mark On Hold
                </DropdownMenuItem>

                {/* CLIENT APPROVAL */}
                {!is_client_approval_submitted ? (
                  canUploadClientApproval(userType) ? (
                    <DropdownMenuItem
                      onClick={() => setOpenClientApprovalModal(true)}
                    >
                      <FileText size={20} />
                      Client Approval
                    </DropdownMenuItem>
                  ) : (
                    <CustomeTooltip truncateValue="..." value="No permission" />
                  )
                ) : (
                  <DropdownMenuItem
                    onClick={() => setOpenRequestToTechCheckModal(true)}
                  >
                    <FileText size={20} />
                    Request To Tech Check
                  </DropdownMenuItem>
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
            // When user selects "todo"
            if (val === "todo") {
              // Save previous tab (common in both functions)
              setPreviousTab(activeTab);

              // First logic: access privilege + tech-check flow
              if (canRequestToTeckCheck?.(userType)) {
                if (!is_client_approval_submitted) {
                  setOpenClientApprovalModal(true);
                } else {
                  setOpenRequestToTechCheckModal(true);
                }
              } else {
                // Second logic: open client document modal
                setOpenClientApprovalModal(true);
              }

              // Keep tab on "todo"
              setActiveTab("todo");
              return;
            }

            // Default case for normal tab switching
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

              {canUploadClientApproval(userType) ? (
                <TabsTrigger value="todo">
                  <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <div className="flex items-center opacity-50 cursor-not-allowed px-2 py-1.5 text-sm">
                      <PanelsTopLeftIcon
                        size={16}
                        className="mr-1 opacity-60"
                      />
                      To-Do Task
                    </div>
                  }
                  value="Only Sales Executive can access this tab"
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

          <TabsContent value="details">
            <main className="flex-1 h-fit">
              {is_client_approval_submitted ? (
                <LeadDetailsUtil
                  status="clientApproval"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultTab="clientApproval"
                />
              ) : (
                <LeadDetailsUtil
                  status="clientdocumentation"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultTab="clientdocumentation"
                />
              )}
            </main>
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

        <ClientApprovalModal
          open={openClientApprovalModal}
          onOpenChange={(open) => {
            setOpenClientApprovalModal(open);
            if (!open) setActiveTab(previousTab);
          }}
          data={{ id: leadIdNum, accountId }}
        />

        <RequestToTechCheckModal
          open={openRequestToTechCheckModal}
          onOpenChange={(open) => {
            setOpenRequestToTechCheckModal(open);
            if (!open) setActiveTab(previousTab);
          }}
          data={{ id: leadIdNum, accountId }}
        />

        <AssignTaskSiteMeasurementForm
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onlyFollowUp
          data={{ id: leadIdNum, name: "" }}
        />

        {/* DELETE CONFIRMATION */}
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
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ⭐ ONLY MARK ON HOLD */}
        <ActivityStatusModal
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          statusType="onHold"
          loading={updateStatusMutation.isPending}
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
                  toast.success("Lead marked On Hold");
                  setActivityModalOpen(false);

                  queryClient.invalidateQueries({
                    queryKey: ["leadById", leadIdNum],
                  });
                },
                onError: (err: any) =>
                  toast.error(err?.message || "Failed to update status"),
              }
            );
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
