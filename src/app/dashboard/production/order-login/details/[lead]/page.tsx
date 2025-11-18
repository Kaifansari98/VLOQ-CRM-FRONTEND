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
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  ArrowUpRight,
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
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canReassingLead,
  canDeleteLead,
  canOrderLogin,
  canMoveToProduction,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import MoveToProductionModal from "@/components/production/order-login-stage/MoveToProductionModal";
import { useLeadProductionReadiness } from "@/api/production/order-login";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";

export default function OrderLoginLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type as string | undefined
  );

  const { data: readiness, isLoading: readinessLoading } =
    useLeadProductionReadiness(vendorId, leadIdNum);

  // derive convenience flags & message
  const missing = readiness?.orderLogin?.missing ?? [];
  const lacksProdFiles = readiness ? !readiness.productionFiles?.hasAny : false;
  const canMove = readiness?.readyForProduction === true;
  const canMoveToProductionStage = canMoveToProduction(userType);

  const disabledReason = readinessLoading
    ? "Checking prerequisites…"
    : [
        ...(missing.length
          ? [`Missing File BreakUps: ${missing.join(", ")}`]
          : []),
        ...(lacksProdFiles ? ["No Production Files uploaded"] : []),
      ].join(" • ");

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [openMoveToProduction, setOpenMoveToProduction] = useState(false);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();
  const lead = data?.data?.lead;

  const client_required_order_login_complition_date =
    lead?.client_required_order_login_complition_date;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = Number(lead?.account_id);

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
    return <p className="p-6">Loading order login lead details...</p>;
  }

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
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
                </DropdownMenuItem>

                {canReassingLead(userType) && (
                  <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                    <Users size={20} />
                    Reassign Lead
                  </DropdownMenuItem>
                )}

                {canDeleteLead(userType) && (
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
            <div className="w-full h-full flex justify-between items-center">
              <div>
                <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                  <TabsTrigger value="details">
                    <HouseIcon size={16} className="mr-1 opacity-60" />
                    Lead Details
                  </TabsTrigger>

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
                    value="Under Development"
                  />

                  <TabsTrigger value="history">
                    <BoxIcon size={16} className="mr-1 opacity-60" />
                    Site History
                  </TabsTrigger>

                  <TabsTrigger value="payment">
                    <UsersRoundIcon size={16} className="mr-1 opacity-60" />
                    Payment Information
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex items-center justify-end gap-2">
                {/* ✅ Show only if user has permission */}
                {canMoveToProductionStage &&
                  (canMove ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex items-center gap-1 "
                      onClick={() => setOpenMoveToProduction(true)}
                    >
                      <ArrowUpRight size={16} />
                      Move to Production
                    </Button>
                  ) : (
                    <CustomeTooltip
                      truncateValue={
                        <Button variant="outline" disabled={true}>
                          <ArrowUpRight size={16} />
                          Move to Production
                        </Button>
                      }
                      value={
                        disabledReason ||
                        "Not eligible to move to Production yet"
                      }
                    />
                  ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="details">
            <main className="flex-1 h-fit">
              <LeadDetailsUtil
                status="orderLogin"
                leadId={leadIdNum}
                accountId={accountId}
                defaultTab={
                  canOrderLogin(userType) ? "orderLogin" : "techcheck"
                }
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


        {/* --- NEW: ActivityStatusModal */}
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

        <MoveToProductionModal
          open={openMoveToProduction}
          onOpenChange={setOpenMoveToProduction}
          data={{ id: Number(leadId), accountId }}
          client_required_order_login_complition_date={
            client_required_order_login_complition_date
          }
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
      </SidebarInset>
    </SidebarProvider>
  );
}
