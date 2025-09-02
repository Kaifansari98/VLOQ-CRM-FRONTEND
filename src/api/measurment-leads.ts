import { apiClient } from "@/lib/apiClient";

export const getInitialSiteMeasurement2 = async (
  vendorId: number,
  statusId: number
) => {
  const response = await apiClient.get(
    `/leads/initial-site-measurement/vendor/${vendorId}/status/${statusId}`
  );
  return response.data;
};
