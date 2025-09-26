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
  data?: {
    id: number;
    accountId: number;
    taskId: number;
    remark?: string;
    dueDate?: string;
    // status?: string;
  };
}

const FollowUpModal: React.FC<Props> = ({ open, onOpenChange, data }) => {
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
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "❌ Failed to update lead");
        },
      }
    );
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
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to cancel lead");
        },
      }
    );
  };
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Follow Up"
      description="Update the follow-up status for this lead."
      size="md"
    >
      <div className="space-y-4 p-6">
        {/* Mark as Completed */}
        <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">Mark as Completed</span>
            <p className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </p>
          </div>
          <Button
            className="w-28 bg-green-500 hover:bg-green-600 text-white"
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
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, id!
            </p>
          </div>
          <Button
            className="w-28 bg-blue-500 hover:bg-blue-600 "
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
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Accusamus, aliquid.
            </p>
          </div>
          <Button
            className="w-28 bg-red-500 hover:bg-red-600 text-white"
            onClick={() => setOpenCancelModal(true)}
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Completed Modal */}
      <AlertDialog
        open={openCompletedModal}
        onOpenChange={setOpenCompletedModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Follow Up As Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this follow up as completed? This
              action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkCompleted}
              disabled={completedUpdateMutation.isPending}
            >
              {completedUpdateMutation.isPending
                ? "Processing..."
                : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Modal */}
      <AlertDialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Follow Up?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this Follow Up? This action can’t
              be undone.
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
        data={{
          id: leadId!,
          taskId: taskId,
          remark: data?.remark,
          dueDate: data?.dueDate,
        }}
      />
    </BaseModal>
  );
};

export default FollowUpModal;
