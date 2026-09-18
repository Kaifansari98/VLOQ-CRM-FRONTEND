"use client";

import React, { useEffect, useState } from "react";
import BaseModal from "./utils/baseModal";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { toastManager } from "@/components/ui/toast";
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
import CustomeTooltip from "@/components/custom-tooltip";
import { AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  disableDateRestriction?: boolean;
  dateRestrictionLabel?: string;
  actionType?: "complete" | "confirm";
  confirmButtonText?: string;
  isReturnOrder?: boolean;
  data?: {
    leadId: number;
    accountId: number;
    taskId: number;
    dueDate?: string;
    remark?: string;
    taskStatus?: string;
    requiredDeliveryDate?: string;
  };
}

const MiscTaskModal: React.FC<Props> = ({
  open,
  onOpenChange,
  title,
  description,
  disableDateRestriction,
  dateRestrictionLabel = "Required Delivery Date",
  actionType,
  confirmButtonText,
  isReturnOrder,
  data,
}) => {
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
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload documents";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
    },
  });

  const [openCompletedModal, setOpenCompletedModal] = useState(false);
  const [openRescheduleModal, setOpenRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string | undefined>();
  const [rescheduleRemark, setRescheduleRemark] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);

  const rawUserType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type || state.auth.user?.user_type
  );
  const normalizedUserType =
    typeof rawUserType === "string"
      ? rawUserType.toLowerCase().trim().replace(/_/g, "-").replace(/\s+/g, "-")
      : "";
  const isSuperAdmin = normalizedUserType === "super-admin";

  const isPickupScheduleTask =
    actionType === "confirm" ||
    isReturnOrder === true ||
    Boolean(title?.toLowerCase().includes("pickup")) ||
    Boolean(description?.toLowerCase().includes("pickup")) ||
    Boolean(dateRestrictionLabel?.toLowerCase().includes("pickup")) ||
    Boolean(data?.remark?.toLowerCase().includes("pickup"));

  const isConfirm = actionType ? actionType === "confirm" : isPickupScheduleTask;
  const primaryButtonLabel = confirmButtonText || (isConfirm ? "Confirm" : "Complete");

  const isBeforeDeliveryDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return false;
    let targetDateStr = "";
    if (typeof dateValue === "string") {
      const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        targetDateStr = match[1];
      } else {
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return false;
        targetDateStr = d.toISOString().slice(0, 10);
      }
    } else if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) return false;
      targetDateStr = dateValue.toISOString().slice(0, 10);
    }

    if (!targetDateStr) return false;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayDateStr = `${year}-${month}-${day}`;

    return todayDateStr < targetDateStr;
  };

  const formatDeliveryDate = (dateString?: string | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const targetDeliveryDate = data?.requiredDeliveryDate || data?.dueDate;
  const isDateBeforeDelivery = isBeforeDeliveryDate(targetDeliveryDate);
  const isCompleteRestrictedByDate =
    !disableDateRestriction &&
    !isConfirm &&
    !isSuperAdmin &&
    isDateBeforeDelivery;

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
    if (isCompleteRestrictedByDate) {
      toastManager.add({
        title: `Cannot ${isConfirm ? "confirm" : "complete"} task before ${dateRestrictionLabel} (${formatDeliveryDate(targetDeliveryDate)})`,
        type: "error",
      });
      return;
    }

    const executeTaskCompletion = () => {
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
            toastManager.add({
              title: isConfirm ? "Pickup schedule confirmed!" : "Task marked as completed!",
              type: "success",
            });
            setCompletionFiles([]);
            setOpenCompletedModal(false);
            onOpenChange(false);
            if (vendorId) {
              queryClient.invalidateQueries({
                queryKey: ["vendorUserTasks"],
              });
              queryClient.invalidateQueries({
                queryKey: ["vendorAllTasks"],
              });
              queryClient.invalidateQueries({
                queryKey: ["miscellaneousEntries"],
              });
              queryClient.invalidateQueries({
                queryKey: ["miscellaneousByStatus"],
              });
              queryClient.invalidateQueries({
                queryKey: ["leadTasks"],
              });
              queryClient.invalidateQueries({
                queryKey: ["userTasks"],
              });
            }
          },
          onError: (err: any) => {
            const errorMessage =
              err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
              "Failed to update task";

            toastManager.add({
              title: errorMessage,
              type: "error",
            });
          },
        },
      );
    };

    if (completionFiles.length > 0) {
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
            executeTaskCompletion();
          },
        },
      );
    } else {
      executeTaskCompletion();
    }
  };

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
          updateRequiredDeliveryMutation.mutate(
            {
              vendorId: vendorId || 0,
              taskId: data.taskId,
              required_delivery_date: rescheduleDate,
              updated_by: userId || 0,
            },
            {
              onSuccess: () => {
                toastManager.add({ title: "Task rescheduled successfully!", type: "success" });
                setOpenRescheduleModal(false);
                onOpenChange(false);
                queryClient.invalidateQueries({
                  queryKey: ["miscellaneousEntries"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["miscellaneousByStatus"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["siteSupervisorMisc"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["underInstallationStageLeads"],
                });
                if (vendorId) {
                  queryClient.invalidateQueries({
                    queryKey: ["vendorUserTasks", vendorId, userId],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["vendorAllTasks"],
                  });
                }
              },
              onError: (err: any) => {
                toastManager.add({ title: "Task rescheduled successfully!", type: "success" });
                setOpenRescheduleModal(false);
                onOpenChange(false);
                queryClient.invalidateQueries({
                  queryKey: ["miscellaneousEntries"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["miscellaneousByStatus"],
                });
              },
            },
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to reschedule task";

          toastManager.add({
            title: errorMessage,
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
        title={title || "Miscellaneous Task"}
        description={description || "Update or reschedule this miscellaneous task."}
        size="md"
      >
        <div className="space-y-4 p-6">
          {data?.taskStatus === "completed" ? (
            <div className="flex flex-col items-center justify-center gap-0 py-6 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900 mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-semibold text-green-700 dark:text-green-300">Task Completed</p>
              <p className="text-sm text-muted-foreground">
                This dispatch task has already been marked as completed.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-base font-semibold">
                    {isConfirm ? "Confirm Pickup Schedule" : "Mark as Completed"}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {isConfirm
                      ? "If pickup will be done on the scheduled date, you can confirm it."
                      : "If this task is completed, you can mark it as done."}
                  </p>
                  {isCompleteRestrictedByDate && (
                    <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span className="leading-snug">
                        Cannot {isConfirm ? "confirm" : "complete"} before {dateRestrictionLabel} ({formatDeliveryDate(targetDeliveryDate)}).
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <CustomeTooltip
                    side="bottom"
                    align="end"
                    value={
                      isCompleteRestrictedByDate
                        ? `Cannot ${isConfirm ? "confirm" : "mark as completed"} before ${dateRestrictionLabel} (${formatDeliveryDate(targetDeliveryDate)})`
                        : ""
                    }
                    truncateValue={
                      <Button
                        className="w-28"
                        disabled={isCompleteRestrictedByDate}
                        onClick={() => {
                          if (isCompleteRestrictedByDate) {
                            toastManager.add({
                              title: `Cannot ${isConfirm ? "confirm" : "mark as completed"} before ${dateRestrictionLabel} (${formatDeliveryDate(targetDeliveryDate)})`,
                              type: "error",
                            });
                            return;
                          }
                          setOpenCompletedModal(true);
                        }}
                      >
                        {primaryButtonLabel}
                      </Button>
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-base font-semibold">Reschedule</span>
                  <p className="text-sm text-muted-foreground">
                    If the schedule has changed, you can reschedule it.
                  </p>
                </div>
                <div className="shrink-0">
                  <Button className="w-28" onClick={() => setOpenRescheduleModal(true)}>
                    Reschedule
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </BaseModal>

      <BaseModal
        open={openCompletedModal}
        onOpenChange={setOpenCompletedModal}
        title={isConfirm ? "Confirm Pickup Schedule" : "Complete Task"}
        description={
          isConfirm
            ? "Upload completion documents (optional) to confirm this pickup schedule."
            : "Upload completion documents (optional) to mark this task as completed."
        }
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              Upload Documents
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
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
                completedUpdateMutation.isPending ||
                isCompleteRestrictedByDate
              }
            >
              {uploadCompletionDocsMutation.isPending ||
              completedUpdateMutation.isPending
                ? "Processing..."
                : completionFiles.length > 0
                  ? (isConfirm ? "Upload & Confirm" : "Upload & Complete")
                  : primaryButtonLabel}
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
