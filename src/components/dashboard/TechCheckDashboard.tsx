"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useTechCheckNewLeads } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TechCheckDashboard() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) ?? 0;

  const { data, isLoading } = useTechCheckNewLeads(vendorId);

  return (
    <div className="flex flex-col gap-4 p-4 px-6">
      <DashboardHeader />

      <div className="w-full flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <Card className="w-full border bg-background h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                New Leads shifted to Tech Check
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Instances at Type 8 pending tech check completion
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-12 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">
                    {data?.count ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">
                    instances
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
