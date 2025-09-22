import {
  CancelledPayload,
  CancelledUpdateTheTaskIsmAndFollowUp,
  CompletedPayload,
  CompletedUpdateTheTaskIsmAndFollowUp,
  getInitialSiteMeasurement,
  ReschedulePayload,
  RescheduleTaskFollowUp,
} from "@/api/measurment-leads";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useInitialSiteMeasurement = (
  vendorId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["siteMeasurementLeads", vendorId],
    queryFn: () => getInitialSiteMeasurement(vendorId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCompletedUpdateTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: CompletedPayload;
    }) => CompletedUpdateTheTaskIsmAndFollowUp(leadId, taskId, payload),
  });
};

export const useCancelledUpdateTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: CancelledPayload;
    }) => CancelledUpdateTheTaskIsmAndFollowUp(leadId, taskId, payload),
  });
};

export const useRescheduleTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: ReschedulePayload;
    }) => RescheduleTaskFollowUp(leadId, taskId, payload),
  });
};
