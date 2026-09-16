import { getMeetings } from "@/api/designingStageQueries";
import { GetMeetingsResponse } from "@/types/designing-stage-types";
import { useQuery } from "@tanstack/react-query";

export const useGetMeetings = (vendorId: number, leadId: number) => {
  return useQuery<GetMeetingsResponse>({
    queryKey: ["meetings", vendorId, leadId],
    queryFn: () => getMeetings(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};
