import { getInitialSiteMeasurementTask } from "@/api/designingStageQueries";
import {
  CancelledPayload,
  CancelledUpdateTheTaskIsmAndFollowUp,
  CompletedPayload,
  CompletedUpdateTheTaskIsmAndFollowUp,
  getInitialSiteMeasurement,
  getSiteMeasurmentLeadById,
  ReschedulePayload,
  RescheduleTaskFollowUp,
} from "@/api/measurment-leads";
import { SiteMeasurementLeadData } from "@/types/site-measrument-types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useInitialSiteMeasurement = (
  vendorId: number,
  userId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["siteMeasurementLeads", vendorId, userId],
    queryFn: () => getInitialSiteMeasurement(vendorId, userId),
    enabled: enabled && !!vendorId && !!userId, // ✅ ensure both exist
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

export function useSiteMeasurementLeadById(leadId: number) {
  return useQuery({
    queryKey: ["siteMeasurementLeadDetails", leadId],
    queryFn: () => getSiteMeasurmentLeadById(leadId),
    enabled: Boolean(leadId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useInitialSiteMeasurementTask(
  userId: number | undefined,
  leadId: number | undefined
) {
  return useQuery({
    queryKey: ["initialSiteMeasurementTask", userId, leadId],
    queryFn: () => getInitialSiteMeasurementTask(userId!, leadId!),
    enabled: Boolean(userId && leadId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
