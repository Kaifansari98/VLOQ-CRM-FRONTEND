"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreProdNewSitesCardProps {
  count: number;
  isLoading?: boolean;
}

export default function PreProdNewSitesCard({
  count,
  isLoading = false,
}: PreProdNewSitesCardProps) {
  return (
    <Card className="w-full border bg-background h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          New Sites in Production Stage
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Order logged, pre-production pending
        </p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-12 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-tight">
              {count}
            </span>
            <span className="text-sm text-muted-foreground mb-1">instances</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
