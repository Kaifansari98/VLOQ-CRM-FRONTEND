"use client";

import { VendorPerformanceRow } from "@/api/grn/grn-reports";
import { cn } from "@/lib/utils";
import { Award, BarChart3 } from "lucide-react";
import { fmtNumber } from "../shared/reportUtils";
import { EmptyState } from "../shared/EmptyState";

export function VendorPerformanceReport({
  data,
}: {
  data: VendorPerformanceRow[];
}) {
  if (!data.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No performance data"
        subtitle="There are no supplier transactions in this period."
      />
    );
  }

  const sorted = [...data].sort(
    (a, b) => b.fulfillment_rate - a.fulfillment_rate
  );

  return (
    <div className="grid gap-4">
      {sorted.map((v, idx) => {
        const fulfillmentTone =
          v.fulfillment_rate >= 80
            ? "text-emerald-600 bg-emerald-50"
            : v.fulfillment_rate >= 50
              ? "text-amber-600 bg-amber-50"
              : "text-red-600 bg-red-50";

        const rejectionTone =
          v.rejection_rate > 10
            ? "text-red-600"
            : v.rejection_rate > 5
              ? "text-amber-600"
              : "text-emerald-600";

        return (
          <div
            key={v.vendor.id}
            className="rounded-[28px] border bg-background p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                  #{idx + 1}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black">
                      {v.vendor.company_name}
                    </p>

                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                        <Award size={12} />
                        Top Performer
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {v.vendor.vendor_code} • {v.po_count} POs
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[520px]">
                <Metric
                  label="Fulfillment"
                  value={`${v.fulfillment_rate}%`}
                  className={fulfillmentTone}
                  progress={v.fulfillment_rate}
                />

                <Metric
                  label="Rejection"
                  value={`${v.rejection_rate}%`}
                  className={rejectionTone}
                  progress={Math.min(100, v.rejection_rate)}
                />

                <Metric
                  label="Received"
                  value={fmtNumber(v.total_received)}
                  className="text-indigo-600"
                  progress={100}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({
  label,
  value,
  className,
  progress,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  progress: number;
}) {
  return (
    <div className="rounded-2xl bg-muted/30 p-3">
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-black", className)}>{value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{
            width: `${Math.min(100, progress)}%`,
          }}
        />
      </div>
    </div>
  );
}