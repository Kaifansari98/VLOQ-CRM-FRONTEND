import { apiClient } from "@/lib/apiClient";

export interface SimpleMasterItem {
  id: number;
  grade_name?: string;
  finish_name?: string;
  type_name?: string;
  is_active: boolean;
  vendor_id: number;
  created_at: string;
  updated_at: string;
}

export interface GradeMaster extends SimpleMasterItem { grade_name: string; }
export interface FinishMaster extends SimpleMasterItem { finish_name: string; }
export interface TypeMaster extends SimpleMasterItem { type_name: string; }

// ─── Grade ────────────────────────────────────────────────────────────────────
export const getGrades = async (vendor_id: number) => {
  const { data } = await apiClient.get(`/track-trace/grades/${vendor_id}`);
  return (data.data?.grades ?? []) as GradeMaster[];
};
export const createGrade = async (payload: { vendor_id: number; grade_name: string; created_by?: number }) => {
  const { data } = await apiClient.post(`/track-trace/grades`, payload);
  return data;
};
export const updateGrade = async (id: number, payload: { grade_name: string; updated_by?: number }) => {
  const { data } = await apiClient.put(`/track-trace/grades/${id}`, payload);
  return data;
};
export const toggleGradeStatus = async (id: number, is_active: boolean) => {
  const { data } = await apiClient.patch(`/track-trace/grades/${id}/status`, { is_active });
  return data;
};
export const deleteGrade = async (id: number) => {
  const { data } = await apiClient.delete(`/track-trace/grades/${id}`);
  return data;
};

// ─── Finish ───────────────────────────────────────────────────────────────────
export const getFinishes = async (vendor_id: number) => {
  const { data } = await apiClient.get(`/track-trace/finishes/${vendor_id}`);
  return (data.data?.finishes ?? []) as FinishMaster[];
};
export const createFinish = async (payload: { vendor_id: number; finish_name: string; created_by?: number }) => {
  const { data } = await apiClient.post(`/track-trace/finishes`, payload);
  return data;
};
export const updateFinish = async (id: number, payload: { finish_name: string; updated_by?: number }) => {
  const { data } = await apiClient.put(`/track-trace/finishes/${id}`, payload);
  return data;
};
export const toggleFinishStatus = async (id: number, is_active: boolean) => {
  const { data } = await apiClient.patch(`/track-trace/finishes/${id}/status`, { is_active });
  return data;
};
export const deleteFinish = async (id: number) => {
  const { data } = await apiClient.delete(`/track-trace/finishes/${id}`);
  return data;
};

// ─── Type ─────────────────────────────────────────────────────────────────────
export const getTypes = async (vendor_id: number) => {
  const { data } = await apiClient.get(`/track-trace/types/${vendor_id}`);
  return (data.data?.types ?? []) as TypeMaster[];
};
export const createType = async (payload: { vendor_id: number; type_name: string; created_by?: number }) => {
  const { data } = await apiClient.post(`/track-trace/types`, payload);
  return data;
};
export const updateType = async (id: number, payload: { type_name: string; updated_by?: number }) => {
  const { data } = await apiClient.put(`/track-trace/types/${id}`, payload);
  return data;
};
export const toggleTypeStatus = async (id: number, is_active: boolean) => {
  const { data } = await apiClient.patch(`/track-trace/types/${id}/status`, { is_active });
  return data;
};
export const deleteType = async (id: number) => {
  const { data } = await apiClient.delete(`/track-trace/types/${id}`);
  return data;
};

// ─── Core Product ─────────────────────────────────────────────────────────────
export interface CoreProductMaster extends SimpleMasterItem { core_product_name: string; }

export const getCoreProducts = async (vendor_id: number) => {
  const { data } = await apiClient.get(`/track-trace/core-products/${vendor_id}`);
  return (data.data?.coreProducts ?? []) as CoreProductMaster[];
};
export const createCoreProduct = async (payload: { vendor_id: number; core_product_name: string; created_by?: number }) => {
  const { data } = await apiClient.post(`/track-trace/core-products`, payload);
  return data;
};
export const updateCoreProduct = async (id: number, payload: { core_product_name: string; updated_by?: number }) => {
  const { data } = await apiClient.put(`/track-trace/core-products/${id}`, payload);
  return data;
};
export const toggleCoreProductStatus = async (id: number, is_active: boolean) => {
  const { data } = await apiClient.patch(`/track-trace/core-products/${id}/status`, { is_active });
  return data;
};
export const deleteCoreProduct = async (id: number) => {
  const { data } = await apiClient.delete(`/track-trace/core-products/${id}`);
  return data;
};

