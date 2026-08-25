import { apiClient } from "@/lib/apiClient";

export type MaterialSupplyType = "Frankvin" | "Client" | "Shared";

export interface LeadRequirementMaterialItem {
  id: number;
  lead_id: number;
  vendor_id: number;
  product_type_id: number;
  product_id: number;
  quantity: number | string;
  unit_id?: number | null;
  unit_name?: string | null;
  supplied_by: MaterialSupplyType;
  client_percentage: number;
  frankvin_percentage: number;
  client_quantity?: number | string | null;
  frankvin_quantity?: number | string | null;
  created_at: string;
  created_by: number;
  product?: {
    id: number;
    product_name: string;
    item_code?: string | null;
    unit_of_measure?: string | null;
  };
  productType?: {
    id: number;
    type: string;
  };
  unit?: {
    id: number;
    unit_name: string;
    short_name?: string | null;
  };
}

export interface CreateLeadRequirementMaterialPayload {
  lead_id: number;
  vendor_id: number;
  product_type_id: number;
  product_id?: number;
  product_ids?: number[];
  quantity?: number;
  unit_id?: number | null;
  unit_name?: string | null;
  supplied_by?: MaterialSupplyType;
  client_percentage?: number;
  frankvin_percentage?: number;
  created_by: number;
  materials?: Array<{
    quantity: number;
    unit_id?: number | null;
    unit_name?: string | null;
    supplied_by: MaterialSupplyType;
    client_percentage?: number;
    frankvin_percentage?: number;
  }>;
}

export const fetchLeadRequirementMaterialsApi = async (
  leadId: number,
  vendorId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/get-lead-requirement-materials/${leadId}?vendor_id=${vendorId}`,
  );
  return data;
};

export const createLeadRequirementMaterialApi = async (
  payload: CreateLeadRequirementMaterialPayload,
) => {
  const { data } = await apiClient.post(
    `/leads/create-lead-requirement-material`,
    payload,
  );
  return data;
};

export const updateLeadRequirementMaterialApi = async (
  id: number,
  payload: {
    vendor_id: number;
    quantity: number;
    unit_id?: number | null;
    unit_name?: string | null;
    supplied_by?: MaterialSupplyType;
    client_percentage?: number;
    frankvin_percentage?: number;
  }
) => {
  const { data } = await apiClient.put(
    `/leads/update-lead-requirement-material/${id}`,
    payload
  );
  return data;
};

export const deleteLeadRequirementMaterialApi = async (
  id: number,
  vendorId: number,
) => {
  const { data } = await apiClient.delete(
    `/leads/delete-lead-requirement-material/${id}?vendor_id=${vendorId}`,
  );
  return data;
};
