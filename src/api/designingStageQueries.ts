import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { GetDesigningStageResponse } from "@/types/designing-stage-types";

// ✅ Define the response type (adjust fields once API shape is confirmed)
export interface DesigningStageLead {
  id: number;
  name: string;
  email?: string;
  contact?: string;
  status?: number;
  createdAt?: string;
  [key: string]: any; // fallback for unknown fields
}

export interface MoveToDesigningStagePayload {
  lead_id: number;
  user_id: number;
  vendor_id: number;
}

// ✅ Define the expected response (adjust to match your backend)
export interface MoveToDesigningStageResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ✅ API function
const moveToDesigningStage = async (
  payload: MoveToDesigningStagePayload
): Promise<MoveToDesigningStageResponse> => {
  const { data } = await apiClient.post<MoveToDesigningStageResponse>(
    "/leads/designing-stage/update-status",
    payload
  );
  return data;
};

// ✅ Hook
export const useMoveToDesigningStage = () => {
  return useMutation<
    MoveToDesigningStageResponse,
    Error,
    MoveToDesigningStagePayload
  >({
    mutationFn: moveToDesigningStage,
  });
};

// ✅ API function
export const fetchDesigningStageLeads = async (
  vendorId: number,
  status: number
): Promise<GetDesigningStageResponse> => {
  const { data } = await apiClient.get<GetDesigningStageResponse>(
    `/leads/designing-stage/vendor/${vendorId}/status/${status}`
  );
  return data;
};

// ✅ API function for file upload
export const submitQuotation = async (
  file: File,
  vendorId: number,
  leadId: number,
  userId: number,
  accountId: number
) => {
  const formData = new FormData();
  formData.append("file", file); // must match multer field name
  formData.append("vendorId", vendorId.toString());
  formData.append("leadId", leadId.toString());
  formData.append("userId", userId.toString());
  formData.append("accountId", accountId.toString());

  const response = await apiClient.post(
    "/leads/designing-stage/upload-quoation",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const fetchLeadById = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}`
  );
  return data; // This should return the API response payload
};

export interface SubmitMeetingPayload {
  files: File[];
  desc: string;
  date: string;
  vendorId: number;
  leadId: number;
  userId: number;
  accountId: number;
}

export const submitMeeting = async (payload: SubmitMeetingPayload) => {
  const formData = new FormData();

  formData.append("leadId", payload.leadId.toString());
  formData.append("vendorId", payload.vendorId.toString());
  formData.append("userId", payload.userId.toString());
  formData.append("accountId", payload.accountId.toString());
  formData.append("date", new Date(payload.date).toISOString()); // safer
  formData.append("desc", payload.desc);

  payload.files.forEach((file) => {
    formData.append("files", file); // MUST match multer field
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/design-meeting",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
};
