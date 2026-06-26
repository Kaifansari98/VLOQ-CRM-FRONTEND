"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import BaseModal from "@/components/utils/baseModal";
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
import {
  useActOnFastProductionRequestTask,
  useFastProductionRequestDetails,
} from "@/hooks/useTasksQueries";
import { useGetFastProductionDetailsForLead } from "@/hooks/useLeadsQueries";
import { FileText, Download, Calendar, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import DocumentCard from "@/components/utils/documentCard";
import CustomeDatePicker from "@/components/date-picker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    taskId: number;
    remark?: string;
  };
}

const formatDateStr = (dateStr?: string) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const getFinish = (finishes: any[], component: "CARCASS" | "SHUTTER" | "HANDLE") => {
  const item = finishes?.find((f) => f.component === component);
  return {
    category: item?.finish_category || "-",
    description: item?.finish_description || "-",
  };
};

const renderListWithBlackDots = (text: string | null | undefined, isCategory: boolean = false) => {
  if (!text || text === "-") return "-";
  
  if (isCategory) {
    // For materials/categories, render them side-by-side joined by commas
    const joinedText = text.split(/[,\n]+/).map(l => l.trim()).filter(l => l.length > 0).join(', ');
    if (!joinedText) return "-";
    return (
      <ul className="space-y-1.5 mt-1.5">
        <li className="flex items-start gap-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/80 shrink-0 mt-1.5" />
          <span className="text-sm font-bold text-foreground leading-relaxed">{joinedText}</span>
        </li>
      </ul>
    );
  }

  // For regular text (e.g. descriptions), split by newline
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return "-";
  return (
    <ul className="space-y-1.5">
      {lines.map((line, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-foreground/80 shrink-0 mt-1.5" />
          <span className="text-sm text-muted-foreground leading-relaxed">{line}</span>
        </li>
      ))}
    </ul>
  );
};

