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
import { getBookingDoneIsmDetails, uploadBookingDoneIsm } from "@/api/leads";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useInitialSiteMeasurement = (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["siteMeasurementLeads", vendorId, userId, page, limit],
    queryFn: () => getInitialSiteMeasurement(vendorId, userId, page, limit),
    enabled: !!vendorId && !!userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
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

export const useBookingDoneIsmUpload = () => {
  return useMutation({
    mutationFn: uploadBookingDoneIsm,
  });
};

export const useBookingDoneIsmDetails = (
  leadId: number | undefined,
  vendorId: number | undefined
) => {
  return useQuery({
    queryKey: ["bookingDoneIsmDetails", leadId, vendorId],
    queryFn: () => getBookingDoneIsmDetails(leadId!, vendorId!),
    enabled: Boolean(leadId && vendorId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
