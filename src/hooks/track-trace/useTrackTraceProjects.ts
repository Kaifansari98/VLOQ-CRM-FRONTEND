import { useQuery } from "@tanstack/react-query";
import { getAllTrackTraceProjects,fetchMachineTypes } from "@/api/track-trace/track-trace.api";
import { TrackTraceProject } from "@/types/track-trace/track-trace.types";

import { useAppSelector } from "@/redux/store";

export function useTrackTraceProjects(vendorId?: number) {
  return useQuery<TrackTraceProject[]>({
    queryKey: ["track-trace-projects", vendorId],
    queryFn: () => getAllTrackTraceProjects(vendorId!),
    enabled: !!vendorId,
    // staleTime: 1000 * 60 * 5, // cache 5 min
  });
}

export const useMachineTypes = (vendorId?: number) => {
  const authVendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const targetVendorId = vendorId ?? authVendorId;

  return useQuery({
    queryKey: ["machine-types", targetVendorId],
    queryFn: () => fetchMachineTypes(targetVendorId),
  });
};