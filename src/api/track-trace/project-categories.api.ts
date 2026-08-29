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

export interface CategoryNamingStructureData {
  id?: number;
  delimiter?: string;
  fields_json?: string[];
}

export interface ProjectCategory {
  id: number;
  category_name: string;
  parent_id?: number | null;
  parent?: { id: number; category_name: string } | null;
  status: "Yes" | "No";
  created_at: string;
  projectCategoriesMasterVendorMapping: CategoryMapping[];
  include_in_packing?: boolean;
  scan_pack_validate?: boolean;
  use_in_assembled_packing?: boolean;
  prefix?: string | null;
  namingStructure?: CategoryNamingStructureData | null;
}

export interface CreateCategoryPayload {
  vendor_id: number;
  category_name: string;
  parent_id?: number | null;
  type_ids: number[];
  created_by: number;
  include_in_packing?: boolean;
  scan_pack_validate?: boolean;
  use_in_assembled_packing?: boolean;
  prefix?: string | null;
  naming_structure?: { delimiter: string; fields: string[] } | null;
  only_naming_structure_updated?: boolean;
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
  include_in_packing?: boolean;
  scan_pack_validate?: boolean;
  use_in_assembled_packing?: boolean;
  prefix?: string | null;
  naming_structure?: { delimiter: string; fields: string[] } | null;
  only_naming_structure_updated?: boolean;
}

export interface ProjectCategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ProjectCategoriesPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetProjectCategoriesResponse {
  categories: ProjectCategory[];
  pagination?: ProjectCategoriesPagination;
}

export const getProjectCategories = async (
  vendorId: number,
  filters?: ProjectCategoryFilters
) => {
  const params = new URLSearchParams();
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.search && filters.search.trim() !== "")
    params.append("search", filters.search.trim());
  if (filters?.status && filters.status !== "all")
    params.append("status", filters.status);
  if (filters?.type && filters.type !== "all")
    params.append("type", filters.type);
  if (filters?.sort_by) params.append("sort_by", filters.sort_by);
  if (filters?.sort_order) params.append("sort_order", filters.sort_order);

  const qs = params.toString();
  const url = `/track-trace/project-categories/${vendorId}${qs ? `?${qs}` : ""}`;
  const { data } = await apiClient.get(url);
  return data.data as GetProjectCategoriesResponse;
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