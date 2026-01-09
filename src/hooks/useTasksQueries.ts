// hooks/useTasksQueries.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type VendorUserTasksResponse = VendorUserTask[];
export type VendorAllTasksResponse = VendorUserTask[];
export type ActiveLeadTasksResponse = ActiveLeadTask[];

export interface VendorUserTask {
  userLeadTask: {
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
    lead_code: string;
  };
  leadMaster: {
    site_map_link: any;
    lead_code: any;
    id: number;
    name: string;
    account_id: number;
    phone_number: string;
    site_type: string | null;
    product_type: string[];
    product_structure: string[];
  };
}

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

export const getVendorUserTasks = async (
  vendorId: number,
  userId: number
): Promise<VendorUserTasksResponse> => {
  const response = await apiClient.get(
    `/leads/tasks/vendorId/${vendorId}/userId/${userId}/tasks`
  );
  return response.data.data; // backend already returns array
};

export const getVendorAllTasks = async (
  vendorId: number
): Promise<VendorAllTasksResponse> => {
  const response = await apiClient.get(
    `/leads/tasks/vendorId/${vendorId}/tasks/all`
  );
  return response.data.data;
};

export const getActiveLeadTasks = async (
  vendorId: number,
  leadId: number
): Promise<ActiveLeadTasksResponse> => {
  const response = await apiClient.get(
    `/leads/tasks/vendorId/${vendorId}/leadId/${leadId}/active-tasks`
  );
  return response.data.data;
};

export const useVendorUserTasks = (
  vendorId: number,
  userId: number,
  enabled: boolean = true
): UseQueryResult<VendorUserTasksResponse, Error> => {
  return useQuery({
    queryKey: ["vendorUserTasks", vendorId, userId],
    queryFn: () => getVendorUserTasks(vendorId, userId),
    enabled: enabled && !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useVendorAllTasks = (
  vendorId: number,
  enabled: boolean = true
): UseQueryResult<VendorAllTasksResponse, Error> => {
  return useQuery({
    queryKey: ["vendorAllTasks", vendorId],
    queryFn: () => getVendorAllTasks(vendorId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useActiveLeadTasks = (
  vendorId: number,
  leadId: number,
  enabled: boolean = true
): UseQueryResult<ActiveLeadTasksResponse, Error> => {
  return useQuery({
    queryKey: ["activeLeadTasks", vendorId, leadId],
    queryFn: () => getActiveLeadTasks(vendorId, leadId),
    enabled: enabled && !!vendorId && !!leadId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
