import { apiClient } from "@/lib/apiClient";

export type BoxInfoFieldType = "TEXT" | "NUMBER" | "DATE" | "TEXTAREA";

export interface PackagingBoxInfoField {
  id: number;
  field_label: string;
  field_key: string;
  field_type: BoxInfoFieldType;
  is_required: boolean;
  sort_order: number;
}

export interface PackagingProjectContext {
  id: number;
  unique_project_id: string;
  project_name: string;
  project_status: string;
  track_trace_status: string;
  order_no: string | null;
  client_name: string | null;
  lead_id: number | null;
  packing_type: "DEFAULT" | "GROUPWISE";
  project_details_id: number | null;
  group_names: string[];
  box_info_fields: PackagingBoxInfoField[];
}

export interface PackagingBox {
  id: number;
  box_name: string;
  box_status: "packed" | "unpacked";
  project_id: number;
  vendor_id: number;
  project_details_id: number;
  lead_id: number | null;
  items_count?: number;
  weight?: number;
}

export interface CreatePackagingBoxPayload {
  project_id: number;
  project_details_id: number;
  vendor_id: number;
  lead_id: number | null;
  box_name: string;
  box_status: "unpacked";
  created_by: number;
  box_info_values: Array<{
    field_id: number;
    field_value: string | null;
  }>;
}

interface PackagingProjectContextResponse {
  success: boolean;
  message: string;
  data: PackagingProjectContext;
}

interface CreatePackagingBoxResponse {
  message: string;
  box: PackagingBox;
}

export const getPackagingProjectContext = async (
  vendorId: number,
  projectId: number,
) => {
  const { data } = await apiClient.get<PackagingProjectContextResponse>(
    `/track-trace-project/onboard/${vendorId}/packaging-project/${projectId}`,
  );

  return data.data;
};

export const getPackagingBoxes = async (
  vendorId: number,
  projectId: number,
) => {
  const { data } = await apiClient.get<PackagingBox[]>(
    `/boxes/vendor/${vendorId}/project/${projectId}`,
  );

  return data;
};

export const createPackagingBox = async (
  payload: CreatePackagingBoxPayload,
) => {
  const { data } = await apiClient.post<CreatePackagingBoxResponse>(
    "/boxes",
    payload,
  );

  return data.box;
};
