"use client";

import React, { useMemo, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import {
  useActOnApprovalRequest,
  useApprovalRequestDetails,
} from "@/hooks/useApprovalRequests";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  FileText,
  Loader2,
  UserRound,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    taskId: number;
    dueDate?: string;
    remark?: string;
  };
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);

const getFileExtension = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() ?? "";

export default function ApprovalRequestActionModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const queryClient = useQueryClient();
  const actionMutation = useActOnApprovalRequest();
  const { data: approvalRequest, isLoading: isApprovalRequestLoading } =
    useApprovalRequestDetails(data?.leadId, data?.taskId, open);

  const formattedDueDate = useMemo(() => {
    if (!data?.dueDate) return null;

    const parsedDate = new Date(data.dueDate);
    if (Number.isNaN(parsedDate.getTime())) return data.dueDate;

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsedDate);
  }, [data?.dueDate]);

  const formattedRaisedAt = useMemo(() => {
    if (!approvalRequest?.created_at) return null;

    const parsedDate = new Date(approvalRequest.created_at);
    if (Number.isNaN(parsedDate.getTime())) return approvalRequest.created_at;

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsedDate);
  }, [approvalRequest?.created_at]);

  const resetState = () => {
    setMode(null);
    setRemark("");
    setFiles([]);
  };

  const handleSubmit = () => {
    if (!mode) {
      toastManager.add({
        title: "Please select approve or reject",
        type: "error",
      });
      return;
    }

    if (!data?.leadId || !data?.taskId || !userId) {
      toastManager.add({
        title: "Missing lead, task, or user information",
        type: "error",
      });
      return;
    }

    if (mode === "reject" && !remark.trim()) {
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
          action: mode,
          acted_by: userId,
          remark: remark.trim() || null,
          files,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title:
              mode === "approve"
                ? "Approval request approved successfully"
                : "Approval request rejected successfully",
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
              "Failed to update approval request",
            type: "error",
          });
        },
      },
    );
  };

  const requestDocuments = approvalRequest?.request_documents ?? [];

  return (
    <BaseModal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetState();
      }}
      title="Review Approval Request"
      description="Make your decision to approve or reject this request"
      size="lg"
    >
      <div className="space-y-6 p-6 bg-white">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {isApprovalRequestLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading approval request details...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-600">
                    APPROVAL RAISED BY
                  </p>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {approvalRequest?.requester?.user_name || "Unknown"}
                </p>
                {approvalRequest?.requester?.user_email && (
                  <p className="mt-1 text-xs text-slate-500">
                    {approvalRequest.requester.user_email}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-600">
                    RAISED ON
                  </p>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {formattedRaisedAt || "Not available"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Request Remark Section */}
        {(approvalRequest?.request_remark || data?.remark) && (
          <div className="rounded-lg bg-white border border-slate-200 p-5">
            {formattedDueDate && (
              <div className="flex-shrink-0 bg-slate-100 border border-slate-200 rounded-lg p-3 w-full mb-5">
                <div className="flex items-center gap-2 justify-start mb-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-600">
                    DUE DATE
                  </p>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {formattedDueDate}
                </p>
              </div>
            )}
            <p className="text-xs font-semibold text-slate-600 mb-3">
              REQUEST DETAILS
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 bg-slate-50 rounded p-3 border border-slate-200">
              {approvalRequest?.request_remark || data?.remark}
            </p>
          </div>
        )}

        {!isApprovalRequestLoading && requestDocuments.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <p className="text-sm font-semibold text-slate-900">
                Submitted Documents
              </p>
            </div>

            <div className="grid gap-3">
              {requestDocuments.map((doc) => {
                const extension = getFileExtension(doc.original_name);
                const isImage = IMAGE_EXTENSIONS.has(extension);

                if (isImage) {
                  return (
                    <ImageComponent
                      key={doc.id}
                      doc={{
                        id: doc.id,
                        doc_og_name: doc.original_name,
                        signedUrl: doc.signedUrl,
                        created_at: doc.created_at,
                      }}
                    />
                  );
                }

                return (
                  <DocumentCard
                    key={doc.id}
                    doc={{
                      id: doc.id,
                      originalName: doc.original_name,
                      signedUrl: doc.signedUrl,
                      created_at: doc.created_at,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Mode Selection - Toggle */}
        <div className="rounded-lg bg-white border border-slate-200 p-1 inline-flex gap-0 w-full">
          <button
            onClick={() => setMode("approve")}
            className={`flex items-center justify-center w-full gap-2 px-6 py-2.5 rounded-md font-medium transition-all ${
              mode === "approve"
                ? "bg-green-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Request
          </button>
          <button
            onClick={() => setMode("reject")}
            className={`flex items-center justify-center w-full gap-2 px-6 py-2.5 rounded-md font-medium transition-all ${
              mode === "reject"
                ? "bg-red-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Reject Request
          </button>
        </div>

        {/* Dynamic Content Area - Shows after mode selection */}
        {mode && (
          <div className="rounded-lg bg-white border border-slate-200 p-5 space-y-5">
            {/* Header */}
            <div className="space-y-1 pb-4 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-900">
                {mode === "approve" ? "Approve Request" : "Reject Request"}
              </p>
              <p className="text-xs text-slate-600">
                {mode === "approve"
                  ? "Remark and files are optional."
                  : "Remark is required."}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Remark Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-900">
                    {mode === "reject" ? "Rejection Reason" : "Remark"}
                  </label>
                  {mode === "reject" && (
                    <span className="text-slate-900 text-sm">*</span>
                  )}
                </div>
                <TextAreaInput
                  value={remark}
                  onChange={setRemark}
                  placeholder={
                    mode === "reject"
                      ? "Explain why you're rejecting..."
                      : "Add notes (optional)"
                  }
                  className="min-h-[100px] rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-600">
                  {remark.length} / 500 characters
                </p>
              </div>

              {/* File Upload Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">
                  Attachments
                </label>
                <FileUploadField
                  value={files}
                  onChange={setFiles}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                  multiple
                  maxFiles={10}
                />
                <p className="text-xs text-slate-600">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border-slate-200 text-slate-700"
          >
            Cancel
          </Button>
          {mode && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={actionMutation.isPending}
              className={`rounded-lg text-white font-medium transition-all ${
                mode === "approve"
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-600"
                  : "bg-red-600 hover:bg-red-700 disabled:bg-red-600"
              } disabled:opacity-60`}
            >
              {actionMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Processing...
                </div>
              ) : mode === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
