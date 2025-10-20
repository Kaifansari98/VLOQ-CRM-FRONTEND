import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  DesignSelectionsResponse,
  GetDesigningStageResponse,
  GetDesignsResponse,
  GetMeetingsResponse,
} from "@/types/designing-stage-types";

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
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<GetDesigningStageResponse> => {
  const { data } = await apiClient.get<GetDesigningStageResponse>(
    `/leads/designing-stage/get-all-leads/vendor/${vendorId}?userId=${userId}&page=${page}&limit=${limit}`
  );
  return data;
};

export const getQuotationDoc = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/${vendorId}/${leadId}/design-quotation-documents`
  );
  return data; // This should return the API response payload
};

// ✅ API: send multiple files in one go
export const submitQuotation = async (
  files: File[], // <--- array now
  vendorId: number,
  leadId: number,
  userId: number,
  accountId: number
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file)); // must match multer field name
  formData.append("vendorId", vendorId.toString());
  formData.append("leadId", leadId.toString());
  formData.append("userId", userId.toString());
  formData.append("accountId", accountId.toString());

  const response = await apiClient.post(
    "/leads/designing-stage/upload-quotation",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data;
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

export interface SubmitDesignPayload {
  files: File[];
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
    formData.append("files", file);
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/design-meeting",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
};

export const getMeetings = async (
  vendorId: number,
  leadId: number
): Promise<GetMeetingsResponse> => {
  const { data } = await apiClient.get<GetMeetingsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/design-meetings`
  );
  return data;
};

export const submitDesigns = async (payload: SubmitDesignPayload) => {
  const formData = new FormData();

  formData.append("vendorId", payload.vendorId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("userId", payload.userId.toString());
  formData.append("accountId", payload.accountId.toString());

  // Append multiple files
  payload.files.forEach((file) => {
    formData.append("files", file); // MUST match multer field name
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/upload-designs",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

// ✅ NEW: Hook for Design Upload
export const useSubmitDesigns = () => {
  return useMutation<any, Error, SubmitDesignPayload>({
    mutationFn: submitDesigns,
  });
};

export interface SubmitSelectionPayload {
  desc: string;
  type: string;
  vendor_id: number;
  lead_id: number;
  user_id: number;
  account_id: number;
}

export const submitSelection = async (payload: SubmitSelectionPayload) => {
  const formData = new FormData();

  formData.append("desc", payload.desc);
  formData.append("type", payload.type);
  formData.append("vendor_id", String(payload.vendor_id));
  formData.append("lead_id", String(payload.lead_id));
  formData.append("created_by", String(payload.user_id));
  formData.append("account_id", String(payload.account_id));

  const response = await apiClient.post(
    "/leads/designing-stage/design-selection",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ✅ important
      },
    }
  );

  return response.data;
};

export const getDesignsDoc = async (
  vendorId: number,
  leadId: number
): Promise<GetDesignsResponse> => {
  const { data } = await apiClient.get<GetDesignsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/design-stage1-documents`
  );
  return data;
};

export const getSelectionData = async (
  vendorId: number,
  leadId: number
): Promise<DesignSelectionsResponse> => {
  const { data } = await apiClient.get<DesignSelectionsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/design-selections`
  );
  return data;
};

export interface EditSelectionPayload {
  type: string;
  desc: string;
  updated_by: number;
}

export const editSelection = async (
  selectionId: number,
  payload: EditSelectionPayload
) => {
  const formData = new FormData();
  formData.append("desc", payload.desc);
  formData.append("type", payload.type);
  formData.append("updated_by", String(payload.updated_by));
  const response = await apiClient.put(
    `/leads/designing-stage/design-selection/${selectionId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getDesigningStageCounts = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/${vendorId}/${leadId}/design-stage-counts`
  );
  return data.data;
};

export const getInitialSiteMeasurementTask = async (
  userId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/tasks/user/${userId}/lead/${leadId}/initial-site-measurement`
  );
  return data;
};

// ✅ API: Add more documents to an existing meeting
export interface AddMeetingDocsPayload {
  meetingId: number;
  leadId: number;
  vendorId: number;
  userId: number;
  accountId: number;
  files: File[];
}

export const addMeetingDocs = async (payload: AddMeetingDocsPayload) => {
  const formData = new FormData();
  formData.append("meetingId", payload.meetingId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("vendorId", payload.vendorId.toString());
  formData.append("userId", payload.userId.toString());
  formData.append("accountId", payload.accountId.toString());

  payload.files.forEach((file) => formData.append("files", file));

  const { data } = await apiClient.post(
    "/leads/designing-stage/add-meeting-docs",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return data;
};