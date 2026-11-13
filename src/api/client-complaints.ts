import { apiClient } from "@/lib/apiClient";
import { useAppSelector } from "@/redux/store";
import type {
  ComplaintDetails,
  ComplaintActivityParams,
  ComplaintActivityResponse,
  ComplaintAssigneeOption,
  ComplaintVerificationOutcome,
  ComplaintVisitAction,
  ComplaintExecutionAction,
} from "@/types/complaint-details";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ClientComplaintRow,
  ComplaintComponent,
  ComplaintLeadLookup,
  ComplaintPossibleDuplicates,
  ComplaintPriority,
  ComplaintStatus,
  CreateClientComplaintInput,
} from "@/types/client-complaints";

const path = (vendorId: number) => `/client-complaints/vendor/${vendorId}`;

export interface ComplaintMeta {
  categories: { id: number; name: string }[];
  product_types: { id: number; type: string }[];
  components: ComplaintComponent[];
  can_register: boolean;
  visit_fee: number;
  can_configure: boolean;
}

export function useUpdateComplaintSettings(vendorId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: { visit_fee: number }) => {
      const { data } = await apiClient.put<{ data: { visit_fee: number } }>(`${path(vendorId!)}/settings`, settings);
      return data.data;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-complaints-meta", vendorId] }),
        queryClient.invalidateQueries({ queryKey: ["client-complaint-detail", vendorId] }),
      ]),
  });
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

export async function lookupComplaintLead(vendorId: number, leadCode: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: ComplaintLeadLookup }>(`${path(vendorId)}/lead-lookup`, {
    params: { lead_code: leadCode },
    signal,
  });
  return data.data;
}

export interface ComplaintLeadOption {
  id: number;
  firstname: string;
  lastname: string | null;
  lead_code: string;
}

export async function getComplaintLeadOptions(vendorId: number, params: { search?: string; franchise_id?: number; after_id?: number }, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: { rows: ComplaintLeadOption[]; next_cursor: number | null } }>(`${path(vendorId)}/lead-options`, { params, signal });
  return data.data;
}

export async function getComplaintLeadFranchises(vendorId: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: { id: number; franchise_name: string }[] }>(`${path(vendorId)}/lead-franchises`, { signal });
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

// HO verification stage. Every call sends the complaint version the viewer saw,
// so the backend can refuse actions taken on a stale page.
export type ComplaintWorkflowRequest =
  | { kind: "start"; version: number; remarks?: string }
  | { kind: "resume"; version: number; remarks: string }
  | {
      kind: "decision";
      version: number;
      outcome: ComplaintVerificationOutcome;
      remarks: string;
      remote_instructions?: string;
      client_response?: string;
      duplicate_review_remarks?: string;
    }
  | { kind: "information"; version: number; remarks: string; files: File[] }
  | { kind: "priority"; version: number; priority: ComplaintPriority; remarks?: string }
  | { kind: "reassign"; version: number; role: "SITE_SUPERVISOR" | "DEPARTMENT_HEAD"; user_id: number; reason: string }
  | {
      kind: "createVisit";
      version: number;
      charge_mode: "CHARGEABLE" | "FREE_REPEAT";
      repeat_of_visit_id?: number;
      remarks?: string;
    }
  | {
      kind: "visitAction";
      version: number;
      visit_id: number;
      action: ComplaintVisitAction;
      remarks?: string;
      client_reference?: string;
      scheduled_for?: string;
      team_details?: string;
    }
  | {
      kind: "visitPayment";
      version: number;
      visit_id: number;
      amount: number;
      method: string;
      transaction_reference: string;
      payment_date: string;
      proof: File;
    }
  | { kind: "paymentReview"; version: number; payment_id: number; outcome: "VERIFIED" | "REJECTED"; remarks?: string }
  | { kind: "warranty"; version: number; outcome: "COVERED" | "PARTIALLY_COVERED" | "NOT_COVERED"; remarks: string }
  | { kind: "cancel"; version: number; remarks: string }
  | {
      kind: "inspection";
      version: number;
      fields: ComplaintInspectionInput;
      photos: File[];
      videos: File[];
      documents: File[];
    }
  | {
      kind: "inspectionDecision";
      version: number;
      action: "START_QUOTATION" | "PROCEED_WITHOUT_QUOTATION" | "RESOLVE_WITHOUT_REPAIR";
      remarks?: string;
      material_required?: boolean;
    }
  | { kind: "saveQuotation"; version: number; items: ComplaintQuotationItemInput[]; tax_amount: number; submit: boolean }
  | {
      kind: "quotationAction";
      version: number;
      quotation_id: number;
      action: "APPROVE" | "SEND_FOR_REVISION" | "SHARE" | "CLIENT_ACCEPTED" | "CLIENT_REJECTED" | "MODIFICATION_REQUESTED";
      remarks?: string;
      client_reference?: string;
    }
  | {
      kind: "chargePayment";
      version: number;
      charge_id: number;
      amount: number;
      method: string;
      transaction_reference: string;
      payment_date: string;
      proof: File;
    }
  | { kind: "chargeWaiver"; version: number; charge_id: number; remarks: string }
  | {
      kind: "executionAction";
      version: number;
      execution_id: number;
      action: Exclude<ComplaintExecutionAction, "COMPLETE_WORK">;
      remarks?: string;
      purchase_order_reference?: string;
      material_expected_date?: string;
      material_received_date?: string;
      scheduled_for?: string;
      team_details?: string;
    }
  | {
      kind: "executionComplete";
      version: number;
      execution_id: number;
      completion_remarks: string;
      material_used?: string;
      replacement_details?: string;
      client_remarks?: string;
      pending_work?: string;
      before: File[];
      after: File[];
    }
  | {
      kind: "clientConfirmation";
      version: number;
      outcome: "SATISFIED" | "NOT_SATISFIED";
      client_reference: string;
      remarks?: string;
      photos: File[];
    }
  | { kind: "noResponseClosure"; version: number; remarks: string }
  | { kind: "approveClosure"; version: number; remarks: string; reports_reviewed: boolean };

