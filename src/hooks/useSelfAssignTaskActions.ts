import {
  rescheduleSelfAssignTask,
  RescheduleSelfAssignTaskPayload,
  updateSelfAssignTask,
  UpdateSelfAssignTaskPayload,
} from "@/api/self-assign-task";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateSelfAssignTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: UpdateSelfAssignTaskPayload;
    }) => updateSelfAssignTask(leadId, taskId, payload),
    onSuccess: (_data, { leadId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["leadSuperAdminApprovalLockIns"],
        predicate: query => query.queryKey[2] === leadId,
      });
      void queryClient.invalidateQueries({ queryKey: ["activeLeadTasks"], predicate: query => query.queryKey[2] === leadId });
    },
  });
};

export const useRescheduleSelfAssignTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: RescheduleSelfAssignTaskPayload;
    }) => rescheduleSelfAssignTask(leadId, taskId, payload),
  });
};
