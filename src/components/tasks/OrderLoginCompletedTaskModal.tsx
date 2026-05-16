"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/utils/baseModal";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useCompletedUpdateTask } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    accountId: number;
    taskId: number;
    instanceId?: number;
  };
}

const OrderLoginCompletedTaskModal: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const completedUpdateMutation = useCompletedUpdateTask();

  const handleMarkAsSeen = () => {
    if (!data?.leadId || !data?.taskId || !data?.accountId) {
      toastManager.add({
        title: "Task details are incomplete.",
        type: "error",
      });
      return;
    }

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
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId, userId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorAllTasks"],
            });
            queryClient.invalidateQueries({
              queryKey: ["sidebarMyTaskCount"],
              exact: false,
            });
            queryClient.invalidateQueries({
              queryKey: ["leadStats"],
              exact: false,
            });
          }

          onOpenChange(false);
          router.push(
            `/dashboard/production/pre-post-prod/details/${data.leadId}?accountId=${data.accountId}&instance_id=${data.instanceId}`,
          );
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.message || "Failed to mark task as seen.",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Order Login Completed"
      description="Review the production details for this instance and mark this task as seen before redirecting."
      size="md"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between rounded-xl border p-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">Mark as Seen</span>
            <p className="text-sm text-muted-foreground">
              This will mark the task as completed and open the production
              details page for the selected instance.
            </p>
          </div>
          <Button
            className="w-28"
            onClick={handleMarkAsSeen}
            disabled={completedUpdateMutation.isPending}
          >
            {completedUpdateMutation.isPending ? "Opening..." : "Mark as Seen"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default OrderLoginCompletedTaskModal;
