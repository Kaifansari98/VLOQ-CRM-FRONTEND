import { apiClient } from "@/lib/apiClient";

export interface MachineScanPayload {
  vendor_id: number;
  machine_id: number;
  unique_code: string;
  created_by: number;
  project_id?: number;
  box_id?: number;
}

export interface MachineScanResult {
  mapping_id: number;
  cut_list_id: number;
  project_id: number;
  project_name: string;
  machine_id: number;
  machine_name: string;
  item_name: string;
  unique_code: string;
  description: string | null;
  group_name: string | null;
  box_id: number | null;
  box_total_weight?: number | null;
  scanned_at: string;
}

export interface MachineScanResponse {
  success: boolean;
  message: string;
  data?: MachineScanResult;
  errors?: string | string[];
  statusCode: number;
  timestamp?: string;
}

export const validateMachineScan = async (
  payload: MachineScanPayload,
  signal?: AbortSignal,
): Promise<MachineScanResponse> => {
  const { data } = await apiClient.post<MachineScanResponse>(
    "/track-trace/scan/machine-item",
    payload,
    {
      signal,
      timeout: 30_000,
    },
  );

  return data;
};
