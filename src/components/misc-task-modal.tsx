"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "./utils/baseModal";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCompletedUpdateTask,
  useRescheduleTask,
} from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import {
  uploadMiscCompletionDocumentsByTaskId,
  useUpdateMiscRequiredDeliveryDateByTaskId,
} from "@/api/installation/useUnderInstallationStageLeads";
import { FileUploadField } from "@/components/custom/file-upload";

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
  const uploadCompletionDocsMutation = useMutation({
    mutationFn: uploadMiscCompletionDocumentsByTaskId,
    onError: (error: any) => {
      toast.error(error?.message || "Failed to upload documents");
    },
  });

  const [openCompletedModal, setOpenCompletedModal] = useState(false);
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string | undefined>();
  const [rescheduleRemark, setRescheduleRemark] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);

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
    if (completionFiles.length === 0) {
      toast.error("Please upload completion documents");
      return;
    }

    const formData = new FormData();
    completionFiles.forEach((file) => formData.append("files", file));
    formData.append("created_by", String(userId || 0));

    uploadCompletionDocsMutation.mutate(
      {
        vendorId: vendorId || 0,
        taskId: data.taskId,
        formData,
      },
      {
        onSuccess: () => {
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
                setCompletionFiles([]);
                setOpenCompletedModal(false);
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
              onError: (err: any) => {
                toast.error(err?.message || "Failed to update task");
              },
            },
          );
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

      <BaseModal
        open={openCompletedModal}
        onOpenChange={setOpenCompletedModal}
        title="Complete Task"
        description="Upload completion documents to mark this task as completed."
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Upload Documents <span className="text-destructive">*</span>
            </label>
            <FileUploadField
              value={completionFiles}
              onChange={setCompletionFiles}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
              multiple
              maxFiles={10}
              disabled={
                uploadCompletionDocsMutation.isPending ||
                completedUpdateMutation.isPending
              }
            />
            <p className="text-xs text-muted-foreground">
              Upload up to 10 files. Supported: Images, PDFs, Documents
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpenCompletedModal(false)}
              disabled={
                uploadCompletionDocsMutation.isPending ||
                completedUpdateMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkCompleted}
              disabled={
                uploadCompletionDocsMutation.isPending ||
                completedUpdateMutation.isPending
              }
            >
              {uploadCompletionDocsMutation.isPending ||
              completedUpdateMutation.isPending
                ? "Processing..."
                : "Upload & Complete"}
            </Button>
          </div>
        </div>
      </BaseModal>

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
