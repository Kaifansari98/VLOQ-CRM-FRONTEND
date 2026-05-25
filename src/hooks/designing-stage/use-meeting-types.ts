import { getMeetingTypes } from "@/api/designingStageQueries";
import { MeetingTypeMaster } from "@/types/designing-stage-types";
import { useQuery } from "@tanstack/react-query";

export const useGetMeetingTypes = (vendorId: number) => {
  return useQuery<MeetingTypeMaster[]>({
    queryKey: ["meetingTypes", vendorId],
    queryFn: () => getMeetingTypes(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};
