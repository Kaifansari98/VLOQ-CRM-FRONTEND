// hooks/useLeadsQueries.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { getLeadById, getVendorLeads, getVendorUserLeads, getVendorUserLeadsOpen, VendorLeadsResponse, VendorUserLeadsResponse } from '@/api/leads'

// Hook for getting vendor leads
export const useVendorLeads = (
  vendorId: number,
  enabled: boolean = true
): UseQueryResult<VendorLeadsResponse, Error> => {
  return useQuery({
    queryKey: ['vendorLeads', vendorId],
    queryFn: () => getVendorLeads(vendorId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook for getting vendor user leads
export const useVendorUserLeads = (
  vendorId: number,
  userId: number,
  enabled: boolean = true
): UseQueryResult<VendorUserLeadsResponse, Error> => {
  return useQuery({
    queryKey: ['vendorUserLeads', vendorId, userId],
    queryFn: () => getVendorUserLeads(vendorId, userId),
    enabled: enabled && !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook for getting vendor user leads
export const useVendorUserLeadsOpen = (
  vendorId: number,
  userId: number,
): UseQueryResult<VendorUserLeadsResponse, Error> => {
  return useQuery({
    queryKey: ['vendorUserLeadsOpen', vendorId],
    queryFn: () => getVendorUserLeadsOpen(vendorId),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};


export function useLeadById(leadId?: number, vendorId?: number, userId?: number) {
  return useQuery({
    queryKey: ["lead", leadId, vendorId, userId],
    queryFn: () => getLeadById(leadId!, vendorId!, userId!), // non-null assertion because we check enabled below
    enabled: !!leadId && !!vendorId && !!userId, // run only if ids exist
  })
}