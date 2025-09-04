import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { GetDesigningStageResponse } from "@/types/designing-stage-types";

// ✅ Define the response type (adjust fields once API shape is confirmed)
export interface DesigningStageLead {
  id: number;
  name: string;
  email?: string;
  contact?: string;
  status?: number;
  createdAt?: string;
  [key: string]: any; // fallback for unknown fields
}

export interface MoveToDesigningStagePayload {
  lead_id: number;
  user_id: number;
  vendor_id: number;
}

// ✅ Define the expected response (adjust to match your backend)
export interface MoveToDesigningStageResponse {
  success: boolean;
  message: string;
  data?: any;
}

// ✅ API function
const moveToDesigningStage = async (
  payload: MoveToDesigningStagePayload
): Promise<MoveToDesigningStageResponse> => {
  const { data } = await apiClient.post<MoveToDesigningStageResponse>(
    "/leads/designing-stage/update-status",
    payload
  );
  return data;
};

// ✅ Hook
export const useMoveToDesigningStage = () => {
  return useMutation<
    MoveToDesigningStageResponse,
    Error,
    MoveToDesigningStagePayload
  >({
    mutationFn: moveToDesigningStage,
  });
};

// ✅ API function
export const fetchDesigningStageLeads = async (
  vendorId: number,
  status: number
): Promise<GetDesigningStageResponse> => {
  const { data } = await apiClient.get<GetDesigningStageResponse>(
    `/leads/designing-stage/vendor/${vendorId}/status/${status}`
  );
  return data;
};
