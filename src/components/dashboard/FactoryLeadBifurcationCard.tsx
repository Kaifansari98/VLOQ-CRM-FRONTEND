"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
}

function StatBlock({
  label,
  sublabel,
  count,
  isLoading,
  accent,
  dot,
}: StatBlockProps) {
  return (
    <div className={cn("flex-1 rounded-xl p-4 flex flex-col gap-2", accent)}>
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
    </div>
  );
}

export default function FactoryLeadBifurcationCard({
  preProdCount,
  underProdCount,
  isLoading = false,
}: FactoryLeadBifurcationCardProps) {
  return (
    <Card className="w-full border bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Lead Bifurcation</CardTitle>
        <p className="text-xs text-muted-foreground">
          Production stage breakdown across active leads
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex gap-3">
          <StatBlock
            label="Pre-Production"
            sublabel="Order logged, yet to start pre-prod"
            count={preProdCount}
            isLoading={isLoading}
            accent="bg-amber-50 dark:bg-amber-950/30"
            dot="bg-amber-400"
          />
          <StatBlock
            label="Under Production"
            sublabel="Pre-prod pending, currently in production"
            count={underProdCount}
            isLoading={isLoading}
            accent="bg-blue-50 dark:bg-blue-950/30"
            dot="bg-blue-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}
