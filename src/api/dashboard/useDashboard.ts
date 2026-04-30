"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSiteSupervisorAvgDaysToInstallation,
  getSiteSupervisorMiscItems,
  SiteSupervisorMiscItem,
  getSiteSupervisorUpcomingSites,
  SiteSupervisorUpcomingSite,
  getSiteSupervisorServiceCounts,
  SiteSupervisorServiceCounts,
  getSiteSupervisorPendingServices,
  SiteSupervisorPendingService,
  getAdminLostApprovalLeads,
  LostApprovalLead,
  getAdminTaskOverview,
  AdminTaskOverviewResponse,
  AdminTaskOverviewParams,
  getOverdueInstallations,
  OverdueInstallation,
  getSalesExecutiveTaskStats,
  getPerformanceSnapshot,
  getLeadStatusWiseCounts,
  getActiveFranchiseeCount,
  getLeadsThisMonth,
  getLeadsByFranchise,
  getOverdueProjectsCount,
  getFranchisePerformance,
  getAvgDaysPerStage,
  FranchiseLeadCount,
  FranchisePerformanceRow,
  AvgDaysPerStage,
  UiLeadStatusCounts,
  UiPerformanceSnapshot,
  UiSalesExecutiveTaskStats,
  getAvgDaysToConvertLeadToBooking,
  UiAvgDaysToBooking,
  getLeadStatusCounts,
  LeadStatusCounts,
  getSalesExecutiveStageLeads,
  getSalesExecutiveStageCounts,
  SalesExecutiveStageLeads,
  SalesExecutiveStageCounts,
  StageData,
  addPaymentLeads,
  getDashboardAllLeads,
  getAdminDashboardAllLeads,
  getSalesExecutiveActivityStatusCounts,
  SalesExecutiveActivityStatusCounts,
  getAdminProjectsOverview,
  AdminProjectsOverview,
  getAdminCompletedOverview,
  AdminCompletedOverview,
  getAdminLostApprovalOverview,
  AdminLostApprovalOverview,
  getAdminOrdersInPipeline,
  AdminOrdersInPipeline,
  getAdminTotalRevenue,
  AdminTotalRevenue,
  getAdminStageCounts,
  AdminStageCounts,
  getStageWiseCounts,
  StageWiseCount,
  getFranchiseLeads,
  FranchiseLead,
  getStageLeads,
  getOverdueProductionCount,
  getOverdueProduction,
  OverdueProduction,
  getPriorityLeadCounts,
  PriorityLeadCounts,
  getFactoryLeadBifurcation,
  FactoryLeadBifurcation,
  getFactoryAvgProductionToRTD,
  FactoryAvgProductionToRTD,
  getFactoryERDCalendar,
  FactoryERDCalendarItem,
  getFactoryUpcomingDispatches,
  FactoryUpcomingDispatch,
} from "./dashboard.api";
import { useCallback, useEffect, useState } from "react";
import { logError } from "@/lib/utils";

interface UsePerformanceSnapshotResult {
  data: UiPerformanceSnapshot | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ---------------------------------------------------
// 1️⃣ Hook → Sales Executive Task Stats
// ---------------------------------------------------
export function useSalesExecutiveTaskStats(vendorId: number, userId: number) {
  return useQuery<UiSalesExecutiveTaskStats>({
    queryKey: ["sales-executive-task-stats", vendorId, userId],
    queryFn: () => getSalesExecutiveTaskStats(vendorId, userId),
    enabled: !!vendorId && !!userId,
  });
}

// ---------------------------------------------------
// 2️⃣ Hook → Performance Snapshot
// ---------------------------------------------------
export function usePerformanceSnapshot(
  vendorId: number,
  userId: number,
  franchiseId?: number
): UsePerformanceSnapshotResult {
  const [data, setData] = useState<UiPerformanceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!vendorId || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const snapshot = await getPerformanceSnapshot(vendorId, userId, franchiseId);
      setData(snapshot);
    } catch (err) {
      logError("Failed to fetch performance snapshot:", err);
      setError("Failed to load performance data");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, userId, franchiseId]); // ADD dependencies here

  useEffect(() => {
    fetchData();
  }, [fetchData]); // use the function as dependency

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ---------------------------------------------------
// 3️⃣ Hook → Lead Status Wise Counts (1–16)
// ---------------------------------------------------
export function useLeadStatusWiseCounts(vendorId: number, userId?: number) {
  return useQuery<UiLeadStatusCounts>({
    queryKey: ["lead-status-wise-counts", vendorId, userId],
    queryFn: () => getLeadStatusWiseCounts(vendorId, userId),
    enabled: !!vendorId,
  });
}

