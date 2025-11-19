"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/redux/store";
import BaseModal from "./utils/baseModal";
import { Button } from "@/components/ui/button"; // ⬅️ shadcn button
import { toast } from "react-toastify";
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
import {
  useCancelledUpdateTask,
  useCompletedUpdateTask,
} from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useQueryClient } from "@tanstack/react-query";
import RescheduleModal from "./sales-executive/siteMeasurement/reschedule-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "Follow Up" | "Pending Materials" | "Pending Work";
  data?: {
    id: number;
    accountId: number;
    taskId: number;
    remark?: string;
    dueDate?: string;
    // status?: string;
  };
}

const FollowUpModal: React.FC<Props> = ({
  open,
  onOpenChange,
  variant,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.id;
  const accountId = data?.accountId;
  const taskId = data?.taskId;

  const [openCompletedModal, setOpenCompletedModal] = useState<boolean>(false);
  const [openCancelModal, setOpenCancelModal] = useState<boolean>(false);
  const [openRescheduleModal, setOpenRescheduleModal] =
    useState<boolean>(false);
  const completedUpdateMutation = useCompletedUpdateTask();
  const cancelledUpdateMutation = useCancelledUpdateTask();
  const queryClient = useQueryClient();

  console.log("Reschedule Remark :- ", data?.remark);
  console.log("Reschedule DueDate :- ", data?.dueDate);
  const handleMarkCompleted = () => {
    completedUpdateMutation.mutate(
      {
        leadId: leadId || 0,
        taskId: taskId || 0,
        payload: {
          status: "completed",
          updated_by: userId || 0,
          closed_at: new Date().toISOString(),
          closed_by: userId || 0,
        },
      },
      {
        onSuccess: () => {
          toast.success("Lead marked as completed!");
          setOpenCompletedModal(false);

          // Invalidate query to refresh data
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["siteMeasurementLeads", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId, userId],
            });
            queryClient.invalidateQueries({
              queryKey: ["pendingWorkTasks"],
            });
            queryClient.invalidateQueries({
              queryKey: ["finalHandoverReadiness"],
            });
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "❌ Failed to update lead");
        },
      }
    );
    setOpenCompletedModal(false);
    onOpenChange(false);
  };

  const handleCancelLead = () => {
    cancelledUpdateMutation.mutate(
      {
        leadId: leadId || 0,
        taskId: taskId || 0,
        payload: {
          status: "cancelled",
          updated_by: userId || 0,
          closed_by: userId || 0,
          closed_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Lead cancelled successfully!");
          setOpenCancelModal(false);

          // Invalidate query to refresh data
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["siteMeasurementLeads", vendorId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId, userId],
            });
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to cancel lead");
        },
      }
    );
    setOpenCancelModal(false);
    onOpenChange(false);
  };
  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title={
          variant === "Pending Work"
            ? "Pending Work Task"
            : variant === "Pending Materials"
            ? "Pending Material Task"
            : "Follow Up"
        }
        description={
          variant === "Pending Work"
            ? "Update or manage this pending work task for the lead."
            : variant === "Pending Materials"
            ? "Update the pending material task status for this lead."
            : "Update the follow-up status for this lead."
        }
        size="md"
      >
        <div className="space-y-4 p-6">
          {/* Mark as Completed */}
          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Completed</span>
              <p className="text-sm text-muted-foreground">
                {variant === "Pending Work"
                  ? "If this pending work has been completed, you can mark it as done."
                  : variant === "Pending Materials"
                  ? "If this pending material has been dispatched or received, mark it as completed."
                  : "If your follow up is completed, you can mark it as completed."}
              </p>
            </div>
            <Button
              className="w-28"
              onClick={() => setOpenCompletedModal(true)}
            >
              Complete
            </Button>
          </div>

          {/* Reschedule */}
          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Reschedule</span>
              <p className="text-sm text-muted-foreground">
                {variant === "Pending Work"
                  ? "If the work schedule has changed or delayed, you can reschedule it."
                  : variant === "Pending Materials"
                  ? "If the material dispatch date has changed or delayed, you can reschedule it."
                  : "If the client has pushed the meeting date, you can reschedule it."}
              </p>
            </div>
            <Button
              className="w-28"
              onClick={() => setOpenRescheduleModal(true)}
            >
              Reschedule
            </Button>
          </div>

          {/* Mark as Cancel */}
          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold ">Mark as Cancel</span>
              <p className="text-sm text-muted-foreground">
                {variant === "Pending Work"
                  ? "If this pending work is no longer relevant, you can cancel this task."
                  : variant === "Pending Materials"
                  ? "If this pending material task is no longer relevant, you can cancel it."
                  : "If this follow up is cancelled, you can mark it as cancelled."}
              </p>
            </div>
            <Button className="w-28" onClick={() => setOpenCancelModal(true)}>
              Cancel
            </Button>
          </div>
        </div>
      </BaseModal>
      {/* Completed Modal */}
      <AlertDialog
        open={openCompletedModal}
        onOpenChange={setOpenCompletedModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark{" "}
              {variant === "Pending Work"
                ? "Mark Pending Work Task as Completed?"
                : variant === "Pending Materials"
                ? "Mark Pending Material Task as Completed?"
                : "Mark Follow Up as Completed?"}
              as Completed?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this
              {variant === "Pending Work"
                ? " pending work task "
                : variant === "Pending Materials"
                ? " pending material task "
                : " follow up "}
              as completed? This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkCompleted}
              disabled={completedUpdateMutation.isPending}
            >
              {completedUpdateMutation.isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Modal */}
      <AlertDialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel{" "}
              {variant === "Pending Work"
                ? "Cancel Pending Work Task?"
                : variant === "Pending Materials"
                ? "Cancel Pending Material Task?"
                : "Cancel Follow Up?"}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this
              {variant === "Pending Work"
                ? " pending work task "
                : variant === "Pending Materials"
                ? " pending material task "
                : " follow up "}
              ? This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelLead}
              disabled={cancelledUpdateMutation.isPending}
            >
              {cancelledUpdateMutation.isPending
                ? "Processing..."
                : "Completed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleModal
        open={openRescheduleModal}
        onOpenChange={setOpenRescheduleModal}
        onRescheduleSuccess={() => onOpenChange(false)}
        data={{
          id: leadId!,
          taskId: taskId,
          remark: data?.remark,
          dueDate: data?.dueDate,
        }}
      />
    </>
  );
};

export default FollowUpModal;
