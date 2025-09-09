import {
  fetchDesigningStageLeads,
  getDesignsDoc,
  getSelectionData,
  submitQuotation,
  submitSelection,
  SubmitSelectionPayload,
} from "@/api/designingStageQueries";
import {
  DesignSelectionsResponse,
  GetDesigningStageResponse,
  GetDesignsResponse,
} from "@/types/designing-stage-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useDesigningStageLeads = (vendorId: number, status: number) => {
  return useQuery<GetDesigningStageResponse>({
    queryKey: ["designing-stage-leads", vendorId, status],
    queryFn: () => fetchDesigningStageLeads(vendorId, status),
    enabled: !!vendorId && !!status, // prevent query until params available
  });
};

export const useSubmitQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      vendorId,
      leadId,
      userId,
      accountId,
    }: {
      file: File;
      vendorId: number;
      leadId: number;
      userId: number;
      accountId: number;
    }) => submitQuotation(file, vendorId, leadId, userId, accountId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["getQuotationDoc", variables.vendorId, variables.leadId],
      });
    },
  });
};

export const useSubmitSelection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitSelectionPayload) => submitSelection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selections"] });
    },
  });
};

export const useDesignsDoc = (vendorId: number, leadId: number) => {
  return useQuery<GetDesignsResponse>({
    queryKey: ["getDesignsDoc", vendorId, leadId],
    queryFn: () => getDesignsDoc(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useSelectionData = (vendorId: number, leadId: number) => {
  return useQuery<DesignSelectionsResponse>({
    queryKey: ["getDesignsDoc", vendorId, leadId],
    queryFn: () => getSelectionData(vendorId, leadId),
    enabled: !!vendorId && !!leadId, 
  });
};
