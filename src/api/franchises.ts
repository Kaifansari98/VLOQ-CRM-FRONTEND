import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export interface CreateFranchisePayload {
  vendor_id: number;
  franchise_name: string;
  franchise_code?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
  contact_person?: string | null;
  is_head_office: boolean;
  address?: string | null;
}

// ─── API fn ──────────────────────────────────────────────────────────────────

export const createFranchise = async (payload: CreateFranchisePayload) => {
  const { data } = await apiClient.post("/franchises/create", payload);
  return data;
};

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

export const useCreateFranchise = (vendorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFranchise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchises", "vendor", vendorId] });
    },
  });
};
