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
import { Button } from "@/components/ui/button";
import { useMoveToDesigningStage } from "@/api/designingStageQueries";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

export default function SiteMeasurementLead() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const { mutate: moveToDesigningStage, isPending: isMovePending } =
    useMoveToDesigningStage();
    

  const [openConfirmation, setOpenconfirmation] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const handleMoveToDesigningStage = () => {
    if (!leadId || !vendorId || !userId) {
      toast.error("❌ Missing required data to move lead");
      return;
    }

    moveToDesigningStage(
      { lead_id: leadIdNum, vendor_id: vendorId, user_id: userId },
      {
        onSuccess: (res) => {
          toast.success("Lead moved to Designing Stage successfully!");
          queryClient.invalidateQueries({
            queryKey: ["siteMeasurementLeads", vendorId, 2],
          });
          // ✅ Refetch lead count after success
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });
        },
        onError: (err) => {
          console.error("❌ API error:", err);
          toast.error("Failed to move lead. Please try again.");
        },
      }
    );
  };

  const lead = data?.data?.lead;
  const leadStatus = lead?.statusType?.type;

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <div className="flex items-center gap-2">
            <Button onClick={() => setOpenconfirmation(true)}>
              Move To Designing Stage
            </Button>
            <ModeToggle />
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 p-6 space-y-6">
          {lead ? (
            <div className="w-full border py-4 px-5 mt-2 rounded-lg">
              {/* Header with created date */}
              <div className="border-b flex justify-between items-center pb-2 mb-4">
                <h2 className="font-semibold">Lead Information</h2>
                <p className="text-sm">{formatDateTime(lead.created_at)}</p>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium">Lead Name</p>
                  <p>
                    {lead.firstname} {lead.lastname}
                  </p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Lead Email</p>
                  <p>{lead.email}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Lead Contact</p>
                  <p>
                    {lead.country_code} {lead.contact_no}
                  </p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Billing Name</p>
                  <p>{lead.billing_name}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Architect Name</p>
                  <p>{lead.archetech_name}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Product Structures</p>
                  <p>
                    {lead.leadProductStructureMapping
                      ?.map((ps: any) => ps.productStructure?.type)
                      .join(", ") || "N/A"}
                  </p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Product Types</p>
                  <p>
                    {lead.productMappings
                      ?.map((pm: any) => pm.productType?.type)
                      .join(", ") || "N/A"}
                  </p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Source</p>
                  <p>{lead.source?.type}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Site Type</p>
                  <p>{lead.siteType?.type}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-sm font-medium">Priority</p>
                  <p>{lead.priority}</p>
                </div>
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1 mt-4">
                <p className="text-sm font-medium">Design Remarks</p>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm">
                  {lead.designer_remark || "N/A"}
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1 mt-4">
                <p className="text-sm font-medium">Site Address</p>
                <div className="bg-muted border rounded-sm py-1 px-2 text-sm">
                  {lead.site_address || "N/A"}
                </div>
              </div>
            </div>
          ) : (
            <p>No lead details found.</p>
          )}

          <AlertDialog
            open={openConfirmation}
            onOpenChange={setOpenconfirmation}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move the lead to Designing Stage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isMovePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleMoveToDesigningStage}
                  disabled={isMovePending}
                >
                  {isMovePending ? "Processing..." : "Yes, Move"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
