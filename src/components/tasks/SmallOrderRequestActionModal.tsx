"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import BaseModal from "@/components/utils/baseModal";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
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
import { useActOnSmallOrderRequestTask } from "@/hooks/useTasksQueries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    taskId: number;
    remark?: string;
  };
}

export default function SmallOrderRequestActionModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [remark, setRemark] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const actionMutation = useActOnSmallOrderRequestTask();

  const resetState = () => {
    setMode(null);
    setRemark("");
    setConfirmOpen(false);
  };

  const handleSubmit = () => {
    if (!mode) {
      toastManager.add({
        title: "Please choose Approve or Reject",
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
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title:
              mode === "approve"
                ? "Small order request approved successfully"
                : "Small order request rejected successfully",
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
              "Failed to update small order request",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) resetState();
        }}
        title="Small Order Request"
        description="Review this small order request and choose whether to approve or reject it."
        size="md"
      >
        <div className="space-y-5 p-6">
          {data?.remark ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Request Details</p>
              <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                {data.remark}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "approve" ? "default" : "outline"}
              onClick={() => setMode("approve")}
              disabled={actionMutation.isPending}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant={mode === "reject" ? "destructive" : "outline"}
              onClick={() => setMode("reject")}
              disabled={actionMutation.isPending}
            >
              Reject
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              {mode === "reject" ? "Rejection Reason" : "Remark"}
            </p>
            <TextAreaInput
              value={remark}
              onChange={setRemark}
              placeholder={
                mode === "reject"
                  ? "Explain why you're rejecting..."
                  : "Add an optional remark"
              }
            />
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
              disabled={!mode || actionMutation.isPending}
              variant={mode === "reject" ? "destructive" : "default"}
              onClick={() => setConfirmOpen(true)}
            >
              {mode === "reject" ? "Reject" : "Approve"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mode === "reject"
                ? "Reject Small Order Request?"
                : "Approve Small Order Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mode === "reject"
                ? "This will reject the small order request and complete all pending approval tasks linked to it."
                : "This will record your approval and complete your task."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
