"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useActOnFastProductionRequestTask } from "@/hooks/useTasksQueries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    taskId: number;
    remark?: string;
  };
}

export default function FastProductionRequestActionModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [remark, setRemark] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const actionMutation = useActOnFastProductionRequestTask();

  const resetState = () => {
    setShowRejectForm(false);
    setRemark("");
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
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          onOpenChange(nextOpen);
          if (!nextOpen) resetState();
        }}
      >
        <DialogContent className="w-[95vw] min-w-2xl overflow-hidden p-0">
          <div className="border-b bg-muted/30 px-6 py-4">
            <p className="text-left text-xl font-semibold">
              Fast Production Request
            </p>
            <DialogDescription className="text-left text-muted-foreground">
              Confirm approval, or reject this fast production request with a
              reason.
            </DialogDescription>
          </div>

          <div className="space-y-5 p-6">
            <div className="text-sm leading-6 text-muted-foreground">
              Approving this task will record your approval. The lead will be
              marked as fast production only after the last required approver
              approves it.
            </div>

            {showRejectForm ? (
              <div className="space-y-2">
                <p className="text-base font-medium">Rejection Reason</p>
                <TextAreaInput
                  value={remark}
                  onChange={setRemark}
                  placeholder="Explain why you're rejecting..."
                  className="min-h-28"
                />
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
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
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={actionMutation.isPending}
                  >
                    {actionMutation.isPending ? "Processing..." : "Submit Rejection"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    disabled={actionMutation.isPending}
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Fast Production Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will record your approval and complete your task. The lead
              will be marked as fast production only when the last required
              approver approves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
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
