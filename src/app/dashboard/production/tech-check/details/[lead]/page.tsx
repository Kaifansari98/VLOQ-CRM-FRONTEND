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
import { Fragment, useEffect, useState } from "react";
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
  CheckCircle2,
  AlertCircle,
  CircleCheckBig,
  Settings2,
  UploadIcon,
} from "lucide-react";
import CustomeTooltip from "@/components/cutome-tooltip";

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
  canMoveToOrderLogin,
  canReassingLead,
  canDeleteLead,
  canTechCheck,
  canUploadRevisedClientDocumentationFiles,
  canViewThreeVerticalDocsOptionInTechCheck,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import {
  useApproveMultipleDocuments,
  useApproveTechCheck,
  useRejectTechCheck,
} from "@/api/tech-check";
import { useClientDocumentationDetails } from "@/hooks/client-documentation/use-clientdocumentation";
import BaseModal from "@/components/utils/baseModal";
import { cn } from "@/lib/utils";
import TextAreaInput from "@/components/origin-text-area";
import ClientDocumentationModal from "@/components/site-supervisor/final-measurement/client-documantation-modal";
import UploadMoreClientDocumentationModal from "@/components/site-supervisor/client-documentation/uploadmore-client-documentaition-modal";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

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
  const [prevTab, setPrevTab] = useState("details");
  const [assignOpen, setAssignOpen] = useState(false);

  const [openFinalApproveConfirm, setOpenFinalApproveConfirm] = useState(false);
  const [openRejectDocsModal, setOpenRejectDocsModal] = useState(false);

  const [openUploadDocsModal, setOpenUploadDocsModal] = useState(false);

  // ✅ Auto-open To-Do modal when screen loads (only for allowed roles)
  useEffect(() => {
    if (
      canTechCheck(userType) &&
      userType?.toLowerCase() !== "admin" &&
      userType?.toLowerCase() !== "super-admin"
    ) {
      setOpenRejectDocsModal(true);
    }
  }, [userType]);

  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [openRemarkModal, setOpenRemarkModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [openFinalRejectConfirm, setOpenFinalRejectConfirm] = useState(false);
  const [openApproveConfirmModal, setOpenApproveConfirmModal] = useState(false);

  const { mutate: approveMultipleDocsMutate, isPending: approvingDocs } =
    useApproveMultipleDocuments();

  const { data: clientDocsData } = useClientDocumentationDetails(
    vendorId!,
    leadIdNum
  );

  const pptDocs = clientDocsData?.documents?.ppt ?? [];
  const pythaDocs = clientDocsData?.documents?.pytha ?? [];

  const docs = [...pptDocs, ...pythaDocs];

  const hasRejectedDocs = docs.some((d) => d.tech_check_status === "REJECTED");

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const no_of_client_documents_initially_submitted =
    lead?.no_of_client_documents_initially_submitted;

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
            {/* ✅ Tech Check Button */}
            {canTechCheck(userType) && (
              <Button
                variant="default"
                onClick={() => setOpenRejectDocsModal(true)}
                className="bg-blue-500/10 text-blue-500 border-blue-500 border hover:bg-blue-500/15 flex items-center gap-1"
              >
                <Settings2 />
                Tech Check
              </Button>
            )}

            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign Task
            </Button>

            <AnimatedThemeToggler />

            {canViewThreeVerticalDocsOptionInTechCheck(userType) && (
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
            )}
          </div>
        </header>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            if (val === "todo") {
              if (!canTechCheck(userType)) {
                toast.error("You don’t have permission to access To-Do Tasks");
                return; // 🚫 block unauthorized users
              }

              setOpenRejectDocsModal(true);
              setPrevTab(activeTab);
              return;
            }
            setActiveTab(val);
          }}
          className="w-full px-6 pt-4"
        >
          <ScrollArea>
            <div className="flex w-full items-center justify-between mb-3">
              {/* Tabs */}
              <TabsList className="h-auto gap-2 px-1.5 py-1.5 flex-shrink">
                <TabsTrigger value="details">
                  <HouseIcon size={16} className="mr-1 opacity-60" />
                  Lead Details
                </TabsTrigger>
                {canTechCheck(userType) ? (
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
                    value="You don’t have permission to access To-Do Tasks."
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

              <div className="flex items-center justify-between gap-2">
                {/* ✅ Upload Revised Docs Button (Role & Rejection Status Based) */}
                {(() => {
                  const canUpload =
                    canUploadRevisedClientDocumentationFiles(userType);

                  // Case 1: User doesn’t have permission
                  if (!canUpload) {
                    return (
                      <CustomeTooltip
                        truncateValue={
                          <Button
                            disabled
                            className="bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed flex items-center gap-2"
                          >
                            <UploadIcon size={16} />
                            Upload Revised Docs
                          </Button>
                        }
                        value="You don’t have permission to upload revised client documentation."
                      />
                    );
                  }

                  // Case 2: User has permission but no rejected files
                  if (!hasRejectedDocs) {
                    return (
                      <CustomeTooltip
                        truncateValue={
                          <Button
                            disabled
                            className="bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed flex items-center gap-2"
                          >
                            <UploadIcon size={16} />
                            Upload Revised Docs
                          </Button>
                        }
                        value="No rejected client documentation found — only rejected files can be re-uploaded."
                      />
                    );
                  }

                  // Case 3: User has permission and rejected files exist
                  return (
                    <Button
                      onClick={() => setOpenUploadDocsModal(true)}
                      className="bg-blue-50 border border-blue-500 text-blue-500 hover:bg-blue-100 flex items-center gap-2"
                    >
                      <UploadIcon size={16} />
                      Upload Revised Docs
                    </Button>
                  );
                })()}

                {/* ✅ Move To Order Login Button (Role & Status Based) */}
                {canMoveToOrderLogin(userType) &&
                  (() => {
                    const approvedPPT = pptDocs.filter(
                      (d) => d.tech_check_status === "APPROVED"
                    ).length;

                    const approvedPytha = pythaDocs.filter(
                      (d) => d.tech_check_status === "APPROVED"
                    ).length;

                    const approvedCount = approvedPPT + approvedPytha;

                    const pendingCount = docs.filter(
                      (d) =>
                        !d.tech_check_status ||
                        d.tech_check_status === "PENDING"
                    ).length;

                    // Disabled if:
                    // 1. No approved docs
                    // 2. Still some pending docs
                    // 3. No PPT approved
                    // 4. No Pytha approved
                    const isDisabled =
                      approvedCount <
                        (no_of_client_documents_initially_submitted || 0) ||
                      pendingCount > 0 ||
                      approvedPPT === 0 ||
                      approvedPytha === 0;

                    if (isDisabled) {
                      let tooltipMsg = "";

                      if (
                        no_of_client_documents_initially_submitted &&
                        approvedCount <
                          no_of_client_documents_initially_submitted
                      ) {
                        tooltipMsg = `You must approve all initially submitted client documents (${no_of_client_documents_initially_submitted}) before moving to Order Login.`;
                      } else if (approvedPPT === 0) {
                        tooltipMsg =
                          "At least one PPT file must be approved before moving to Order Login.";
                      } else if (approvedPytha === 0) {
                        tooltipMsg =
                          "At least one Pytha file must be approved before moving to Order Login.";
                      } else if (pendingCount > 0) {
                        tooltipMsg = `You still have ${pendingCount} pending document${
                          pendingCount > 1 ? "s" : ""
                        }. Please review all before proceeding.`;
                      }

                      return (
                        <CustomeTooltip
                          truncateValue={
                            <Button
                              disabled
                              className="bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed flex items-center gap-2"
                            >
                              <CircleCheckBig size={16} />
                              Move To Order Login
                            </Button>
                          }
                          value={tooltipMsg}
                        />
                      );
                    }

                    return (
                      <Button
                        onClick={() => setOpenFinalApproveConfirm(true)}
                        className="bg-green-500/10 text-green-500 border-green-500 border hover:bg-green-500/15 flex items-center gap-2"
                      >
                        <CircleCheckBig size={16} />
                        Move To Order Login
                      </Button>
                    );
                  })()}
              </div>
            </div>

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
        {/* 🪟 (C) Approve/Reject Docs Modal (Enhanced Dual Action with Dark Mode) */}
        <BaseModal
          open={openRejectDocsModal}
          onOpenChange={setOpenRejectDocsModal}
          title="Review Client Documentation"
          size="lg"
          description="Select documents to approve or reject. Review each document carefully before taking action."
        >
          <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 px-6 pt-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                    <FileText className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Total
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {docs.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
                    <CheckCircle2 className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Approved
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {
                        docs.filter((d) => d.tech_check_status === "APPROVED")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 dark:bg-amber-600 flex items-center justify-center">
                    <AlertCircle className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Selected
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedDocs.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-red-500 dark:bg-red-600 flex items-center justify-center">
                    <XCircle className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Rejected
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {
                        docs.filter((d) => d.tech_check_status === "REJECTED")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document List */}
            {docs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 mx-6">
                <FileText
                  className="mx-auto text-gray-400 dark:text-gray-600 mb-3"
                  size={48}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  No client documentation found
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Documents will appear here once uploaded
                </p>
              </div>
            ) : (
              <div className="space-y-3 px-6 pt-2">
                <div className="flex flex-col justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-white">
                    Document List
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click to select documents, then choose to approve or reject
                  </p>
                </div>

                {/* List View - FIXED VERSION with Dark Mode */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {(() => {
                    // Separate and sort documents - PENDING first, then APPROVED, then REJECTED
                    const pending = docs
                      .filter(
                        (d) =>
                          !d.tech_check_status ||
                          d.tech_check_status === "PENDING"
                      )
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        return dateB - dateA;
                      });

                    const approved = docs
                      .filter((d) => d.tech_check_status === "APPROVED")
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        return dateB - dateA;
                      });

                    const rejected = docs
                      .filter((d) => d.tech_check_status === "REJECTED")
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        return dateB - dateA;
                      });

                    const sortedDocs = [...pending, ...approved, ...rejected];

                    return sortedDocs.map((doc, index) => {
                      const isRejected = doc.tech_check_status === "REJECTED";
                      const isApproved = doc.tech_check_status === "APPROVED";
                      const isPending =
                        !doc.tech_check_status ||
                        doc.tech_check_status === "PENDING";
                      const isSelected = selectedDocs.includes(doc.id);
                      const isDisabled = isRejected || isApproved;

                      const isFirstApproved =
                        isApproved &&
                        index > 0 &&
                        sortedDocs[index - 1].tech_check_status !== "APPROVED";

                      const isFirstRejected =
                        isRejected &&
                        index > 0 &&
                        sortedDocs[index - 1].tech_check_status !== "REJECTED";

                      // Format date
                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      };

                      return (
                        <Fragment key={doc.id}>
                          {/* Divider for approved section */}
                          {isFirstApproved && (
                            <div className="flex items-center gap-3 py-3">
                              <div className="flex-1 h-px bg-green-200 dark:bg-green-800"></div>
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-3 py-1 bg-green-50 dark:bg-green-950/50 rounded-full border border-green-200 dark:border-green-800">
                                Already Approved Documents
                              </span>
                              <div className="flex-1 h-px bg-green-200 dark:bg-green-800"></div>
                            </div>
                          )}

                          {/* Divider for rejected section */}
                          {isFirstRejected && (
                            <div className="flex items-center gap-3 py-3">
                              <div className="flex-1 h-px bg-red-200 dark:bg-red-800"></div>
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400 px-3 py-1 bg-red-50 dark:bg-red-950/50 rounded-full border border-red-200 dark:border-red-800">
                                Already Rejected Documents
                              </span>
                              <div className="flex-1 h-px bg-red-200 dark:bg-red-800"></div>
                            </div>
                          )}

                          <div
                            className={cn(
                              "relative rounded-lg border-2 p-4 transition-all duration-200 group flex items-center gap-4",
                              isDisabled
                                ? "cursor-not-allowed opacity-75"
                                : "cursor-pointer",
                              isRejected
                                ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                : isApproved
                                ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                : isSelected
                                ? "border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/30 shadow-md"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                            )}
                            onClick={() => {
                              if (isDisabled) return;
                              setSelectedDocs((prev) =>
                                prev.includes(doc.id)
                                  ? prev.filter((d) => d !== doc.id)
                                  : [...prev, doc.id]
                              );
                            }}
                          >
                            {/* File Icon */}
                            <div
                              className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                isRejected
                                  ? "bg-red-100 dark:bg-red-900/50"
                                  : isApproved
                                  ? "bg-green-100 dark:bg-green-900/50"
                                  : isSelected
                                  ? "bg-amber-100 dark:bg-amber-900/50"
                                  : "bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50"
                              )}
                            >
                              <FileText
                                className={
                                  isRejected
                                    ? "text-red-500 dark:text-red-400"
                                    : isApproved
                                    ? "text-green-500 dark:text-green-400"
                                    : isSelected
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-blue-500 dark:text-blue-400"
                                }
                                size={24}
                              />
                            </div>

                            {/* Document Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-semibold text-sm truncate",
                                  isDisabled
                                    ? "text-gray-500 dark:text-gray-400"
                                    : "text-gray-900 dark:text-white"
                                )}
                              >
                                {doc.doc_og_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Uploaded: {formatDate(doc.created_at)}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                  <CheckCircle2 size={14} />
                                  Approved
                                </span>
                              )}

                              {isRejected && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                  <XCircle size={14} />
                                  Rejected
                                </span>
                              )}

                              {!isDisabled && isSelected && (
                                <div className="w-6 h-6 rounded-full bg-amber-500 dark:bg-amber-600 flex items-center justify-center shadow-md">
                                  <CheckCircle2
                                    className="text-white"
                                    size={16}
                                  />
                                </div>
                              )}

                              {!isDisabled && !isSelected && (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition-colors"></div>
                              )}
                            </div>
                          </div>
                        </Fragment>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-between py-4 px-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm">
                {selectedDocs.length > 0 ? (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {selectedDocs.length}
                    </span>{" "}
                    document{selectedDocs.length !== 1 ? "s" : ""} selected
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No documents selected
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenRejectDocsModal(false);
                    setSelectedDocs([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={selectedDocs.length === 0}
                  onClick={() => {
                    if (selectedDocs.length === 0) {
                      toast.error("Please select at least one document.");
                      return;
                    }
                    setOpenRejectDocsModal(false);
                    setOpenApproveConfirmModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  <CheckCircle2 size={16} className="mr-1" />
                  Approve Selected ({selectedDocs.length})
                </Button>
                <Button
                  variant="destructive"
                  disabled={selectedDocs.length === 0}
                  onClick={() => {
                    if (selectedDocs.length === 0) {
                      toast.error("Please select at least one document.");
                      return;
                    }
                    setOpenRejectDocsModal(false);
                    setOpenRemarkModal(true);
                  }}
                >
                  <XCircle size={16} className="mr-1" />
                  Reject Selected ({selectedDocs.length})
                </Button>
              </div>
            </div>
          </div>
        </BaseModal>

        {/* 🪟 (D) Remark Input Modal - Enhanced */}
        <BaseModal
          open={openRemarkModal}
          onOpenChange={setOpenRemarkModal}
          title="Add Rejection Remark"
          size="md"
          description="Provide a detailed reason for rejecting the selected documents."
        >
          <div className="space-y-5 px-4 py-4">
            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle
                className="text-amber-600 flex-shrink-0 mt-0.5"
                size={18}
              />
              <div className="text-sm">
                <p className="font-medium text-amber-900 mb-1">
                  Selected Documents: {selectedDocs.length}
                </p>
                <p className="text-amber-700 text-xs">
                  Your remark will be sent to the client for all selected
                  documents.
                </p>
              </div>
            </div>

            {/* Selected Documents Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">
                Documents to Reject:
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1.5 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {docs
                  .filter((doc) => selectedDocs.includes(doc.id))
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 text-xs text-gray-700 bg-white px-3 py-2 rounded-md border border-gray-200"
                    >
                      <FileText
                        size={14}
                        className="text-amber-600 flex-shrink-0"
                      />
                      <span className="truncate font-medium">
                        {doc.doc_og_name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Remark Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <TextAreaInput
                value={remark}
                onChange={(value) => setRemark(value)}
                maxLength={500}
                placeholder="Enter detailed reason for rejection (e.g., 'Document is unclear', 'Missing required information', 'Incorrect format')..."
              />
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              {/* <p className="text-xs text-gray-500">
                This action will notify the client
              </p> */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenRemarkModal(false);
                    setRemark("");
                  }}
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
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Continue to Confirm
                </Button>
              </div>
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

        {/* 🪟 New: Approve Confirmation Modal */}
        <AlertDialog
          open={openApproveConfirmModal}
          onOpenChange={setOpenApproveConfirmModal}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Selected Documents?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to approve {selectedDocs.length} document
                {selectedDocs.length !== 1 ? "s" : ""}. This action will mark
                them as approved and they will be processed accordingly.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setOpenApproveConfirmModal(false);
                  setOpenRejectDocsModal(true);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  approveMultipleDocsMutate({
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    userId: userId!,
                    approvedDocs: selectedDocs,
                  });

                  setOpenApproveConfirmModal(false);
                  setSelectedDocs([]);
                }}
                disabled={approvingDocs}
                className="bg-green-600 hover:bg-green-700"
              >
                {approvingDocs ? "Approving..." : "Confirm Approval"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <UploadMoreClientDocumentationModal
          open={openUploadDocsModal}
          onOpenChange={setOpenUploadDocsModal}
          data={{
            leadId: leadIdNum,
            accountId: accountId,
          }}
        />

        <AssignTaskSiteMeasurementForm
          open={assignOpen}
          onOpenChange={setAssignOpen}
          onlyFollowUp
          data={{ id: leadIdNum, name: "" }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
