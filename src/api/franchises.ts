import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FranchiseListItem {
  shift_minutes?: number;
  Department?: string;
  id: number;
  vendor_id: number;
  franchise_name: string;
  franchise_code: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_number: string | null;
  address: string | null;
  pincode: string | null;
  /** The vendor's store city (city master). */
  store_city_id?: number | null;
  storeCity?: { name: string } | null;
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
  shift_minutes?: number;
  vendor_id: number;
  franchise_name: string;
  franchise_code?: string | null;
  contact_number?: string | null;
  contact_email?: string | null;
  contact_person?: string | null;
  is_head_office: boolean;
  address?: string | null;
  store_city_id?: number | null;
}

export type UpdateFranchisePayload = Partial<
  Pick<
    CreateFranchisePayload,
    | "shift_minutes"
    | "franchise_name"
    | "franchise_code"
    | "contact_number"
    | "contact_email"
    | "contact_person"
    | "address"
    | "store_city_id"
  >
> & { status?: "active" | "inactive" };

export interface StoreCity {
  id: number;
  name: string;
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

export const updateFranchise = async (id: number, payload: UpdateFranchisePayload) => {
  const { data } = await apiClient.put(`/franchises/${id}`, payload);
  return data;
};

export const useUpdateFranchise = (vendorId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateFranchisePayload & { id: number }) => updateFranchise(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franchises", "vendor", vendorId] });
    },
  });
};

/** The vendor's active cities from the city master (StoreCityMaster). */
export const useStoreCities = (vendorId: number, enabled = true) =>
  useQuery({
    queryKey: ["franchises", "store-cities", vendorId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: StoreCity[] }>(`/franchises/vendor/${vendorId}/store-cities`);
      return data.data;
    },
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
