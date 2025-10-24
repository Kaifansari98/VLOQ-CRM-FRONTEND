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
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  FileText,
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
import ClientApprovalModal from "@/components/site-supervisor/client-approval/client-approval-modal";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import {
  canReassingLead,
  canDeleteLead,
  canRequestToTeckCheck,
  canUploadClientApproval,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import RequestToTechCheckModal from "@/components/site-supervisor/client-approval/request-to-tech-check-modal";
import CustomeTooltip from "@/components/cutome-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";

export default function ClientApprovalLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type as string | undefined
  );

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [openClientApprovalModal, setOpenClientApprovalModal] = useState(false);
  const [prevTab, setPrevTab] = useState("details");
  const [assignOpen, setAssignOpen] = useState(false);

  const [openRequestToTechCheckModal, setOpenRequestToTechCheckModal] =
    useState(false);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const accountId = Number(lead?.account_id);

  const is_client_approval_submitted = lead?.is_client_approval_submitted;

  // 🔹 Auto-open Client Approval Modal only if user has access
  useEffect(() => {
    if (
      !isLoading &&
      !is_client_approval_submitted &&
      canUploadClientApproval(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setOpenClientApprovalModal(true);
    }
  }, [isLoading, userType, is_client_approval_submitted]);

  console.log("is_client_approval_submitted :- ", is_client_approval_submitted);

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
    return <p className="p-6">Loading client approval lead details...</p>;
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
                {/* <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/site-supervisor/client-approval">
                    Client Approval
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator /> */}
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
            {/* ✅ Request To Tech Check button (always visible) */}
            {/* ✅ Request To Tech Check button (Check both client approval & privilege) */}
            {!is_client_approval_submitted ? (
              <CustomeTooltip
                truncateValue={
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  >
                    Request To Tech Check
                  </Button>
                }
                value="Submit Client Approval first to enable Tech Check"
              />
            ) : canRequestToTeckCheck(userType) ? (
              <Button
                size="sm"
                onClick={() => setOpenRequestToTechCheckModal(true)}
              >
                Request To Tech Check
              </Button>
            ) : (
              <CustomeTooltip
                truncateValue={
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  >
                    Request To Tech Check
                  </Button>
                }
                value="You don’t have permission for Tech Check request"
              />
            )}

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
                {/* ✅ Client Approval Access Control */}
                {!is_client_approval_submitted ? (
                  canUploadClientApproval(userType) ? (
                    <DropdownMenuItem
                      onClick={() => setOpenClientApprovalModal(true)}
                    >
                      <FileText size={20} />
                      Client Approval
                    </DropdownMenuItem>
                  ) : (
                    <CustomeTooltip
                      truncateValue={
                        <div className="flex items-center opacity-50 cursor-not-allowed px-2 py-1.5">
                          <FileText size={18} className="mr-2" />
                          Client Approval
                        </div>
                      }
                      value="You don’t have permission for Client Approval"
                    />
                  )
                ) : canRequestToTeckCheck(userType) ? (
                  <DropdownMenuItem
                    onClick={() => setOpenRequestToTechCheckModal(true)}
                  >
                    <FileText size={20} />
                    Request To Tech Check
                  </DropdownMenuItem>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <div className="flex items-center opacity-50 cursor-not-allowed px-2 py-1.5">
                        <FileText size={18} className="mr-2" />
                        Request To Tech Check
                      </div>
                    }
                    value="You don’t have permission to request Tech Check"
                  />
                )}

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
          onValueChange={(val) => {
            if (val === "todo") {
              if (!canRequestToTeckCheck(userType)) {
                toast.error("You don’t have permission to access To-Do Tasks");
                return; // 🚫 block tab change
              }
          
              if (!is_client_approval_submitted) {
                setOpenClientApprovalModal(true);
              } else {
                setOpenRequestToTechCheckModal(true);
              }
          
              setPrevTab(activeTab);
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
              {canRequestToTeckCheck(userType) ? (
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
                  value="Only Admin, Super-Admin or Sales-Executive can access To-Do Tasks."
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="details">
            <main className="flex-1 h-fit">
              {is_client_approval_submitted ? (
                <LeadDetailsUtil
                  status="clientApproval"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultTab="clientApproval"
                />
              ) : (
                <LeadDetailsUtil
                  status="clientdocumentation"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultTab="clientdocumentation"
                />
              )}
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

        <ClientApprovalModal
          open={openClientApprovalModal}
          onOpenChange={setOpenClientApprovalModal}
          data={{ id: leadIdNum, accountId }}
        />

        <RequestToTechCheckModal
          open={openRequestToTechCheckModal}
          onOpenChange={setOpenRequestToTechCheckModal}
          data={{ id: leadIdNum, accountId }}
        />

        <AssignTaskSiteMeasurementForm
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onlyFollowUp
          data={{ id: leadIdNum, name: "" }}
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
