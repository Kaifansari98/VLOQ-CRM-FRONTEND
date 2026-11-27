import { createMeetingType, getMeetingTypes } from "@/api/designingStageQueries";
import { MeetingTypeMaster } from "@/types/designing-stage-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetMeetingTypes = (vendorId: number) => {
  return useQuery<MeetingTypeMaster[]>({
    queryKey: ["meetingTypes", vendorId],
    queryFn: () => getMeetingTypes(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

/** Adds a meeting type (super-admin only) and puts it in the list straight away. */
export const useCreateMeetingType = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: string) => createMeetingType(vendorId, type),
    onSuccess: (created) => {
      queryClient.setQueryData<MeetingTypeMaster[]>(["meetingTypes", vendorId], (list = []) => [
        ...list.filter((t) => t.id !== created.id),
        created,
      ]);
      void queryClient.invalidateQueries({ queryKey: ["meetingTypes", vendorId] });
    },
  });
};
