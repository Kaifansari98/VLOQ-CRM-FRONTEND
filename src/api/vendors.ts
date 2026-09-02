import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────
// Field names match the VendorMaster Prisma model exactly.

export interface VendorListItem {
  id: number;
  vendor_name: string;
  vendor_code: string;
  subdomain_url: string | null;
  primary_contact_email: string;
  primary_contact_number: string;
  primary_contact_name: string;
  status: string | null;
  handlesLargeScaleProjects: boolean | null;
  is_crm_enabled: boolean | null;
  is_inventory_enabled: boolean | null;
  is_tracktrace_enabled: boolean | null;
  is_scanpack_enabled: boolean | null;
  is_available_unique_code: boolean | null;
  push_lead_to_cadbid: boolean | null;
  is_this_vendor_is_custom_usertype_only: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  logoUrl?: string;
  iconUrl?: string;
  loginImageUrl?: string;
  gst_no?: string | null;
  toll_free_no?: string | null;
  website_link?: string | null;
  tag_line?: string | null;
  address?: string | null;
  pincode?: string | null;
  city?: string | null;
  state_id?: number | null;
  state?: {
    id: number;
    name: string;
  } | null;
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

export interface VendorDetailResponse {
  success: boolean;
  message?: string;
  data: VendorListItem;
}

export interface OnboardVendorPayload {
  vendor_name: string;
  vendor_code: string;
  subdomain_url: string;
  primary_contact_name: string;
  primary_contact_number: string;
  primary_contact_email: string;
  country_code: string;
  head_office_id: null;
  status: "active";
  logo: string;
  time_zone: string;
  handlesLargeScaleProjects?: boolean;
  is_crm_enabled?: boolean;
  is_inventory_enabled: boolean;
  is_tracktrace_enabled: boolean;
  is_available_unique_code?: boolean;
  push_lead_to_cadbid?: boolean;
  gst_no?: string | null;
  toll_free_no?: string | null;
  website_link?: string | null;
  tag_line?: string | null;
  address?: string | null;
  pincode?: string | null;
  city?: string | null;
  state_id?: number | null;
  state?: {
    id: number;
    name: string;
  } | null;
}

export interface UpdateVendorPayload {
  vendor_name: string;
  vendor_code: string;
  subdomain_url: string;
  primary_contact_name: string;
  primary_contact_number: string;
  primary_contact_email: string;
  status: "active";
  time_zone: string;
  handlesLargeScaleProjects: boolean;
  is_crm_enabled: boolean;
  is_inventory_enabled: boolean;
  is_tracktrace_enabled: boolean;
  is_available_unique_code: boolean;
  push_lead_to_cadbid?: boolean;
  gst_no?: string | null;
  toll_free_no?: string | null;
  website_link?: string | null;
  tag_line?: string | null;
  address?: string | null;
  pincode?: string | null;
  city?: string | null;
  state_id?: number | null;
  state?: {
    id: number;
    name: string;
  } | null;
}

// ─── API fn ──────────────────────────────────────────────────────────────────

export const fetchVendors = async (
  params: VendorListParams,
): Promise<VendorListResponse> => {
  const { data } = await apiClient.get("/vendors", { params });
  return data;
};

export const onboardVendor = async (payload: FormData) => {
  const { data } = await apiClient.post("/vendors/onboard", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const updateVendor = async (
  vendorId: number,
  payload: UpdateVendorPayload | FormData,
) => {
  const headers = payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined;
  const { data } = await apiClient.patch(`/vendors/${vendorId}`, payload, { headers });
  return data;
};

export const fetchVendorById = async (
  vendorId: number,
): Promise<VendorDetailResponse> => {
  const { data } = await apiClient.get(`/vendors/${vendorId}`);
  return data;
};

export const fetchVendorBySubdomain = async (
  subdomain: string,
): Promise<{ success: boolean; data: { id: number; vendor_name: string; logoUrl: string; iconUrl: string; loginImageUrl?: string } }> => {
  const { data } = await apiClient.get(`/vendors/public/by-subdomain`, {
    params: { subdomain }
  });
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

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      payload,
    }: {
      vendorId: number;
      payload: UpdateVendorPayload | FormData;
    }) => updateVendor(vendorId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", variables.vendorId] });
    },
  });
};

export const useVendorById = (vendorId?: number) => {
  return useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: () => fetchVendorById(vendorId as number),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
};


export interface StateListItem {
  id: number;
  name: string;
}

export const fetchStates = async (): Promise<{
  success: boolean;
  data: StateListItem[];
}> => {
  const { data } = await apiClient.get("/vendors/states");
  return data;
};

export const useStates = () => {
  return useQuery({
    queryKey: ["states"],
    queryFn: fetchStates,
    retry: false,
    refetchOnWindowFocus: false,
  });
};
