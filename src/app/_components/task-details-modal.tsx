"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import { useTaskDetails } from "@/hooks/useTasksQueries";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  User,
  AlertCircle,
  Eye,
  Send,
  Check,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

const getFileExtension = (fileName?: string | null) =>
  fileName?.split(".").pop()?.toLowerCase() ?? "";

const cleanRemarkText = (text?: string | null) => {
  if (!text) return "";
  return text.replace(/\|\|.*?\|\|/g, "").trim();
};

interface TaskDetailsModalProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({
  taskId,
  open,
  onOpenChange,
}: TaskDetailsModalProps) {
  const router = useRouter();
  const isOnlineLeadFeatureEnabled = useAppSelector(
    (s) => s.auth.user?.vendor?.is_online_lead_feature_enabled === true,
  );
  const { data: response, isLoading, error } = useTaskDetails(
    taskId ?? 0,
    open && !!taskId
  );

  const task = response?.data;
  const lead = task?.lead;

  const getLeadDetailsPath = (leadId: number, accountId: number, leadStatus: string) => {
    const stage = (leadStatus || "").toLowerCase();

    if (stage.includes("initial site measurement") || stage.includes("ism")) {
      return `/dashboard/leads/initial-site-measurement/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("designing")) {
      return `/dashboard/leads/designing-stage/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("booking")) {
      return `/dashboard/leads/booking-stage/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("draft") || stage.includes("online")) {
      const basePath = isOnlineLeadFeatureEnabled
        ? "/dashboard/leads/online-lead"
        : "/dashboard/leads/draft-lead";
      return `${basePath}/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("final site measurement") || stage.includes("final measurement") || stage.includes("fsm")) {
      return `/dashboard/project/final-measurement/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("client documentation") || stage.includes("documentation")) {
      return `/dashboard/project/client-documentation/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("client approval") || stage.includes("approval")) {
      return `/dashboard/project/client-approval/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("order login")) {
      return `/dashboard/production/order-login/details/${leadId}?accountId=${accountId}&tab=orderLogin`;
    }
    if (stage.includes("tech")) {
      return `/dashboard/production/tech-check/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("production")) {
      return `/dashboard/production/pre-post-prod/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("ready to dispatch") || stage.includes("ready")) {
      return `/dashboard/production/ready-to-dispatch/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("site readiness")) {
      return `/dashboard/installation/site-readiness/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("dispatch planning")) {
      return `/dashboard/installation/dispatch-planning/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("dispatch")) {
      return `/dashboard/installation/dispatch-stage/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("under installation") || stage.includes("installation")) {
      return `/dashboard/installation/under-installation/details/${leadId}?accountId=${accountId}`;
    }
    if (stage.includes("final handover") || stage.includes("handover") || stage.includes("completed") || stage.includes("delivered")) {
      return `/dashboard/installation/final-handover/details/${leadId}?accountId=${accountId}&tab=servicing&source=servicing`;
    }

    return `/dashboard/leads/leadstable/details/${leadId}?accountId=${accountId}`;
  };

  const handleViewLead = () => {
    if (lead?.id) {
      const path = getLeadDetailsPath(lead.id, lead.account_id, (lead as any).statusType?.type || lead.lead_status);
      router.push(path);
      onOpenChange(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "open":
        return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400";
      default:
        return "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white";
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400";
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={task ? `Task Details - ${task.task_type}` : "Loading Task..."}
      description="Detailed view of the lead task details."
      size="lg"
    >
      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-sm">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-xs">Fetching task details...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-10 text-destructive space-y-2">
            <AlertCircle size={40} />
            <p className="font-semibold">Error Loading Task</p>
            <p className="text-xs text-muted-foreground">Please try again later.</p>
          </div>
        )}

        {task && (
          <>
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Task Summary Card */}
              <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileText size={16} className="text-primary" />
                    Task Summary
                  </h4>
                  <Badge className={`border font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created At:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {task.created_at ? format(new Date(task.created_at), "dd MMM yyyy, hh:mm a") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar size={12} />
                      {task.due_date ? format(new Date(task.due_date), "dd MMM yyyy") : "N/A"}
                    </span>
                  </div>
                  {task.closed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed At:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {format(new Date(task.closed_at), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  )}
                  {task.instance?.title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instance:</span>
                      <span className="font-medium text-foreground">{task.instance.title}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Details */}
              <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                  <User size={16} className="text-primary" />
                  Task Assignment
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">
                      {task.user ? task.user.user_name : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned By:</span>
                    <span className="font-medium">
                      {task.createdBy ? task.createdBy.user_name : "System"}
                    </span>
                  </div>
                  {task.closedBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Closed By:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {task.closedBy.user_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Approval Request Section */}
            {task.approvalRequest && (
              <div className="border border-border rounded-2xl p-5 space-y-5">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <FileText size={18} className="text-primary" />
                    Approval History
                  </h4>
                  <Badge className={`border font-semibold text-xs px-2.5 py-0.5 rounded-full ${getApprovalStatusColor(task.approvalRequest.status)}`}>
                    {task.approvalRequest.status}
                  </Badge>
                </div>

                <div className="space-y-5">
                  {/* Sent Request */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shrink-0 mt-0.5">
                      <Send className="h-3.5 w-3.5" />
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Request Sent by {task.approvalRequest.requester?.user_name || task.createdBy?.user_name || "System"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {task.created_at ? format(new Date(task.created_at), "dd MMM yyyy · hh:mm a") : ""}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 w-full space-y-3">
                        {task.approvalRequest.request_remark ? (
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                            {cleanRemarkText(task.approvalRequest.request_remark)}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No remark provided with request</p>
                        )}

                        {task.approvalRequest.request_documents && task.approvalRequest.request_documents.length > 0 && (
                          <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Attachments ({task.approvalRequest.request_documents.length})
                            </p>
                            <div className="grid gap-2">
                              {task.approvalRequest.request_documents.map((doc: any) => (
                                IMAGE_EXTENSIONS.has(getFileExtension(doc.original_name)) ? (
                                  <ImageComponent
                                    key={doc.id}
                                    doc={{
                                      id: doc.id,
                                      doc_og_name: doc.original_name,
                                      signedUrl: doc.signedUrl,
                                    }}
                                  />
                                ) : (
                                  <DocumentCard
                                    key={doc.id}
                                    doc={{
                                      id: doc.id,
                                      originalName: doc.original_name,
                                      signedUrl: doc.signedUrl,
                                    }}
                                  />
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Response / Replied Request */}
                  {task.approvalRequest.status !== "pending" && (
                    <div className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5 ${task.approvalRequest.status === "approved"
                          ? "bg-emerald-600 text-white dark:bg-emerald-500"
                          : "bg-rose-600 text-white dark:bg-rose-500"
                        }`}>
                        {task.approvalRequest.status === "approved" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {task.approvalRequest.status === "approved"
                              ? `Approved by ${task.approvalRequest.responder?.user_name || task.approvalRequest.responderName || "Approver"}`
                              : `Rejected by ${task.approvalRequest.responder?.user_name || task.approvalRequest.responderName || "Approver"}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {task.approvalRequest.responded_at ? format(new Date(task.approvalRequest.responded_at), "dd MMM yyyy · hh:mm a") : ""}
                          </span>
                        </div>
                        <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 w-full space-y-3">
                          {task.approvalRequest.response_remark ? (
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                              {cleanRemarkText(task.approvalRequest.response_remark)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No response remark provided</p>
                          )}

                          {task.approvalRequest.response_documents && task.approvalRequest.response_documents.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                Attachments ({task.approvalRequest.response_documents.length})
                              </p>
                              <div className="grid gap-2">
                                {task.approvalRequest.response_documents.map((doc: any) => (
                                  IMAGE_EXTENSIONS.has(getFileExtension(doc.original_name)) ? (
                                    <ImageComponent
                                      key={doc.id}
                                      doc={{
                                        id: doc.id,
                                        doc_og_name: doc.original_name,
                                        signedUrl: doc.signedUrl,
                                      }}
                                    />
                                  ) : (
                                    <DocumentCard
                                      key={doc.id}
                                      doc={{
                                        id: doc.id,
                                        originalName: doc.original_name,
                                        signedUrl: doc.signedUrl,
                                      }}
                                    />
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remarks Section */}
            {task.remark && !task.approvalRequest && (
              <div className="border border-border rounded-2xl p-5 space-y-5 mt-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <FileText size={18} className="text-primary" />
                  Task Remarks
                </h4>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Remark by {task.createdBy?.user_name || "System"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {task.created_at ? format(new Date(task.created_at), "dd MMM yyyy · hh:mm a") : ""}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 w-full space-y-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                        {cleanRemarkText(task.remark)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {lead?.id && (
                <Button onClick={handleViewLead} className="flex items-center gap-1.5">
                  <Eye size={16} />
                  View Lead Details
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
