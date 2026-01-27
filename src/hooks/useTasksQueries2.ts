// types/vendorUserTask.ts

import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export type SortOrder = "asc" | "desc";

export interface VendorUserTaskFilterPayload {
  page: number;
  limit: number;

  created_at?: SortOrder;

  global_search?: string;

  lead_code?: string;
  lead_name?: string;
  phone?: string;

  task_type?: string[] | number[];

  due_date?: string;

  site_map_link?: boolean | null;

  site_type?: number[];

  product_type?: number[];

  product_structure?: number[];

  assign_by?: number | null;

  assign_to?: number | null;
}

// ----------------------------------------

export interface VendorUserTaskResponse {
  success: boolean;
  message: string;
  count: number;

  data: VendorUserTaskItem[];

  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ----------------------------------------

export interface VendorUserTaskItem {
  userLeadTask: {
    id: number;
    status: string;
    due_date: string;
    task_type: string;
    remark: string | null;

    closed_by: number | null;
    closed_at: string | null;

    created_by: number;
    created_by_name: string;

    assigned_to_name: string;

    created_at: string;
    updated_at: string | null;
  };

  leadMaster: {
    id: number;
    account_id: number;
    vendor_id: number;

    lead_code: string;

    site_map_link: string | null;

    name: string;
    phone_number: string;

    site_type: string;
    lead_status: string;

    product_type: string[];
    product_structure: string[];
  };
}

export const postVendorUserTasksFilter = async (
  vendorId: number,
  userId: number,
  payload: VendorUserTaskFilterPayload,
): Promise<VendorUserTaskResponse> => {
  const { data } = await apiClient.post(
    `/leads/tasks/vendorId/${vendorId}/userId/${userId}/tasks/filter`,
    payload,
  );

  return data;
};

export const useVendorUserTasks = (
  vendorId: number,
  userId: number,
  payload: VendorUserTaskFilterPayload,
) => {
  return useQuery<VendorUserTaskResponse>({
    queryKey: ["vendor-user-tasks", vendorId, userId, payload],

    queryFn: () => postVendorUserTasksFilter(vendorId, userId, payload),

    enabled: !!vendorId && !!userId,

    staleTime: 5 * 60 * 1000,

    refetchOnWindowFocus: false,
  });
};

// types/vendorAllTasks
export interface VendorAllTasksFilterPayload {
  page: number;
  limit: number;

  created_at?: SortOrder;

  global_search?: string;

  lead_code?: string;
  lead_name?: string;
  phone?: string;

  task_type?: string[] | number[];

  due_date?: string;

  site_map_link?: boolean | null;

  site_type?: number[];

  product_type?: number[];

  product_structure?: number[];

  assign_by?: number | null;

  assign_to?: number | null;
}

// --------------------------------------------

export interface VendorAllTasksResponse {
  success: boolean;
  message: string;
  count: number;

  data: VendorAllTaskItem[];

  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// --------------------------------------------

export interface VendorAllTaskItem {
  userLeadTask: {
    id: number;
    status: string;

    due_date: string;

    task_type: string;

    remark: string | null;

    closed_by: number | null;
    closed_at: string | null;

    created_by: number;
    created_by_name: string;

    assigned_to_name: string;

    created_at: string;
    updated_at: string | null;
  };

  leadMaster: {
    id: number;
    account_id: number;
    vendor_id: number;

    lead_code: string;

    site_map_link: string | null;

    name: string;

    phone_number: string;

    site_type: string;

    lead_status: string;

    product_type: string[];

    product_structure: string[];
  };
}

export const postVendorAllTasksFilter = async (
  vendorId: number,
  payload: VendorAllTasksFilterPayload,
): Promise<VendorAllTasksResponse> => {
  const { data } = await apiClient.post(
    `/leads/tasks/vendorId/${vendorId}/tasks/filter/all`,
    payload,
  );

  return data;
};

export const useVendorAllTasks = (
  vendorId: number,
  payload: VendorAllTasksFilterPayload,
) => {
  return useQuery<VendorAllTasksResponse>({
    queryKey: ["vendor-all-tasks", vendorId, payload],

    queryFn: () => postVendorAllTasksFilter(vendorId, payload),

    enabled: !!vendorId,

    staleTime: 5 * 60 * 1000,

    refetchOnWindowFocus: false,
  });
};
