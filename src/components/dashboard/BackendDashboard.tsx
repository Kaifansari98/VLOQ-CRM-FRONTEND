"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AssignedTaskCard } from "@/components/dashboard/AssignedTaskCard";
import AvgDaysToInstallationCard from "@/components/dashboard/AvgDaysToInstallationCard";
import {
  useBackendNewOrderLoginLeads,
  useBackendAvgOLToProduction,
} from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CountCardProps {
  count: number;
  isLoading: boolean;
}

function NewOrderLoginCard({ count, isLoading }: CountCardProps) {
  return (
    <Card className="w-full border bg-background h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          New Leads in Order Login Stage
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Leads currently at Type 9 — Order Login
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-12 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-tight">{count}</span>
            <span className="text-sm text-muted-foreground mb-1">leads</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BackendDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) ?? 0;

  const { data: orderLoginData, isLoading: isLoadingOL } =
    useBackendNewOrderLoginLeads(vendorId);

  const { data: avgData, isLoading: isLoadingAvg } =
    useBackendAvgOLToProduction(vendorId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Left: count card */}
        <div className="w-full lg:w-[40%]">
          <NewOrderLoginCard
            count={orderLoginData?.count ?? 0}
            isLoading={isLoadingOL}
          />
        </div>

        {/* Right: task overview + avg timeline stacked */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          <AssignedTaskCard />
          <AvgDaysToInstallationCard
            avgDays={avgData?.avgDays ?? 0}
            readable={avgData?.readable ?? { days: 0, hours: 0, minutes: 0 }}
            isLoading={isLoadingAvg}
            title="Avg Timeline – OL to Production"
            subtitle="Order Login (Type 9) → Production Stage (Type 10)"
          />
        </div>
      </div>
    </div>
  );
}
