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
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mark as Completed</span>
          <Button
            className="w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40"
            onClick={() => setOpenCompletedModal(true)}
          >
            Completed
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Reschedule</span>
          <Button
            className="w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40"
            onClick={() => setOpenRescheduleModal(true)}
          >
            Reschedule
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mark as Cancel</span>
          <Button
            className="w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40"
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
                : "Completed"}
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
                id:leadId!,
                taskId:taskId,
                remark: data?.remark,
                dueDate: data?.dueDate,
              }}
            />
    </BaseModal>
  );
};

export default FollowUpModal;
