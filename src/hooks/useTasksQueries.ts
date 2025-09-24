// hooks/useTasksQueries.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type VendorUserTasksResponse = VendorUserTask[];

export interface VendorUserTask {
  userLeadTask: {
    id: number;
    status: string;
    due_date: string;
    task_type: string;
    closed_by: number | null;
    closed_at: string | null;
    created_by: number;
    created_by_name?: string;
    created_at: string;
    updated_by: number | null;
    updated_at: string;
  };
  leadMaster: {
    id: number;
    name: string;
    phone_number: string;
    site_type: string | null;
    product_type: string[];
    product_structure: string[];
  };
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