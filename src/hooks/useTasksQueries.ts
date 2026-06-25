import { useMutation, useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ===============================
// TYPES
// ===============================

export type VendorUserTasksResponse = VendorUserTask[];
export type VendorAllTasksResponse = VendorUserTask[];
export type ActiveLeadTasksResponse = ActiveLeadTask[];

// -------------------------------
// TASK ITEM TYPE
// -------------------------------

export interface VendorUserTask {
  userLeadTask: {
    instance_id: any;
    id: number;
    status: string;
    due_date: string;
    remark: string;
    task_type: string;
    closed_by: number | null;
    closed_at: string | null;
    created_by: number;
    created_by_name?: string;
    assigned_to_name?: string | null;
    created_at: string;
    updated_by: number | null;
    updated_at: string;
    lead_code?: string;
  };

  leadMaster: {
    site_map_link: any;
    lead_code: any;
    id: number;
    name: string;
    account_id: number;
    phone_number: string;
    site_type: string | null;
    lead_status?: string | null;
    product_type: string[];
    product_structure: string[];
  };
}

// -------------------------------
// ACTIVE LEAD TASK TYPE
// -------------------------------

export interface ActiveLeadTask {
  task_type: string;
  lead_stage: string | null;
  due_date: string;
  remark: string | null;
  status: string;
  created_by: number;
  user?: {
    user_name: string;
  } | null;
  createdBy?: {
    user_name: string;
  } | null;
}

export interface ActOnSmallOrderRequestTaskPayload {
  action: "approve" | "reject";
  acted_by: number;
  remark?: string | null;
}

export interface ActOnFastProductionRequestTaskPayload {
  action: "approve" | "reject";
  acted_by: number;
  remark?: string | null;
}

// ===============================
// FILTER PAYLOAD TYPE
// ===============================

export interface TaskFilterPayload {
  page: number;
  limit: number;
  created_at: "asc" | "desc";
  franchise_id?: number;

  global_search?: string;

  lead_code?: string;
  lead_name?: string;
  phone?: string;

  task_type?: string[];

  due_date?: string;

  // ✅ NEW
  due_filter?: "today" | "upcoming" | "overdue" | "completed";

  // ✅ DATE RANGE - ADD THIS
  date_range?: {
    from: string;
    to: string;
  };

  assignat_range?: {
    from: string;
    to: string;
  };

  site_map_link?: boolean | null;

  site_type?: number[];
  product_type?: number[];
  product_structure?: number[];

  assign_by?: number | null;
  assign_to?: number[];
}

// ===============================
// API RESPONSE TYPE
// ===============================

export interface VendorUserTasksApiResponse {
  success: boolean;
  count: number;

  // ✅ NEW SUMMARY BLOCK
  summary: {
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };

  data: VendorUserTask[];

  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===============================
// MY TASK API
// ===============================

export const postVendorUserTasks = async (
  vendorId: number,
  userId: number,
  payload: TaskFilterPayload,
): Promise<VendorUserTasksApiResponse> => {
  const { data } = await apiClient.post(
    `/leads/tasks/vendorId/${vendorId}/userId/${userId}/tasks/filter`,
    payload,
  );

  return data;
};

// ===============================
// VENDOR ALL TASK API
// ===============================

export const postVendorAllTasksFilter = async (
  vendorId: number,
  payload: TaskFilterPayload,
): Promise<VendorUserTasksApiResponse> => {
  const response = await apiClient.post(
    `/leads/tasks/vendorId/${vendorId}/tasks/filter/all`,
    payload,
  );

  return response.data;
};

export const useVendorUserTasksFilter = (
  vendorId: number,
  userId: number,
  payload: TaskFilterPayload,
) => {
  return useQuery<VendorUserTasksApiResponse>({
    queryKey: [
      "vendorUserTasks",
      vendorId,
      payload.franchise_id,
      userId,
      payload.page,
      payload.limit,
      payload.created_at,
      payload.global_search,
      payload.lead_code,
      payload.lead_name,
      payload.phone,
      payload.task_type,
      payload.due_filter,
      payload.assignat_range, // ✅ ADD THIS
      payload.date_range, // ✅ ADD THIS
      payload.assign_by,
      payload.assign_to,
      payload.site_map_link,
      payload.site_type,
      payload.product_type,
      payload.product_structure,
    ],
    queryFn: () => postVendorUserTasks(vendorId, userId, payload),
    enabled: !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useVendorAllTasksFilter = (
  vendorId: number,
  payload: TaskFilterPayload,
) => {
  return useQuery<VendorUserTasksApiResponse>({
    queryKey: [
      "vendorAllTasks",
      vendorId,
      payload.franchise_id,
      payload.page,
      payload.limit,
      payload.created_at,
      payload.global_search,
      payload.lead_code,
      payload.lead_name,
      payload.phone,
      payload.task_type,
      payload.due_filter,
      payload.date_range, // ✅ ADD THIS
      payload.assignat_range, // ✅ ADD THIS
      payload.assign_by,
      payload.assign_to,
      payload.site_map_link,
      payload.site_type,
      payload.product_type,
      payload.product_structure,
    ],
    queryFn: () => postVendorAllTasksFilter(vendorId, payload),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
// active lead tasks api function and hooks
export const getActiveLeadTasks = async (
  vendorId: number,
  leadId: number,
  franchiseId?: number,
): Promise<ActiveLeadTasksResponse> => {
  const response = await apiClient.get(
    `/leads/tasks/vendorId/${vendorId}/leadId/${leadId}/active-tasks${
      franchiseId ? `?franchise_id=${franchiseId}` : ""
    }`,
  );
  return response.data.data;
};

export const useActiveLeadTasks = (
  vendorId: number,
  leadId: number,
  franchiseId?: number,
  enabled: boolean = true,
): UseQueryResult<ActiveLeadTasksResponse, Error> => {
  return useQuery({
    queryKey: ["activeLeadTasks", vendorId, leadId, franchiseId ?? null],
    queryFn: () => getActiveLeadTasks(vendorId, leadId, franchiseId),
    enabled: enabled && !!vendorId && !!leadId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const actOnSmallOrderRequestTask = async (
  leadId: number,
  taskId: number,
  payload: ActOnSmallOrderRequestTaskPayload,
) => {
  const { data } = await apiClient.patch(
    `/leads/tasks/leadId/${leadId}/taskId/${taskId}/small-order-request/action`,
    payload,
  );
  return data;
};

export const useActOnSmallOrderRequestTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: ActOnSmallOrderRequestTaskPayload;
    }) => actOnSmallOrderRequestTask(leadId, taskId, payload),
  });
};

export const actOnFastProductionRequestTask = async (
  leadId: number,
  taskId: number,
  payload: ActOnFastProductionRequestTaskPayload,
) => {
  const { data } = await apiClient.patch(
    `/leads/tasks/leadId/${leadId}/taskId/${taskId}/fast-production-request/action`,
    payload,
  );
  return data;
};

export const useActOnFastProductionRequestTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: ActOnFastProductionRequestTaskPayload;
    }) => actOnFastProductionRequestTask(leadId, taskId, payload),
  });
};
