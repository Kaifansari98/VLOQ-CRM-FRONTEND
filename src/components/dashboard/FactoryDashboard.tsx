"use client";
import { useMemo } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FactoryLeadBifurcationCard from "@/components/dashboard/FactoryLeadBifurcationCard";
import AvgDaysToInstallationCard from "@/components/dashboard/AvgDaysToInstallationCard";
import { useFactoryAvgProductionToRTD, useSiteSupervisorMiscItems, useFactoryERDCalendar, useFactoryUpcomingDispatches } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import SiteSupervisorMiscTable from "@/components/dashboard/SiteSupervisorMiscTable";
import FactoryERDCalendarTable from "@/components/dashboard/FactoryERDCalendarTable";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import {
  type UniversalStagePostPayload,
  useUniversalStageLeadsPost,
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

  const productionSummaryPayload = useMemo<UniversalStagePostPayload>(
    () => ({
      userId,
      franchise_id:
        shouldIncludeFranchise && franchiseId != null ? franchiseId : undefined,
      tag: "Type 10",
      page: 1,
      limit: 5000,
      filter_name: "",
      filter_lead_code: "",
      contact: "",
      alt_contact_no: "",
      email: "",
      site_address: "",
      archetech_name: "",
      designer_remark: "",
      furniture_type: [],
      furniture_structure: [],
      site_type: [],
      source: [],
      assign_to: [],
      site_map_link: null,
      created_at: "desc",
      global_search: "",
    }),
    [franchiseId, shouldIncludeFranchise, userId],
  );

  const { data: productionSummaryData, isLoading: isLoadingBifurcation } =
    useUniversalStageLeadsPost(vendorId, productionSummaryPayload);

  const bifurcation = useMemo(() => {
    const counts = {
      pendingCount: 0,
      preProdDoneCount: 0,
      underProdCount: 0,
      completedCount: 0,
    };

    const leads = productionSummaryData?.data ?? [];

    leads.forEach((lead) => {
      const instances = lead.productStructureInstances ?? [];
      const productionInstances = instances.filter(
        (instance) =>
          instance?.is_tech_check_completed === true &&
          instance?.is_order_login_completed === true,
      );

      productionInstances.forEach((instance) => {
        if (instance?.is_production_completed) {
          counts.completedCount += 1;
          return;
        }

        if (instance?.is_under_production) {
          counts.underProdCount += 1;
          return;
        }

        if (instance?.is_pre_prod_done) {
          counts.preProdDoneCount += 1;
          return;
        }

        counts.pendingCount += 1;
      });
    });

    return counts;
  }, [productionSummaryData?.data]);

  const { data: avgRTD, isLoading: isLoadingAvgRTD } =
    useFactoryAvgProductionToRTD(vendorId);

  const { data: miscItems, isLoading: isLoadingMisc } =
    useSiteSupervisorMiscItems(vendorId, userId);

  const { data: erdItems, isLoading: isLoadingERD } =
    useFactoryERDCalendar(vendorId);

  const { data: dispatchItems, isLoading: isLoadingDispatches } =
    useFactoryUpcomingDispatches(vendorId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <FactoryLeadBifurcationCard
            pendingCount={bifurcation?.pendingCount ?? 0}
            preProdDoneCount={bifurcation?.preProdDoneCount ?? 0}
            underProdCount={bifurcation?.underProdCount ?? 0}
            completedCount={bifurcation?.completedCount ?? 0}
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

      <div className="w-full flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/2">
          <SiteSupervisorMiscTable data={miscItems} isLoading={isLoadingMisc} />
        </div>
        <div className="w-full lg:w-1/2">
          <FactoryERDCalendarTable
            erdData={erdItems}
            dispatchData={dispatchItems}
            isLoadingERD={isLoadingERD}
            isLoadingDispatches={isLoadingDispatches}
          />
        </div>
      </div>
    </div>
  );
}
