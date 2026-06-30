"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import BaseModal from "@/components/utils/baseModal";
import {
  useActOnFastProductionRequestTask,
  useFastProductionRequestDetails,
} from "@/hooks/useTasksQueries";
import { useGetFastProductionDetailsForLead } from "@/hooks/useLeadsQueries";
import { Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import DocumentCard from "@/components/utils/documentCard";
import CustomeDatePicker from "@/components/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
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

const getTodayAtMidnight = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getFinish = (finishes: any[], component: "CARCASS" | "SHUTTER" | "HANDLE") => {
  const item = finishes?.find((f) => f.component === component);
  return {
    category: item?.finish_category || "-",
    description: item?.finish_description || "-",
  };
};

const renderSimpleList = (text: string | null | undefined, isCategory: boolean = false) => {
  if (!text || text === "-") return <span className="text-sm text-muted-foreground">-</span>;
  
  if (isCategory) {
    const items = text.split(/[,\n]+/).map(l => l.trim()).filter(l => l.length > 0);
    if (items.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 border border-border/50 text-foreground">
            {item}
          </span>
        ))}
      </div>
    );
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return <span className="text-sm text-muted-foreground">-</span>;
  return (
    <div className="space-y-1 mt-1">
      {lines.map((line, idx) => (
        <p key={idx} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
      ))}
    </div>
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
  const [acceptRequestedDates, setAcceptRequestedDates] = useState(false);

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
  
  const fastProductionDetails = Array.isArray(fastProductionDetailsResponse?.data) 
    ? fastProductionDetailsResponse.data 
    : ((fastProductionDetailsResponse?.data as any)?.requests || []);


  const minProductionTargetDate = React.useMemo(() => {
    const baseDate = getTodayAtMidnight();

    const tentativeDates = fastProductionDetails
      .map((detail: any) => {
        if (!detail?.tentative_order_login_date) return null;
        const parsed = new Date(detail.tentative_order_login_date);
        if (Number.isNaN(parsed.getTime())) return null;
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      })
      .filter((date: Date | null): date is Date => date !== null);

    if (tentativeDates.length > 0) {
      const latestTentativeDate = new Date(
        Math.max(...tentativeDates.map((date) => date.getTime())),
      );

      if (latestTentativeDate > baseDate) {
        baseDate.setTime(latestTentativeDate.getTime());
      }
    }

    baseDate.setDate(baseDate.getDate() + 10);
    return toDateInputValue(baseDate);
  }, [fastProductionDetails]);

  useEffect(() => {
    if (open) {
      setActiveRequestIdx(0);
      setShowRejectForm(false);
      setRemark("");
      setProductionTargetDate(undefined);
      setAcceptRequestedDates(false);
    }
  }, [open]);

  const resetState = () => {
    setShowRejectForm(false);
    setRemark("");
    setProductionTargetDate(undefined);
    setAcceptRequestedDates(false);
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

    if (action === "approve" && isFactoryUser && !acceptRequestedDates && !productionTargetDate) {
      toastManager.add({
        title: "Production target date is required if you do not accept requested dates.",
        type: "error",
      });
      return;
    }

    // Modal can be closed now since validation passed
    if (action === "approve") {
      setConfirmOpen(false);
    }

    let finalTargetDate = productionTargetDate;
    if (action === "approve" && isFactoryUser && acceptRequestedDates) {
      if (fastProductionDetails.length > 0) {
        const dates = fastProductionDetails
          .map((d: any) => new Date(d.client_required_delivery_date).getTime())
          .filter((t: number) => !isNaN(t));
        
        if (dates.length > 0) {
          const maxDate = new Date(Math.max(...dates));
          // Adjust for local timezone by creating YYYY-MM-DD from local parts
          const year = maxDate.getFullYear();
          const month = String(maxDate.getMonth() + 1).padStart(2, '0');
          const day = String(maxDate.getDate()).padStart(2, '0');
          finalTargetDate = `${year}-${month}-${day}`;
        }
      }
    }

    actionMutation.mutate(
      {
        leadId: data.leadId,
        taskId: data.taskId,
        payload: {
          action,
          acted_by: userId,
          remark: remark.trim() || null,
          production_target_date: finalTargetDate || null,
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
        description="Review the request details below to approve or reject."
        size="xl"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 px-6 py-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
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

                    <div className="flex flex-wrap gap-2">
                      {requests.map((req: any, idx: number) => {
                        const isActive = idx === activeRequestIdx;
                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => setActiveRequestIdx(idx)}
                            className={cn(
                              "rounded-md border px-4 py-2 text-left transition-all",
                              isActive
                                ? "border-foreground bg-foreground/5 shadow-sm"
                                : "border-border bg-background hover:border-foreground/30 hover:bg-muted/50",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Instance {idx + 1}
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                  {req.instance?.title || `Instance ${idx + 1}`}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Active Request Details Panel */}
                {activeRequest ? (
                  <div className="space-y-5 animate-in fade-in duration-200">

                    {/* Detailed Info List */}
                    <div className="space-y-4">
                      
                      {/* Date */}
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold capitalize text-foreground">
                          Required Delivery Date
                        </p>
                        <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
                          <div className="rounded-md bg-muted p-2.5 text-foreground shrink-0">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              {formatDateStr(activeRequest.client_required_delivery_date)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Finishes List (1 per row) */}
                      <div className="flex flex-col gap-5">
                        {/* Carcass Finish */}
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            Carcass Finish
                          </p>
                          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
                            <div>
                              {renderSimpleList(getFinish(activeRequest.finishes, "CARCASS").category, true)}
                            </div>
                            {getFinish(activeRequest.finishes, "CARCASS").description && getFinish(activeRequest.finishes, "CARCASS").description !== "-" && (
                              <div className="border-t border-border/40 pt-3">
                                {renderSimpleList(getFinish(activeRequest.finishes, "CARCASS").description)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Shutter Finish */}
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            Shutter Finish
                          </p>
                          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
                            <div>
                              {renderSimpleList(getFinish(activeRequest.finishes, "SHUTTER").category, true)}
                            </div>
                            {getFinish(activeRequest.finishes, "SHUTTER").description && getFinish(activeRequest.finishes, "SHUTTER").description !== "-" && (
                              <div className="border-t border-border/40 pt-3">
                                {renderSimpleList(getFinish(activeRequest.finishes, "SHUTTER").description)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Handles Finish */}
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            Handles Finish
                          </p>
                          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4">
                            <div>
                              {renderSimpleList(getFinish(activeRequest.finishes, "HANDLE").category, true)}
                            </div>
                            {getFinish(activeRequest.finishes, "HANDLE").description && getFinish(activeRequest.finishes, "HANDLE").description !== "-" && (
                              <div className="border-t border-border/40 pt-3">
                                {renderSimpleList(getFinish(activeRequest.finishes, "HANDLE").description)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selections List (1 per row) */}
                      <div className="flex flex-col gap-5">
                        {/* Hardware Selection */}
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            Hardware Selection
                          </p>
                          <div className="rounded-xl border border-border/60 bg-card p-4">
                            {renderSimpleList(activeRequest.hardware_selection)}
                          </div>
                        </div>

                        {/* Accessory Selection */}
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            Accessory Selection
                          </p>
                          <div className="rounded-xl border border-border/60 bg-card p-4">
                            {renderSimpleList(activeRequest.accessory_selection)}
                          </div>
                        </div>
                      </div>

                      {/* Special Requirements */}
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold capitalize text-foreground">
                          Special Requirements
                        </p>
                        <div className="rounded-xl border border-dashed border-foreground/20 bg-muted/20 p-4">
                          {renderSimpleList(activeRequest.special_requirements)}
                        </div>
                      </div>

                      {/* Remarks */}
                      {activeRequest.remarks ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold capitalize text-foreground">
                            Remarks
                          </p>
                          <div className="rounded-xl border border-border/60 bg-card p-4">
                            {renderSimpleList(activeRequest.remarks)}
                          </div>
                        </div>
                      ) : null}

                      {/* Attachments */}
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold capitalize text-foreground">
                          Attachments
                        </p>
                        <div className="rounded-xl border border-border/60 bg-card p-4">
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

      {isFactoryUser ? (
        <BaseModal 
          open={confirmOpen} 
          onOpenChange={setConfirmOpen}
          title="Approve Fast Production Request?"
          description="Approving will complete your task. The lead will be marked as fast production once all approvers have approved."
          size="lg"
        >
          <div className="flex flex-col p-6 pt-2 h-full">
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
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateStr(detail.client_required_delivery_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="mb-6 text-left">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="accept-dates" 
                  checked={acceptRequestedDates}
                  onCheckedChange={(checked) => {
                    setAcceptRequestedDates(checked as boolean);
                    if (checked) {
                      setProductionTargetDate(undefined);
                    }
                  }}
                />
                <label
                  htmlFor="accept-dates"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Ready to approve with requested target dates
                </label>
              </div>

              {!acceptRequestedDates && (
                <>
                  <label className="text-sm font-medium">
                    Production Target Date <span className="text-destructive">*</span>
                  </label>
                  <div className="mt-1">
                    <CustomeDatePicker
                      value={productionTargetDate}
                      onChange={setProductionTargetDate}
                      restriction="futureOnly"
                      minDate={minProductionTargetDate}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-auto pt-4 border-t">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionMutation.isPending || (!acceptRequestedDates && !productionTargetDate)}
              >
                {actionMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </BaseModal>
      ) : (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Fast Production Request?</AlertDialogTitle>
              <AlertDialogDescription>
                Approving will complete your task. The lead will be marked as fast production once all approvers have approved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionMutation.isPending}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleApprove}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
