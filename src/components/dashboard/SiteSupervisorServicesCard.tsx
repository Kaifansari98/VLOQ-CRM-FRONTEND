"use client";

import { useRouter } from "next/navigation";
import { CardTitle } from "@/components/ui/card";

interface SiteSupervisorServicesCardProps {
  total: number;
  completed: number;
  pending: number;
  isLoading?: boolean;
}

export default function SiteSupervisorServicesCard({
  total,
  completed,
  pending,
  isLoading = false,
}: SiteSupervisorServicesCardProps) {
  const router = useRouter();

  return (
    <div
      className="border py-4 sm:w-1/2 rounded-2xl mt-4 flex flex-col justify-between cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => router.push("/dashboard/installation/servicing")}
    >
      <div className="px-5">
        <CardTitle className="text-sm font-medium">Pending Services</CardTitle>
        <p className="text-xs text-muted-foreground">Assigned To You.</p>
      </div>

      <div className="px-5 flex flex-col pt-2">
        <div>
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-3xl font-semibold">{total}</div>
          )}
        </div>

        <div className="flex flex-row justify-between mt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            {isLoading ? (
              <div className="h-5 w-10 bg-muted animate-pulse rounded" />
            ) : (
              <span className="text-sm font-medium">{completed}</span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
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
