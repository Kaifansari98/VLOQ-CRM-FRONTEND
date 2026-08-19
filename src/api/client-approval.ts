import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import type { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
}

// Utility to extract message safely
const extractAxiosError = (err: AxiosError<ApiErrorResponse>) =>
  err.response?.data?.message || "Unexpected server error";

export const getClientApprovalLeads = async (
  vendorId: number,
  userId: number
) => {
  const { data } = await apiClient.get(
    `/leads/client-approval/allLeads/vendorId/${vendorId}/userId/${userId}`
  );
  return data;
};

export const getClientApprovalDetails = async (
  vendorId: number,
  leadId: number,
  productTypeId?: number,
) => {
  const url = productTypeId
    ? `/leads/client-approval/details/vendorId/${vendorId}/leadId/${leadId}?product_type_id=${productTypeId}`
    : `/leads/client-approval/details/vendorId/${vendorId}/leadId/${leadId}`;
  const { data } = await apiClient.get(url);
  return data.data;
};

export const useClientApprovalDetails = (
  vendorId?: number,
  leadId?: number,
  productTypeId?: number,
) => {
  return useQuery({
    queryKey: ["clientApprovalDetails", vendorId, leadId, productTypeId],
    queryFn: () => getClientApprovalDetails(vendorId!, leadId!, productTypeId),
    enabled: !!vendorId && !!leadId,
  });
};

export interface UploadApprovalDocPayload {
  leadId: number;
  accountId: number;
  vendorId: number;
  createdBy: number;
  productTypeId?: number;
  documents: File[];
}

export const uploadMoreClientApprovalDocs = async (
  payload: UploadApprovalDocPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("account_id", payload.accountId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());
  if (payload.productTypeId) {
    formData.append("product_type_id", payload.productTypeId.toString());
  }

  payload.documents.forEach((file) => {
    formData.append("documents", file);
  });

  const { data } = await apiClient.post(
    `/leads/client-approval/add-documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
};

export const useBackendUsers = (vendorId: number) => {
  return useQuery({
    queryKey: ["backendUsers", vendorId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/leads/client-approval/backend-users/vendorId/${vendorId}`
      );
      return data?.data?.backend_users || [];
    },
    enabled: !!vendorId,
  });
};

export const useSubmitClientApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const vendorId = formData.get("vendor_id");
      const leadId = formData.get("lead_id");

      const { data } = await apiClient.post(
        `/leads/client-approval/vendorId/${vendorId}/leadId/${leadId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },

    onSuccess: () => {
      toastManager.add({ title: "Client Approval submitted successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["clientApprovalDetails"] });
    },

    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({ title: extractAxiosError(err), type: "error" });
    },
  });
};

export const useRequestToTechCheck = () => {
  return useMutation({
    mutationFn: async ({
      vendorId,
      leadId,
      accountId,
      assign_to_user_id,
      created_by,
    }: {
      vendorId: number;
      leadId: number;
      accountId: number;
      assign_to_user_id: number;
      created_by: number;
    }) => {
      const { data } = await apiClient.post(
        `/leads/client-approval/vendorId/${vendorId}/leadId/${leadId}/request-to-tech-check`,
        {
          account_id: accountId,
          assign_to_user_id,
          created_by,
        }
      );
      return data;
    },

    onSuccess: () =>
      toastManager.add({ title: "Request to Tech Check submitted successfully!", type: "success" }),

    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({ title: extractAxiosError(err), type: "error" });
    },
  });
};

export const useTechCheckUsers = (vendorId: number) => {
  return useQuery({
    queryKey: ["techCheckUsers", vendorId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/leads/client-approval/tech-check-users/vendorId/${vendorId}`
      );
      return data?.data?.tech_check_users || [];
    },
    enabled: !!vendorId,
  });
};
