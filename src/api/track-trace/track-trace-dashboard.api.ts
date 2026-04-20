// track-trace-dashboard.api.ts
import { apiClient } from "@/lib/apiClient";

export interface MachineScanStatus {
  machine_id: number;
  machine_name: string;
  sequence_no: number;
  total: number;
  scanned: number;
  pending: number;
  all_scanned: boolean;
}

export interface ProjectScanStatus {
  project_id: number;
  project_name: string;
  project_status: string;
  track_trace_status: string;
  created_at: string;
  panels_scanned: number;
  total_panels: number;
  machines: MachineScanStatus[];
}

export interface TraceTraceDashboardResponse {
  active: ProjectScanStatus[];
  archived: ProjectScanStatus[];
  active_count: number;
  archived_count: number;
}

export const getTraceTraceDashboard = async (
  vendorId: number
): Promise<TraceTraceDashboardResponse> => {
  const { data } = await apiClient.get(
    `/track-trace/dashboard/${vendorId}`
  );
  return data.data;
};