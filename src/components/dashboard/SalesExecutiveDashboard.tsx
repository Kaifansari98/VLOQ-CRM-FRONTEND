"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import PerformanceBarChart from "./PerformanceBarChart";
import { useAppSelector } from "@/redux/store";
import { getPerformanceSnapshot } from "@/api/dashboard/dashboard.api";
import type { UiPerformanceSnapshot } from "@/api/dashboard/dashboard.api";
import LeadsSummaryCard from "./LeadsSummaryCard";
import {
  useAvgDaysToBooking,
  useLeadStatusCounts,
  usePerformanceSnapshot,
  useSalesExecutiveStageCounts,
} from "@/api/dashboard/useDashboard";
import BookingValueCard from "./BookingValueCard";
import AvgDaysToBookingCard from "./AvgDaysToBookingCard";
import EnhancedStageOverview from "./LeadStatusComparisonCard";
import { SalesExecutiveStageCounts } from "@/api/dashboard/dashboard.api";

export default function SalesExecutiveDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendor?.id!;
  const userId = user?.id!;

  const [performanceData, setPerformanceData] =
    useState<UiPerformanceSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data } = usePerformanceSnapshot(vendorId, userId);

  const { data: avgBookingData, isLoading: isLoadingAvg } = useAvgDaysToBooking(
    vendorId,
    userId
  );

  const { data: stageCounts, isLoading: isLoadingStageCounts } =
    useSalesExecutiveStageCounts(vendorId, userId);

  const [leadFilter, setLeadFilter] = useState<"week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!vendorId || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getPerformanceSnapshot(vendorId, userId);
        setPerformanceData(data);
        console.log(data);
      } catch (err: any) {
        console.error("Failed to fetch performance data:", err);
        setError(err.message || "Failed to load performance data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, [vendorId, userId]);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      {/* Top Greeting + Date/Time */}
      <DashboardHeader />

      {/* Performance Chart + Assigned Tasks */}
      <div className="w-full h-full flex gap-4 items-stretch  ">
        <div className="w-[60%]">
          <EnhancedStageOverview
            data={stageCounts}
            isLoading={isLoadingStageCounts}
          />
        </div>
        <div className="w-[40%] flex flex-col">
          <AssignedTaskCard />
          <div className="flex  flex-row gap-4">
            <LeadsSummaryCard
              assigned={data?.totalLeadsAssigned || 0}
              completed={data?.totalCompletedLeads || 0}
              pending={data?.totalPendingLeads || 0}
              isLoading={isLoading}
            />
            <AvgDaysToBookingCard
              avgDays={avgBookingData?.avgDays || 0}
              readable={
                avgBookingData?.readable || { days: 0, hours: 0, minutes: 0 }
              }
              isLoading={isLoadingAvg}
            />
          </div>
        </div>
      </div>
      
      {/* Booking value and  Total booking */}
      <div className="w-full h-full flex gap-4 items-stretch">
        <div className="w-[40%]">
          <BookingValueCard
            data={
              performanceData
                ? {
                    bookingValueThisWeekArray:
                      performanceData.bookingValueThisWeekArray,
                    bookingValueThisMonthArray:
                      performanceData.bookingValueThisMonthArray,
                    bookingValueThisYearArray:
                      performanceData.bookingValueThisYearArray,
                    bookingValueThisWeek: performanceData.bookingValueThisWeek,
                    bookingValueThisMonth:
                      performanceData.bookingValueThisMonth,
                    bookingValueThisYear: performanceData.bookingValueThisYear,
                  }
                : undefined
            }
            isLoading={isLoading}
          />
        </div>

        <div className="w-[60%]">
          <PerformanceBarChart
            data={
              performanceData
                ? {
                    bookedThisWeek: performanceData.bookedThisWeek,
                    bookedThisMonth: performanceData.bookedThisMonth,
                    bookedThisYear: performanceData.bookedThisYear,
                    bookedOverall: performanceData.bookedOverall,
                    bookedThisWeekTotal: performanceData.bookedThisWeekTotal,
                    bookedThisMonthTotal: performanceData.bookedThisMonthTotal,
                    bookedThisYearTotal: performanceData.bookedThisYearTotal,
                  }
                : undefined
            }
            isLoading={isLoading}
          />
        </div>

        {/* <div className="w-[60%]">
          <div className="h-[200px] bg-red-800"></div>
        </div> */}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Other dashboard sections will come below */}
    </div>
  );
}
