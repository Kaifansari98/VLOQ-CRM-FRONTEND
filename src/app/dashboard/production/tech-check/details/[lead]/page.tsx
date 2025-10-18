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
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import { canReassingLead, canDeleteLead } from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import { useApproveTechCheck, useRejectTechCheck } from "@/api/tech-check";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import BaseModal from "@/components/utils/baseModal";

export default function ClientApprovalLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type as string | undefined
  );

  const { mutate: approveTechCheckMutate, isPending: approving } =
    useApproveTechCheck();
  const { mutate: rejectTechCheckMutate, isPending: rejecting } =
    useRejectTechCheck();

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [openClientApprovalModal, setOpenClientApprovalModal] = useState(false);
  const [prevTab, setPrevTab] = useState("details");

  const [openTechCheckConfirm, setOpenTechCheckConfirm] = useState(false);
  const [openFinalApproveConfirm, setOpenFinalApproveConfirm] = useState(false);
  const [openRejectDocsModal, setOpenRejectDocsModal] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [openRemarkModal, setOpenRemarkModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [openFinalRejectConfirm, setOpenFinalRejectConfirm] = useState(false);

  const { data: clientDocsData } = useClientDocumentationDetails(
    vendorId!,
    leadIdNum
  );
  const docs = [
    ...(clientDocsData?.documents?.ppt ?? []),
    ...(clientDocsData?.documents?.pytha ?? []),
  ];

  const [openRequestToTechCheckModal, setOpenRequestToTechCheckModal] =
    useState(false);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();

  const accountId = Number(lead?.account_id);

  const is_client_approval_submitted = lead?.is_client_approval_submitted;

  console.log("is_client_approval_submitted :- ", is_client_approval_submitted);

  console.log("account id :- ", accountId);

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
            <ModeToggle />

            {/* ✅ Tech Check Button */}
            <Button
              variant="default"
              onClick={() => setOpenTechCheckConfirm(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Tech Check
            </Button>

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
              <TabsTrigger value="todo">
                <PanelsTopLeftIcon size={16} className="mr-1 opacity-60" />
                To-Do Task
              </TabsTrigger>
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
              <LeadDetailsUtil
                status="techcheck"
                leadId={leadIdNum}
                accountId={accountId}
                defaultTab="techcheck"
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

        {/* 🪟 (A) First Modal — Tech Check main action modal */}
        <AlertDialog
          open={openTechCheckConfirm}
          onOpenChange={setOpenTechCheckConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Proceed with Tech Check?</AlertDialogTitle>
              <AlertDialogDescription>
                Choose whether to approve or reject this lead’s client
                documentation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-end gap-3">
              <Button
                variant="destructive"
                onClick={() => {
                  setOpenTechCheckConfirm(false);
                  setOpenRejectDocsModal(true);
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  setOpenTechCheckConfirm(false);
                  setOpenFinalApproveConfirm(true);
                }}
              >
                Approve
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 🪟 (B) Approve Final Confirmation */}
        <AlertDialog
          open={openFinalApproveConfirm}
          onOpenChange={setOpenFinalApproveConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this Tech Check? The lead will
                move to Order Login stage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  approveTechCheckMutate({
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    userId: userId!,
                  });

                  setOpenFinalApproveConfirm(false);
                }}
                disabled={approving}
              >
                {approving ? "Approving..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 🪟 (C) Reject Docs Modal (list all client docs) */}
        <BaseModal
          open={openRejectDocsModal}
          onOpenChange={setOpenRejectDocsModal}
          title="Reject Client Documentation"
          size="lg"
          description="Select the documents that need to be re-uploaded or corrected."
        >
          <div className="space-y-4">
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No client documentation found.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-md border cursor-pointer ${
                      selectedDocs.includes(doc.id)
                        ? "border-red-500 bg-red-50"
                        : "hover:bg-muted"
                    }`}
                    onClick={() =>
                      setSelectedDocs((prev) =>
                        prev.includes(doc.id)
                          ? prev.filter((d) => d !== doc.id)
                          : [...prev, doc.id]
                      )
                    }
                  >
                    <FileText className="inline-block mr-2" size={18} />
                    {doc.doc_og_name}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (selectedDocs.length === 0) {
                    toast.error(
                      "Please select at least one document to reject."
                    );
                    return;
                  }
                  setOpenRejectDocsModal(false);
                  setOpenRemarkModal(true);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </BaseModal>

        {/* 🪟 (D) Remark Input Modal */}
        <BaseModal
          open={openRemarkModal}
          onOpenChange={setOpenRemarkModal}
          title="Add Remark for Rejection"
          size="md"
        >
          <div className="space-y-3">
            <textarea
              className="w-full p-3 border rounded-md text-sm"
              rows={3}
              placeholder="Enter rejection remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenRemarkModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!remark.trim()) {
                    toast.error("Remark is required.");
                    return;
                  }
                  setOpenRemarkModal(false);
                  setOpenFinalRejectConfirm(true);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </BaseModal>

        {/* 🪟 (E) Final Confirmation Modal for Reject */}
        <AlertDialog
          open={openFinalRejectConfirm}
          onOpenChange={setOpenFinalRejectConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject the selected documents?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  rejectTechCheckMutate({
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    userId: userId!,
                    payload: { rejectedDocs: selectedDocs, remark },
                  });

                  setOpenFinalRejectConfirm(false);
                  setSelectedDocs([]);
                  setRemark("");
                }}
                disabled={rejecting}
              >
                {rejecting ? "Rejecting..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
