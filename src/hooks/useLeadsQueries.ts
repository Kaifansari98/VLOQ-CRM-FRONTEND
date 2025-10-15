// hooks/useLeadsQueries.ts
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  assignToSiteMeasurement,
  AssignToSiteMeasurementPayload,
  fetchLeadLogs,
  getLeadById,
  getVendorLeads,
  getVendorUserLeads,
  getVendorUserLeadsOpen,
  Lead,
  VendorLeadsResponse,
  VendorUserLeadsResponse,
} from "@/api/leads";
import {
  assignToFinalMeasurement,
  AssignToFinalMeasurementPayload,
} from "@/api/final-measurement";
import { apiClient } from "@/lib/apiClient";

interface UseLeadLogsOptions {
  leadId: number;
  vendorId: number;
  limit?: number;
}

export interface VendorOverallLeadsResponse {
  count: number;
  data: Lead[];
}

export interface VendorUserLeadsOpenResponse {
  count: number;
  data: Lead[];
}

// Hook for getting vendor leads
export const useVendorLeads = (
  vendorId: number,
  enabled: boolean = true
): UseQueryResult<VendorLeadsResponse, Error> => {
  return useQuery({
    queryKey: ["vendorLeads", vendorId],
    queryFn: () => getVendorLeads(vendorId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for getting vendor user leads
export const useVendorUserLeads = (
  vendorId: number,
  userId: number,
  enabled: boolean = true
): UseQueryResult<VendorUserLeadsResponse, Error> => {
  return useQuery({
    queryKey: ["vendorUserLeads", vendorId, userId],
    queryFn: () => getVendorUserLeads(vendorId, userId),
    enabled: enabled && !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for getting vendor user leads
export const useVendorUserLeadsOpen = (
  vendorId: number,
  userId: number
): UseQueryResult<VendorUserLeadsOpenResponse, Error> => {
  return useQuery({
    queryKey: ["vendorUserLeadsOpen", vendorId, userId],
    queryFn: () => getVendorUserLeadsOpen(vendorId, userId),
    enabled: !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ✅ Get all vendor leads (Overall Leads) for a given tag (e.g. Type 1)
export const getVendorOverallLeads = async (
  vendorId: number,
  tag: string,
  userId: number,
): Promise<VendorOverallLeadsResponse> => {
  const response = await apiClient.get(
    `/leads/bookingStage/vendorId/${vendorId}/all-leads`,
    {
      params: { tag, userId },
    }
  );
  return response.data; // keep full shape: { count, data }
};

export const useVendorOverallLeads = (
  vendorId: number,
  tag: string,
  userId: number
): UseQueryResult<VendorOverallLeadsResponse, Error> => {
  return useQuery({
    queryKey: ["vendorOverallLeads", vendorId, tag],
    queryFn: () => getVendorOverallLeads(vendorId, tag, userId),
    enabled: !!vendorId && !!tag,
    staleTime: 5 * 60 * 1000, // cache 5min
    refetchOnWindowFocus: false,
  });
};

export function useLeadById(
  leadId?: number,
  vendorId?: number,
  userId?: number
) {
  return useQuery({
    queryKey: ["lead", leadId, vendorId, userId],
    queryFn: () => getLeadById(leadId!, vendorId!, userId!), // non-null assertion because we check enabled below
    enabled: !!leadId && !!vendorId && !!userId, // run only if ids exist
  });
}

export const useAssignToSiteMeasurement = (leadId: number) => {
  return useMutation({
    mutationFn: (payload: AssignToSiteMeasurementPayload) =>
      assignToSiteMeasurement(leadId, payload),
  });
};

export const useAssignToFinalMeasurement = (leadId: number) => {
  return useMutation({
    mutationFn: (payload: AssignToFinalMeasurementPayload) =>
      assignToFinalMeasurement(leadId, payload),
  });
};

export const useLeadLogs = ({
  leadId,
  vendorId,
  limit = 10,
}: UseLeadLogsOptions) => {
  return useInfiniteQuery({
    queryKey: ["leadLogs", leadId, vendorId],
    queryFn: async ({ pageParam }) =>
      await fetchLeadLogs({
        leadId,
        vendorId,
        limit,
        cursor: pageParam ?? undefined, // null-safe cursor
      }),
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined, // ✅ REQUIRED in v5+
    staleTime: 60 * 1000, // 1 min cache
    refetchOnWindowFocus: false,
  });
};
