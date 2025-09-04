import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/apiClient"

export interface MoveToDesigningStagePayload {
    lead_id: number
    user_id: number
    vendor_id: number
}

// ✅ Define the expected response (adjust to match your backend)
export interface MoveToDesigningStageResponse {
    success: boolean
    message: string
    data?: any
}

// ✅ API function
const moveToDesigningStage = async (
    payload: MoveToDesigningStagePayload
  ): Promise<MoveToDesigningStageResponse> => {
    const { data } = await apiClient.post<MoveToDesigningStageResponse>(
      "/leads/designing-stage/update-status",
      payload
    )
    return data
}

// ✅ Hook
export const useMoveToDesigningStage = () => {
    return useMutation<MoveToDesigningStageResponse, Error, MoveToDesigningStagePayload>({
      mutationFn: moveToDesigningStage,
    })
}