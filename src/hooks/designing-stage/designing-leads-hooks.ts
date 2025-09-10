import {
  editSelection,
  EditSelectionPayload,
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

export const useDesignsDoc = (vendorId: number, leadId: number) => {
  return useQuery<GetDesignsResponse>({
    queryKey: ["getDesignsDoc", vendorId, leadId],
    queryFn: () => getDesignsDoc(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useSubmitSelection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitSelectionPayload) => submitSelection(payload),
    onSuccess: (_, variables) => {
      // Invalidate the specific selection data query
      queryClient.invalidateQueries({ 
        queryKey: ["getSelectionData", variables.vendor_id, variables.lead_id] 
      });
      // Also invalidate the general selections query as fallback
      queryClient.invalidateQueries({ queryKey: ["selections"] });
    },
  });
};

export const useSelectionData = (vendorId: number, leadId: number) => {
  return useQuery<DesignSelectionsResponse>({
    queryKey: ["getSelectionData", vendorId, leadId],
    queryFn: () => getSelectionData(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useEditSelectionData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ selectionId, payload }: { selectionId: number; payload: EditSelectionPayload }) =>
      editSelection(selectionId, payload),
    onSuccess: (_, variables) => {
      // We need to invalidate queries but we don't have vendorId/leadId in the variables
      // So invalidate all getSelectionData queries
      queryClient.invalidateQueries({ 
        queryKey: ["getSelectionData"] 
      });
      queryClient.invalidateQueries({ queryKey: ["selections"] });
    },
  });
};
