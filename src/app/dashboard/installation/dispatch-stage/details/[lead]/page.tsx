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
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
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
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  Truck,
  Clock,
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
import { toast } from "react-toastify";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canReassingLead,
  canDeleteLead,
  canDoDispatchPlanning,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { useQueryClient } from "@tanstack/react-query";
import { useMoveLeadToUnderInstallation } from "@/api/installation/useUnderInstallationStageLeads";
import { useCheckReadyForPostDispatch } from "@/api/installation/useDispatchStageLeads";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";

export default function DispatchPlanningLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type);

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [previousTab, setPreviousTab] = useState("details");

  const [openMoveConfirm, setOpenMoveConfirm] = useState(false);
  const moveMutation = useMoveLeadToUnderInstallation();

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

  const { data: readiness } = useCheckReadyForPostDispatch(vendorId, leadIdNum);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = lead?.account_id;
  console.log("Parent 1: ", accountId);

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
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
              {/* Move to Under Installation Button + Tooltip Logic */}
              {readiness?.readyForPostDispatch ? (
                // 🔹 ENABLED BUTTON (Lead is ready)
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setOpenMoveConfirm(true)}
                >
                  Move to Under Installation
                </Button>
              ) : (
                // 🔸 DISABLED with Tooltip (Lead NOT ready)
                <CustomeTooltip
                  truncateValue={
                    <div className="opacity-50 cursor-not-allowed px-3 py-1.5 text-sm border rounded-md">
                      Move to Under Installation
                    </div>
                  }
                  value={
                    readiness?.message ||
                    "Lead is missing required information to proceed."
                  }
                />
              )}

              {/* Assign Task Button */}
              <Button size="sm" onClick={() => setAssignOpen(true)}>
                Assign Task
              </Button>
            </div>

            <AnimatedThemeToggler />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setActivityType("onHold");
                    setActivityModalOpen(true);
                  }}
                >
                  <Clock className="mr h-4 w-4" />
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

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            if (val === "todo") {
              setPreviousTab(activeTab);
              setAssignOpen(true);
              return;
            }
            setActiveTab(val);
          }}
          className="w-full px-6 pt-4"
        >
          <ScrollArea>
            <div className="w-full h-full flex justify-between items-center mb-4">
              <div className="w-full flex items-center gap-2 justify-between">
                <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                  {/* ✅ Dispatch Planning Details */}
                  <TabsTrigger value="details">
                    <Truck size={16} className="mr-1 opacity-60" />
                    Dispatch Planning Details
                  </TabsTrigger>

                  {/* ✅ To-Do Task (Conditional Access) */}
                  {canDoDispatchPlanning(userType) ? (
                    <TabsTrigger
                      value="todo"
                      onClick={() => setAssignOpen(true)}
                    >
                      <PanelsTopLeftIcon
                        size={16}
                        className="mr-1 opacity-60"
                      />
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
                      value="Only Admin or Sales Executive can access this tab"
                    />
                  )}

                  {/* ✅ Site History */}
                  <TabsTrigger value="history">
                    <BoxIcon size={16} className="mr-1 opacity-60" />
                    Site History
                  </TabsTrigger>

                  {/* ✅ Payment Info */}
                  <TabsTrigger value="payment">
                    <UsersRoundIcon size={16} className="mr-1 opacity-60" />
                    Payment Information
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="details">
            <main className="flex-1 h-fit">
              {!isLoading && accountId && (
                <LeadDetailsGrouped
                  status="dispatch"
                  defaultTab="dispatch"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultParentTab="installation"
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

        {/* Move to Under Installation Confirmation */}
        <AlertDialog open={openMoveConfirm} onOpenChange={setOpenMoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Move Lead to Under Installation?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will move the current lead from <b>Dispatch Planning</b> to
                the <b>Under Installation</b> stage. Do you wish to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!vendorId || !userId) {
                    toast.error("Missing vendor or user information!");
                    return;
                  }

                  moveMutation.mutate(
                    { vendorId, leadId: leadIdNum, updated_by: userId },
                    {
                      onSuccess: () => {
                        toast.success(
                          "Lead successfully moved to Under Installation stage!"
                        );
                        setOpenMoveConfirm(false);
                        queryClient.invalidateQueries({
                          queryKey: ["dispatchStageLeads"],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["underInstallationStageLeads"],
                        });
                        // Optionally redirect to the new stage’s page
                        router.push(
                          "/dashboard/installation/under-installation"
                        );
                      },
                      onError: (err: any) => {
                        toast.error(
                          err?.response?.data?.message ||
                            "Failed to move lead to Under Installation"
                        );
                      },
                    }
                  );
                }}
              >
                {moveMutation.isPending ? "Moving..." : "Confirm Move"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  toast.success("Lead marked as On Hold!");

                  setActivityModalOpen(false);

                  // Invalidate related queries to refresh UI
                  queryClient.invalidateQueries({
                    queryKey: ["leadById", leadIdNum],
                  });
                },
                onError: (err: any) => {
                  toast.error(err?.message || "Failed to update lead status");
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
