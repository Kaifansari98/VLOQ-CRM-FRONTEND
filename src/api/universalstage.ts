import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

// -------------------------
// Product Types
// -------------------------
export interface ProductType {
  id: number;
  type: string;
  tag: string;
}

export interface ProductMapping {
  productType: ProductType;
}

export type SortOrder = "asc" | "desc";

// -------------------------
// Product Structure
// -------------------------
export interface ProductStructure {
  id: number;
  type: string;
}

export interface ProductStructureMapping {
  productStructure: ProductStructure;
}

export interface ProductStructureInstance {
  id: number;
  title: string;
  quantity_index: number;
  product_structure_id: number;
  is_tech_check_completed?: boolean | null;
  tech_check_completed_at?: string | null;
  is_order_login_completed?: boolean | null;
  order_login_completed_at?: string | null;
  productStructure?: ProductStructure | null;
}

// -------------------------
// Needed Child Objects
// -------------------------
export interface AccountInfo {
  id: number;
  name: string;
}

export interface SiteTypeInfo {
  id: number;
  type: string;
  vendor_id: number;
}

export interface SourceInfo {
  id: number;
  type: string;
  vendor_id: number;
}

export interface AssignedUser {
  id: number;
  user_name: string;
}

export interface pagination {
  currentPage: number;
  totalPages: number;
  totalRecoards: number;
  hasNext: boolean;
  hasPrev: boolean;
}
// -------------------------
// MAIN LEAD MODEL (Your required fields only)
// -------------------------
export interface UniversalStageLead {
  id: number;
  lead_code: string;

  firstname: string;
  lastname: string;

  contact_no: string;
  alt_contact_no: string | null;

  email: string | null;

  site_address: string;
  site_map_link: string | null;

  archetech_name: string | null;

  designer_remark: string | null;

  created_at: string;
  account_id: number;

  assign_to: number | null;

  // --- Relationships ---
  account: AccountInfo | null;
  siteType: SiteTypeInfo | null;
  source: SourceInfo | null;

  assignedTo?: AssignedUser | null;

  productMappings: ProductMapping[];
  leadProductStructureMapping: ProductStructureMapping[];
  productStructureInstances?: ProductStructureInstance[];
}

// -------------------------
// API RESPONSE
// -------------------------
export interface UniversalStageLeadResponse {
  success: boolean;
  message: string;
  count: number;
  data: UniversalStageLead[];
  pagination: pagination;
}

export const getUniversalStageLeads = async (
  vendorId: number,
  userId: number,
  tag: string,
  page: number,
  limit: number,
) => {
  const { data } = await apiClient.get(
    `/leads/bookingStage/universal-table-data/vendorId/${vendorId}`,
    {
      params: { userId, tag, page, limit },
    },
  );

  return data;
};

export const useUniversalStageLeads = (
  vendorId: number,
  userId: number,
  tag: string,
  page: number,
  pageSize: number,
) => {
  return useQuery<UniversalStageLeadResponse>({
    queryKey: ["universal-stage-leads", vendorId, userId, tag, page, pageSize],
    queryFn: () =>
      getUniversalStageLeads(vendorId, userId, tag, page, pageSize),
    enabled: !!vendorId && !!userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

export interface UniversalStagePostPayload {
  userId: number;
  tag?: string;
  page: number;
  limit: number;

  filter_name: string;
  filter_lead_code: string;
  contact: string;
  alt_contact_no: string;
  email: string;
  site_address: string;
  archetech_name: string;
  designer_remark: string;

  furniture_type: number[];
  furniture_structure: number[];
  site_type: number[];
  source: number[];
  stagetag?: string[];
  assign_to: number[];
  site_map_link: boolean | null;

  created_at: SortOrder;
}

export const postUniversalStageLeads = async (
  vendorId: number,
  payload: UniversalStagePostPayload,
): Promise<UniversalStageLeadResponse> => {
  const { data } = await apiClient.post(
    `/leads/bookingStage/universal-table-data-2/vendorId/${vendorId}`,
    payload,
  );

  return data;
};

export const getUnderInstallationLeadsWithMiscellaneous = async (
  vendorId: number,
  payload: UniversalStagePostPayload,
): Promise<UniversalStageLeadResponse> => {
  const { data } = await apiClient.post<UniversalStageLeadResponse>(
    `/leads/installation/under-installation/vendorId/${vendorId}/get-all-leads-which-includes-any-miscellaneous-item`,
    payload,
  );

  return data;
};

// hooks/useUnderInstallationLeadsWithMiscellaneous
export const useUnderInstallationLeadsWithMiscellaneous = (
  vendorId: number,
  payload: UniversalStagePostPayload,
) => {
  return useQuery<UniversalStageLeadResponse>({
    queryKey: ["under-installation-misc-leads", vendorId, payload],
    queryFn: () =>
      getUnderInstallationLeadsWithMiscellaneous(vendorId, payload),
    enabled: !!vendorId && !!payload?.userId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

// hooks/useUniversalStageLeadsPost.ts
export const useUniversalStageLeadsPost = (
  vendorId: number,
  payload: UniversalStagePostPayload,
) => {
  return useQuery<UniversalStageLeadResponse>({
    queryKey: ["universal-stage-leads", vendorId, payload],
    queryFn: () => postUniversalStageLeads(vendorId, payload),

    enabled: !!vendorId && !!payload?.userId,

    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// hooks/postVendorLeadsByTag.ts
export interface VendorLeadsByTagPostPayload {
  userId?: number | null; // optional (for exclusion logic)
  tag: string;

  page: number;
  limit: number;

  global_search?: string;

  filter_lead_code?: string;
  filter_name?: string;
  contact?: string;

  alt_contact_no?: string;
  email?: string;
  site_address?: string;
  archetech_name?: string;
  designer_remark?: string;

  furniture_type?: number[];
  furniture_structure?: number[];
  site_type?: number[];
  source?: number[];
  stagetag?: string[];
  assign_to?: number[];
  site_map_link?: boolean | null;

  created_at?: SortOrder;
  date_range?: {
    from: string;
    to: string;
  };
}

export const postVendorLeadsByTag = async (
  vendorId: number,
  payload: VendorLeadsByTagPostPayload,
): Promise<UniversalStageLeadResponse> => {
  const { data } = await apiClient.post(
    `/leads/bookingStage/vendorId/${vendorId}/vendor-leads-by-tag/all-leads`,
    payload,
  );

  return data;
};

export const useVendorLeadsByTagPost = (
  vendorId: number,
  payload: VendorLeadsByTagPostPayload,
) => {
  return useQuery<UniversalStageLeadResponse>({
    queryKey: ["vendorOverallLeads", vendorId, payload],

    queryFn: () => postVendorLeadsByTag(vendorId, payload),

    enabled: !!vendorId && !!payload?.tag,

    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
