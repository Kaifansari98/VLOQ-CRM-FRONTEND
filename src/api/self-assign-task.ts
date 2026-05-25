import { apiClient } from "@/lib/apiClient";

export interface UpdateSelfAssignTaskPayload {
  status: string;
  updated_by: number;
  closed_at: string;
  closed_by: number;
  remark?: string;
}

export interface RescheduleSelfAssignTaskPayload {
  updated_by: number;
  due_date: string;
  remark: string;
}

export const updateSelfAssignTask = async (
  leadId: number,
  taskId: number,
  payload: UpdateSelfAssignTaskPayload,
) => {
  const { data } = await apiClient.patch(
    `/tasks/leadId/${leadId}/taskId/${taskId}/update-self-assign-task`,
    payload,
  );

  return data;
};

export const rescheduleSelfAssignTask = async (
  leadId: number,
  taskId: number,
  payload: RescheduleSelfAssignTaskPayload,
) => {
  const { data } = await apiClient.patch(
    `/tasks/leadId/${leadId}/taskId/${taskId}/reschedule-self-assign-task`,
    payload,
  );

  return data;
};
