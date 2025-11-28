import { apiClient } from "@/lib/apiClient";

export const getInitialSiteMeasurement = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const response = await apiClient.get(
    `/leads/initial-site-measurement/vendor/${vendorId}/initial-site-measurement`,
    {
      params: { userId, page, limit }, // ✅ send userId in query
    }
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

export interface CompletedPayload {
  status: string;
  updated_by: number;
  closed_at: string;
  closed_by: number;
}

export const CompletedUpdateTheTaskIsmAndFollowUp = async (
  leadId: number,
  taskId: number,
  payload: CompletedPayload
) => {
  try {
    const { data } = await apiClient.patch(
      `/leads/leadId/${leadId}/taskId/${taskId}/update-assign-ism`,
      payload
    );
    return data;
  } catch (error: any) {
    console.error("Error updating completed task:", error);
    throw error;
  }
};

export interface CancelledPayload {
  status: string;
  updated_by: number;
  closed_at: string;
  closed_by: number;
}

export const CancelledUpdateTheTaskIsmAndFollowUp = async (
  leadId: number,
  taskId: number,
  payload: CancelledPayload
) => {
  try {
    const { data } = await apiClient.patch(
      `/leads/leadId/${leadId}/taskId/${taskId}/update-assign-ism`,
      payload
    );
    return data;
  } catch (error: any) {
    console.error("Error updating cancelled task:", error);
    throw error;
  }
};

export interface ReschedulePayload {
  updated_by: number;
  closed_at: string;
  closed_by: number;
  due_date: string;
  remark: string;
}

export const RescheduleTaskFollowUp = async (
  leadId: number,
  taskId: number,
  payload: ReschedulePayload
) => {
  try {
    const { data } = await apiClient.patch(
      `/leads/leadId/${leadId}/taskId/${taskId}/update-assign-ism`,
      payload
    );
    return data;
  } catch (error: any) {
    console.error("Error updating cancelled task:", error);
    throw error;
  }
};

export const getSiteMeasurmentLeadById = async (leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/initial-site-measurement/leadId/${leadId}`
  );
  return data.data;
};
