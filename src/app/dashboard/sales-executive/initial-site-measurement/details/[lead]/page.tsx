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
import { useState } from "react";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import {
  CheckCircle,
  CircleArrowOutUpRight,
  ClipboardCheck,
  Clock,
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
} from "lucide-react";
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
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useInitialSiteMeasurementTask } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";

export default function SiteMeasurementLead() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const updateStatusMutation = useUpdateActivityStatus();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">("onHold");
  const { data, isLoading, isPending } = useInitialSiteMeasurementTask(
    userId,
    leadIdNum
  );
  console.log("lead id: ", leadIdNum);
  console.log("Site measurement Task: ", data);
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
                  <BreadcrumbLink href="/dashboard/sales-executive/initial-site-measurement">
                    Site Measurement
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
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {/* 🔹 Upload Measurement */}
                <DropdownMenuItem onSelect={() => alert("Upload Measurement")}>
                  <ClipboardCheck size={20} />
                  Upload Measurement
                </DropdownMenuItem>

                {/* ✅ Activity Status Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CircleArrowOutUpRight className="mr-2 h-4 w-4" />
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

                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen size={20} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users size={20} />
                  Reassign Lead
                </DropdownMenuItem>

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
          <LeadDetailsUtil
            status="details"
            leadId={leadIdNum}
            leadInfo={{ leadId: leadIdNum, accountId: accountId }}
          />
        </main>

        {/* ✅ Render modal here */}
        <AssignTaskSiteMeasurementForm
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onlyFollowUp={true}
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
          statusType={activityType} // "onHold" | "lostApproval"
          onSubmitRemark={(remark) => {
            if (!vendorId || !userId || !accountId) return;

            updateStatusMutation.mutate({
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId: Number(accountId),
                userId,
                status: activityType,
                remark,
                createdBy: userId,
              },
            });
          }}
          loading={updateStatusMutation.isPending}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
