"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import { useAppSelector } from "@/redux/store";
import {
  useLeadStatusWiseCounts,
  usePerformanceSnapshot,
  useAvgDaysToInstallation,
} from "@/api/dashboard/useDashboard";
import SiteSupervisorPipelineCard from "./SiteSupervisorPipelineCard";
import LeadsSummaryCard from "./LeadsSummaryCard";
import AvgDaysToInstallationCard from "./AvgDaysToInstallationCard";

export default function SiteSupervisorDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendor_id ?? 0;
  const userId = user?.id ?? 0;

  const { data: leadCounts, isLoading: isLoadingCounts } =
    useLeadStatusWiseCounts(vendorId, userId);

  const { data: perfData, isLoading: isLoadingPerf } = usePerformanceSnapshot(
    vendorId,
    userId
  );

  const { data: installationData, isLoading: isLoadingInstallation } =
    useAvgDaysToInstallation(vendorId, userId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full h-full flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="lg:w-[60%]">
          <SiteSupervisorPipelineCard
            data={leadCounts}
            isLoading={isLoadingCounts}
          />
        </div>
        <div className="lg:w-[40%] flex flex-col">
          <AssignedTaskCard />
          <div className="flex flex-col w-full sm:flex-row sm:gap-4">
            <LeadsSummaryCard
              assigned={perfData?.totalLeadsAssigned || 0}
              completed={perfData?.totalCompletedLeads || 0}
              pending={perfData?.totalPendingLeads || 0}
              isLoading={isLoadingPerf}
            />
            <AvgDaysToInstallationCard
              avgDays={installationData?.avgDays || 0}
              readable={
                installationData?.readable || { days: 0, hours: 0, minutes: 0 }
              }
              isLoading={isLoadingInstallation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
