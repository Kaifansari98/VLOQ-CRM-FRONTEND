"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FactoryLeadBifurcationCardProps {
  preProdCount: number;
  underProdCount: number;
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
        "flex-1 rounded-xl p-4 flex flex-col gap-2 text-left transition-opacity hover:opacity-90",
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
        <div className="h-9 w-16 bg-muted animate-pulse rounded" />
      ) : (
        <span className="text-4xl font-semibold tracking-tight">{count}</span>
      )}
      <p className="text-xs text-muted-foreground leading-snug">{sublabel}</p>
    </button>
  );
}

export default function FactoryLeadBifurcationCard({
  preProdCount,
  underProdCount,
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
        <div className="flex gap-3">
          <StatBlock
            label="Pre-Production"
            sublabel="Order logged in, yet to start pre-production stage."
            count={preProdCount}
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
        </div>
      </CardContent>
    </Card>
  );
}
