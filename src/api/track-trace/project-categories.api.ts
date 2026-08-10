// project-categories.api.ts
import { apiClient } from "@/lib/apiClient";

export interface CategoryType {
  id: number;
  module_name: string;
}

export interface CategoryMapping {
  id: number;
  project_categories_type_master_id: number;
  projectCategoriesTypeMaster: CategoryType;
}

export interface ProjectCategory {
  id: number;
  category_name: string;
  parent_id?: number | null;
  parent?: { id: number; category_name: string } | null;
  status: "Yes" | "No";
  created_at: string;
  projectCategoriesMasterVendorMapping: CategoryMapping[];
}

export interface CreateCategoryPayload {
  vendor_id: number;
  category_name: string;
  parent_id?: number | null;
  type_ids: number[];
  created_by: number;
}

export interface UpdateCategoryPayload {
  id: number;
  vendor_id: number;
  category_name: string;
  parent_id?: number | null;
  status: "Yes" | "No";
  type_ids: number[];
  created_by: number;
  updated_by: number;
}

export const getProjectCategories = async (vendorId: number) => {
  const { data } = await apiClient.get(`/track-trace/project-categories/${vendorId}`);
  return data.data.categories as ProjectCategory[];
};

export const getProjectCategoryTypes = async () => {
  const { data } = await apiClient.get(`/track-trace/project-categories/types`);
  return data.data.types as CategoryType[];
};

export const createProjectCategory = async (payload: CreateCategoryPayload) => {
  const { data } = await apiClient.post(`/track-trace/project-categories`, payload);
  return data;
};

export const updateProjectCategory = async (payload: UpdateCategoryPayload) => {
  const { data } = await apiClient.put(`/track-trace/project-categories/${payload.id}`, payload);
  return data;
};

export const toggleProjectCategoryStatus = async (id: number, status: "Yes" | "No") => {
  const { data } = await apiClient.patch(`/track-trace/project-categories/${id}/status`, { status });
  return data;
};

export const checkExternalToken = async (vendorId: number) => {
  const res = await apiClient.get(`/track-trace/category/project-categories/check-token?vendor_id=${vendorId}`);
  return res.data.data as { has_token: boolean; token: { name: string; email: string; created_at: string } | null };
};
 
export const syncCategoriesFromExternal = async (vendorId: number) => {
  const res = await apiClient.post(`/track-trace/category/project-categories/sync`, { vendor_id: vendorId });
  return res.data.data as { total: number; created: number; updated: number; skipped: number };
};