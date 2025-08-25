// hooks/useDeleteLead.ts
import { deleteLead } from "@/api/leads";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      userId,
    }: {
      leadId: number;
      vendorId: number;
      userId: number;
    }) => deleteLead(leadId, userId),

    onSuccess: (_, { vendorId, userId }) => {
      // invalidate the cache so UI refreshes automatically
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, userId],
      });
    },
  });
}
