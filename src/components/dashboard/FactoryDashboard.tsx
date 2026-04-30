"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FactoryLeadBifurcationCard from "@/components/dashboard/FactoryLeadBifurcationCard";
import { useFactoryLeadBifurcation } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";

export default function FactoryDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) ?? 0;

  const { data: bifurcation, isLoading: isLoadingBifurcation } =
    useFactoryLeadBifurcation(vendorId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full max-w-md">
        <FactoryLeadBifurcationCard
          preProdCount={bifurcation?.preProdCount ?? 0}
          underProdCount={bifurcation?.underProdCount ?? 0}
          isLoading={isLoadingBifurcation}
        />
      </div>
    </div>
  );
}
