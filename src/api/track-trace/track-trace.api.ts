import { apiClient } from "@/lib/apiClient";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

export const getAllTrackTraceProjects = async (
  vendorId: number
): Promise<TrackTraceProject[]> => {
  const { data } = await apiClient.get(
    `/track-trace/project/${vendorId}`
  );

  // Because your API wraps data inside ApiResponse.success()
  return data.data;
};