export interface UseAvgDaysToBookingResult {
  data: UiAvgDaysToBooking | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAvgDaysToBooking(
  vendorId: number,
  userId: number,
  franchiseId?: number
): UseAvgDaysToBookingResult {
  const [data, setData] = useState<UiAvgDaysToBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!vendorId || !userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAvgDaysToConvertLeadToBooking(vendorId, userId, franchiseId);
      setData(res);
    } catch (err: any) {
      console.error("Failed to fetch avg days to booking:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vendorId, userId, franchiseId]);

  return { data, isLoading, error, refetch: fetchData };
}

export interface UseLeadStatusCountsResult {
  overall: LeadStatusCounts | null;
  mine: LeadStatusCounts | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeadStatusCounts(
  vendorId: number,
  userId: number
): UseLeadStatusCountsResult {
  const [overall, setOverall] = useState<LeadStatusCounts | null>(null);
  const [mine, setMine] = useState<LeadStatusCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!vendorId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const [overallRes, myRes] = await Promise.all([
        getLeadStatusCounts(vendorId),
        getLeadStatusCounts(vendorId, userId),
      ]);

      setOverall(overallRes.data);
      setMine(myRes.data);
    } catch (err: any) {
      console.error("Failed to fetch lead status counts:", err);
      setError(err.message || "Failed to load lead status data");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, userId]); // <<– Add dependencies here

  useEffect(() => {
    fetchData();
  }, [fetchData]); // <<– Only this dependency

  return { overall, mine, isLoading, error, refetch: fetchData };
}

export function useAdminProjectsOverview(vendorId?: number, franchiseId?: number) {
  return useQuery<AdminProjectsOverview>({
    queryKey: ["admin-projects-overview", vendorId, franchiseId],
    queryFn: () => getAdminProjectsOverview(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function useAdminCompletedOverview(vendorId?: number, franchiseId?: number) {
  return useQuery<AdminCompletedOverview>({
    queryKey: ["admin-completed-overview", vendorId, franchiseId],
    queryFn: () => getAdminCompletedOverview(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function useAdminLostApprovalOverview(vendorId?: number, franchiseId?: number) {
  return useQuery<AdminLostApprovalOverview>({
    queryKey: ["admin-lost-approval-overview", vendorId, franchiseId],
    queryFn: () => getAdminLostApprovalOverview(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function useAdminOrdersInPipeline(vendorId?: number) {
  return useQuery<AdminOrdersInPipeline>({
    queryKey: ["admin-orders-in-pipeline", vendorId],
    queryFn: () => getAdminOrdersInPipeline(vendorId!),
    enabled: !!vendorId,
  });
}

export function useAdminTotalRevenue(vendorId?: number, franchiseId?: number) {
  return useQuery<AdminTotalRevenue>({
    queryKey: ["admin-total-revenue", vendorId, franchiseId],
    queryFn: () => getAdminTotalRevenue(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function useAvgDaysPerStage(vendorId?: number, franchiseId?: number) {
  return useQuery<AvgDaysPerStage>({
    queryKey: ["avg-days-per-stage", vendorId, franchiseId],
    queryFn: () => getAvgDaysPerStage(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function useFranchisePerformance(vendorId?: number) {
  return useQuery<FranchisePerformanceRow[]>({
    queryKey: ["franchise-performance", vendorId],
    queryFn: () => getFranchisePerformance(vendorId!),
    enabled: !!vendorId,
  });
}

export function useOverdueProjectsCount(vendorId?: number) {
  return useQuery<{ count: number }>({
    queryKey: ["overdue-projects-count", vendorId],
    queryFn: () => getOverdueProjectsCount(vendorId!),
    enabled: !!vendorId,
  });
}

export function useLeadsByFranchise(vendorId?: number) {
  return useQuery<FranchiseLeadCount[]>({
    queryKey: ["leads-by-franchise", vendorId],
    queryFn: () => getLeadsByFranchise(vendorId!),
    enabled: !!vendorId,
  });
}

export function useLeadsThisMonth(vendorId?: number) {
  return useQuery<{ count: number }>({
    queryKey: ["leads-this-month", vendorId],
    queryFn: () => getLeadsThisMonth(vendorId!),
    enabled: !!vendorId,
  });
}

export function useOverdueInstallations(vendorId?: number, franchiseId?: number) {
  return useQuery<OverdueInstallation[]>({
    queryKey: ["overdue-installations", vendorId, franchiseId],
    queryFn: () => getOverdueInstallations(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function useActiveFranchiseeCount(vendorId?: number) {
  return useQuery<{ count: number }>({
    queryKey: ["active-franchisee-count", vendorId],
    queryFn: () => getActiveFranchiseeCount(vendorId!),
    enabled: !!vendorId,
  });
}

export function useAdminStageCounts(vendorId?: number, franchiseId?: number) {
  return useQuery<AdminStageCounts>({
    queryKey: ["admin-stage-counts", vendorId, franchiseId],
    queryFn: () => getAdminStageCounts(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

export function usePriorityLeadCounts(vendorId?: number, franchiseId?: number) {
  return useQuery<PriorityLeadCounts>({
    queryKey: ["priority-lead-counts", vendorId, franchiseId],
    queryFn: () => getPriorityLeadCounts(vendorId!, franchiseId),
    enabled: !!vendorId,
  });
}

// Stage counts hook
export interface UseStageCountsResult {
  data: SalesExecutiveStageCounts | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
export function useSalesExecutiveStageCounts(
  vendorId: number,
  userId: number,
  franchiseId?: number
): UseStageCountsResult {
  const [data, setData] = useState<SalesExecutiveStageCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!vendorId || !userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await getSalesExecutiveStageCounts(vendorId, userId, franchiseId);
      setData(res);
    } catch (err: any) {
      console.error("Failed to fetch stage counts:", err);
      setError(err.message || "Failed to load stage counts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vendorId, userId, franchiseId]);

  return { data, isLoading, error, refetch: fetchData };
}

// Stage leads hook (not used yet)
export interface UseStageLeadsResult {
  data: SalesExecutiveStageLeads | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
export function useSalesExecutiveStageLeads(
  vendorId: number,
  userId: number
): UseStageLeadsResult {
  const [data, setData] = useState<SalesExecutiveStageLeads | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!vendorId || !userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await getSalesExecutiveStageLeads(vendorId, userId);
      setData(res);
    } catch (err: any) {
      console.error("Failed to fetch stage leads:", err);
      setError(err.message || "Failed to load stage leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vendorId, userId]);

  return { data, isLoading, error, refetch: fetchData };
}

export const useAddPaymentLeads = (vendorId: number, userId: number) => {
  return useQuery<StageData>({
    queryKey: ["payment-leads", vendorId, userId],
    queryFn: () => addPaymentLeads(vendorId, userId),
    enabled: !!vendorId && !!userId, // Prevents undefined requests
    staleTime: 1000 * 60 * 5, // 5 minutes caching
    refetchOnWindowFocus: false, // avoid unnecessary refetch
  });
};

export const useGetDashboardAllLeads = (vendorId: number, userId: number) => {
  return useQuery<StageData>({
    queryKey: ["dashboard-leads", vendorId, userId],
    queryFn: () => getDashboardAllLeads(vendorId, userId),
    enabled: !!vendorId && !!userId, // Prevents undefined requests
    staleTime: 1000 * 60 * 5, // 5 minutes caching
    refetchOnWindowFocus: false, // avoid unnecessary refetch
  });
};

export const useGetAdminDashboardAllLeads = (vendorId: number, franchiseId?: number) => {
  return useQuery<StageData>({
    queryKey: ["admin-dashboard-leads", vendorId, franchiseId],
    queryFn: () => getAdminDashboardAllLeads(vendorId, franchiseId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useSalesExecutiveActivityStatusCounts = (
  vendorId?: number,
  userId?: number
) => {
  return useQuery<SalesExecutiveActivityStatusCounts>({
    queryKey: ["sales-executive-activity-status-counts", vendorId, userId],
    queryFn: () => getSalesExecutiveActivityStatusCounts(vendorId!, userId!),
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60,
  });
};

export function useStageWiseCounts(vendorId?: number, franchiseId?: number) {
  return useQuery<StageWiseCount[]>({
    queryKey: ["stage-wise-counts", vendorId, franchiseId],
    queryFn: () => getStageWiseCounts(vendorId!, franchiseId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFranchiseLeads(vendorId?: number, franchiseId?: number) {
  return useQuery<FranchiseLead[]>({
    queryKey: ["franchise-leads", vendorId, franchiseId],
    queryFn: () => getFranchiseLeads(vendorId!, franchiseId!),
    enabled: !!vendorId && !!franchiseId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useStageLeads(vendorId?: number, tag?: string, franchiseId?: number) {
  return useQuery<FranchiseLead[]>({
    queryKey: ["stage-leads", vendorId, tag, franchiseId],
    queryFn: () => getStageLeads(vendorId!, tag!, franchiseId),
    enabled: !!vendorId && !!tag,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSiteSupervisorServiceCounts(vendorId: number, userId: number) {
  return useQuery<SiteSupervisorServiceCounts>({
    queryKey: ["site-supervisor-service-counts", vendorId, userId],
    queryFn: () => getSiteSupervisorServiceCounts(vendorId, userId),
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSiteSupervisorUpcomingSites(vendorId: number, userId: number) {
  return useQuery<SiteSupervisorUpcomingSite[]>({
    queryKey: ["site-supervisor-upcoming-sites", vendorId, userId],
    queryFn: () => getSiteSupervisorUpcomingSites(vendorId, userId),
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSiteSupervisorMiscItems(vendorId: number, userId: number) {
  return useQuery<SiteSupervisorMiscItem[]>({
    queryKey: ["site-supervisor-misc-items", vendorId, userId],
    queryFn: () => getSiteSupervisorMiscItems(vendorId, userId),
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSiteSupervisorPendingServices(
  vendorId: number,
  userId: number,
  filter: "month" | "year"
) {
  return useQuery<SiteSupervisorPendingService[]>({
    queryKey: ["site-supervisor-pending-services", vendorId, userId, filter],
    queryFn: () => getSiteSupervisorPendingServices(vendorId, userId, filter),
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAvgDaysToInstallation(vendorId: number, userId: number) {
  return useQuery<UiAvgDaysToBooking>({
    queryKey: ["avg-days-to-installation", vendorId, userId],
    queryFn: () => getSiteSupervisorAvgDaysToInstallation(vendorId, userId),
    enabled: !!vendorId && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useOverdueProductionCount(vendorId?: number) {
  return useQuery<{ count: number }>({
    queryKey: ["overdue-production-count", vendorId],
    queryFn: () => getOverdueProductionCount(vendorId!),
    enabled: !!vendorId,
  });
}

export function useOverdueProduction(vendorId?: number, franchiseId?: number) {
  return useQuery<OverdueProduction[]>({
    queryKey: ["overdue-production", vendorId, franchiseId],
    queryFn: () => getOverdueProduction(vendorId!, franchiseId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminLostApprovalLeads(vendorId?: number, franchiseId?: number) {
  return useQuery<LostApprovalLead[]>({
    queryKey: ["admin-lost-approval-leads", vendorId, franchiseId],
    queryFn: () => getAdminLostApprovalLeads(vendorId!, franchiseId),
    enabled: false,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAdminTaskOverview(vendorId?: number, params: AdminTaskOverviewParams = {}) {
  return useQuery<AdminTaskOverviewResponse>({
    queryKey: ["admin-task-overview", vendorId, params],
    queryFn: () => getAdminTaskOverview(vendorId!, params),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFactoryLeadBifurcation(vendorId: number) {
  return useQuery<FactoryLeadBifurcation>({
    queryKey: ["factory-lead-bifurcation", vendorId],
    queryFn: () => getFactoryLeadBifurcation(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFactoryUpcomingDispatches(vendorId: number) {
  return useQuery<FactoryUpcomingDispatch[]>({
    queryKey: ["factory-upcoming-dispatches", vendorId],
    queryFn: () => getFactoryUpcomingDispatches(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFactoryERDCalendar(vendorId: number) {
  return useQuery<FactoryERDCalendarItem[]>({
    queryKey: ["factory-erd-calendar", vendorId],
    queryFn: () => getFactoryERDCalendar(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFactoryAvgProductionToRTD(vendorId: number) {
  return useQuery<FactoryAvgProductionToRTD>({
    queryKey: ["factory-avg-production-to-rtd", vendorId],
    queryFn: () => getFactoryAvgProductionToRTD(vendorId),
    enabled: !!vendorId,
    staleTime: 1000 * 60 * 2,
  });
}
