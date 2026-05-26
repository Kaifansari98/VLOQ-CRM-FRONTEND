import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FranchiseListItem {
  id: number;
  vendor_id: number;
  franchise_name: string;
  franchise_code: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_number: string | null;
  address: string | null;
  pincode: string | null;
  is_head_office: boolean;
  status: string;
  createdAt: string | null;
}

export interface FranchisesResponse {
  success: boolean;
  message?: string;
  data: FranchiseListItem[];
}

// ─── API fn ──────────────────────────────────────────────────────────────────

export const fetchFranchisesByVendor = async (
  vendorId: number,
): Promise<FranchisesResponse> => {
  const { data } = await apiClient.get(`/franchises/vendor/${vendorId}`);
  return data;
};

// ─── React-Query hook ────────────────────────────────────────────────────────

export const useFranchisesByVendor = (vendorId: number, enabled = true) => {
  return useQuery({
    queryKey: ["franchises", "vendor", vendorId],
    queryFn: () => fetchFranchisesByVendor(vendorId),
    enabled: enabled && !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
