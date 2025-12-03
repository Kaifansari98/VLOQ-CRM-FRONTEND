import { apiClient } from "@/lib/apiClient";
import { toastError } from "@/lib/utils";
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

// ✅ --- Approve Tech Check ---
export const approveTechCheck = async ({
  vendorId,
  leadId,
  userId,
  assignToUserId,
  accountId,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
  assignToUserId: number;
  accountId: number;
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/approve`,
    {
      assign_to_user_id: assignToUserId,
      account_id: accountId,
    }
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
    onSuccess: async () => {
      toast.success("Tech Check approved successfully!");
      await queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] });
      router.push(`/dashboard/production/order-login`);
      await queryClient.invalidateQueries({ queryKey: ["leadStats"] });
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });
};

export const useRejectTechCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectTechCheck,
    onSuccess: async () => {
      toast.success("Tech Check rejected successfully!");
      await queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] });
      await queryClient.invalidateQueries({
        queryKey: ["clientDocumentationDetails"],
      });
    },
    onError: (error: unknown) => {
      toastError(error)
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
    onSuccess: async () => {
      toast.success("Selected documents approved successfully!");
      // Refresh the tech-check leads and client-doc details
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] }),
        queryClient.invalidateQueries({
          queryKey: ["clientDocumentationDetails"],
        }),
      ]);
    },
    onError: (error: unknown) => {
      toastError(error);
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