export interface ComplaintInspectionInput {
  visit_id: number;
  actual_visit_date: string;
  client_available: boolean;
  issue_observed: string;
  root_cause: string;
  affected_product: string;
  affected_unit_number: string;
  responsibility: string;
  responsibility_remarks?: string;
  repair_actions: string[];
  material_required: boolean;
  materials: {
    material_name: string;
    quantity: number;
    unit?: string;
    specification?: string;
    finish_colour?: string;
    estimated_cost?: number;
    remarks?: string;
  }[];
  remarks?: string;
  estimated_work_days?: number;
  expected_completion_date?: string;
  additional_visit_required: boolean;
  further_approval_required: boolean;
}

export interface ComplaintQuotationItemInput {
  category: string;
  description: string;
  quantity: number;
  unit?: string;
  unit_rate: number;
  warranty_covered_amount: number;
  chargeable_reason?: string;
}

export async function runComplaintWorkflow(vendorId: number, complaintId: number, request: ComplaintWorkflowRequest) {
  const base = `${path(vendorId)}/complaints/${complaintId}`;
  const multipart = (url: string, fields: object, files: [string, File][]) => {
    const form = new FormData();
    form.append("data", JSON.stringify(fields));
    files.forEach(([name, file]) => form.append(name, file));
    return apiClient.post(url, form, { headers: { "Content-Type": "multipart/form-data" } });
  };
  switch (request.kind) {
    case "information": {
      const { kind: _, files, ...fields } = request;
      await multipart(`${base}/verification/information-received`, fields, files.map((f) => ["files", f]));
      return;
    }
    case "visitPayment": {
      const { kind: _, visit_id, proof, ...fields } = request;
      await multipart(`${base}/visits/${visit_id}/payments`, fields, [["proof", proof]]);
      return;
    }
    case "visitAction": {
      const { kind: _, visit_id, ...body } = request;
      await apiClient.post(`${base}/visits/${visit_id}/action`, body);
      return;
    }
    case "paymentReview": {
      const { kind: _, payment_id, ...body } = request;
      await apiClient.post(`${base}/payments/${payment_id}/review`, body);
      return;
    }
    case "inspection": {
      const { version, fields, photos, videos, documents } = request;
      await multipart(`${base}/inspections`, { ...fields, version }, [
        ...photos.map((f): [string, File] => ["photos", f]),
        ...videos.map((f): [string, File] => ["videos", f]),
        ...documents.map((f): [string, File] => ["documents", f]),
      ]);
      return;
    }
    case "quotationAction": {
      const { kind: _, quotation_id, ...body } = request;
      await apiClient.post(`${base}/quotations/${quotation_id}/action`, body);
      return;
    }
    case "chargePayment": {
      const { kind: _, charge_id, proof, ...fields } = request;
      await multipart(`${base}/charges/${charge_id}/payments`, fields, [["proof", proof]]);
      return;
    }
    case "chargeWaiver": {
      const { kind: _, charge_id, ...body } = request;
      await apiClient.post(`${base}/charges/${charge_id}/waive`, body);
      return;
    }
    case "executionAction": {
      const { kind: _, execution_id, ...body } = request;
      await apiClient.post(`${base}/executions/${execution_id}/action`, body);
      return;
    }
    case "executionComplete": {
      const { kind: _, execution_id, before, after, ...fields } = request;
      await multipart(`${base}/executions/${execution_id}/complete`, fields, [
        ...before.map((f): [string, File] => ["before", f]),
        ...after.map((f): [string, File] => ["after", f]),
      ]);
      return;
    }
    case "clientConfirmation": {
      const { kind: _, photos, ...fields } = request;
      await multipart(`${base}/closure/client-confirmation`, fields, photos.map((f) => ["photos", f]));
      return;
    }
    default: {
      const { kind, ...body } = request;
      const url = {
        start: `${base}/verification/start`,
        resume: `${base}/verification/resume`,
        decision: `${base}/verification/decision`,
        priority: `${base}/priority`,
        reassign: `${base}/reassign`,
        createVisit: `${base}/visits`,
        warranty: `${base}/warranty`,
        cancel: `${base}/cancel`,
        inspectionDecision: `${base}/inspection-decision`,
        saveQuotation: `${base}/quotations`,
        noResponseClosure: `${base}/closure/no-response`,
        approveClosure: `${base}/closure/approve`,
      }[kind];
      await apiClient.post(url, body);
    }
  }
}

export function useComplaintWorkflow(vendorId: number, complaintId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ComplaintWorkflowRequest) => runComplaintWorkflow(vendorId, complaintId, request),
    // Refresh even on failure: a 409 means the page is stale.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-complaint-detail", vendorId, complaintId] }),
        queryClient.invalidateQueries({ queryKey: ["client-complaint-activity", vendorId, complaintId] }),
        queryClient.invalidateQueries({ queryKey: ["client-complaints", vendorId] }),
      ]),
  });
}

export function useComplaintAssigneeOptions(vendorId: number, complaintId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["client-complaint-assignees", vendorId, complaintId],
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get<{
        data: { site_supervisors: ComplaintAssigneeOption[]; head_site_supervisors: ComplaintAssigneeOption[] };
      }>(`${path(vendorId)}/complaints/${complaintId}/assignee-options`, { signal });
      return data.data;
    },
    enabled,
    staleTime: 60_000,
  });
}
