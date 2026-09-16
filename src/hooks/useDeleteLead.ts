import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLead } from "@/api/leads";
import { toastError } from "@/lib/utils";

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
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, userId],
      });
    },

    // ✅ Centralized onError handling
    onError: (error) => {
      toastError(error); // automatically formats backend error
    },
  });
}
