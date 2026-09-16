import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface SelfAssignTaskType {
  id: number;
  vendor_id: number;
  user_type_id: number;
  type: string;
  created_at: string;
}

const getSelfAssignTaskTypes = async (
  vendorId: number,
  userTypeId?: number,
): Promise<SelfAssignTaskType[]> => {
  const { data } = await apiClient.get("/vendors/self-assign-task-types", {
    params: {
      vendor_id: vendorId,
      ...(userTypeId ? { user_type_id: userTypeId } : {}),
    },
  });

  return data?.data ?? [];
};

export const useSelfAssignTaskTypes = (
  vendorId?: number,
  userTypeId?: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["selfAssignTaskTypes", vendorId, userTypeId],
    queryFn: () => getSelfAssignTaskTypes(vendorId!, userTypeId),
    enabled: enabled && !!vendorId && !!userTypeId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useVendorSelfAssignTaskTypes = (
  vendorId?: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["vendorSelfAssignTaskTypes", vendorId],
    queryFn: () => getSelfAssignTaskTypes(vendorId!),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
