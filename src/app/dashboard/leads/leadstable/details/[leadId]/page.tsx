"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
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
  CircleArrowOutUpRight,
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
import {
  canAssignISM,
  canReassignLeadButton,
  canDeleteLedForSalesExecutiveButton,
  canEditLeadForSalesExecutiveButton,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import PaymentComingSoon from "@/components/generics/PaymentComingSoon";

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
    (state) => state.auth.user?.user_type.user_type
  );

  const [openDelete, setOpenDelete] = useState(false);
  const deleteLeadMutation = useDeleteLead();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;
  const isDraftLead = !!lead?.is_draft;
  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const LeadStage = lead?.statusType?.type;
  console.log("Lead Stage :- ", LeadStage);

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

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLedForSalesExecutiveButton(userType);
  const canEdit = canEditLeadForSalesExecutiveButton(userType);

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
          router.push("/dashboard/leads/leadstable");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to delete lead!");
        },
      }
    );
  };

  useEffect(() => {
    if (isLoading || !lead) return;

    // ✅ Open modal only if:
    // - Lead is not draft
    // - User can assign ISM
    // - User is NOT admin or super-admin
    if (
      !lead.is_draft &&
      canAssignISM(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setAssignOpen(true);
      setActiveTab("projects");
    }
  }, [isLoading, lead, userType]);

  // 🔹 Tabs state
  const [activeTab, setActiveTab] = useState("details");

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background">
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

          <AnimatedThemeToggler />

          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <EllipsisVertical size={22} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                  <SquarePen className=" h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}

              {canReassign && (
                <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                  <Users className="h-4 w-4" />
                  Reassign Lead
                </DropdownMenuItem>
              )}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <CircleArrowOutUpRight className="h-4 w-4" />
                  <span>Lead Status</span>
                </DropdownMenuSubTrigger>

                {!uiDisabled && (
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onSelect={() => {
                        setActivityType("onHold");
                        setActivityModalOpen(true);
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark On Hold
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={() => {
                        setActivityType("lostApproval");
                        setActivityModalOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark As Lost
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                )}
              </DropdownMenuSub>

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  {uiDisabled ? (
                    <CustomeTooltip
                      truncateValue={
                        <DropdownMenuItem disabled>Delete</DropdownMenuItem>
                      }
                      value="Please wait while the lead loads."
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
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>

            {isDraftLead ? (
              <CustomeTooltip
                truncateValue={
                  <TabsTrigger value="projects" disabled>
                    <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
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
          <PaymentComingSoon />
        </TabsContent>
      </Tabs>

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
    </>
  );
}
