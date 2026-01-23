import { apiClient } from "@/lib/apiClient";
import { Lead } from "./leads";
import { useQuery } from "@tanstack/react-query";

export interface UpdateActivityStatusPayload {
  vendorId: number;
  accountId: number;
  userId: number;
  status: string;
  remark: string;
  createdBy: number;
  dueDate?: string;
}

export interface RevertActivityStatusPayload {
  vendorId: number;
  accountId: number;
  userId: number;
  remark: string;
  createdBy: number;
}

export interface ApiActivityStatusCounts {
  totalOnGoing: number;
  openOnGoing: number;
  onHold: number;
  lostApproval: number;
  lost: number;
}

export interface UiActivityStatusCounts {
  total: number; // maps totalOnGoing
  open: number; // maps openOnGoing
  onHold: number;
  lostApproval: number;
  lost: number;
}

export const updateLeadActivityStatus = async (
  leadId: number,
  payload: UpdateActivityStatusPayload,
) => {
  const response = await apiClient.post(
    `/leads/lead-activity-status/leadId/${leadId}/activity-status`,
    payload,
  );
  return response.data;
};

export const getOnHoldLeads = async (vendorId: number): Promise<Lead[]> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/onHold`,
  );
  return res.data.data;
};

export const getLostApprovalLeads = async (
  vendorId: number,
): Promise<Lead[]> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/lostApproval`,
  );
  return res.data.data;
};

export const getLostLeads = async (vendorId: number): Promise<Lead[]> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/lost`,
  );
  return res.data.data;
};

export const revertLeadToOnGoing = async (
  leadId: number,
  payload: RevertActivityStatusPayload,
) => {
  const res = await apiClient.post(
    `/leads/lead-activity-status/leadId/${leadId}/activity-status/revert`,
    payload,
  );
  return res.data;
};

export const getActivityStatusCounts = async (
  vendorId: number,
): Promise<UiActivityStatusCounts> => {
  const res = await apiClient.get(
    `/leads/lead-activity-status/vendorId/${vendorId}/activity-status-counts`,
  );
  const data: ApiActivityStatusCounts = res.data.data;

  return {
    total: data.totalOnGoing || 0,
    open: data.openOnGoing || 0,
    onHold: data.onHold || 0,
    lostApproval: data.lostApproval || 0,
    lost: data.lost || 0,
  };
};

// -------------------------
// Reuse existing types from universalStage
// -------------------------

export interface ProductType {
  id: number;
  type: string;
  tag: string;
}

export interface ProductMapping {
  productType: ProductType;
}

export interface ProductStructure {
  id: number;
  type: string;
}

export interface ProductStructureMapping {
  productStructure: ProductStructure;
}

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

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type SortOrder = "asc" | "desc";

// -------------------------
// Lead Activity Status Lead Model
// -------------------------
export interface ActivityStatusLead {
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

  // Relationships
  account: AccountInfo | null;
  siteType: SiteTypeInfo | null;
  source: SourceInfo | null;
  assignedTo: AssignedUser | null;
  assignedBy: AssignedUser | null;
  createdBy: AssignedUser | null;

  productMappings: ProductMapping[];
  leadProductStructureMapping: ProductStructureMapping[];
}

// -------------------------
// API Response
// -------------------------
export interface ActivityStatusLeadResponse {
  success: boolean;
  message: string;
  count: number;
  data: ActivityStatusLead[];
  pagination: Pagination;
}

// -------------------------
// POST Payload for Filters
// -------------------------
export interface ActivityStatusFilterPayload {
  page: number;
  limit: number;

  // Search filters
  global_search?: string;
  filter_lead_code?: string;
  filter_name?: string;
  contact?: string;
  site_address?: string;

  // Array filters
  furniture_type?: number[];
  furniture_structure?: number[];
  site_type?: number[];
  source?: number[];
  assign_to?: number[]; // Array of numbers
  status?: string[]; // ✅ NEW: Array of status strings

  // Boolean filter
  site_map_link?: boolean | null;

  // ✅ NEW: Date Range Filter
  date_range?: {
    from: string; // Format: "YYYY-MM-DD" or ISO string
    to: string; // Format: "YYYY-MM-DD" or ISO string
  };

  // Sort order
  created_at?: SortOrder;
}

// ============================================
// OnHold Leads API Functions & Hook
// ============================================

export const postOnHoldLeadsFilter = async (
  vendorId: number,
  payload: ActivityStatusFilterPayload,
): Promise<ActivityStatusLeadResponse> => {
  const { data } = await apiClient.post(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/onHold/filter`,
    payload,
  );

  console.log("On Hold Leads Filter API Response: ", payload);
  return data;
};

export const useOnHoldLeadsFilter = (
  vendorId: number,
  payload: ActivityStatusFilterPayload,
) => {
  return useQuery<ActivityStatusLeadResponse>({
    queryKey: ["onHoldLeads", vendorId, payload],
    queryFn: () => postOnHoldLeadsFilter(vendorId, payload),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ============================================
// Lost Leads API Functions & Hook
// ============================================

export const postLostLeadsFilter = async (
  vendorId: number,
  payload: ActivityStatusFilterPayload,
): Promise<ActivityStatusLeadResponse> => {
  const { data } = await apiClient.post(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/lost/filter`,
    payload,
  );
  return data;
};

export const useLostLeadsFilter = (
  vendorId: number,
  payload: ActivityStatusFilterPayload,
) => {
  return useQuery<ActivityStatusLeadResponse>({
    queryKey: ["lostLeads", vendorId, payload],
    queryFn: () => postLostLeadsFilter(vendorId, payload),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ============================================
// Lost Approval Leads API Functions & Hook
// ============================================

export const postLostApprovalLeadsFilter = async (
  vendorId: number,
  payload: ActivityStatusFilterPayload,
): Promise<ActivityStatusLeadResponse> => {
  const { data } = await apiClient.post(
    `/leads/lead-activity-status/vendor/${vendorId}/leads/lostApproval/filter`,
    payload,
  );
  return data;
};

export const useLostApprovalLeadsFilter = (
  vendorId: number,
  payload: ActivityStatusFilterPayload,
) => {
  return useQuery<ActivityStatusLeadResponse>({
    queryKey: ["lostApprovalLeads", vendorId, payload],
    queryFn: () => postLostApprovalLeadsFilter(vendorId, payload),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