export default function FastProductionRequestActionModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [remark, setRemark] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeRequestIdx, setActiveRequestIdx] = useState(0);
  const [productionTargetDate, setProductionTargetDate] = useState<string | undefined>();

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector((state: any) => state.auth.user?.user_type?.user_type?.toLowerCase() || "");
  const isFactoryUser = userType.includes("factory");

  const queryClient = useQueryClient();
  const actionMutation = useActOnFastProductionRequestTask();

  const { data: requestDetailsResponse, isLoading } = useFastProductionRequestDetails(
    data?.leadId || 0,
    data?.taskId || 0,
    open,
  );

  const requestDetails = requestDetailsResponse?.data;
  const requests = requestDetails?.requests || [];
  const activeRequest = requests[activeRequestIdx];

  const { data: fastProductionDetailsResponse } = useGetFastProductionDetailsForLead(
    vendorId,
    data?.leadId,
    undefined,
    open && isFactoryUser
  );
  const fastProductionDetails = fastProductionDetailsResponse?.data || [];

  useEffect(() => {
    if (open) {
      setActiveRequestIdx(0);
      setShowRejectForm(false);
      setRemark("");
      setProductionTargetDate(undefined);
    }
  }, [open]);

  const resetState = () => {
    setShowRejectForm(false);
    setRemark("");
    setProductionTargetDate(undefined);
    setConfirmOpen(false);
  };

  const submitAction = (action: "approve" | "reject") => {
    if (!data?.leadId || !data?.taskId || !userId) {
      toastManager.add({
        title: "Missing lead, task, or user information",
        type: "error",
      });
      return;
    }

    if (action === "reject" && !remark.trim()) {
      toastManager.add({
        title: "Remark is required for rejection",
        type: "error",
      });
      return;
    }

    actionMutation.mutate(
      {
        leadId: data.leadId,
        taskId: data.taskId,
        payload: {
          action,
          acted_by: userId,
          remark: remark.trim() || null,
          production_target_date: productionTargetDate || null,
        },
      },
      {
        onSuccess: (response: any) => {
          const isFullyApproved = response?.data?.isFullyApproved === true;
          toastManager.add({
            title:
              action === "reject"
                ? "Fast production request rejected successfully"
                : isFullyApproved
                  ? "Fast production request approved successfully"
                  : "Approval recorded. Awaiting the remaining approver.",
            type: "success",
          });

          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorAllTasks", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["leadLogs"],
            });
            queryClient.invalidateQueries({
              queryKey: ["leadStats"],
            });
          }

          onOpenChange(false);
          resetState();
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "Failed to update fast production request",
            type: "error",
          });
        },
      },
    );
  };

  const handleApprove = () => {
    setConfirmOpen(false);
    submitAction("approve");
  };

  const handleReject = () => {
    submitAction("reject");
  };

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) resetState();
        }}
        title="Fast Production Request"
        description="Confirm approval, or reject this fast production request with a reason."
        size="xl"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 px-6 py-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                <p className="mt-4 text-sm font-medium">Fetching request details...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
                <Info className="h-8 w-8 mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-sm font-medium">No request details found for this task.</p>
              </div>
            ) : (
              <>
   
                {/* Instance Selector */}
                {requests.length > 1 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Select Instance
                        </p>
                        <p className="text-xs text-muted-foreground">
                          View details for each requested instance.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {requests.map((req: any, idx: number) => {
                        const isActive = idx === activeRequestIdx;
                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => setActiveRequestIdx(idx)}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-left transition-all",
                              isActive
                                ? "border-orange-500 bg-orange-50 shadow-sm dark:border-orange-400 dark:bg-orange-950/30"
                                : "border-border bg-background hover:border-orange-300 hover:bg-orange-50/60 dark:hover:border-orange-500/50 dark:hover:bg-orange-950/20",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Instance {idx + 1}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  {req.instance?.title || `Instance ${idx + 1}`}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : requests.length === 1 ? (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50/70 px-4 py-3 dark:border-orange-900/50 dark:bg-orange-950/20">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Instance
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {requests[0].instance?.title || "Instance 1"}
                    </p>
                  </div>
                ) : null}

                {/* Active Request Details Panel */}
                {activeRequest ? (
                  <div className="space-y-5 animate-in fade-in duration-200">

                    {/* Detailed Info List */}
                    <div className="space-y-4">
                      {/* Carcass Finish */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                            Carcass Finish
                          </p>
                          {renderListWithBlackDots(getFinish(activeRequest.finishes, "CARCASS").category, true)}
                        </div>
                        <div className="border-t border-border pt-3 mt-1">
                          {renderListWithBlackDots(getFinish(activeRequest.finishes, "CARCASS").description)}
                        </div>
                      </div>

                      {/* Shutter Finish */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                            Shutter Finish
                          </p>
                          {renderListWithBlackDots(getFinish(activeRequest.finishes, "SHUTTER").category, true)}
                        </div>
                        <div className="border-t border-border pt-3 mt-1">
                          {renderListWithBlackDots(getFinish(activeRequest.finishes, "SHUTTER").description)}
                        </div>
                      </div>

                      {/* Handles Finish */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                            Handles Finish
                          </p>
                          {renderListWithBlackDots(getFinish(activeRequest.finishes, "HANDLE").category, true)}
                        </div>
                        <div className="border-t border-border pt-3 mt-1">
                          {renderListWithBlackDots(getFinish(activeRequest.finishes, "HANDLE").description)}
                        </div>
                      </div>

                      {/* Hardware Selection */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Hardware Selection
                        </p>
                        <div>
                          {renderListWithBlackDots(activeRequest.hardware_selection)}
                        </div>
                      </div>

                      {/* Accessory Selection */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Accessory Selection
                        </p>
                        <div>
                          {renderListWithBlackDots(activeRequest.accessory_selection)}
                        </div>
                      </div>

                      {/* Special Requirements */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-orange-50/20 p-5 dark:border-orange-950/30">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-400">
                          Special Requirements
                        </p>
                        <div>
                          {renderListWithBlackDots(activeRequest.special_requirements)}
                        </div>
                      </div>

                      {/* Remarks */}
                      {activeRequest.remarks ? (
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Remarks
                          </p>
                          <div>
                            {renderListWithBlackDots(activeRequest.remarks)}
                          </div>
                        </div>
                      ) : null}

                      {/* Date */}
                      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                        <div className="rounded-xl bg-orange-100 dark:bg-orange-950/50 p-2.5 text-orange-600 dark:text-orange-400 shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-xs font-medium text-muted-foreground">
                            Required Delivery Date
                          </p>
                          <p className="text-sm font-bold text-foreground mt-0.5">
                            {formatDateStr(activeRequest.client_required_delivery_date)}
                          </p>
                        </div>
                      </div>

                      {/* Attachments */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Attachments
                        </p>
                        <div>
                          {activeRequest.documents && activeRequest.documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                              {activeRequest.documents.map((docMapping: any) => {
                                const doc = docMapping.document;
                                if (!doc) return null;
                                const docData = {
                                  id: doc.id || docMapping.id,
                                  originalName: doc.doc_og_name || "Unnamed Document",
                                  signedUrl: doc.signedUrl,
                                  created_at: doc.created_at,
                                };
                                return (
                                  <DocumentCard
                                    key={docMapping.id || doc.id}
                                    doc={docData}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="shrink-0 border-t bg-muted/10 px-6 py-5 space-y-4">
            {showRejectForm ? (
              <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                <p className="text-sm font-semibold text-foreground">Rejection Reason <span className="text-destructive">*</span></p>
                <TextAreaInput
                  value={remark}
                  onChange={setRemark}
                  placeholder="Please provide a detailed reason for rejecting this fast production request..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              {showRejectForm ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRemark("");
                    }}
                    disabled={actionMutation.isPending}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={actionMutation.isPending}
                    className="min-w-[140px]"
                  >
                    {actionMutation.isPending ? "Processing..." : "Submit Rejection"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 min-w-[100px]"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionMutation.isPending || isLoading}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={actionMutation.isPending || isLoading}
                    className="min-w-[140px]"
                  >
                    Approve Request
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </BaseModal>

      <BaseModal 
        open={confirmOpen} 
        onOpenChange={setConfirmOpen}
        title="Approve Fast Production Request?"
        description="This will record your approval and complete your task. The lead will be marked as fast production only when the last required approver approves."
        size="lg"
      >
        <div className="flex flex-col p-6 pt-2 h-full">
          {isFactoryUser && (
            <div className="mb-6 text-left">
              {fastProductionDetails.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-blue-500" />
                    <h4 className="font-semibold text-foreground">Fast Production Details</h4>
                  </div>
                  <div className={cn("grid gap-3 max-h-[60vh] overflow-y-auto", fastProductionDetails.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                    {fastProductionDetails.map((detail: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Instance</span>
                          <span className="text-sm font-semibold text-foreground truncate" title={detail.instance?.title || "Single Lead"}>
                            {detail.instance?.title || "Single Lead"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1 border-t pt-2">
                          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Target Delivery</span>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateStr(detail.client_required_delivery_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              <div className="mt-4">
                <label className="text-sm font-medium">Production Target Date (Optional)</label>
                <div className="mt-1">
                  <CustomeDatePicker
                    value={productionTargetDate}
                    onChange={setProductionTargetDate}
                    restriction="futureOnly"
                    minDate={new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
