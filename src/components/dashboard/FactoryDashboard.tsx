"use client";

import { useMemo } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FactoryLeadBifurcationCard from "@/components/dashboard/FactoryLeadBifurcationCard";
import AvgDaysToInstallationCard from "@/components/dashboard/AvgDaysToInstallationCard";
import { useFactoryAvgProductionToRTD, useSiteSupervisorMiscItems } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import SiteSupervisorMiscTable from "@/components/dashboard/SiteSupervisorMiscTable";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import {
  type VendorLeadsByTagPostPayload,
  useVendorLeadsByTagPost,
} from "@/api/universalstage";

export default function FactoryDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) ?? 0;
  const userId = useAppSelector((s) => s.auth.user?.id) ?? 0;
  const userType = useAppSelector((s) => s.auth.user?.user_type.user_type);
  const franchiseId = useAppSelector(
    (s) => s.auth.franchise_id ?? s.auth.user?.franchise_id,
  );
  const normalizedUserType = userType?.toLowerCase();
  const shouldIncludeFranchise =
    normalizedUserType === "admin" ||
    normalizedUserType === "super-admin" ||
    normalizedUserType === "sales-executive" ||
    normalizedUserType === "head-site-supervisor";

  const baseBifurcationPayload = useMemo<VendorLeadsByTagPostPayload>(
    () => ({
      franchise_id:
        shouldIncludeFranchise && franchiseId != null ? franchiseId : undefined,
      tag: "Type 10",
      page: 1,
      limit: 20,
      global_search: "",
      created_at: "desc" as const,
    }),
    [franchiseId, shouldIncludeFranchise],
  );

  const preProdDonePayload = useMemo<VendorLeadsByTagPostPayload>(
    () => ({
      ...baseBifurcationPayload,
      production_status: "Pre Prod Done",
    }),
    [baseBifurcationPayload],
  );

  const underProductionPayload = useMemo<VendorLeadsByTagPostPayload>(
    () => ({
      ...baseBifurcationPayload,
      production_status: "Under Production",
    }),
    [baseBifurcationPayload],
  );

  const { data: preProdDoneData, isLoading: isLoadingPreProdDone } =
    useVendorLeadsByTagPost(vendorId, preProdDonePayload);

  const { data: underProductionData, isLoading: isLoadingUnderProduction } =
    useVendorLeadsByTagPost(vendorId, underProductionPayload);

  const isLoadingBifurcation =
    isLoadingPreProdDone || isLoadingUnderProduction;

  const bifurcation = useMemo(
    () => ({
      preProdCount: preProdDoneData?.count ?? 0,
      underProdCount: underProductionData?.count ?? 0,
    }),
    [preProdDoneData?.count, underProductionData?.count],
  );

  const { data: avgRTD, isLoading: isLoadingAvgRTD } =
    useFactoryAvgProductionToRTD(vendorId);

  const { data: miscItems, isLoading: isLoadingMisc } =
    useSiteSupervisorMiscItems(vendorId, userId);

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
        <div className="w-full sm:w-1/2 flex flex-col gap-4">
          <AssignedTaskCard />
          <AvgDaysToInstallationCard
            avgDays={avgRTD?.avgDays ?? 0}
            readable={avgRTD?.readable ?? { days: 0, hours: 0, minutes: 0 }}
            isLoading={isLoadingAvgRTD}
            title="Avg Timeline – Production to RTD"
            subtitle="Pre-Prod Done → Ready to Dispatch"
          />
        </div>
      </div>

      <div className="w-full flex">
        <div className="w-full lg:w-1/2">
          <SiteSupervisorMiscTable data={miscItems} isLoading={isLoadingMisc} />
        </div>
      </div>
    </div>
  );
}
