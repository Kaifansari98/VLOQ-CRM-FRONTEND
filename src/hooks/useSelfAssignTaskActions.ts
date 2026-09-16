import {
  rescheduleSelfAssignTask,
  RescheduleSelfAssignTaskPayload,
  updateSelfAssignTask,
  UpdateSelfAssignTaskPayload,
} from "@/api/self-assign-task";
import { useMutation } from "@tanstack/react-query";

export const useUpdateSelfAssignTask = () => {
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
