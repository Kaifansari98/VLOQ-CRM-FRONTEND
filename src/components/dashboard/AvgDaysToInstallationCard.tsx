"use client";

import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AvgDaysToInstallationCardProps {
  avgDays: number;
  readable: { days: number; hours: number; minutes: number };
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function AvgDaysToInstallationCard({
  avgDays,
  readable,
  isLoading = false,
  className,
  title = "Avg Days to Installation",
  subtitle = "Start → Completion",
}: AvgDaysToInstallationCardProps) {
  const readableLabel = `${readable?.days ?? 0}d ${readable?.hours ?? 0}h ${readable?.minutes ?? 0}m`;

  return (
    <div
      className={cn(
        "flex border py-4 rounded-2xl flex-col justify-between",
        className,
      )}
    >
      <div className="flex flex-row justify-between items-start px-5">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="px-5 pt-2">
        {isLoading ? (
          <>
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
          </>
        ) : (
          <>
            <div className="text-3xl font-semibold">
              {avgDays
                ? avgDays < 1
                  ? `${avgDays.toFixed(2)} day`
                  : Math.floor(avgDays) === 1
                  ? `1 day`
                  : `${Math.floor(avgDays)} days`
                : "0.00 day"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{readableLabel}</p>
          </>
        )}
      </div>
    </div>
  );
}
