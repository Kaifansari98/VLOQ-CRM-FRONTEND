"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import { useAppSelector } from "@/redux/store";
import {
  useLeadStatusWiseCounts,
  useAvgDaysToInstallation,
  useSiteSupervisorMiscItems,
} from "@/api/dashboard/useDashboard";
import SiteSupervisorPipelineCard from "./SiteSupervisorPipelineCard";
import AvgDaysToInstallationCard from "./AvgDaysToInstallationCard";
import SiteSupervisorMiscTable from "./SiteSupervisorMiscTable";
import SiteSupervisorPendingServicesTable from "./SiteSupervisorPendingServicesTable";
import SupervisorLeadsTable from "./SupervisorLeadsTable";

export default function HeadSiteSupervisorDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const vendorId = user?.vendor_id ?? 0;
  const userId = user?.id ?? 0;

  const { data: leadCounts, isLoading: isLoadingCounts } =
    useLeadStatusWiseCounts(vendorId, userId);

  const { data: installationData, isLoading: isLoadingInstallation } =
    useAvgDaysToInstallation(vendorId, userId);

  const { data: miscItems, isLoading: isLoadingMisc } =
    useSiteSupervisorMiscItems(vendorId, userId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full h-full flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="lg:w-[60%]">
          <SiteSupervisorPipelineCard
            data={leadCounts}
            isLoading={isLoadingCounts}
            miscItems={miscItems}
          />
        </div>
        <div className="lg:w-[40%]">
          <SupervisorLeadsTable vendorId={vendorId} />
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <AssignedTaskCard className="h-full min-h-[150px] flex flex-col" />
        </div>
        <div className="w-full lg:w-1/2">
          <AvgDaysToInstallationCard
            avgDays={installationData?.avgDays || 0}
            readable={
              installationData?.readable || { days: 0, hours: 0, minutes: 0 }
            }
            isLoading={isLoadingInstallation}
            className="h-full min-h-[150px]"
          />
        </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <SiteSupervisorMiscTable data={miscItems} isLoading={isLoadingMisc} />
        </div>
        <div className="w-full lg:w-1/2">
          <SiteSupervisorPendingServicesTable />
        </div>
      </div>
    </div>
  );
}
