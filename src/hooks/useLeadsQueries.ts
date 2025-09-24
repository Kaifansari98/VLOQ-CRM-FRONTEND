// hooks/useLeadsQueries.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  assignToSiteMeasurement,
  AssignToSiteMeasurementPayload,
  getLeadById,
  getVendorLeads,
  getVendorUserLeads,
  getVendorUserLeadsOpen,
  VendorLeadsResponse,
  VendorUserLeadsResponse,
} from "@/api/leads";
import { toast } from "react-toastify";
import { assignToFinalMeasurement, AssignToFinalMeasurementPayload } from "@/api/final-measurement";

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
): UseQueryResult<VendorUserLeadsResponse, Error> => {
  return useQuery({
    queryKey: ["vendorUserLeadsOpen", vendorId, userId],
    queryFn: () => getVendorUserLeadsOpen(vendorId, userId),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
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