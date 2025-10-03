import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// ✅ Fetch all client approval leads
export const getClientApprovalLeads = async (
  vendorId: number,
  userId: number
) => {
  const { data } = await apiClient.get(
    `/leads/client-approval/allLeads/vendorId/${vendorId}/userId/${userId}`
  );
  return data;
};

// ✅ Fetch client approval details
export const getClientApprovalDetails = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/client-approval/vendorId/${vendorId}/leadId/${leadId}`
  );
  return data.data;
};

// Optional: upload more approval docs
export interface UploadApprovalDocPayload {
  leadId: number;
  accountId: number;
  vendorId: number;
  createdBy: number;
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
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post(
        `/leads/client-approval/vendorId/${formData.get(
          "vendor_id"
        )}/leadId/${formData.get("lead_id")}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Client Approval submitted successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to submit client approval"
      );
    },
  });
};
