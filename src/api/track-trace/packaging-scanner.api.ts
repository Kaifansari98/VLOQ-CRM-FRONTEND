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
  packing_type: "DEFAULT" | "GROUPWISE" | "CUSTOM_GROUP";
  is_multi_location: boolean;
  project_details_id: number | null;
  group_names: string[];
  locations: Array<{
    location_name: string;
  }>;
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
  sequence_no?: number | null;
  product_group_name?: string | null;
  packing_group_name?: string | null;
  product_set_no?: number | null;
  box_position?: number | null;
  boxes_per_product?: number | null;
  is_auto_created?: boolean;
  location_name?: string | null;
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

export type PackagingBoxStatus = "packed" | "unpacked";

interface PackagingBoxPrintResponse {
  success: boolean;
  message: string;
  data?: {
    print_html?: string;
  };
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

export const updatePackagingBoxStatus = async (
  boxId: number,
  status: PackagingBoxStatus,
  userId: number,
  reason?: string,
) => {
  const { data } = await apiClient.put<PackagingBox>(
    `/boxes/status/${status}/${boxId}`,
    {
      user_id: userId,
      reason,
    },
  );

  return data;
};

export const getPackagingBoxPrint = async (
  boxId: number,
  projectId: number,
  vendorId: number,
  locationName?: string | null,
) => {
  const { data } = await apiClient.get<PackagingBoxPrintResponse>(
    `/boxes/boxes/pdf/${boxId}/${projectId}/${vendorId}/web`,
    {
      params: locationName ? { location: locationName } : undefined,
    },
  );

  return data;
};

export interface ManualPackingItem {
  id: number;
  project_id: number;
  vendor_id: number;
  lead_id: number | null;
  item_name: string;
  description: string | null;
  material_details: string | null;
  qty: number;
  total_qty: number;
  packed_qty: number;
  pending_qty: number;
  packing_status: "Pending" | "Partially Packed" | "Packed";
  unique_code: string | null;
  unique_code_2: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  category_id: number | null;
  category_name: string | null;
  group_name: string | null;
  procurement: string | null;
  weight: number | null;
  use_in_assembled_packing?: boolean;
  include_in_packing?: boolean;
  scan_pack_validate?: boolean;
}

export interface ManualPackingSummary {
  total_items: number;
  total_qty: number;
  packed_qty: number;
  pending_qty: number;
}

export interface ManualPackingResponseData {
  project: {
    id: number;
    project_name: string;
    unique_project_id: string;
  };
  summary: ManualPackingSummary;
  items: ManualPackingItem[];
}

export interface ManualPackingApiResponse {
  success: boolean;
  message: string;
  data: ManualPackingResponseData;
}

export interface AddManualPackingItemPayload {
  project_id: number;
  vendor_id: number;
  box_id: number;
  cut_list_id: number;
  qty: number;
  user_id: number;
}

export interface AddManualPackingItemResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const getManualPackingItems = async (
  vendorId: number,
  projectId: number,
) => {
  const { data } = await apiClient.get<ManualPackingApiResponse>(
    "/track-trace/boxes/packing/manual-items",
    {
      params: {
        vendor_id: vendorId,
        project_id: projectId,
      },
    },
  );

  return data.data;
};

export const addManualPackingItem = async (
  payload: AddManualPackingItemPayload,
) => {
  const { data } = await apiClient.post<AddManualPackingItemResponse>(
    "/track-trace/boxes/packing/manual-items",
    payload,
  );

  return data;
};

