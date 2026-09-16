"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { useRescheduleInitialSiteMeasurementTask } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { toastError } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  data?: {
    leadId: number;
    taskId: number;
    dueDate?: string;
    remark?: string;
  };
}

const InitialSiteMeasurementTaskModal: React.FC<Props> = ({
  open,
  onOpenChange,
  onComplete,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const rescheduleMutation = useRescheduleInitialSiteMeasurementTask();
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string | undefined>();
  const [rescheduleRemark, setRescheduleRemark] = useState("");

  useEffect(() => {
    if (!open) return;
    setRescheduleDate(data?.dueDate);
    setRescheduleRemark(data?.remark ?? "");
  }, [data?.dueDate, data?.remark, open]);

  const handleReschedule = () => {
    if (!data) return;
    if (!rescheduleDate) {
      toastManager.add({ title: "Please select a date", type: "error" });
      return;
    }
    if (!rescheduleRemark.trim()) {
      toastManager.add({ title: "Please enter a remark", type: "error" });
      return;
    }

    rescheduleMutation.mutate(
      {
        leadId: data.leadId,
        taskId: data.taskId,
        payload: {
          updated_by: userId || 0,
          due_date: rescheduleDate,
          remark: rescheduleRemark.trim(),
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Initial Site Measurement task rescheduled successfully!",
            type: "success",
          });
          setOpenRescheduleModal(false);
          onOpenChange(false);
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId, userId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorAllTasks"],
            });
          }
        },
        onError: (err: unknown) => {
          toastError(err);
        },
      },
    );
  };

  return (
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Initial Site Measurement Task"
        description="Complete this task by opening the ISM upload form, or reschedule it to a new date."
        size="md"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Mark as Completed</span>
              <p className="text-sm text-muted-foreground">
                Open the Initial Site Measurement form and complete this task.
              </p>
            </div>
            <Button
              className="w-28"
              onClick={() => {
                onOpenChange(false);
                onComplete();
              }}
            >
              Complete
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold">Reschedule</span>
              <p className="text-sm text-muted-foreground">
                If the site visit date has changed, reschedule this task.
              </p>
            </div>
            <Button
              className="w-28"
              onClick={() => setOpenRescheduleModal(true)}
            >
              Reschedule
            </Button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={openRescheduleModal}
        onOpenChange={setOpenRescheduleModal}
        title="Reschedule Initial Site Measurement"
        description="Set a new due date and add a remark for this ISM task."
        size="md"
      >
        <div className="p-6 flex flex-col gap-4">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <CustomeDatePicker
                value={rescheduleDate}
                onChange={setRescheduleDate}
                restriction="futureOnly"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remark</label>
              <TextAreaInput
                value={rescheduleRemark}
                onChange={setRescheduleRemark}
                placeholder="Enter remark"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenRescheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending}
              >
                {rescheduleMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default InitialSiteMeasurementTaskModal;
