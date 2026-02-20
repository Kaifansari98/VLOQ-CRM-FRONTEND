"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "./utils/baseModal";
import { Button } from "@/components/ui/button";
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
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCompletedUpdateTask,
  useRescheduleTask,
} from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useUpdateMiscRequiredDeliveryDateByTaskId } from "@/api/installation/useUnderInstallationStageLeads";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    accountId: number;
    taskId: number;
    dueDate?: string;
    remark?: string;
  };
}

const MiscTaskModal: React.FC<Props> = ({ open, onOpenChange, data }) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();

  const completedUpdateMutation = useCompletedUpdateTask();
  const rescheduleMutation = useRescheduleTask();
  const updateRequiredDeliveryMutation =
    useUpdateMiscRequiredDeliveryDateByTaskId();

  const [openCompletedModal, setOpenCompletedModal] = useState(false);
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string | undefined>();
  const [rescheduleRemark, setRescheduleRemark] = useState("");

  useEffect(() => {
    if (data?.dueDate) {
      setRescheduleDate(data.dueDate);
    }
    if (data?.remark) {
      setRescheduleRemark(data.remark);
    } else {
      setRescheduleRemark("");
    }
  }, [data]);

  const handleMarkCompleted = () => {
    if (!data) return;
    completedUpdateMutation.mutate(
      {
        leadId: data.leadId,
        taskId: data.taskId,
        payload: {
          status: "completed",
          updated_by: userId || 0,
          closed_at: new Date().toISOString(),
          closed_by: userId || 0,
        },
      },
      {
        onSuccess: () => {
          toast.success("Task marked as completed!");
          setOpenCompletedModal(false);
          onOpenChange(false);
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId, userId],
            });
            queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to update task");
        },
      },
    );
  };

  const handleReschedule = () => {
    if (!data) return;
    if (!rescheduleDate) {
      toast.error("Please select a date");
      return;
    }
    if (!rescheduleRemark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    rescheduleMutation.mutate(
      {
        leadId: data.leadId,
        taskId: data.taskId,
        payload: {
          updated_by: userId || 0,
          closed_at: new Date().toISOString(),
          closed_by: userId || 0,
          due_date: rescheduleDate,
          remark: rescheduleRemark.trim(),
        },
      },
      {
        onSuccess: () => {
          updateRequiredDeliveryMutation.mutate(
            {
              vendorId: vendorId || 0,
              taskId: data.taskId,
              required_delivery_date: rescheduleDate,
              updated_by: userId || 0,
            },
            {
              onSuccess: () => {
                toast.success("Task rescheduled successfully!");
                setOpenRescheduleModal(false);
                onOpenChange(false);
                if (vendorId) {
                  queryClient.invalidateQueries({
                    queryKey: ["vendorUserTasks", vendorId, userId],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["vendorAllTasks"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["miscellaneousEntries"],
                  });
                }
              },
            },
          );
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to reschedule task");
        },
      },
    );
  };

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Miscellaneous Task"
        description="Update or reschedule this miscellaneous task."
        size="md"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Completed</span>
              <p className="text-sm text-muted-foreground">
                If this task is completed, you can mark it as done.
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
                If the schedule has changed, you can reschedule it.
              </p>
            </div>
            <Button className="w-28" onClick={() => setOpenRescheduleModal(true)}>
              Reschedule
            </Button>
          </div>
        </div>
      </BaseModal>

      <AlertDialog
        open={openCompletedModal}
        onOpenChange={setOpenCompletedModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark task as completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this task as completed?
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

      <BaseModal
        open={openRescheduleModal}
        onOpenChange={setOpenRescheduleModal}
        title="Reschedule Task"
        description="Set a new date for this miscellaneous task."
        size="md"
      >
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date</label>
            <CustomeDatePicker
              value={rescheduleDate}
              onChange={setRescheduleDate}
              restriction="futureOnly"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Remark</label>
            <TextAreaInput
              value={rescheduleRemark}
              onChange={setRescheduleRemark}
              placeholder="Enter your remark"
              maxLength={1000}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenRescheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={
                rescheduleMutation.isPending ||
                updateRequiredDeliveryMutation.isPending
              }
            >
              {rescheduleMutation.isPending ||
              updateRequiredDeliveryMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default MiscTaskModal;
