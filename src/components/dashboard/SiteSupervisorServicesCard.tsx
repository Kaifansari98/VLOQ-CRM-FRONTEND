"use client";

import { useRouter } from "next/navigation";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SiteSupervisorServicesCardProps {
  count: number;
  isLoading?: boolean;
  className?: string;
}

export default function SiteSupervisorServicesCard({
  count,
  isLoading = false,
  className,
}: SiteSupervisorServicesCardProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "w-full border py-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-muted/30 transition-colors",
        className
      )}
      onClick={() => router.push("/dashboard/installation/dispatch-stage")}
    >
      <div className="px-5">
        <CardTitle className="text-sm font-medium">Upcoming Sites</CardTitle>
        <p className="text-xs text-muted-foreground">Dispatched leads in your queue.</p>
      </div>

      <div className="px-5 pt-2">
        {isLoading ? (
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-3xl font-semibold">{count}</div>
        )}
      </div>
    </div>
  );
}
