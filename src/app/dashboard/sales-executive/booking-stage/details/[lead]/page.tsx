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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
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

export default function BookingStageLeadsDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const lead = data?.data?.lead;
  const createdAt = lead?.created_at;
  const accountId = lead?.account_id;

  // const status = lead.statusType.type;
  console.log("Status Type: ", status);

  console.log(lead);

  const leadInfo = {
    leadId: leadId,
    createdAt: createdAt,
    accountId: accountId,
  };

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
    return <p className="p-6">Loading lead details...</p>;
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
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/sales-executive/booking-stage">
                    Booking Stage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {lead?.firstname} {lead?.lastname} Details
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign Task
            </Button>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users size={20} />
                  Reassign Lead
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenDelete(true)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-6 pt-4">
          <LeadDetailsUtil status="booking" leadId={leadIdNum} />
        </main>

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

        {/* ✅ Render modal here */}
        <AssignTaskFinalMeasurementForm
          open={assignOpen}
          onOpenChange={setAssignOpen}
          data={{ id: leadIdNum, name: "" }}
        />

        <AssignLeadModal
          open={assignOpenLead}
          onOpenChange={setAssignOpenLead}
          leadData={{ id: leadIdNum }}
        />

        <EditLeadModal
          open={openEditModal}
          onOpenChange={setOpenEditModal}
          leadData={{ id: leadIdNum }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
