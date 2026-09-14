// useTraceTraceDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { getTraceTraceDashboard } from "@/api/track-trace/track-trace-dashboard.api";

export const TRACE_TRACE_DASHBOARD_KEY = (vendorId: number, status: string = "all") =>
  ["trace-trace-dashboard", vendorId, status] as const;

export function useTraceTraceDashboard(vendorId?: number, status: string = "all") {
  return useQuery({
    queryKey: TRACE_TRACE_DASHBOARD_KEY(vendorId ?? 0, status),
    queryFn: () => getTraceTraceDashboard(vendorId!, status),
    enabled: !!vendorId,
    staleTime: 10000, // 10s — scan counts change frequently
    refetchInterval: 30000,
  });
}