import { apiClient } from "@/lib/apiClient";

export interface BrandMaster {
  id: number;
  vendor_id: number;
  brand_name: string;
  brand_short_name: string | null;
  logo: string | null;
  is_active: boolean;
  active: "Yes" | "No";
  created_at: string;
  updated_at: string;
}

export interface CreateBrandPayload {
  vendor_id: number;
  brand_name: string;
  brand_short_name?: string | null;
  logo?: string | null;
  created_by?: number | null;
}

export interface UpdateBrandPayload {
  id: number;
  vendor_id: number;
  brand_name: string;
  brand_short_name?: string | null;
  logo?: string | null;
  is_active?: boolean;
  updated_by?: number | null;
}

export const getBrandMasters = async (vendorId: number) => {
  const { data } = await apiClient.get(`/track-trace/brands/${vendorId}`);
  return data.data.brands as BrandMaster[];
};

export const createBrandMaster = async (payload: CreateBrandPayload) => {
  const { data } = await apiClient.post(`/track-trace/brands`, payload);
  return data;
};

export const updateBrandMaster = async (payload: UpdateBrandPayload) => {
  const { data } = await apiClient.put(`/track-trace/brands/${payload.id}`, payload);
  return data;
};

export const toggleBrandMasterStatus = async (id: number, is_active: boolean) => {
  const { data } = await apiClient.patch(`/track-trace/brands/${id}/status`, { is_active });
  return data;
};

export const deleteBrandMaster = async (id: number, vendorId: number) => {
  const { data } = await apiClient.delete(`/track-trace/brands/${id}`, { data: { vendor_id: vendorId } });
  return data;
};
