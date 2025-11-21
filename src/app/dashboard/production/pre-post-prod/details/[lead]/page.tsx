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
import { ModeToggle } from "@/components/ModeToggle";
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
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  Factory,
  CalendarCheck2,
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
  canViewToOrderLoginDetails,
  handledproductionDefaultTab,
  canMoveToReadyToDispatch,
  canViewAndWorkEditProcutionExpectedDate,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canAccessTodoTaskTabProductionStage,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import CustomeDatePicker from "@/components/date-picker";
import {
  useLatestOrderLoginByLead,
  usePostProductionCompleteness,
  useUpdateExpectedOrderLoginReadyDate,
} from "@/api/production/production-api";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useCheckPostProductionReady } from "@/api/production/production-api";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import { useMoveLeadToReadyToDispatch } from "@/api/production/useReadyToDispatchLeads";
import { useRouter } from "next/navigation";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";

export default function ProductionLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type
  );

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [openReadyToDispatch, setOpenReadyToDispatch] = useState(false);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  const moveLeadMutation = useMoveLeadToReadyToDispatch();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  // 🔍 Check Post Prouction Readiness
  const { data: postProductionStatus } = useCheckPostProductionReady(
    vendorId,
    leadIdNum
  );

  const { data: latestOrderLoginData, isLoading: latestOrderLoginLoading } =
    useLatestOrderLoginByLead(vendorId, Number(leadIdNum));

  const canMoveReadyToDispatchStage = canMoveToReadyToDispatch(userType);
  const canUpdateExpectedDate =
    canViewAndWorkEditProcutionExpectedDate(userType);

  const canShowTodoTab = canAccessTodoTaskTabProductionStage(userType);

  const latestOrderLoginDate =
    latestOrderLoginData?.data?.estimated_completion_date;

  useEffect(() => {
    if (
      !latestOrderLoginDate ||
      !postProductionStatus?.all_order_login_dates_added ||
      !lead?.id // ✅ Wait for lead data to be loaded
    )
      return;

    // 1️⃣ Compute 3-day buffered date (day precision only)
    const baseDate = new Date(latestOrderLoginDate);
    baseDate.setDate(baseDate.getDate() + 3);
    const computedDate = baseDate.toISOString().split("T")[0];

    // 2️⃣ Normalize expected date and latest order login date to day strings
    const expectedDate = lead?.expected_order_login_ready_date
      ? new Date(lead.expected_order_login_ready_date)
          .toISOString()
          .split("T")[0]
      : undefined;

    const latestDate = new Date(latestOrderLoginDate)
      .toISOString()
      .split("T")[0];

    // 3️⃣ Hit API ONLY in these specific cases:
    const shouldHitApi =
      // Case 1: Expected date is missing → set by buffer
      !expectedDate ||
      // Case 2: Expected date < latest order login date → update to latest
      (expectedDate && new Date(expectedDate) < new Date(latestDate));

    // ✅ REMOVED Case 3 (expectedDate === computedDate) because this causes repeated API calls

    if (shouldHitApi) {
      // Determine the correct date to set
      const dateToSet = !expectedDate
        ? computedDate // If missing, set 3-day buffer
        : latestDate; // If smaller, set to latest order login date

      handleExpectedDateChange(dateToSet);
    }

    // ✅ Only depend on the actual data values, not the lead object itself
  }, [
    latestOrderLoginDate,
    postProductionStatus?.all_order_login_dates_added,
    lead?.expected_order_login_ready_date, // ✅ Only this specific field
    lead?.id, // ✅ To ensure lead is loaded
  ]);

  const expected_order_login_ready_date = lead?.expected_order_login_ready_date;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const noOfBoxes = lead?.no_of_boxes;

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);

  const productionDefaultTab = handledproductionDefaultTab(userType);

  const deleteLeadMutation = useDeleteLead();

  const { mutateAsync: updateExpectedDate } =
    useUpdateExpectedOrderLoginReadyDate();

  const { data: completeness } = usePostProductionCompleteness(
    vendorId,
    leadIdNum
  );

  const handleExpectedDateChange = async (newDate?: string) => {
    if (!newDate || !vendorId || !userId || !leadIdNum) return;

    try {
      await updateExpectedDate({
        vendorId,
        leadId: leadIdNum,
        expected_order_login_ready_date: newDate,
        updated_by: userId,
      });

      toast.success("Expected Order Login Ready Date updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["leadById", leadIdNum] });
      queryClient.invalidateQueries({
        queryKey: ["postProductionReady", vendorId, leadIdNum],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update expected order login date");
    }
  };

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
    return <p className="p-6">Loading production lead details...</p>;
  }

  const disabledReason = !canUpdateExpectedDate
    ? "You do not have permission to update this date."
    : completeness?.any_exists
    ? "Cannot change the date because lead is currently in post-production."
    : !postProductionStatus?.all_order_login_dates_added
    ? "Please ensure all Order Login expected completion dates are added before setting this."
    : undefined;

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
            {canMoveReadyToDispatchStage &&
              (completeness?.all_exists && lead?.no_of_boxes > 0 ? (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setOpenReadyToDispatch(true)}
                >
                  Ready To Dispatch
                </Button>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled
                      className="bg-gray-400 cursor-not-allowed text-white"
                    >
                      Ready To Dispatch
                    </Button>
                  }
                  value={
                    !completeness?.all_exists
                      ? "Cannot move yet — please complete all production tasks (QC photos, hardware packing, and woodwork packing)."
                      : !lead?.no_of_boxes || lead?.no_of_boxes <= 0
                      ? "Add number of boxes before dispatch."
                      : "Action unavailable."
                  }
                />
              ))}

            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign Task
            </Button>

            <AnimatedThemeToggler />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {/* --- NEW: Lead Status submenu (Mark On Hold / Mark As Lost) */}
                <DropdownMenuItem
                  onSelect={() => {
                    setActivityType("onHold");
                    setActivityModalOpen(true);
                  }}
                >
                  <Clock className=" h-4 w-4" />
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
          onValueChange={(val) => setActiveTab(val)}
          className="w-full px-6 pt-4"
        >
          <ScrollArea>
            <div className="w-full h-full flex justify-between items-center mb-4">
              <div className="w-full flex items-center gap-2 justify-between">
                <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                  <TabsTrigger value="details">
                    <Factory size={16} className="mr-1 opacity-60" />
                    Production Details
                  </TabsTrigger>

                  {canShowTodoTab ? (
                    <TabsTrigger value="todo">
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
                      value="Only factory user can access this tab"
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
                <div className="w-60 flex flex-col">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1 ml-1">
                    <CalendarCheck2 size={12} />
                    Expected Ready Date of Order
                  </label>
                  <CustomeDatePicker
                    value={
                      lead?.expected_order_login_ready_date ||
                      (postProductionStatus?.all_order_login_dates_added &&
                      latestOrderLoginDate
                        ? (() => {
                            const baseDate = new Date(latestOrderLoginDate);
                            baseDate.setDate(baseDate.getDate() + 3); // ⏱ Add 3-day buffer
                            return baseDate.toISOString().split("T")[0];
                          })()
                        : undefined)
                    }
                    onChange={handleExpectedDateChange}
                    restriction="futureOnly"
                    minDate={
                      latestOrderLoginDate
                        ? latestOrderLoginDate.split("T")[0] // ✅ user can only pick dates >= latest order login date
                        : undefined
                    }
                    disabledReason={disabledReason}
                  />
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* 🔹 Details Tab */}
          <TabsContent value="details">
            <main className="flex-1 h-fit">
              <LeadDetailsGrouped
                status="production"
                defaultTab={productionDefaultTab ? "production" : "techcheck"}
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="production"
              />
            </main>
          </TabsContent>

          {/* 🔹 To-Do Tab — use SAME component as Details */}
          <TabsContent value="todo">
            <main className="flex-1 h-fit">
              <LeadDetailsGrouped
                status="production"
                defaultTab={productionDefaultTab ? "production" : "techcheck"}
                leadId={leadIdNum}
                accountId={accountId}
                defaultParentTab="production"
              />
            </main>
          </TabsContent>

          {/* 🔹 Site History */}
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>

          {/* 🔹 Payment */}
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
          onlyFollowUp
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

        {/* ✅ Ready To Dispatch Confirmation */}
        <AlertDialog
          open={openReadyToDispatch}
          onOpenChange={setOpenReadyToDispatch}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move to Ready To Dispatch?</AlertDialogTitle>
              <AlertDialogDescription>
                This will move the lead from Production to the Ready-To-Dispatch
                stage. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!vendorId || !userId || !leadIdNum) {
                    toast.error("Missing vendor or user information!");
                    return;
                  }

                  try {
                    await moveLeadMutation.mutateAsync({
                      vendorId,
                      leadId: leadIdNum,
                      updated_by: userId,
                    });

                    toast.success(
                      "Lead moved to Ready-To-Dispatch successfully!"
                    );
                    setOpenReadyToDispatch(false);

                    // ✅ Refetch relevant queries
                    queryClient.invalidateQueries({
                      queryKey: ["leadById", leadIdNum],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["leadStats", vendorId, userId],
                    });

                    // ✅ Redirect after a short delay for smooth UX
                    setTimeout(() => {
                      router.push("/dashboard/production/ready-to-dispatch");
                    }, 400);
                  } catch (err: any) {
                    toast.error(
                      err?.message || "Failed to move lead to Ready-To-Dispatch"
                    );
                  }
                }}
              >
                Confirm
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
