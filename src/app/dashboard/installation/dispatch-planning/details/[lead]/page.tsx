"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
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
  canDoDispatchPlanning,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  useDispatchReadinessStatus,
  useMoveLeadToDispatch,
} from "@/api/installation/useDispatchPlanning";
import { useQueryClient } from "@tanstack/react-query";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { toastError } from "@/lib/utils";

export default function DispatchPlanningLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type
  );

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    userType?.toLowerCase() === "sales-executive" ? "todo" : "details"
  );
  const [openMoveConfirm, setOpenMoveConfirm] = useState(false);

  const { data: readinessStatus, isLoading: readinessLoading } =
    useDispatchReadinessStatus(vendorId, leadIdNum);
  const moveMutation = useMoveLeadToDispatch();

  const isReadyForDispatch = readinessStatus?.is_ready_for_dispatch ?? false;
  const missingFields = readinessStatus?.missing_fields ?? [];

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

  const deleteLeadMutation = useDeleteLead();

  useEffect(() => {
    if (userType?.toLowerCase() === "sales-executive") {
      setActiveTab("todo");
    }
  }, [userType]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toast.error("Missing vendor or user info!");
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => toast.success("Lead deleted successfully!"),
        onError: () => toast.error("Failed to delete lead"),
      }
    );

    setOpenDelete(false);
  };

  if (isLoading) {
    return <p className="p-6">Loading Dispatch Planning lead details...</p>;
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  return (
    <>
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
            {/* Move to Dispatch Button */}
            {isReadyForDispatch ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => setOpenMoveConfirm(true)}
                disabled={moveMutation.isPending}
                className="cursor-pointer"
              >
                {moveMutation.isPending ? "Moving..." : "Move to Dispatch"}
              </Button>
            ) : (
              <CustomeTooltip
                truncateValue={
                  <Button size="sm" variant="outline" disabled>
                    Move to Dispatch
                  </Button>
                }
                value={
                  readinessLoading
                    ? "Checking dispatch readiness..."
                    : `Cannot move yet. Missing: ${
                        missingFields.join(", ") || "data"
                      }`
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
                <Clock className="m h-4 w-4" />
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
                {/* ✅ Dispatch Planning Details */}
                <TabsTrigger value="details">
                  <Truck size={16} className="mr-1 opacity-60" />
                  Dispatch Planning Details
                </TabsTrigger>

                {/* ✅ To-Do Task (Conditional Access) */}
                {canDoDispatchPlanning(userType) ? (
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
            <LeadDetailsGrouped
              status="dispatchPlanning"
              defaultTab="dispatchPlanning"
              leadId={leadIdNum}
              accountId={accountId}
              defaultParentTab="installation"
            />
          </main>
        </TabsContent>

        <TabsContent value="todo">
          <main className="flex-1 h-fit">
            <LeadDetailsGrouped
              status="dispatchPlanning"
              defaultTab="dispatchPlanning"
              leadId={leadIdNum}
              accountId={accountId}
              defaultParentTab="installation"
            />
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

      {/* ✅ Move to Dispatch Confirmation Modal */}
      <AlertDialog open={openMoveConfirm} onOpenChange={setOpenMoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move to Dispatch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this lead to the Dispatch stage?
              <br />
              Once moved, this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await moveMutation.mutateAsync({
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    payload: { updated_by: userId! },
                  });
                  toast.success("Lead successfully moved to Dispatch stage 🚚");
                  queryClient.invalidateQueries({ queryKey: ["leadStats"] });
                  router.push("/dashboard/installation/dispatch-stage/");
                  setOpenMoveConfirm(false);
                } catch (err: unknown) {
                  toastError(err);
                }
              }}
            >
              Confirm & Move
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
              onError: (err) => {
                toast.error(err || "Failed to update lead status");
              },
            }
          );
        }}
        loading={updateStatusMutation.isPending}
      />
    </>
  );
}
