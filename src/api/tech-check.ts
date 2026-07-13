import { apiClient } from "@/lib/apiClient";
import { toastError } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";

// ✅ --- Fetch Tech-Check Leads (paginated) ---
export const getTechCheckLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10,
) => {
  const { data } = await apiClient.get(
    `/leads/production/tech-check/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    },
  );
  return data?.data;
};

// ✅ --- React Query Hook: My Tech-Check Leads ---
export const useTechCheckLeads = (
  vendorId: number | undefined,
  userId: number | undefined,
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: ["techCheckLeads", vendorId, userId, page, limit],
    queryFn: () => getTechCheckLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

// ✅ --- Fetch Tech-Check Instance Status ---
export const getTechCheckInstanceStatus = async (
  vendorId: number,
  leadId: number,
  instanceId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/production/tech-check/vendorId/${vendorId}/leadId/${leadId}/instanceId/${instanceId}/status`,
  );
  return data?.data;
};

export const useTechCheckInstanceStatus = (
  vendorId: number | undefined,
  leadId: number | undefined,
  instanceId: number | null | undefined,
) => {
  return useQuery({
    queryKey: ["techCheckInstanceStatus", vendorId, leadId, instanceId],
    queryFn: () => getTechCheckInstanceStatus(vendorId!, leadId!, instanceId!),
    enabled: !!vendorId && !!leadId && !!instanceId,
  });
};

// ✅ --- Approve Tech Check ---
export const approveTechCheck = async ({
  vendorId,
  leadId,
  userId,
  assignToUserId,
  accountId,
  clientRequiredOrderLoginComplitionDate,
  productStructureInstanceId,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
  assignToUserId: number;
  accountId: number;
  clientRequiredOrderLoginComplitionDate?: string;
  productStructureInstanceId?: number | null;
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/approve`,
    {
      assign_to_user_id: assignToUserId,
      account_id: accountId,
      ...(clientRequiredOrderLoginComplitionDate
        ? {
            client_required_order_login_complition_date:
              clientRequiredOrderLoginComplitionDate,
          }
        : {}),
      ...(productStructureInstanceId
        ? { product_structure_instance_id: productStructureInstanceId }
        : {}),
    },
  );
  return data;
};

// ✅ --- Reject Tech Check ---
export const rejectTechCheck = async ({
  vendorId,
  leadId,
  userId,
  instanceId,
  payload,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
  instanceId: number;
  payload: { rejectedDocs: number[]; remark: string };
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/instanceId/${instanceId}/reject`,
    payload,
  );
  return data;
};

export const useApproveTechCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveTechCheck,
    onSuccess: async (data, variables) => {
      toastManager.add({
        title: "Tech Check approved successfully!",
        type: "success",
      });
      await queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] });
      await queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      if (variables?.leadId) {
        await queryClient.invalidateQueries({
          queryKey: ["lead", variables.leadId],
        });
      }
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
      toastManager.add({
        title: "Tech Check rejected successfully!",
        type: "success",
      });
      await queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] });
      await queryClient.invalidateQueries({
        queryKey: ["clientDocumentationDetails"],
      });
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });
};

// ✅ --- Approve Multiple Documents ---
export const approveMultipleDocuments = async ({
  vendorId,
  leadId,
  userId,
  instanceId,
  approvedDocs,
}: {
  vendorId: number;
  leadId: number;
  userId: number;
  instanceId: number;
  approvedDocs: number[];
}) => {
  const { data } = await apiClient.post(
    `/leads/production/tech-check/leadId/${leadId}/vendorId/${vendorId}/userId/${userId}/instanceId/${instanceId}/documents/approve`,
    { approvedDocs },
  );
  return data;
};

export const useApproveMultipleDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveMultipleDocuments,
    onSuccess: async () => {
      toastManager.add({
        title: "Selected documents approved successfully!",
        type: "success",
      });
      // Refresh the tech-check leads and client-doc details
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["techCheckLeads"] }),
        queryClient.invalidateQueries({
          queryKey: ["clientDocumentationDetails"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["allLeadDocuments"],
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
  leadId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/client-required-completion-date`,
  );
  return data?.data;
};

// ✅ --- React Query Hook ---
export const useClientRequiredCompletionDate = (
  vendorId: number | undefined,
  leadId: number | undefined,
) => {
  return useQuery({
    queryKey: ["clientRequiredCompletionDate", vendorId, leadId],
    queryFn: () => getClientRequiredCompletionDate(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};
