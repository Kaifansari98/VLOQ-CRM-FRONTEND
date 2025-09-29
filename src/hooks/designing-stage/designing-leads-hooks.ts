import {
  editSelection,
  EditSelectionPayload,
  fetchDesigningStageLeads,
  getDesigningStageCounts,
  getDesignsDoc,
  getQuotationDoc,
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

export const useDesigningStageLeads = (vendorId: number, userId: number) => {
  return useQuery<GetDesigningStageResponse>({
    queryKey: ["designing-stage-leads", vendorId, userId],
    queryFn: () => fetchDesigningStageLeads(vendorId, userId),
    enabled: !!vendorId && !!userId, // ✅ only fetch when all are available
    staleTime: 5 * 60 * 1000, // cache for 5 mins
    refetchOnWindowFocus: false,
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
        queryKey: ["getSelectionData", variables.vendor_id, variables.lead_id],
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
    mutationFn: ({
      selectionId,
      payload,
    }: {
      selectionId: number;
      payload: EditSelectionPayload;
    }) => editSelection(selectionId, payload),
    onSuccess: (_, variables) => {
      // We need to invalidate queries but we don't have vendorId/leadId in the variables
      // So invalidate all getSelectionData queries
      queryClient.invalidateQueries({
        queryKey: ["getSelectionData"],
      });
      queryClient.invalidateQueries({ queryKey: ["selections"] });
    },
  });
};

export function useQuotationDoc(vendorId?: number, leadId?: number) {
  return useQuery({
    queryKey: ["getQuotationDoc", vendorId, leadId],
    queryFn: () => {
      if (!vendorId || !leadId) {
        throw new Error("vendorId and leadId are required");
      }
      return getQuotationDoc(vendorId, leadId);
    },
    enabled: Boolean(vendorId && leadId),
  });
}

export function useDesigningStageCounts(
  vendorId: number | undefined,
  leadId: number | undefined
) {
  return useQuery({
    queryKey: ["designingStageCounts", vendorId, leadId],
    queryFn: () => getDesigningStageCounts(vendorId!, leadId!),
    enabled: Boolean(vendorId && leadId), // run only when both IDs are available
    staleTime: 5 * 60 * 1000, // optional: cache for 5 minutes
  });
}
