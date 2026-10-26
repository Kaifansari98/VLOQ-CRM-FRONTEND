// useTraceTraceDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { getTraceTraceDashboard } from "@/api/track-trace/track-trace-dashboard.api";
import type { MachineFabrication } from "@/types/track-trace";

export const TRACE_TRACE_DASHBOARD_KEY = (
  vendorId: number,
  status: string = "all",
  fabrication?: MachineFabrication,
) => ["trace-trace-dashboard", vendorId, status, fabrication ?? "ALL"] as const;

export function useTraceTraceDashboard(
  vendorId?: number,
  status: string = "all",
  fabrication?: MachineFabrication,
) {
  return useQuery({
    queryKey: TRACE_TRACE_DASHBOARD_KEY(vendorId ?? 0, status, fabrication),
    queryFn: () => getTraceTraceDashboard(vendorId!, status, { fabrication }),
    enabled: !!vendorId,
    staleTime: 10000, // 10s — scan counts change frequently
    refetchInterval: 30000,
  });
}
