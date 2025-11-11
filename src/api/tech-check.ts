import { useVendorOverallLeads } from "@/hooks/useLeadsQueries";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

// ✅ --- Fetch Tech-Check Leads (paginated) ---
export const getTechCheckLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/production/tech-check/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );
  return data?.data;
};

// ✅ --- React Query Hook: My Tech-Check Leads ---
export const useTechCheckLeads = (
  vendorId: number | undefined,
  userId: number | undefined,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["techCheckLeads", vendorId, userId, page, limit],
    queryFn: () => getTechCheckLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

export const useVendorTechCheckOverallLeads = (
  vendorId: number,
  userId: number
) => {
  return useVendorOverallLeads(vendorId, "Type 8", userId);
};

// ✅ --- Approve Tech Check ---
export const approveTechCheck = async ({
  vendorId,
  leadId,
  userId,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/approve`
  );
  return data;
};

// ✅ --- Reject Tech Check ---
export const rejectTechCheck = async ({
  vendorId,
  leadId,
  userId,
  payload,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
  payload: { rejectedDocs: number[]; remark: string };
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/reject`,
    payload
  );
  return data;
};

export const useApproveTechCheck = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: approveTechCheck,
    onSuccess: async (_, variables) => {
      toast.success("Tech Check approved successfully!");
      await queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] });
      router.push(`/dashboard/production/order-login`);
      await queryClient.invalidateQueries({ queryKey: ["leadStats"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Approval failed");
    },
  });
};

export const useRejectTechCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectTechCheck,
    onSuccess: async (_, variables) => {
      toast.success("Tech Check rejected successfully!");
      await queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] });
      await queryClient.invalidateQueries({ queryKey: ["clientDocumentationDetails"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Rejection failed");
    },
  });
};

// ✅ --- Approve Multiple Documents ---
export const approveMultipleDocuments = async ({
  vendorId,
  leadId,
  userId,
  approvedDocs,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
  approvedDocs: number[];
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/documents/approve`,
    { approvedDocs }
  );
  return data;
};

export const useApproveMultipleDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveMultipleDocuments,
    onSuccess: async (_, variables) => {
      toast.success("Selected documents approved successfully!");
      // Refresh the tech-check leads and client-doc details
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] }),
        queryClient.invalidateQueries({
          queryKey: ["clientDocumentationDetails"],
        }),
      ]);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Document approval failed");
    },
  });
};

// ✅ --- Fetch Client Required Completion Date ---
export const getClientRequiredCompletionDate = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/client-required-completion-date`
  );
  return data?.data;
};

// ✅ --- React Query Hook ---
export const useClientRequiredCompletionDate = (
  vendorId: number | undefined,
  leadId: number | undefined
) => {
  return useQuery({
    queryKey: ["clientRequiredCompletionDate", vendorId, leadId],
    queryFn: () => getClientRequiredCompletionDate(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};
