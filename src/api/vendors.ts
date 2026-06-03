import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────
// Field names match the VendorMaster Prisma model exactly.

export interface VendorListItem {
  id: number;
  vendor_name: string;
  vendor_code: string;
  primary_contact_email: string;
  primary_contact_number: string;
  primary_contact_name: string;
  status: string | null;
  is_inventory_enabled: boolean | null;
  is_tracktrace_enabled: boolean | null;
  is_this_vendor_is_custom_usertype_only: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VendorListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface VendorListResponse {
  success: boolean;
  message?: string;
  data: VendorListItem[];
  pagination?: {
    totalPages: number;
    totalCount: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface OnboardVendorPayload {
  vendor_name: string;
  vendor_code: string;
  primary_contact_name: string;
  primary_contact_number: string;
  primary_contact_email: string;
  country_code: string;
  head_office_id: null;
  status: "active";
  logo: string;
  time_zone: string;
}

// ─── API fn ──────────────────────────────────────────────────────────────────

export const fetchVendors = async (
  params: VendorListParams,
): Promise<VendorListResponse> => {
  const { data } = await apiClient.get("/vendors", { params });
  return data;
};

export const onboardVendor = async (payload: OnboardVendorPayload) => {
  const { data } = await apiClient.post("/vendors/onboard", payload);
  return data;
};

// ─── React-Query hook ────────────────────────────────────────────────────────

export const useVendors = (params: VendorListParams, enabled = true) => {
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => fetchVendors(params),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export const useOnboardVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: onboardVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
};
