import { useQuery } from "@tanstack/react-query";
import {
  getProjectItemTracking,
  ProjectItemTrackingQuery,
  ProjectItemTrackingResponse,
} from "@/api/track-trace/track-trace-items.api";

export const PROJECT_ITEM_TRACKING_KEY = (
  vendorId?: number,
  projectId?: string | number,
  query?: ProjectItemTrackingQuery,
) =>
  [
    "project-item-tracking",
    vendorId,
    projectId,
    query?.page,
    query?.limit,
    query?.search,
    query?.scanStatus,
    query?.machineId,
    query?.stage,
    query?.category,
    query?.group,
  ] as const;

export function useProjectItemTracking(
  vendorId?: number,
  projectId?: string | number,
  query: ProjectItemTrackingQuery = {},
) {
  return useQuery<ProjectItemTrackingResponse>({
    queryKey: PROJECT_ITEM_TRACKING_KEY(vendorId, projectId, query),
    queryFn: () => getProjectItemTracking(vendorId!, projectId!, query),
    enabled: Boolean(vendorId && projectId),
    staleTime: 5000,
    refetchInterval: 15000,
  });
}
