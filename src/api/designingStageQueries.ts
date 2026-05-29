import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  DesignSelectionsResponse,
  GetDesigningStageResponse,
  GetDesignsResponse,
  GetMeetingsResponse,
  MeetingTypeMaster,
} from "@/types/designing-stage-types";

// ✅ Define the response type (adjust fields once API shape is confirmed)
export interface DesigningStageLead {
  id: number;
  name: string;
  email?: string;
  contact?: string;
  status?: number;
  createdAt?: string;
  [key: string]: unknown; // fallback for unknown fields
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
  data?: unknown;
}

// ✅ API function
const moveToDesigningStage = async (
  payload: MoveToDesigningStagePayload,
): Promise<MoveToDesigningStageResponse> => {
  const { data } = await apiClient.post<MoveToDesigningStageResponse>(
    "/leads/designing-stage/update-status",
    payload,
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
  limit: number = 10,
): Promise<GetDesigningStageResponse> => {
  const { data } = await apiClient.get<GetDesigningStageResponse>(
    `/leads/designing-stage/get-all-leads/vendor/${vendorId}?userId=${userId}&page=${page}&limit=${limit}`,
  );
  return data;
};

export const getQuotationDoc = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/${vendorId}/${leadId}/design-quotation-documents`,
  );
  return data; // This should return the API response payload
};

// ✅ API: send multiple files in one go
export const submitQuotation = async (
  files: File[], // <--- array now
  vendorId: number,
  leadId: number,
  userId: number,
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file)); // must match multer field name
  formData.append("vendorId", vendorId.toString());
  formData.append("leadId", leadId.toString());
  formData.append("userId", userId.toString());

  const response = await apiClient.post(
    "/leads/designing-stage/upload-quotation",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
};

export interface SubmitMeetingPayload {
  files: File[];
  desc?: string;
  date: string;
  vendorId: number;
  leadId: number;
  userId: number;
  meeting_type_id?: number;
}

export interface SubmitDesignPayload {
  files: File[];
  vendorId: number;
  leadId: number;
  userId: number;
  productStructureInstanceIds?: number[];
}

export const submitMeeting = async (payload: SubmitMeetingPayload) => {
  const formData = new FormData();

  formData.append("leadId", payload.leadId.toString());
  formData.append("vendorId", payload.vendorId.toString());
  formData.append("userId", payload.userId.toString());
  formData.append("date", new Date(payload.date).toISOString()); // safer
  if (payload.desc != null) {
    formData.append("desc", payload.desc);
  }
  if (payload.meeting_type_id) {
    formData.append("meeting_type_id", payload.meeting_type_id.toString());
  }

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  payload.productStructureInstanceIds?.forEach((instanceId) => {
    formData.append("product_structure_instance_ids", String(instanceId));
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/design-meeting",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
};

export const getMeetings = async (
  vendorId: number,
  leadId: number,
): Promise<GetMeetingsResponse> => {
  const { data } = await apiClient.get<GetMeetingsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/design-meetings`,
  );
  return data;
};

export const getMeetingTypes = async (
  vendorId: number,
): Promise<MeetingTypeMaster[]> => {
  const { data } = await apiClient.get<{
    success: boolean;
    message: string;
    data: MeetingTypeMaster[];
  }>(`/leads/designing-stage/vendor/${vendorId}/meeting-types`);

  return data.data ?? [];
};

export const submitDesigns = async (payload: SubmitDesignPayload) => {
  const formData = new FormData();

  formData.append("vendorId", payload.vendorId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("userId", payload.userId.toString());

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/upload-designs",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
};

// ✅ NEW: Hook for Design Upload
export const useSubmitDesigns = () => {
  return useMutation<unknown, Error, SubmitDesignPayload>({
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
  product_structure_instance_id?: number | null;
}

export const submitSelection = async (payload: SubmitSelectionPayload) => {
  const formData = new FormData();

  formData.append("desc", payload.desc);
  formData.append("type", payload.type);
  formData.append("vendor_id", String(payload.vendor_id));
  formData.append("lead_id", String(payload.lead_id));
  formData.append("created_by", String(payload.user_id));
  formData.append("account_id", String(payload.account_id));
  if (payload.product_structure_instance_id) {
    formData.append(
      "product_structure_instance_id",
      String(payload.product_structure_instance_id),
    );
  }

  const response = await apiClient.post(
    "/leads/designing-stage/design-selection",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data", // ✅ important
      },
    },
  );

  return response.data;
};

export const getDesignsDoc = async (
  vendorId: number,
  leadId: number,
): Promise<GetDesignsResponse> => {
  const { data } = await apiClient.get<GetDesignsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/design-stage1-documents`,
  );
  return data;
};

export const getSelectionData = async (
  vendorId: number,
  leadId: number,
  productStructureInstanceId?: number,
): Promise<DesignSelectionsResponse> => {
  const params = new URLSearchParams();
  if (productStructureInstanceId) {
    params.set(
      "product_structure_instance_id",
      String(productStructureInstanceId),
    );
  }
  params.set("page", "1");
  params.set("limit", "1000");
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await apiClient.get<DesignSelectionsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/design-selections${query}`,
  );
  return data;
};

