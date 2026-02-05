import { apiClient } from "@/lib/apiClient";

export const getClientDocumentationLeads = async (
  vendorId: number,
  userId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/client-documentation/allLeads/vendorId/${vendorId}/userId/${userId}`,
  );
  return data;
};

export const getClientDocumentationDetails = async (
  vendorId: number,
  leadId: number,
  userId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/client-documentation/vendorId/${vendorId}/leadId/${leadId}`,
    {
      params: {
        userId, // 👈 GET query param
      },
    },
  );

  return data.data;
};

export interface OrderLoginEligibilityResponse {
  allowed: boolean;
  reason: string;
}

export const getOrderLoginEligibility = async (
  vendorId: number,
  leadId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/client-documentation/order-login/eligibility/${vendorId}/${leadId}`,
  );

  return data.data;
};

export interface UploadMoreDocPayload {
  leadId: number;
  accountId: number;
  vendorId: number;
  createdBy: number;
  productStructureInstanceId?: number;
  pptDocuments: File[];
  pythaDocuments: File[];
}

export const uploadMoreClientDocumentation = async (
  payload: UploadMoreDocPayload,
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("account_id", payload.accountId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());
  if (payload.productStructureInstanceId) {
    formData.append(
      "product_structure_instance_id",
      payload.productStructureInstanceId.toString()
    );
  }

  payload.pptDocuments.forEach((file) => {
    formData.append("client_documentations_ppt", file);
  });

  payload.pythaDocuments.forEach((file) => {
    formData.append("client_documentations_pytha", file);
  });

  const { data } = await apiClient.post(
    `/leads/client-documentation/add-documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
};

export const moveLeadToClientApproval = async (payload: {
  leadId: number;
  vendorId: number;
  updatedBy: number;
}) => {
  const { data } = await apiClient.post(
    `/leads/client-documentation/move-to-client-approval`,
    {
      lead_id: payload.leadId,
      vendor_id: payload.vendorId,
      updated_by: payload.updatedBy,
    }
  );
  return data;
};
