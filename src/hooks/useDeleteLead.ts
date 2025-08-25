import { deleteLead } from "@/api/leads";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, userId }: { leadId: number; userId: number }) =>
      deleteLead(leadId, userId),

    onSuccess: () => {
      // delete ke baad list refresh
      queryClient.invalidateQueries({ queryKey: ["vendorUserLeads"] });
    },

    onError: (error) => {
      console.error("❌ Delete failed:", error);
    },
  });
}
