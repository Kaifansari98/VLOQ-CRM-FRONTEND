"use client";

import React, { useMemo, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { useActOnApprovalRequest } from "@/hooks/useApprovalRequests";

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

export default function ApprovalRequestActionModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [remark, setRemark] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const queryClient = useQueryClient();
  const actionMutation = useActOnApprovalRequest();

  const title = useMemo(
    () => (mode === "approve" ? "Approve Request" : "Reject Request"),
    [mode],
  );

  const description = useMemo(
    () =>
      mode === "approve"
        ? "Review the request and approve it. Remark and file upload are optional."
        : "Review the request and reject it. Remark is required and file upload is optional.",
    [mode],
  );

  const resetState = () => {
    setMode("approve");
    setRemark("");
    setFiles([]);
  };

  const handleSubmit = () => {
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

  return (
    <BaseModal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetState();
      }}
      title="Approval Request"
      description="Review this approval task and choose whether to approve or reject it."
      size="md"
    >
      <div className="space-y-5 p-6">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p>
            <span className="font-medium">Task ID:</span> {data?.taskId ?? "-"}
          </p>
          {data?.dueDate ? (
            <p>
              <span className="font-medium">Due Date:</span> {data.dueDate}
            </p>
          ) : null}
          {data?.remark ? (
            <p>
              <span className="font-medium">Request Remark:</span> {data.remark}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "approve" ? "default" : "outline"}
            onClick={() => setMode("approve")}
            className="flex-1"
          >
            Approve
          </Button>
          <Button
            type="button"
            variant={mode === "reject" ? "destructive" : "outline"}
            onClick={() => setMode("reject")}
            className="flex-1"
          >
            Reject
          </Button>
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Remark{mode === "reject" ? " *" : ""}
            </p>
            <TextAreaInput
              value={remark}
              onChange={setRemark}
              placeholder={
                mode === "approve"
                  ? "Add an optional approval remark"
                  : "Add rejection reason"
              }
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">File Upload</p>
            <FileUploadField
              value={files}
              onChange={setFiles}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
              multiple
              maxFiles={10}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={mode === "reject" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={actionMutation.isPending}
          >
            {actionMutation.isPending
              ? "Processing..."
              : mode === "approve"
                ? "Approve"
                : "Reject"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
