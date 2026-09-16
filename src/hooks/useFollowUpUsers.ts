import { useQuery } from "@tanstack/react-query";
import { getFollowUpUsers } from "@/api/leads";

export const useFollowUpUsers = (
  vendorId: number | undefined,
  leadId: number | undefined,
  franchiseId?: number | null,
) => {
  return useQuery({
    queryKey: ["followUpUsers", vendorId, leadId, franchiseId],
    queryFn: () => getFollowUpUsers(vendorId!, leadId!, franchiseId),
    enabled: !!vendorId && !!leadId,
  });
};
