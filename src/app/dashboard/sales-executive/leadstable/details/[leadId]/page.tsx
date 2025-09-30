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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ModeToggle";
import { useParams, useSearchParams } from "next/navigation";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda"; 
import { useAppSelector } from "@/redux/store";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  ClipboardCheck,
  SquarePen,
  Users,
  XCircle,
  Clock,
  EllipsisVertical,
} from "lucide-react";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { toast } from "react-toastify";

export default function LeadDetails() {
  const { leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = Number(searchParams.get("accountId")) || 0;

  console.log(
    "[LeadDetails] leadId:",
    leadIdNum,
    "accountId (from query params):",
    accountId
  );

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const updateActivityStatusMutation = useUpdateActivityStatus();

  // 👇 modal state
  const [assignOpen, setAssignOpen] = useState(false);

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">(
    "onHold"
  );

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
                  <BreadcrumbLink href="/dashboard/sales-executive/leadstable">
                    Open Leads
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Details</BreadcrumbPage>
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
                  <EllipsisVertical size={22} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {/* 🔹 Upload Measurement */}
                <DropdownMenuItem onSelect={() => alert("Upload Measurement")}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Upload Measurement
                </DropdownMenuItem>

                {/* 🔹 Edit */}
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                {/* 🔹 Reassign */}
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Reassign Lead
                </DropdownMenuItem>

                {/* 🔹 Activity Status submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <EllipsisVertical className="mr-2 h-4 w-4" />
                    Activity Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() => {
                        setActivityType("onHold");
                        setActivityModalOpen(true);
                      }}
                    >
                      <Clock className="h-4 w-4" />
                      Mark On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        setActivityType("lostApproval");
                        setActivityModalOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Mark As Lost
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                {/* 🔹 Delete */}
                <DropdownMenuItem onSelect={() => alert("Delete")}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-6 pt-4">
          <LeadDetailsUtil status="details" leadId={leadIdNum} />
        </main>
      </SidebarInset>

      {/* ✅ Render modal here */}
      <AssignTaskSiteMeasurementForm
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

      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        onSubmitRemark={(remark) => {
          if (!vendorId || !userId) {
            toast.error("Missing vendor/user info");
            return;
          }

          // Map UI action → API status
          const status = activityType === "onHold" ? "onHold" : "lostApproval";

          updateActivityStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId, // if you have accountId in details page, pass it here
                userId,
                status,
                remark,
                createdBy: userId,
              },
            },
            {
              onSuccess: () => {
                toast.success(
                  status === "onHold"
                    ? "Lead marked as On Hold!"
                    : "Lead sent for Lost Approval!"
                );
                setActivityModalOpen(false); // ✅ close modal
              },
            }
          );
        }}
        loading={updateActivityStatusMutation.isPending}
      />
    </SidebarProvider>
  );
}