"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FactoryLeadBifurcationCard from "@/components/dashboard/FactoryLeadBifurcationCard";
import AvgDaysToInstallationCard from "@/components/dashboard/AvgDaysToInstallationCard";
import {
  useFactoryLeadBifurcation,
  useFactoryAvgProductionToRTD,
} from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";

export default function FactoryDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) ?? 0;

  const { data: bifurcation, isLoading: isLoadingBifurcation } =
    useFactoryLeadBifurcation(vendorId);

  const { data: avgRTD, isLoading: isLoadingAvgRTD } =
    useFactoryAvgProductionToRTD(vendorId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <FactoryLeadBifurcationCard
            preProdCount={bifurcation?.preProdCount ?? 0}
            underProdCount={bifurcation?.underProdCount ?? 0}
            isLoading={isLoadingBifurcation}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <AvgDaysToInstallationCard
            avgDays={avgRTD?.avgDays ?? 0}
            readable={avgRTD?.readable ?? { days: 0, hours: 0, minutes: 0 }}
            isLoading={isLoadingAvgRTD}
            title="Avg Timeline – Production to RTD"
            subtitle="Pre-Prod Done → Ready to Dispatch"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
