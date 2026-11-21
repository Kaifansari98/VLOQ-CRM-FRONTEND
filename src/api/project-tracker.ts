import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Client Project Tracker (CRM side): what the client app shows for a booking,
// plus the controls the lead's team and HO use to keep it up to date.

const base = (vendorId: number) => `/project-tracker/vendor/${vendorId}`;

export type TrackerStageKey =
  | "BOOKING"
  | "FINAL_MEASUREMENT"
  | "TECH_CHECK"
  | "PRODUCTION"
  | "DISPATCH"
  | "DELIVERY"
  | "INSTALLATION"
  | "HANDOVER";

export type TrackerStatus = "PENDING" | "IN_PROGRESS" | "ON_HOLD" | "DELAYED" | "COMPLETED";

export interface TrackerStage {
  key: TrackerStageKey;
  name: string;
  status: TrackerStatus;
  started_at: string | null;
  completed_at: string | null;
  original_expected_date: string | null;
  latest_expected_date: string | null;
  revised: boolean;
  items: { id: number; title: string; status: TrackerStatus }[] | null;
  /** Past its latest expected date without being completed. Staff only. */
  overdue: boolean;
}

export interface TrackerRevision {
  id: number;
  stage: TrackerStageKey;
  stage_name: string;
  previous_date: string | null;
  proposed_date: string;
  approved_date: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requested_by: string | null;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_remarks: string | null;
}

export interface TrackerUpdate {
  id: string;
  kind: string;
  stage: TrackerStageKey;
  stage_name: string;
  title: string;
  description: string | null;
  at: string;
  published_by?: string | null;
  files: { id: number; name: string; media_type: "PHOTO" | "VIDEO" | "DOCUMENT"; url: string }[];
}

export interface StaffTracker {
  project: {
    lead_id: number;
    lead_code: string;
    name: string;
    client_name: string;
    site_address: string | null;
    completed: boolean;
    completed_at: string | null;
    milestones_completed: number;
    milestones_total: number;
  };
  expected_completion: { original: string | null; latest: string | null };
  current:
    | (TrackerStage & {
        description: string;
        department: string;
        remark: string | null;
        remark_at: string | null;
        hold: {
          status: "ON_HOLD" | "DELAYED";
          reason: string | null;
          action: string | null;
          resume_date: string | null;
          since: string | null;
        } | null;
      })
    | null;
  stages: TrackerStage[];
  permissions: { can_edit: boolean; can_approve: boolean };
  stage_details: Record<
    TrackerStageKey,
    {
      client_remark: string | null;
      client_remark_at: string | null;
      original_set_by: string | null;
      original_set_at: string | null;
    }
  >;
  revisions: TrackerRevision[];
  audit: {
    id: number;
    stage: TrackerStageKey | null;
    action: string;
    details: Record<string, unknown> | null;
    by: string | null;
    at: string;
  }[];
  updates: TrackerUpdate[];
}

export interface PendingRevision {
  id: number;
  lead_id: number;
  lead_code: string | null;
  client_name: string;
  stage: TrackerStageKey;
  stage_name: string;
  previous_date: string | null;
  proposed_date: string;
  reason: string;
  requested_by: string | null;
  requested_at: string;
}

export function useStaffTracker(vendorId: number | undefined, leadId: number | undefined) {
  return useQuery({
    queryKey: ["project-tracker", vendorId, leadId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: StaffTracker }>(`${base(vendorId!)}/leads/${leadId}`);
      return data.data;
    },
    enabled: !!vendorId && !!leadId,
  });
}

export function usePendingRevisions(vendorId: number | undefined) {
  return useQuery({
    queryKey: ["project-tracker-revisions", vendorId],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        data: { can_approve: boolean; rows: PendingRevision[] };
      }>(`${base(vendorId!)}/revisions`);
      return data.data;
    },
    enabled: !!vendorId,
  });
}

export type TrackerAction =
  | {
      kind: "status";
      stage: TrackerStageKey;
      status: "IN_PROGRESS" | "ON_HOLD" | "DELAYED";
      reason?: string;
      action?: string;
      resume_date?: string;
      revised_date?: string;
      remarks?: string;
    }
  | { kind: "expectedDate"; stage: TrackerStageKey; date: string }
  | { kind: "revision"; stage: TrackerStageKey; proposed_date: string; reason: string }
  | { kind: "remark"; stage: TrackerStageKey; remark: string }
  | { kind: "update"; stage: TrackerStageKey; title: string; description?: string; files: File[] }
  | {
      kind: "decision";
      revision_id: number;
      outcome: "APPROVED" | "REJECTED";
      approved_date?: string;
      remarks?: string;
    };

async function runTrackerAction(vendorId: number, leadId: number | undefined, action: TrackerAction) {
  const lead = `${base(vendorId)}/leads/${leadId}`;
  switch (action.kind) {
    case "status": {
      const { kind: _, stage, ...body } = action;
      return apiClient.post(`${lead}/stages/${stage}/status`, body);
    }
    case "expectedDate":
      return apiClient.post(`${lead}/stages/${action.stage}/expected-date`, { date: action.date });
    case "revision":
      return apiClient.post(`${lead}/stages/${action.stage}/revisions`, {
        proposed_date: action.proposed_date,
        reason: action.reason,
      });
    case "remark":
      return apiClient.post(`${lead}/stages/${action.stage}/remark`, { remark: action.remark });
    case "update": {
      const form = new FormData();
      form.append(
        "data",
        JSON.stringify({ stage: action.stage, title: action.title, description: action.description }),
      );
      action.files.forEach((file) => form.append("files", file));
      return apiClient.post(`${lead}/updates`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    case "decision": {
      const { kind: _, revision_id, ...body } = action;
      return apiClient.post(`${base(vendorId)}/revisions/${revision_id}/decision`, body);
    }
  }
}

/** Runs a tracker action; `leadId` may be omitted for revision decisions. */
export function useTrackerAction(vendorId: number, leadId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: TrackerAction) => runTrackerAction(vendorId, leadId, action),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-tracker", vendorId] }),
        queryClient.invalidateQueries({ queryKey: ["project-tracker-revisions", vendorId] }),
      ]),
  });
}

export const trackerError = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
  "Something went wrong. Please try again.";
