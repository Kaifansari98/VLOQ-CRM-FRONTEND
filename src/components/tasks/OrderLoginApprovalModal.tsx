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
import { useApproveOrderLoginTask } from "@/hooks/useLeadsQueries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    taskId: number;
  };
}

export default function OrderLoginApprovalModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [remark, setRemark] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const approveMutation = useApproveOrderLoginTask();

  const handleApprove = () => {
    if (!data?.leadId || !data?.taskId || !userId) {
      toastManager.add({
        title: "Missing lead, task, or user information",
        type: "error",
      });
      return;
    }

    approveMutation.mutate(
      {
        leadId: data.leadId,
        taskId: data.taskId,
        payload: {
          approved_by: userId,
          approval_remark: remark.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Order Login approval completed successfully",
            type: "success",
          });
          setConfirmOpen(false);
          onOpenChange(false);
          setRemark("");

          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorAllTasks", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["leadSuperAdminApprovalLockIns", vendorId, data.leadId],
            });
            queryClient.invalidateQueries({
              queryKey: ["leadStats"],
            });
          }
        },
        onError: (error: any) => {
          toastManager.add({
            title:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "Failed to approve Order Login task",
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
          if (!nextOpen) {
            setRemark("");
            setConfirmOpen(false);
          }
        }}
        title="Order Login Approval"
        description="Approve this task to complete the lock-in and unlock Production File Upload and Order Login actions."
        size="md"
      >
        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Remark</p>
            <TextAreaInput
              value={remark}
              onChange={setRemark}
              placeholder="Add an optional remark"
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
              onClick={() => setConfirmOpen(true)}
              disabled={approveMutation.isPending}
            >
              Approve
            </Button>
          </div>
        </div>
      </BaseModal>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Order Login?</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the Order Login lock-in and mark the task as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
