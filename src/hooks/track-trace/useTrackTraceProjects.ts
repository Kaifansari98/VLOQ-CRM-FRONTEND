import { useQuery } from "@tanstack/react-query";
import { getAllTrackTraceProjects } from "@/api/track-trace/track-trace.api";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

export function useTrackTraceProjects(vendorId?: number) {
  return useQuery<TrackTraceProject[]>({
    queryKey: ["track-trace-projects", vendorId],
    queryFn: () => getAllTrackTraceProjects(vendorId!),
    enabled: !!vendorId,
    // staleTime: 1000 * 60 * 5, // cache 5 min
  });
}
