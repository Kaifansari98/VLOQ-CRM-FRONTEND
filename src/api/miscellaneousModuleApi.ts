import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface MiscellaneousStatusCounts {
  awaiting_approval: number;
  misc_approved: number;
  under_process: number;
  rtd: number;
  dispatch_scheduled: number;
  dispatched: number;
  resolved: number;
  rejected: number;
  total: number;
}

export interface MiscellaneousStatusCountsResponse {
  success: boolean;
  data: MiscellaneousStatusCounts;
}

export interface MiscellaneousItem {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  lead?: {
    id: number;
    lead_code: string;
    firstname: string;
    lastname: string;
    contact_no: string;
    site_address?: string;
    franchise_id?: number;
    franchise?: {
      id: number;
      franchise_name: string;
      franchise_code?: string;
    };
    assignedTo?: {
      id: number;
      user_name: string;
    };
  };
  type: {
    id: number;
    name: string;
  };
  problem_description: string;
  reorder_material_details: string;
  quantity: number | null;
  cost: number | null;
  supervisor_remark: string | null;
  expected_ready_date: string | null;
  solution: string | null;
  required_delivery_date: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  misc_approved: boolean | null;
  exp_of_rejection: string | null;
  status_label: string;
  status_slug?: string;
  created_by: number;
  created_at: string;
  created_user?: {
    id: number;
    user_name: string;
  };
  teams: {
    team_id: number;
    team_name: string;
  }[];
  documents: {
    document_id: number;
    original_name: string;
    file_key: string;
    doc_type_tag: string | null;
    doc_type_name: string | null;
    signed_url: string | null;
    uploaded_at: string;
  }[];
  task?: any;
  delivery_task?: any;
}

export interface MiscellaneousByStatusPayload {
  status: string;
  franchise_id?: number;
  user_type?: string;
  user_id?: number;
  page: number;
  limit: number;
  global_search?: string;
  filter_lead_code?: string;
  date_range?: { from: string; to: string };
}

export interface MiscellaneousByStatusResponse {
  success: boolean;
  status: string;
  count: number;
  miscellaneous: MiscellaneousItem[];
  data?: MiscellaneousItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getMiscellaneousStatusCounts = async (
  vendorId: number,
  franchiseId?: number,
  userType?: string,
  userId?: number,
): Promise<MiscellaneousStatusCountsResponse> => {
  const { data } = await apiClient.get(
    `/miscellaneous-master/vendor/${vendorId}/status-counts`,
    {
      params: {
        ...(franchiseId ? { franchise_id: franchiseId } : {}),
        ...(userType ? { user_type: userType } : {}),
        ...(userId ? { user_id: userId } : {}),
      },
    },
  );
  return data;
};

export const useMiscellaneousStatusCounts = (
  vendorId?: number,
  franchiseId?: number,
  userType?: string,
  userId?: number,
) => {
  return useQuery<MiscellaneousStatusCountsResponse>({
    queryKey: ["miscellaneousStatusCounts", vendorId, franchiseId, userType, userId],
    queryFn: () => getMiscellaneousStatusCounts(vendorId!, franchiseId, userType, userId),
    enabled: !!vendorId,
    refetchInterval: 20000,
  });
};

export const getMiscellaneousByStatus = async (
  vendorId: number,
  payload: MiscellaneousByStatusPayload,
): Promise<MiscellaneousByStatusResponse> => {
  const { data } = await apiClient.post(
    `/miscellaneous-master/vendor/${vendorId}/status-leads`,
    payload,
  );
  return data;
};

export const useMiscellaneousByStatus = (
  vendorId?: number,
  payload?: MiscellaneousByStatusPayload,
) => {
  return useQuery<MiscellaneousByStatusResponse>({
    queryKey: [
      "miscellaneousByStatus",
      vendorId,
      payload?.status,
      payload?.franchise_id,
      payload?.user_type,
      payload?.page,
      payload?.limit,
      payload?.global_search,
    ],
    queryFn: () => getMiscellaneousByStatus(vendorId!, payload!),
    enabled: !!vendorId && !!payload?.status,
  });
};
