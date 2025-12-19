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
  Clock,
  UserIcon,
  UserPlus,
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
import AssignTaskFinalMeasurementForm from "@/components/sales-executive/Lead/assign-task-final-measurement-form";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { toast } from "react-toastify";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canAssignFM,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

// --- NEW imports for Activity Status flow
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";

export default function BookingStageLeadsDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(true);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type
  );

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  useEffect(() => {
    if (userType?.toLowerCase() === "sales-executive") {
      setAssignOpen(true);
    } else {
      setAssignOpen(false);
    }
  }, [userType]);

  const lead = data?.data?.lead;
  const accountId = lead?.account_id;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

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
        onError: () => toast.error("Failed to delete lead"),
      }
    );

    setOpenDelete(false);
  };

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState("details");

  // --- Activity status state & hooks (new)
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold">("onHold");

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();

  if (isLoading) {
    return <p className="p-6">Loading lead details...</p>;
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
          {canAssignFM(userType) ? (
            <Button
              className="hidden md:block"
              size="sm"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          ) : (
            <CustomeTooltip
              truncateValue={
                <Button className="hidden md:block" size="sm" disabled>
                  Assign Task
                </Button>
              }
              value="You don't have permission to assign Final Measurement tasks."
            />
          )}

          <AnimatedThemeToggler />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <EllipsisVertical size={25} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {canAssignFM(userType) ? (
                <DropdownMenuItem
                  className="flex md:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assign Task
                </DropdownMenuItem>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <DropdownMenuItem className="flex md:hidden" disabled>
                      <UserPlus size={20} />
                      Assign Task
                    </DropdownMenuItem>
                  }
                  value="You don't have permission to assign Final Measurement tasks."
                />
              )}
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
        onValueChange={(val) => {
          if (val === "projects") {
            // instead of switching tab, open modal
            setAssignOpen(true);
            return; // stay on details
          }
          setActiveTab(val);
        }}
        className="w-full p-3 md:p-6"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>
            <TabsTrigger value="projects">
              <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
              To-Do Task
            </TabsTrigger>
            <TabsTrigger value="history">
              <BoxIcon size={16} className="mr-1 opacity-60" />
              Site History
            </TabsTrigger>
            <TabsTrigger value="team">
              <UsersRoundIcon size={16} className="mr-1 opacity-60" />
              Payment Information
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Contents */}
        <TabsContent value="details">
          <main className="h-auto overflow-visible">
            <LeadDetailsUtil
              status="booking"
              leadId={leadIdNum}
              defaultTab="booking"
            />
          </main>
        </TabsContent>

        <TabsContent value="history">
          <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
        </TabsContent>

        <TabsContent value="team">
          <PaymentInformation accountId={accountId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AssignTaskFinalMeasurementForm
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) setActiveTab("details");
        }}
        data={{
          id: leadIdNum,
          name: "",
          accountId: accountId!, // ✅ PASS IT HERE
        }}
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
