import { useMutation, useQuery } from "@tanstack/react-query";
import {
  actOnApprovalRequest,
  ActOnApprovalRequestPayload,
  createApprovalRequest,
  CreateApprovalRequestPayload,
  getApprovalRequestAssignableUsers,
} from "@/api/approval-requests";

export const useCreateApprovalRequest = (leadId: number) => {
  return useMutation({
    mutationFn: (payload: CreateApprovalRequestPayload) =>
      createApprovalRequest(leadId, payload),
  });
};

export const useApprovalRequestAssignableUsers = (
  vendorId?: number,
  leadId?: number,
) => {
  return useQuery({
    queryKey: ["approvalRequestAssignableUsers", vendorId, leadId],
    queryFn: () => getApprovalRequestAssignableUsers(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
};

export const useActOnApprovalRequest = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: ActOnApprovalRequestPayload;
    }) => actOnApprovalRequest(leadId, taskId, payload),
  });
};
