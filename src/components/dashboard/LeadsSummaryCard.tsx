"use client";

import { useState } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeInfo } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSalesExecutiveActivityStatusCounts } from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import { Separator } from "../ui/separator";

interface LeadsSummaryCardProps {
  assigned: number;
  completed: number;
  pending: number;
  isLoading?: boolean;

  // optional callback when user selects filter
  onFilterChange?: (filter: "week" | "month" | "year") => void;
}

export default function LeadsSummaryCard({
  assigned,
  completed,
  pending,
  isLoading = false,
  onFilterChange,
}: LeadsSummaryCardProps) {
  const [filter, setFilter] = useState<"week" | "month" | "year">("month");
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: activityCounts, isLoading: activityCountsLoading } =
    useSalesExecutiveActivityStatusCounts(vendorId, userId);

  const handleSelect = (value: "week" | "month" | "year") => {
    setFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="border py-4 sm:w-1/2  rounded-2xl mt-4 flex flex-col justify-between">
      <div className="flex flex-row justify-between items-start px-5">
        {/* LEFT — Title */}
        <div>
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <p className="text-xs text-muted-foreground">Assigned To You.</p>
        </div>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full p-0 hover:bg-accent/50 transition-colors"
              >
                <BadgeInfo className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipContent
              className="
        p-4 rounded-lg shadow-lg backdrop-blur-md
        bg-white/80 dark:bg-zinc-900/70
        border border-border/40
        space-y-3 w-48 transition-all
      "
            >
              {/* Header */}
              <p className="text-xs font-medium text-muted-foreground tracking-wide">
                Activity Status Overview
              </p>

              {/* Body */}
              {activityCountsLoading ? (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="animate-pulse">Loading...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  {/* Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      On Hold
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {activityCounts?.onHold ?? 0}
                    </span>
                  </div>

                  {/* Subtle separator */}
                  <Separator className="bg-border/40 dark:bg-border/20" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Lost Approval
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {activityCounts?.lostApproval ?? 0}
                    </span>
                  </div>

                  <Separator className="bg-border/40 dark:bg-border/20" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Lost</span>
                    <span className="font-semibold text-foreground text-sm">
                      {activityCounts?.lost ?? 0}
                    </span>
                  </div>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="px-5 flex flex-col pt-2">
        {/* Total Assigned */}
        <div>
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-3xl font-semibold">{assigned}</div>
          )}
        </div>

        <div className="flex flex-row justify-between">
          {/* Completed */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>

            {isLoading ? (
              <div className="h-5 w-10 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-sm font-medium">{completed}</span>
            )}
          </div>

          {/* Pending */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>

            {isLoading ? (
              <div className="h-5 w-10 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-sm font-medium">{pending}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
