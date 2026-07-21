import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface FranchiseSummary {
  id: number;
  vendor_id: number;
  franchise_name: string;
  franchise_code?: string | null;
  is_head_office?: boolean;
  moduled_for_b2b?: boolean;
  status?: string | null;
}

export const fetchFranchisesByVendorId = async (vendorId: number) => {
  const { data } = await apiClient.get(`/franchises/vendor/${vendorId}`);
  return (data?.data ?? []) as FranchiseSummary[];
};

export const fetchHeadSiteSupervisorFranchiseMapping = async (
  vendorId: number,
  franchiseId: number
) => {
  const { data } = await apiClient.get(
    `/franchises/head-site-supervisor-mapping`,
    { params: { vendor_id: vendorId, franchise_id: franchiseId } }
  );
  return data?.data ?? null;
};

export const useFranchisesByVendorId = (
  vendorId?: number,
  enabled = true
) => {
  return useQuery({
    queryKey: ["franchises", vendorId],
    queryFn: () => fetchFranchisesByVendorId(vendorId!),
    enabled: !!vendorId && enabled,
  });
};

export const useHeadSiteSupervisorFranchiseMapping = (
  vendorId?: number,
  franchiseId?: number,
  enabled = true
) => {
  return useQuery({
    queryKey: ["head-site-supervisor-mapping", vendorId, franchiseId],
    queryFn: () =>
      fetchHeadSiteSupervisorFranchiseMapping(vendorId!, franchiseId!),
    enabled: !!vendorId && !!franchiseId && enabled,
  });
};
