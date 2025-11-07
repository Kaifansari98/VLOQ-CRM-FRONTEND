import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

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
    `/leads/client-approval/details/vendorId/${vendorId}/leadId/${leadId}`
  );
  return data.data;
};

// ✅ Hook: useClientApprovalDetails
export const useClientApprovalDetails = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["clientApprovalDetails", vendorId, leadId],
    queryFn: () => getClientApprovalDetails(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
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

// ✅ Backend users
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

// ✅ Submit client approval
export const useSubmitClientApproval = () => {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ["clientApprovalDetails"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to submit client approval"
      );
    },
  });
};

// ✅ Request to Tech Check (with date)
export const useRequestToTechCheck = () => {
  return useMutation({
    mutationFn: async ({
      vendorId,
      leadId,
      accountId,
      assign_to_user_id,
      created_by,
      client_required_order_login_complition_date, // 👈 new field
    }: {
      vendorId: number;
      leadId: number;
      accountId: number;
      assign_to_user_id: number;
      created_by: number;
      client_required_order_login_complition_date: string;
    }) => {
      const { data } = await apiClient.post(
        `/leads/client-approval/vendorId/${vendorId}/leadId/${leadId}/request-to-tech-check`,
        {
          account_id: accountId,
          assign_to_user_id,
          created_by,
          client_required_order_login_complition_date,
        }
      );
      return data;
    },
    onSuccess: () => toast.success("Request to Tech Check submitted successfully!"),
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || "Failed to request Tech Check"),
  });
};


// ✅ Fetch tech-check users
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
