"use client";

import { useRouter } from "next/navigation";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

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
        "w-full border py-6 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-muted/30 transition-colors min-h-[160px]",
        className
      )}
      onClick={() => router.push("/dashboard/installation/dispatch-stage")}
    >
      <div className="px-5 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-sm font-medium">Upcoming Sites</CardTitle>
          <p className="text-xs text-muted-foreground">Dispatched leads in your queue.</p>
        </div>
        <div className="p-2 rounded-full border">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
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
