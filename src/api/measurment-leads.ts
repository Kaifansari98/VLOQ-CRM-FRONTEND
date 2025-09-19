import { apiClient } from "@/lib/apiClient";

export const getInitialSiteMeasurement = async (
  vendorId: number,
  statusId: number
) => {
  const response = await apiClient.get(
    `/leads/initial-site-measurement/vendor/${vendorId}/initial-site-measurement`
  );
  return response.data;
};

export const UpdateInitialSiteMeasurement = async (
  paymentId: number,
  formData: FormData
) => {
  const response = await apiClient.put(
    `/leads/initial-site-measurement/${paymentId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

