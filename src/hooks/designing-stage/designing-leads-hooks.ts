import {
  fetchDesigningStageLeads,
  submitQuotation,
} from "@/api/designingStageQueries";
import { GetDesigningStageResponse } from "@/types/designing-stage-types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useDesigningStageLeads = (vendorId: number, status: number) => {
  return useQuery<GetDesigningStageResponse>({
    queryKey: ["designing-stage-leads", vendorId, status],
    queryFn: () => fetchDesigningStageLeads(vendorId, status),
    enabled: !!vendorId && !!status, // prevent query until params available
  });
};

export const useSubmitQuotation = () => {
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
  });
};