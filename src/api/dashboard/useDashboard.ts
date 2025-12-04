"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSalesExecutiveTaskStats,
  getPerformanceSnapshot,
  getLeadStatusWiseCounts,
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
  userId: number
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
      const snapshot = await getPerformanceSnapshot(vendorId, userId);
      setData(snapshot);
    } catch (err) {
      logError("Failed to fetch performance snapshot:", err);
      setError("Failed to load performance data");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, userId]); // ADD dependencies here

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
  userId: number
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
      const res = await getAvgDaysToConvertLeadToBooking(vendorId, userId);
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
  }, [vendorId, userId]);

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

// Stage counts hook
export interface UseStageCountsResult {
  data: SalesExecutiveStageCounts | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
export function useSalesExecutiveStageCounts(
  vendorId: number,
  userId: number
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
      const res = await getSalesExecutiveStageCounts(vendorId, userId);
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
  }, [vendorId, userId]);

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