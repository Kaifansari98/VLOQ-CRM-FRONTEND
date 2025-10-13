"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  SquarePen,
  Users,
  XCircle,
  Clock,
  EllipsisVertical,
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
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
import { useLeadById } from "@/hooks/useLeadsQueries";
import { canReassingLead, canDeleteLead } from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";

export default function LeadDetails() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = Number(searchParams.get("accountId")) || 0;

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined
  );

  const [openDelete, setOpenDelete] = useState(false);
  const deleteLeadMutation = useDeleteLead();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const isDraftLead = !!lead?.is_draft;
  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  // console.log("Lead Code :-", leadCode);
  // console.log(`${lead.firstname || ""} ${lead.lastname || ""}`.trim());

  const uiDisabled = isLoading || !lead;

  const updateActivityStatusMutation = useUpdateActivityStatus();

  // modals
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<"onHold" | "lostApproval">(
    "onHold"
  );

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

          // ✅ Invalidate both queries so they refetch
          queryClient.invalidateQueries({
            queryKey: ["vendorUserLeadsOpen", vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          // ✅ Redirect to table after invalidation
          router.push("/dashboard/sales-executive/leadstable");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to delete lead!");
        },
      }
    );
  };

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState("details");

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
            {isDraftLead ? (
              <CustomeTooltip
                truncateValue={
                  <Button size="sm" disabled>
                    Assign Task
                  </Button>
                }
                value="This action cannot be performed because the lead is still in Draft mode."
              />
            ) : (
              <Button
                size="sm"
                onClick={() => setAssignOpen(true)}
                disabled={uiDisabled}
              >
                Assign Task
              </Button>
            )}

            <ModeToggle />
            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={22} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                {canReassingLead(userType) && (
                  <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Reassign Lead
                  </DropdownMenuItem>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <EllipsisVertical className="mr-2 h-4 w-4" />
                    Lead Status
                  </DropdownMenuSubTrigger>

                  {!isDraftLead && !uiDisabled && (
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
                  )}
                </DropdownMenuSub>
                {canDeleteLead(userType) && (
                  <>
                    <DropdownMenuSeparator />
                    {isDraftLead || uiDisabled ? (
                      <CustomeTooltip
                        truncateValue={
                          <DropdownMenuItem disabled>Delete</DropdownMenuItem>
                        }
                        value={
                          isDraftLead
                            ? "This action cannot be performed because the lead is still in Draft mode."
                            : "Please wait while the lead loads."
                        }
                      />
                    ) : (
                      <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
                        Delete
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 🔹 Tabs bar above content */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            if (val === "projects") {
              if (isDraftLead || uiDisabled) return; // ✅ block in draft/loading
              setAssignOpen(true);
              return;
            }
            setActiveTab(val);
          }}
          className="w-full px-6 pt-4"
        >
          <ScrollArea>
            <TabsList className="text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-1 py-2">
              <TabsTrigger value="details">
                <HouseIcon size={16} className="mr-1 opacity-60" />
                Lead Details
              </TabsTrigger>

              {isDraftLead ? (
                <CustomeTooltip
                  truncateValue={
                    <TabsTrigger value="projects" disabled>
                      <PanelsTopLeftIcon
                        size={16}
                        className="mr-1 opacity-60"
                      />
                      To-Do Task
                    </TabsTrigger>
                  }
                  value="This action cannot be performed because the lead is still in Draft mode."
                />
              ) : (
                <TabsTrigger value="projects" disabled={uiDisabled}>
                  <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                  To-Do Task
                </TabsTrigger>
              )}

              <TabsTrigger value="history" disabled={uiDisabled}>
                <BoxIcon size={16} className="mr-1 opacity-60" />
                Site History
              </TabsTrigger>
              <TabsTrigger value="team" disabled={uiDisabled}>
                <UsersRoundIcon size={16} className="mr-1 opacity-60" />
                Payment Information
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* 🔹 Tab Contents */}
          <TabsContent value="details">
            <main className="flex-1 h-fit">
              <LeadDetailsUtil status="details" leadId={leadIdNum} />
            </main>
          </TabsContent>

          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>

          <TabsContent value="team">
            <p className="text-center text-muted-foreground py-4">
              Payment Information Content
            </p>
          </TabsContent>
        </Tabs>
      </SidebarInset>

      {/* ✅ Modals */}
      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={(open) => {
          setAssignOpen(open);
          if (!open) {
            // when modal closes, go back to details tab
            setActiveTab("details");
          }
        }}
        data={{ id: leadIdNum, name: "" }}
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
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        onSubmitRemark={(remark, dueDate) => {
          if (!vendorId || !userId) {
            toast.error("Missing vendor/user info");
            return;
          }
          const status = activityType === "onHold" ? "onHold" : "lostApproval";
          updateActivityStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId,
                userId,
                status,
                remark,
                createdBy: userId,
                ...(status === "onHold" ? { dueDate } : {}),
              },
            },
            {
              onSuccess: () => {
                toast.success(
                  status === "onHold"
                    ? "Lead marked as On Hold!"
                    : "Lead sent for Lost Approval!"
                );
                setActivityModalOpen(false);
              },
            }
          );
        }}
        loading={updateActivityStatusMutation.isPending}
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
    </SidebarProvider>
  );
}
