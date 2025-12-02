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
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, CircleCheck, CircleX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import {
  useRevertActivityStatus,
  useUpdateActivityStatus,
} from "@/hooks/useActivityStatus";
import RevertRemarkModal from "@/components/generics/RevertRemarkModal";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function PendingLeadDetails() {
  const router = useRouter();

  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const tab = searchParams.get("tab");

  const queryClient = useQueryClient();
  const revertMutation = useRevertActivityStatus();

  const [openRemark, setOpenRemark] = useState(false);
  const [remarkLeadId, setRemarkLeadId] = useState<number | null>(null);
  const [openApproveModal, setOpenApproveModal] = useState(false);

  const [openMarkLost, setOpenMarkLost] = useState(false);

  const markAsLostMutation = useUpdateActivityStatus();

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
                  <BreadcrumbLink href="/dashboard/leads/leadstable">
                    {tab} Leads
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
            <AnimatedThemeToggler />

            {/* 🔹 Dynamic Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <EllipsisVertical size={20} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44">
                {/* ✅ If navigated from On Hold */}
                {tab === "onHold" && (
                  <>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setRemarkLeadId(leadIdNum);
                        setOpenRemark(true);
                      }}
                    >
                      <CircleCheck size={18} className="mr-2" />
                      Mark as Active
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setOpenMarkLost(true);
                      }}
                    >
                      <XCircle size={18} className="mr-2" />
                      Mark as Lost
                    </DropdownMenuItem>
                  </>
                )}

                {/* ✅ If navigated from Lost Approval */}
                {tab === "lostApproval" && (
                  <>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setOpenApproveModal(true);
                      }}
                    >
                      <CircleCheck size={18} className="mr-2" />
                      Approve
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setRemarkLeadId(leadIdNum);
                        setOpenRemark(true);
                      }}
                    >
                      <CircleX size={18} className="mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}

                {/* ✅ If navigated from Lost */}
                {tab === "lost" && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setRemarkLeadId(leadIdNum);
                      setOpenRemark(true);
                    }}
                  >
                    <CircleCheck size={18} className="mr-2" />
                    Mark as Active
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 pt-4">
          <LeadDetailsUtil
            status="details"
            leadId={leadIdNum}
            leadInfo={{ leadId: leadIdNum, accountId: accountId }}
          />
        </main>

        <ActivityStatusModal
          open={openApproveModal}
          onOpenChange={setOpenApproveModal}
          statusType="lost"
          onSubmitRemark={(remark) => {
            if (!vendorId || !userId) {
              toast.error("Missing vendor/user info");
              return;
            }

            // 🔹 Same flow as the table’s Mark as Lost
            markAsLostMutation.mutate(
              {
                leadId: leadIdNum,
                payload: {
                  vendorId,
                  accountId: Number(accountId),
                  userId,
                  status: "lost",
                  remark,
                  createdBy: userId,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Lead Approved!");
                  setOpenApproveModal(false);

                  // ✅ Invalidate both queries
                  queryClient.invalidateQueries({
                    queryKey: ["lostApprovalLeads"],
                  });
                  queryClient.invalidateQueries({ queryKey: ["lostLeads"] });

                  // ✅ Redirect back to Lost Approval tab
                  router.push("/dashboard/leads/leadstable");
                },
                onError: (err: any) => {
                  toast.error(err?.message || "Failed to approve lead!");
                },
              }
            );
          }}
          loading={markAsLostMutation.isPending}
        />

        <ActivityStatusModal
          open={openMarkLost}
          onOpenChange={setOpenMarkLost}
          statusType="lostApproval"
          onSubmitRemark={(remark) => {
            if (!vendorId || !userId) {
              toast.error("Missing vendor/user info");
              return;
            }

            markAsLostMutation.mutate(
              {
                leadId: leadIdNum,
                payload: {
                  vendorId,
                  accountId: Number(accountId),
                  userId,
                  status: "lostApproval",
                  remark,
                  createdBy: userId,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Lead marked as Lost Approval!");
                  setOpenMarkLost(false);

                  // ✅ Refresh related data
                  queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
                  queryClient.invalidateQueries({ queryKey: ["lostLeads"] });

                  // ✅ Redirect back to Pending Leads On Hold tab
                  router.push("/dashboard/leads/leadstable");
                },
                onError: (err: any) => {
                  toast.error(err?.message || "Failed to mark as Lost!");
                },
              }
            );
          }}
          loading={markAsLostMutation.isPending}
        />

        {/* 🔹 Remark Modal for reverting (Mark as Active) */}
        <RevertRemarkModal
          open={openRemark}
          onOpenChange={setOpenRemark}
          onSubmitRemark={(remark) => {
            if (!vendorId || !userId || !remarkLeadId) {
              toast.error("Missing vendor/user/lead info");
              return;
            }

            revertMutation.mutate(
              {
                leadId: remarkLeadId,
                payload: {
                  vendorId,
                  accountId: Number(accountId),
                  userId,
                  remark,
                  createdBy: userId,
                },
              },
              {
                onSuccess: () => {
                  toast.success("Lead marked as Active!");
                  setOpenRemark(false);
                  setRemarkLeadId(null);

                  // ✅ Invalidate queries so table refreshes
                  queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
                  queryClient.invalidateQueries({ queryKey: ["leadStats"] });

                  // ✅ Redirect back
                  router.push("/dashboard/leads/leadstable");
                },
                onError: (err: any) => {
                  toast.error(err?.message || "Failed to mark as active!");
                },
              }
            );
          }}
          loading={revertMutation.isPending}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
