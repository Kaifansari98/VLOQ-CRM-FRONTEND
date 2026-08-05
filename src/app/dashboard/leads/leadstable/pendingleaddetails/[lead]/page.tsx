"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, CircleCheck, CircleX, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
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
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useLeadById } from "@/hooks/useLeadsQueries";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PendingLeadDetails() {
  const router = useRouter();

  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type as string | undefined,
  );
  const normalizedUserType = userType?.trim().toLowerCase();
  const isAuditor = normalizedUserType === "auditor";
  const shouldDirectlyMarkLost =
    normalizedUserType === "admin" || normalizedUserType === "super-admin";

  const tab = searchParams.get("tab");

  const queryClient = useQueryClient();
  const revertMutation = useRevertActivityStatus();

  const [openRemark, setOpenRemark] = useState(false);
  const [remarkLeadId, setRemarkLeadId] = useState<number | null>(null);
  const [openApproveModal, setOpenApproveModal] = useState(false);

  const [openMarkLost, setOpenMarkLost] = useState(false);

  const markAsLostMutation = useUpdateActivityStatus();

  const { data: leadResponse } = useLeadById(leadIdNum, vendorId, userId);
  const latestActivityStatus =
    leadResponse?.data?.lead?.latest_activity_status;
  const shouldShowStatusInfo = !!latestActivityStatus;
  const activityCreatedAt = latestActivityStatus?.created_at
    ? new Date(latestActivityStatus.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const formatStatusLabel = (value?: string) => {
    if (!value) return "—";
    const spaced = value.replace(/([a-z])([A-Z])/g, "$1 $2");
    return spaced
      .split(/\s+/)
      .map((part) =>
        part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part
      )
      .join(" ");
  };

  return (
    <>
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
          {shouldShowStatusInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative bg-accent p-1.5 rounded-sm"
                  aria-label="Latest activity status"
                >
                  <Info size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="w-64 p-0 bg-transparent shadow-none">
                <div className="rounded-lg border bg-background shadow-md">
                  <div className="border-b px-3 py-2 text-sm font-semibold text-primary">
                    Latest Activity Status
                  </div>
                  <div className="space-y-2 px-3 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Lead status</span>
                      <span className="font-medium text-foreground">
                        {formatStatusLabel(
                          latestActivityStatus.activity_status
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        {formatStatusLabel(
                          latestActivityStatus.activity_status
                        )}{" "}
                        by
                      </span>
                      <span className="font-medium text-foreground">
                        {latestActivityStatus.created_by_name ||
                          latestActivityStatus.created_by}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        {formatStatusLabel(
                          latestActivityStatus.activity_status
                        )}{" "}
                        at
                      </span>
                      <span className="font-medium text-foreground">
                        {activityCreatedAt}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span>Remark</span>
                      <span className="rounded-md bg-muted px-2 py-1 text-foreground">
                        {latestActivityStatus.activity_status_remark || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
          {!isAuditor && <NotificationBell />}
          <AnimatedThemeToggler />

          {/* 🔹 Dynamic Actions Menu */}
          {!isAuditor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative bg-accent p-1.5 rounded-sm"
              >
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
          )}
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
        existingRemark={latestActivityStatus?.activity_status_remark || ""}
        existingRemarkLabel="Sales executive remark"
        onSubmitRemark={(remark) => {
          if (!vendorId || !userId) {
            toastManager.add({ title: "Missing vendor/user info", type: "error" });
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
                toastManager.add({ title: "Lead Approved!", type: "success" });
                setOpenApproveModal(false);

                // ✅ Invalidate both queries
                queryClient.invalidateQueries({
                  queryKey: ["lostApprovalLeads"],
                });
                queryClient.invalidateQueries({ queryKey: ["lostLeads"] });

                // ✅ Redirect back to Lost Approval tab
                router.push("/dashboard/leads/leadstable");
              },
              onError: (err) => {
                toastManager.add({ title: err || "Failed to approve lead!", type: "error" });
              },
            }
          );
        }}
        loading={markAsLostMutation.isPending}
      />

      <ActivityStatusModal
        open={openMarkLost}
        onOpenChange={setOpenMarkLost}
        statusType="lost"
        onSubmitRemark={(remark) => {
          if (!vendorId || !userId) {
            toastManager.add({ title: "Missing vendor/user info", type: "error" });
            return;
          }

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
              onSuccess: (res: any) => {
                const finalStatus = res?.data?.activity_status;
                toastManager.add({
                  title:
                    finalStatus === "lostApproval"
                      ? "Lead sent for Lost Approval!"
                      : "Lead marked as Lost!",
                  type: "success",
                });
                setOpenMarkLost(false);

                // ✅ Refresh related data
                queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
                queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
                queryClient.invalidateQueries({ queryKey: ["lostApprovalLeads"] });

                // ✅ Redirect back to Pending Leads On Hold tab
                router.push("/dashboard/leads/leadstable");
              },
              onError: (err) => {
                toastManager.add({ title: err || "Failed to mark as Lost!", type: "error" });
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
            toastManager.add({ title: "Missing vendor/user/lead info", type: "error" });
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
                setOpenRemark(false);
                setRemarkLeadId(null);

                // ✅ Invalidate queries so table refreshes
                queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
                queryClient.invalidateQueries({ queryKey: ["leadStats"] });

                // ✅ Redirect back
                router.push("/dashboard/leads/leadstable");
              },
              onError: (err) => {
                toastManager.add({ title: err?.message || "Failed to mark as active!", type: "error" });
              },
            }
          );
        }}
        loading={revertMutation.isPending}
      />
    </>
  );
}
