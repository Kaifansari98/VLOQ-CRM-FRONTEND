"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FactoryLeadBifurcationCardProps {
  pendingCount: number;
  preProdDoneCount: number;
  underProdCount: number;
  completedCount: number;
  isLoading?: boolean;
}

interface StatBlockProps {
  label: string;
  sublabel: string;
  count: number;
  isLoading: boolean;
  accent: string;
  dot: string;
  onClick?: () => void;
}

function StatBlock({
  label,
  sublabel,
  count,
  isLoading,
  accent,
  dot,
  onClick,
}: StatBlockProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-0 rounded-xl p-3 flex flex-col gap-1.5 text-left transition-opacity hover:opacity-90",
        accent,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      {isLoading ? (
        <div className="h-7 w-14 bg-muted animate-pulse rounded" />
      ) : (
        <span className="text-2xl font-semibold tracking-tight">{count}</span>
      )}
      <p className="text-[11px] text-muted-foreground leading-snug">
        {sublabel}
      </p>
    </button>
  );
}

export default function FactoryLeadBifurcationCard({
  pendingCount,
  preProdDoneCount,
  underProdCount,
  completedCount,
  isLoading = false,
}: FactoryLeadBifurcationCardProps) {
  const router = useRouter();

  return (
    <Card className="w-full h-full border bg-background flex flex-col justify-between">
      <div className="pb-3 pl-6">
        <p className="text-sm font-medium">Lead Bifurcation</p>
        <p className="text-xs text-muted-foreground">
          Production stage breakdown across active leads
        </p>
      </div>

      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock
            label="Pending"
            sublabel="Order logged in, production work not started yet."
            count={pendingCount}
            isLoading={isLoading}
            accent="bg-slate-50 dark:bg-slate-950/30"
            dot="bg-slate-500"
            onClick={() =>
              router.push(
                "/dashboard/production/pre-post-prod?productionStatus=Pending",
              )
            }
          />
          <StatBlock
            label="Pre-Prod Done"
            sublabel="Pre-production is done and ready for factory execution."
            count={preProdDoneCount}
            isLoading={isLoading}
            accent="bg-amber-50 dark:bg-amber-950/30"
            dot="bg-amber-400"
            onClick={() =>
              router.push("/dashboard/production/pre-post-prod?productionStatus=Pre%20Prod%20Done")
            }
          />
          <StatBlock
            label="Under Production"
            sublabel="Pre-prod done, currently in under production"
            count={underProdCount}
            isLoading={isLoading}
            accent="bg-blue-50 dark:bg-blue-950/30"
            dot="bg-blue-500"
            onClick={() =>
              router.push(
                "/dashboard/production/pre-post-prod?productionStatus=Under%20Production",
              )
            }
          />
          <StatBlock
            label="Completed"
            sublabel="Production workflow is fully completed for these leads."
            count={completedCount}
            isLoading={isLoading}
            accent="bg-emerald-50 dark:bg-emerald-950/30"
            dot="bg-emerald-500"
            onClick={() =>
              router.push(
                "/dashboard/production/pre-post-prod?productionStatus=Completed",
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
