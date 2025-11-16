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

import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";

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
  Hammer, // Under Installation icon
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
} from "lucide-react";

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

import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useDeleteLead } from "@/hooks/useDeleteLead";

import { toast } from "react-toastify";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/cutome-tooltip";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import LeadDetailsGrouped from "@/components/utils/lead-details-grouped";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMoveToFinalHandover,
  useSetActualInstallationStartDate,
  useUnderInstallationDetails,
} from "@/api/installation/useUnderInstallationStageLeads";

export default function UnderInstallationLeadDetails() {
  const router = useRouter();
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: underDetails } = useUnderInstallationDetails(
    vendorId,
    leadIdNum
  );
  const setStartMutation = useSetActualInstallationStartDate();

  const [openStartModal, setOpenStartModal] = useState(false);

  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const moveMutation = useMoveToFinalHandover();

  const [activeTab, setActiveTab] = useState("details");

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();
  const accountId = lead?.account_id;

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

  function formatInstallationDate(dateString: string) {
    const date = new Date(dateString);

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    const fullDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${time} – ${dayName}, ${fullDate}`;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="w-full h-full overflow-x-hidden flex flex-col">
        {/* 🔹 Header */}
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

          {/* 🔹 Header Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setSelectedLead(lead); // <-- use the lead you're viewing
                setShowMoveModal(true);
              }}
            >
              Move to Final Handover
            </Button>

            <AnimatedThemeToggler />

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

                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setOpenDelete(true)}>
                    <XCircle size={20} className="text-red-500" />
                    Delete
                  </DropdownMenuItem>
                </>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 🔹 Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val)}
          className="w-full px-6 pt-4"
        >
          <div className="w-full flex justify-between">
            <div>
              <ScrollArea>
                <div className="w-full h-full flex justify-between items-center mb-4">
                  <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                    {/* Under Installation Details */}
                    <TabsTrigger value="details">
                      <Hammer size={16} className="mr-1 opacity-60" />
                      Under Installation Details
                    </TabsTrigger>

                    {/* To-Do Tab — Disabled */}
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
                      value="Under development"
                    />

                    {/* Site History */}
                    <TabsTrigger value="history">
                      <BoxIcon size={16} className="mr-1 opacity-60" />
                      Site History
                    </TabsTrigger>

                    {/* Payment */}
                    <TabsTrigger value="payment">
                      <UsersRoundIcon size={16} className="mr-1 opacity-60" />
                      Payment Information
                    </TabsTrigger>
                  </TabsList>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            <div className="flex px-6">
              {!underDetails?.actual_installation_start_date ? (
                <Button size="sm" onClick={() => setOpenStartModal(true)}>
                  Start Installation
                </Button>
              ) : (
                <div className="flex flex-col items-start">
                  <p className="text-xs font-semibold">
                    Installation Started At
                  </p>

                  {/* Stylish formatted date & time */}
                  <div className="mt-1">
                    <p className="text-sm">
                      {formatInstallationDate(
                        underDetails.actual_installation_start_date
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🔹 Start Installation Button / Date Display */}

          {/* TAB CONTENTS */}

          <TabsContent value="details">
            <main className="flex-1 h-fit">
              {!isLoading && accountId && (
                <LeadDetailsGrouped
                  status="underInstallation"
                  defaultTab="underInstallation"
                  leadId={leadIdNum}
                  accountId={accountId}
                  defaultParentTab="installation"
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

        {/* 🔹 Modals */}
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

        {/* Delete Dialog */}
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

        <AlertDialog open={openStartModal} onOpenChange={setOpenStartModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Installation?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark the installation as started? (Date
                & time will be recorded)
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setStartMutation.mutate({
                    vendorId: vendorId!,
                    leadId: leadIdNum,
                    updated_by: userId!,
                    actual_installation_start_date: new Date().toISOString(),
                  });
                  setOpenStartModal(false);
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showMoveModal} onOpenChange={setShowMoveModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold">
                Move Lead to Final Handover?
              </AlertDialogTitle>
            </AlertDialogHeader>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark this lead as <b>Final Handover</b>?
              This action will update the lead’s stage.
            </p>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <AlertDialogAction
                onClick={() => {
                  moveMutation.mutate({
                    vendorId: lead.vendor_id,
                    leadId: lead.id,
                    updated_by: userId!,
                  });
                  setShowMoveModal(false);
                }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
