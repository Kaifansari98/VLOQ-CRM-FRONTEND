import { apiClient } from "@/lib/apiClient";

export const getClientDocumentationLeads = async (
  vendorId: number,
  userId: number
) => {
  const { data } = await apiClient.get(
    `/leads/client-documentation/allLeads/vendorId/${vendorId}/userId/${userId}`
  );
  return data;
};

export const getClientDocumentationDetails = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/client-documentation/vendorId/${vendorId}/leadId/${leadId}`
  );

  return data.data;
};

export interface UploadMoreDocPayload {
  leadId: number;
  accountId: number;
  vendorId: number;
  createdBy: number;
  documents: File[];
}

export const uploadMoreClientDocumentation = async (
  payload: UploadMoreDocPayload
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
    `/leads/client-documentation/add-documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};