export interface EditSelectionPayload {
  type: string;
  desc: string;
  updated_by: number;
  product_structure_instance_id?: number | null;
}

export const editSelection = async (
  selectionId: number,
  payload: EditSelectionPayload,
) => {
  const formData = new FormData();
  formData.append("desc", payload.desc);
  formData.append("type", payload.type);
  formData.append("updated_by", String(payload.updated_by));
  if (typeof payload.product_structure_instance_id !== "undefined") {
    formData.append(
      "product_structure_instance_id",
      payload.product_structure_instance_id
        ? String(payload.product_structure_instance_id)
        : "",
    );
  }
  const response = await apiClient.put(
    `/leads/designing-stage/design-selection/${selectionId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

// ─── CHS Selection Type Mapping ──────────────────────────────────────────────

export interface CHSMappingItem {
  carcass_type_id?: number | null;
  shutter_type_id?: number | null;
  shutter_sub_type_id?: number | null;
  handle_type_id?: number | null;
}

export interface UpsertCHSMappingPayload {
  vendor_id: number;
  lead_id: number;
  selection_id: number;
  items: CHSMappingItem[];
  created_by: number;
}

export interface UpdateCHSMappingPayload {
  carcass_type_id?: number | null;
  shutter_type_id?: number | null;
  shutter_sub_type_id?: number | null;
  handle_type_id?: number | null;
  updated_by: number;
}

export const upsertCHSSelectionTypeMapping = async (
  payload: UpsertCHSMappingPayload,
) => {
  const { data } = await apiClient.post(
    "/leads/designing-stage/chs-selection-type-mapping",
    payload,
  );
  return data;
};

export const getCHSSelectionTypeMappings = async (
  vendorId: number,
  leadId: number,
  selectionId?: number,
) => {
  const params = new URLSearchParams();
  if (selectionId) params.set("selection_id", String(selectionId));
  const query = params.toString() ? `?${params.toString()}` : "";
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/chs-selection-type-mapping${query}`,
  );
  return data;
};

export const updateCHSSelectionTypeMapping = async (
  id: number,
  payload: UpdateCHSMappingPayload,
) => {
  const { data } = await apiClient.put(
    `/leads/designing-stage/chs-selection-type-mapping/${id}`,
    payload,
  );
  return data;
};

export interface CHSManufacturingDaysByInstance {
  instance_id: number | null;
  max_days: number | null;
}

export const getCHSManufacturingDaysByInstance = async (
  vendorId: number,
  leadId: number,
): Promise<{ data: CHSManufacturingDaysByInstance[] }> => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/chs-manufacturing-days-by-instance`,
  );
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────

export const getDesigningStageCounts = async (
  vendorId: number,
  leadId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/${vendorId}/${leadId}/design-stage-counts`,
  );
  return data.data;
};

export const getInitialSiteMeasurementTask = async (
  userId: number,
  leadId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/tasks/user/${userId}/lead/${leadId}/initial-site-measurement`,
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
    },
  );

  return data;
};

export const getLeadStatus = async (leadId: number, vendorId: number) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/status/leadId/${leadId}/vendorId/${vendorId}`,
  );
  return data?.data; // returns { lead_id, status_type_id, status, status_tag }
};


export const getLeadStatusNotification = async (
  leadId: number,
  vendorId: number,
  instanceId?: number,
) => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/statusfornotification/leadId/${leadId}/vendorId/${vendorId}`,
    {
      params: instanceId ? { instance_id: instanceId } : {},
    },
  );

  return data?.data;
};
export interface InstanceStageResponse {
  vendor_id: number;
  lead_id: number;
  instance_id: number;
  derived_stage: "tech-check-stage" | "order-login-stage" | "production-stage";
}

export const getInstanceStage = async (
  vendorId: number,
  leadId: number,
  instanceId: number,
): Promise<InstanceStageResponse> => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/instance/${instanceId}/stage`,
  );

  return data?.data;
};
