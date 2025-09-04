import {
  fetchDesigningStageLeads,
} from "@/api/designingStageQueries";
import { GetDesigningStageResponse } from "@/types/designing-stage-types";
import { useQuery } from "@tanstack/react-query";

export const useDesigningStageLeads = (vendorId: number, status: number) => {
  return useQuery<GetDesigningStageResponse>({
    queryKey: ["designing-stage-leads", vendorId, status],
    queryFn: () => fetchDesigningStageLeads(vendorId, status),
    enabled: !!vendorId && !!status, // prevent query until params available
  });
};

