"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PreProdNewSitesCard from "@/components/dashboard/PreProdNewSitesCard";
import AvgDaysToInstallationCard from "@/components/dashboard/AvgDaysToInstallationCard";
import { usePreProdNewSites, usePreProdAvgTimeline } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";

export default function PreProdDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) ?? 0;

  const { data: newSites, isLoading: isLoadingNewSites } =
    usePreProdNewSites(vendorId);

  const { data: avgTimeline, isLoading: isLoadingAvg } =
    usePreProdAvgTimeline(vendorId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <PreProdNewSitesCard
            count={newSites?.count ?? 0}
            isLoading={isLoadingNewSites}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <AvgDaysToInstallationCard
            avgDays={avgTimeline?.avgDays ?? 0}
            readable={avgTimeline?.readable ?? { days: 0, hours: 0, minutes: 0 }}
            isLoading={isLoadingAvg}
            title="Avg Pre-Production Timeline"
            subtitle="Order Login Done → Pre-Prod Done"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
