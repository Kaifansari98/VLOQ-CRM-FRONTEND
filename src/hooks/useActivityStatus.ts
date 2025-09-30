import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateLeadActivityStatus,
  UpdateActivityStatusPayload,
  getLostLeads,
  getOnHoldLeads,
  RevertActivityStatusPayload,
  revertLeadToOnGoing,
  getLostApprovalLeads,
  getActivityStatusCounts,
} from "@/api/activityStatus";
import { toast } from "react-toastify";

export const useUpdateActivityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId: number;
      payload: UpdateActivityStatusPayload;
    }) => updateLeadActivityStatus(leadId, payload),
    onSuccess: (data) => {
      toast.success("Lead status updated!");
      // invalidate any related queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ["lostApprovalLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "❌ Failed to update status"
      );
    },
  });
};

export const useOnHoldLeads = (vendorId: number) => {
  return useQuery({
    queryKey: ["onHoldLeads", vendorId],
    queryFn: () => getOnHoldLeads(vendorId),
    enabled: !!vendorId,
  });
};

export const useLostApprovalLeads = (vendorId: number) => {
  return useQuery({
    queryKey: ["lostApprovalLeads", vendorId],
    queryFn: () => getLostApprovalLeads(vendorId),
    enabled: !!vendorId,
  });
};

export const useLostLeads = (vendorId: number) => {
  return useQuery({
    queryKey: ["lostLeads", vendorId],
    queryFn: () => getLostLeads(vendorId),
    enabled: !!vendorId,
  });
};

export const useRevertActivityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId: number;
      payload: RevertActivityStatusPayload;
    }) => revertLeadToOnGoing(leadId, payload),
    onSuccess: () => {
      toast.success("Lead reverted to OnGoing!");
      // refresh onHold & lost lists + any generic leads cache
      queryClient.invalidateQueries({ queryKey: ["onHoldLeads"] });
      queryClient.invalidateQueries({ queryKey: ["lostLeads"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to revert lead");
    },
  });
};

export const useActivityStatusCounts = (vendorId?: number) => {
  return useQuery({
    queryKey: ["activityStatusCounts", vendorId],
    queryFn: () => getActivityStatusCounts(vendorId!),
    enabled: !!vendorId,
  });
};