import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface FranchiseSummary {
  id: number;
  vendor_id: number;
  franchise_name: string;
  franchise_code?: string | null;
  is_head_office?: boolean;
  status?: string | null;
}

export const fetchFranchisesByVendorId = async (vendorId: number) => {
  const { data } = await apiClient.get(`/franchises/vendor/${vendorId}`);
  return (data?.data ?? []) as FranchiseSummary[];
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
