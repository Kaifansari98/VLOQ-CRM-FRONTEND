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
  designDocumentId?: number,
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file)); // must match multer field name
  formData.append("vendorId", vendorId.toString());
  formData.append("leadId", leadId.toString());
  formData.append("userId", userId.toString());
  if (designDocumentId != null) {
    formData.append("designDocumentId", designDocumentId.toString());
  }

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
  meeting_start_time?: string;
  meeting_end_time?: string;
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
  if (payload.meeting_start_time) {
    formData.append("meeting_start_time", payload.meeting_start_time);
  }
  if (payload.meeting_end_time) {
    formData.append("meeting_end_time", payload.meeting_end_time);
  }

  payload.files.forEach((file) => {
    formData.append("files", file);
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

export interface SubmitDesignPayload {
  files: File[];
  vendorId: number;
  leadId: number;
  userId: number;
  designType?: "2D" | "3D" | "2D + 3D";
  productStructureInstanceIds?: number[] | string[];
}

export const submitDesigns = async (payload: SubmitDesignPayload) => {
  const formData = new FormData();

  formData.append("vendorId", payload.vendorId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("userId", payload.userId.toString());
  if (payload.designType) {
    formData.append("design_type", payload.designType);
  }

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  payload.productStructureInstanceIds?.forEach((instanceId) => {
    formData.append("product_structure_instance_ids", String(instanceId));
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

export interface SubmitCostingFilePayload {
  files: File[];
  vendorId: number;
  leadId: number;
  userId: number;
  productStructureInstanceIds?: number[] | string[];
}

export const submitCostingFile = async (payload: SubmitCostingFilePayload) => {
  const formData = new FormData();

  formData.append("vendorId", payload.vendorId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("userId", payload.userId.toString());

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  payload.productStructureInstanceIds?.forEach((instanceId) => {
    formData.append("product_structure_instance_ids", String(instanceId));
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/upload-costing-file",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
};

export const getCostingFileDoc = async (
  vendorId: number,
  leadId: number,
): Promise<GetDesignsResponse> => {
  const { data } = await apiClient.get<GetDesignsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/costing-file-documents`,
  );
  return data;
};

export interface SubmitElectricalPlumbingPayload {
  files: File[];
  vendorId: number;
  leadId: number;
  userId: number;
  productStructureInstanceIds?: number[] | string[];
}

export const submitElectricalPlumbing = async (
  payload: SubmitElectricalPlumbingPayload,
) => {
  const formData = new FormData();

  formData.append("vendorId", payload.vendorId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("userId", payload.userId.toString());

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  payload.productStructureInstanceIds?.forEach((instanceId) => {
    formData.append("product_structure_instance_ids", String(instanceId));
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/upload-electrical-plumbing",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
};

export const getElectricalPlumbingDoc = async (
  vendorId: number,
  leadId: number,
): Promise<GetDesignsResponse> => {
  const { data } = await apiClient.get<GetDesignsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/electrical-plumbing-documents`,
  );
  return data;
};

export interface SubmitFinalIsmUploadPayload {
  files: File[];
  vendorId: number;
  leadId: number;
  userId: number;
  productStructureInstanceIds?: number[] | string[];
}

export const submitFinalIsmUpload = async (
  payload: SubmitFinalIsmUploadPayload,
) => {
  const formData = new FormData();

  formData.append("vendorId", payload.vendorId.toString());
  formData.append("leadId", payload.leadId.toString());
  formData.append("userId", payload.userId.toString());

  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  payload.productStructureInstanceIds?.forEach((instanceId) => {
    formData.append("product_structure_instance_ids", String(instanceId));
  });

  const { data } = await apiClient.post(
    "/leads/designing-stage/upload-final-ism",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
};

export const getFinalIsmUploadDoc = async (
  vendorId: number,
  leadId: number,
): Promise<GetDesignsResponse> => {
  const { data } = await apiClient.get<GetDesignsResponse>(
    `/leads/designing-stage/${vendorId}/${leadId}/final-ism-upload-documents`,
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

export interface LeadSpecificationEntry {
  id: number;
  vendor_id: number;
  lead_id: number;
  name: string;
  created_at: string;
  created_by: number;
}

export const getLeadSpecifications = async (
  vendorId: number,
  leadId: number,
): Promise<LeadSpecificationEntry[]> => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/specifications`,
  );

  return Array.isArray(data?.data) ? data.data : [];
};

export interface LeadCarcassMaterialMappingEntry {
  id: number;
  vendor_id: number;
  lead_id: number;
  carcass_type_id: number;
  carcas_material_id: number;
  carcass_material_finish_id: number;
  created_at: string;
  created_by: number;
  carcassType?: { id: number; name: string };
  carcasMaterial?: { id: number; name: string };
  carcassMaterialFinish?: { id: number; name: string };
}

export interface UpsertLeadCarcassMaterialMappingPayload {
  id?: number;
  vendor_id: number;
  lead_id: number;
  carcass_type_id: number;
  carcas_material_id: number;
  carcass_material_finish_id: number;
  created_by: number;
}

export const getLeadCarcassMaterialMappings = async (
  vendorId: number,
  leadId: number,
): Promise<LeadCarcassMaterialMappingEntry[]> => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/carcass-material-mappings`,
  );

  return Array.isArray(data?.data) ? data.data : [];
};

export const upsertLeadCarcassMaterialMapping = async (
  payload: UpsertLeadCarcassMaterialMappingPayload,
) => {
  const { data } = await apiClient.post(
    "/leads/designing-stage/carcass-material-mappings",
    payload,
  );
  return data?.data as LeadCarcassMaterialMappingEntry;
};

export interface LeadShutterMaterialMappingEntry {
  id: number;
  vendor_id: number;
  lead_id: number;
  shutter_type_id: number;
  shutter_material_id: number;
  shutter_material_finish_id: number;
  created_at: string;
  created_by: number;
  shutterType?: { id: number; name: string };
  shutterMaterial?: { id: number; name: string };
  shutterMaterialFinish?: { id: number; name: string };
}

export interface UpsertLeadShutterMaterialMappingPayload {
  id?: number;
  vendor_id: number;
  lead_id: number;
  shutter_type_id: number;
  shutter_material_id: number;
  shutter_material_finish_id: number;
  created_by: number;
}

export const getLeadShutterMaterialMappings = async (
  vendorId: number,
  leadId: number,
): Promise<LeadShutterMaterialMappingEntry[]> => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/shutter-material-mappings`,
  );

  return Array.isArray(data?.data) ? data.data : [];
};

export const upsertLeadShutterMaterialMapping = async (
  payload: UpsertLeadShutterMaterialMappingPayload,
) => {
  const { data } = await apiClient.post(
    "/leads/designing-stage/shutter-material-mappings",
    payload,
  );
  return data?.data as LeadShutterMaterialMappingEntry;
};

export interface LeadHardwareMappingEntry {
  id: number;
  vendor_id: number;
  lead_id: number;
  carcass_legs_id: number;
  skirting_carcass_legs_id: number;
  skirting_carcass_legs_color_id: number | null;
  note: string | null;
  created_at: string;
  created_by: number;
  carcassLegs?: { id: number; name: string };
  skirtingCarcassLegs?: { id: number; name: string; inScope: boolean };
  skirtingCarcassLegsColor?: { id: number; color: string } | null;
}

export interface UpsertLeadHardwareMappingPayload {
  id?: number;
  vendor_id: number;
  lead_id: number;
  carcass_legs_id: number;
  skirting_carcass_legs_id: number;
  skirting_carcass_legs_color_id?: number | null;
  note?: string | null;
  created_by: number;
}

export const getLeadHardwareMappings = async (
  vendorId: number,
  leadId: number,
): Promise<LeadHardwareMappingEntry[]> => {
  const { data } = await apiClient.get(
    `/leads/designing-stage/vendor/${vendorId}/lead/${leadId}/hardware-mappings`,
  );

  return Array.isArray(data?.data) ? data.data : [];
};

export const upsertLeadHardwareMapping = async (
  payload: UpsertLeadHardwareMappingPayload,
) => {
  const { data } = await apiClient.post(
    "/leads/designing-stage/hardware-mappings",
    payload,
  );
  return data?.data as LeadHardwareMappingEntry;
};
