import { apiClient } from "@/lib/apiClient";
import { useAppSelector } from "@/redux/store";
import type { ComplaintDetails, ComplaintActivityParams, ComplaintActivityResponse } from "@/types/complaint-details";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ClientComplaintRow,
  ComplaintComponent,
  ComplaintLeadLookup,
  ComplaintPossibleDuplicates,
  ComplaintStatus,
  CreateClientComplaintInput,
} from "@/types/client-complaints";

const path = (vendorId: number) => `/client-complaints/vendor/${vendorId}`;

export interface ComplaintMeta {
  categories: { id: number; name: string }[];
  product_types: { id: number; type: string }[];
  components: ComplaintComponent[];
  can_register: boolean;
}

export interface ComplaintListParams {
  page: number;
  limit: number;
  search?: string;
  status?: ComplaintStatus[];
}

export interface ComplaintListResponse {
  rows: ClientComplaintRow[];
  total: number;
  page: number;
  limit: number;
  status_counts: Partial<Record<ComplaintStatus, number>>;
}

export async function getComplaintMeta(vendorId: number) {
  const { data } = await apiClient.get<{ data: ComplaintMeta }>(`${path(vendorId)}/meta`);
  return data.data;
}

export async function lookupComplaintLead(vendorId: number, leadCode: string) {
  const { data } = await apiClient.get<{ data: ComplaintLeadLookup }>(`${path(vendorId)}/lead-lookup`, {
    params: { lead_code: leadCode },
  });
  return data.data;
}

export async function getComplaintDuplicates(
  vendorId: number,
  params: { mobile?: string; name?: string; address?: string },
  signal?: AbortSignal,
) {
  const { data } = await apiClient.get<{ data: ComplaintPossibleDuplicates }>(`${path(vendorId)}/duplicates`, {
    params,
    signal,
  });
  return data.data;
}

export async function getComplaints(vendorId: number, params: ComplaintListParams) {
  const { data } = await apiClient.get<{ data: ComplaintListResponse }>(`${path(vendorId)}/complaints`, {
    params: { ...params, status: params.status?.join(",") || undefined },
  });
  return data.data;
}

export async function createComplaint(vendorId: number, input: CreateClientComplaintInput) {
  const { photos, videos, ...details } = input;
  const body = new FormData();
  body.append("data", JSON.stringify(details));
  photos.forEach((file) => body.append("photos", file));
  videos.forEach((file) => body.append("videos", file));
  const { data } = await apiClient.post<{
    data: { id: number; complaint_code: string; status: ComplaintStatus; possible_duplicate: boolean };
  }>(`${path(vendorId)}/complaints`, body, { headers: { "Content-Type": "multipart/form-data" } });
  return data.data;
}

export function useComplaintMeta(vendorId?: number) {
  return useQuery({
    queryKey: ["client-complaints-meta", vendorId],
    queryFn: () => getComplaintMeta(vendorId!),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplaints(vendorId: number | undefined, params: ComplaintListParams) {
  return useQuery({
    queryKey: ["client-complaints", vendorId, params],
    queryFn: () => getComplaints(vendorId!, params),
    enabled: !!vendorId,
    placeholderData: (previous) => previous,
  });
}

export function useCreateComplaint(vendorId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientComplaintInput) => createComplaint(vendorId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client-complaints", vendorId] }),
  });
}

export async function getComplaintDetail(
  vendorId: number,
  complaintId: number,
  signal?: AbortSignal,
) {
  const { data } = await apiClient.get<{ data: ComplaintDetails }>(
    `${path(vendorId)}/complaints/${complaintId}`,
    { signal },
  );
  return data.data;
}

export function useComplaintDetail(
  vendorId: number | undefined,
  complaintId: number,
) {
  const viewerId = useAppSelector((state) => state.auth.user?.id);
  const viewerRole = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  return useQuery({
    queryKey: [
      "client-complaint-detail",
      vendorId,
      complaintId,
      viewerId,
      viewerRole,
    ],
    queryFn: ({ signal }) => getComplaintDetail(vendorId!, complaintId, signal),
    enabled: !!vendorId && Number.isSafeInteger(complaintId) && complaintId > 0,
    staleTime: 30_000,
    retry: false,
  });
}

export async function getComplaintActivity(
  vendorId: number,
  complaintId: number,
  params: ComplaintActivityParams,
  signal?: AbortSignal,
) {
  const { data } = await apiClient.get<{ data: ComplaintActivityResponse }>(
    `${path(vendorId)}/complaints/${complaintId}/activity`,
    { params, signal },
  );
  return data.data;
}

export function useComplaintActivity(
  vendorId: number,
  complaintId: number,
  params: ComplaintActivityParams,
) {
  const viewerId = useAppSelector((state) => state.auth.user?.id);
  const viewerRole = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  return useQuery({
    queryKey: [
      "client-complaint-activity",
      vendorId,
      complaintId,
      viewerId,
      viewerRole,
      params,
    ],
    queryFn: ({ signal }) =>
      getComplaintActivity(vendorId, complaintId, params, signal),
    staleTime: 30_000,
    retry: false,
  });
}
