"use client";

import { ArrowBigRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/redux/store";
import { useSalesExecutiveTaskStats } from "@/api/dashboard/useDashboard";

export function AssignedTaskCard() {
  const user = useAppSelector((state) => state.auth.user);

  const vendorId = user?.vendor?.id!;
  const userId = user?.id!;

  const { data, isLoading } = useSalesExecutiveTaskStats(vendorId, userId);

  if (isLoading) {
    return (
      <Card className="w-full md:w-full border bg-background">
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading task stats…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-fit md:w-full border py-4 rounded-2xl">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            🗓️ Assigned Tasks
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Overview of all tasks assigned to you.
          </p>
        </div>

        <div className="p-2 rounded-full border cursor-pointer hover:bg-muted">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>

      {/* Stats Row */}
      <CardContent className="pt-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>

                Today's Tasks</span>
            <span className="text-4xl font-semibold">{data?.today ?? 0}</span>
          </div>

          <div className="flex justify-end items-end gap-5">
          <div className="flex flex-col">
            <span className="flex items-center text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
              Upcoming
            </span>
            <span className="text-3xl font-semibold">
              {data?.upcoming ?? 0}
            </span>
          </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                Overdue</span>
              <span className="text-3xl font-semibold">
                {data?.overdue ?? 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}
