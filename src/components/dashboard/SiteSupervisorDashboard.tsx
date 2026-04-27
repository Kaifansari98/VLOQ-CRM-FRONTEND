"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import { useAppSelector } from "@/redux/store";
import {
  useLeadStatusWiseCounts,
  useAvgDaysToInstallation,
  useSiteSupervisorMiscItems,
  useSiteSupervisorUpcomingSites,
  useSiteSupervisorServiceCounts,
} from "@/api/dashboard/useDashboard";
import SiteSupervisorPipelineCard from "./SiteSupervisorPipelineCard";
import SiteSupervisorServicesCard from "./SiteSupervisorServicesCard";
import AvgDaysToInstallationCard from "./AvgDaysToInstallationCard";
import SiteSupervisorMiscTable from "./SiteSupervisorMiscTable";
import SiteSupervisorUpcomingSitesTable from "./SiteSupervisorUpcomingSitesTable";

export default function SiteSupervisorDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendor_id ?? 0;
  const userId = user?.id ?? 0;

  const { data: leadCounts, isLoading: isLoadingCounts } =
    useLeadStatusWiseCounts(vendorId, userId);

  const { data: serviceCounts, isLoading: isLoadingServices } =
    useSiteSupervisorServiceCounts(vendorId, userId);

  const { data: installationData, isLoading: isLoadingInstallation } =
    useAvgDaysToInstallation(vendorId, userId);

  const { data: miscItems, isLoading: isLoadingMisc } =
    useSiteSupervisorMiscItems(vendorId, userId);

  const { data: upcomingSites, isLoading: isLoadingUpcomingSites } =
    useSiteSupervisorUpcomingSites(vendorId, userId);

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
            <SiteSupervisorServicesCard
              total={serviceCounts?.total || 0}
              completed={serviceCounts?.completed || 0}
              pending={serviceCounts?.pending || 0}
              isLoading={isLoadingServices}
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

      {/* Unresolved Misc (left) + Upcoming Sites (right) */}
      <div className="w-full flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <SiteSupervisorMiscTable data={miscItems} isLoading={isLoadingMisc} />
        </div>
        <div className="w-full lg:w-1/2">
          <SiteSupervisorUpcomingSitesTable
            data={upcomingSites}
            isLoading={isLoadingUpcomingSites}
          />
        </div>
      </div>
    </div>
  );
}
