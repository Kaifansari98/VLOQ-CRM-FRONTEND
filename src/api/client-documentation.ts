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
