"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ModeToggle";
import { useParams, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { useState } from "react";
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
import { useRouter } from "next/navigation";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import BookingModal from "@/components/sales-executive/designing-stage/booking-modal";
import { ProcessedSiteMeasurementLead } from "@/types/site-measrument-types";

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

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [bookingOpenLead, setBookingOpenLead] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">(
    "onHold"
  );

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
          router.push("/dashboard/sales-executive/designing-stage");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to delete lead!");
        },
      }
    );
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
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/sales-executive/designing-stage">
                    Designing Stage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Leads Details</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign Task
            </Button>
            <ModeToggle />

            {/* 🔹 Dropdown for actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Move to Booking */}
                <DropdownMenuItem onSelect={() => setBookingOpenLead(true)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Move To Booking
                </DropdownMenuItem>

                {/* Lead Status submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Lead Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() => {
                        setActivityType("onHold");
                        setActivityModalOpen(true);
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Mark On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setActivityType("lostApproval");
                        setActivityModalOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Mark As Lost
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Reassign Lead */}
                <DropdownMenuItem onSelect={() => setAssignOpenLead(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Reassign Lead
                </DropdownMenuItem>

                {/* Edit Lead */}
                <DropdownMenuItem onSelect={() => setOpenEditModal(true)}>
                  <SquarePen className="mr-2 h-4 w-4" />
                  Edit Lead
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Delete */}
                <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-6 pt-4">
          <LeadDetailsUtil status="designing" leadId={leadIdNum} />
        </main>

        {/* ✅ Render modal here */}
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
          leadData={{ id: leadIdNum }}
        />

        <BookingModal
          open={bookingOpenLead}
          onOpenChange={setBookingOpenLead}
          data={{ id: leadIdNum, accountId: Number(accountId) }}
        />

        <ActivityStatusModal
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          statusType={activityType} // "onHold" | "lostApproval"
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
      </SidebarInset>
    </SidebarProvider>
  );
}
