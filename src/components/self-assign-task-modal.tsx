"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/redux/store";
import BaseModal from "./utils/baseModal";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import TextAreaInput from "./origin-text-area";
import SelfAssignTaskRescheduleModal from "./self-assign-task-reschedule-modal";
import { useUpdateSelfAssignTask } from "@/hooks/useSelfAssignTaskActions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    accountId: number;
    taskId: number;
    taskType: string;
    remark?: string;
    dueDate?: string;
  };
}

const SelfAssignTaskModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.id;
  const taskId = data?.taskId;
  const taskType = data?.taskType || "Task";

  const [openCompletedModal, setOpenCompletedModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [completionRemark, setCompletionRemark] = useState("");
  const updateMutation = useUpdateSelfAssignTask();
  const queryClient = useQueryClient();

  const invalidateTaskQueries = () => {
    if (!vendorId) return;

    queryClient.invalidateQueries({
      queryKey: ["vendorUserTasks", vendorId, userId],
    });
    queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
    queryClient.invalidateQueries({ queryKey: ["leadStats"] });
  };

  const handleMarkCompleted = () => {
    const trimmedRemark = completionRemark.trim();
    if (!trimmedRemark) {
      toastManager.add({
        title: `Remark is required to complete ${taskType}.`,
        type: "error",
      });
      return;
    }

    updateMutation.mutate(
      {
        leadId: leadId || 0,
        taskId: taskId || 0,
        payload: {
          status: "completed",
          updated_by: userId || 0,
          closed_at: new Date().toISOString(),
          closed_by: userId || 0,
          remark: trimmedRemark,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${taskType} marked as completed!`,
            type: "success",
          });
          setOpenCompletedModal(false);
          setCompletionRemark("");
          invalidateTaskQueries();
          onOpenChange(false);
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.response?.data?.message || err?.message || "Failed to update task",
            type: "error",
          });
        },
      },
    );
  };

  const handleCancelTask = () => {
    updateMutation.mutate(
      {
        leadId: leadId || 0,
        taskId: taskId || 0,
        payload: {
          status: "cancelled",
          updated_by: userId || 0,
          closed_at: new Date().toISOString(),
          closed_by: userId || 0,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${taskType} cancelled successfully!`,
            type: "success",
          });
          setOpenCancelModal(false);
          invalidateTaskQueries();
          onOpenChange(false);
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.response?.data?.message || err?.message || "Failed to cancel task",
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
        onOpenChange={onOpenChange}
        title={taskType}
        description={`Update the status of this ${taskType.toLowerCase()} task.`}
        size="md"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Completed</span>
              <p className="text-sm text-muted-foreground">
                If this {taskType.toLowerCase()} task is done, mark it as completed.
              </p>
            </div>
            <Button className="w-28" onClick={() => setOpenCompletedModal(true)}>
              Complete
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Reschedule</span>
              <p className="text-sm text-muted-foreground">
                If the due date or plan changed, reschedule this task.
              </p>
            </div>
            <Button className="w-28" onClick={() => setOpenRescheduleModal(true)}>
              Reschedule
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Cancel</span>
              <p className="text-sm text-muted-foreground">
                If this task is no longer required, cancel it.
              </p>
            </div>
            <Button className="w-28" onClick={() => setOpenCancelModal(true)}>
              Cancel
            </Button>
          </div>
        </div>
      </BaseModal>

      <AlertDialog
        open={openCompletedModal}
        onOpenChange={(nextOpen) => {
          setOpenCompletedModal(nextOpen);
          if (!nextOpen) {
            setCompletionRemark("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {taskType} as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this task as completed? This action can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">Remark</p>
            <TextAreaInput
              value={completionRemark}
              onChange={setCompletionRemark}
              maxLength={500}
              placeholder="Enter the completion remark..."
              className="min-h-[120px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkCompleted}
              disabled={updateMutation.isPending || !completionRemark.trim()}
            >
              {updateMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {taskType}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this task? This action can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTask}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SelfAssignTaskRescheduleModal
        open={openRescheduleModal}
        onOpenChange={setOpenRescheduleModal}
        taskType={taskType}
        data={{
          id: leadId || 0,
          taskId,
          remark: data?.remark,
          dueDate: data?.dueDate,
        }}
      />
    </>
  );
};

export default SelfAssignTaskModal;
