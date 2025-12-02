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
  limit: number
) => {
  const { data } = await apiClient.get(
    `/leads/bookingStage/universal-table-data/vendorId/${vendorId}`,
    {
      params: { userId, tag, page, limit },
    }
  );

  return data;
};

export const useUniversalStageLeads = (
  vendorId: number,
  userId: number,
  tag: string,
  page: number,
  pageSize: number
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
