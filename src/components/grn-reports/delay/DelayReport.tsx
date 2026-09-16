"use client";

import { DelayReportRow } from "@/api/grn/grn-reports";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Truck } from "lucide-react";
import {
  delayTone,
  fmtDate,
  fmtNumber,
  toneClass,
} from "../shared/reportUtils";
import { EmptyState } from "../shared/EmptyState";

export function DelayReport({ data }: { data: DelayReportRow[] }) {
  if (!data.length) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No delivery delays"
        subtitle="All supplier deliveries are on track for this period."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {data.map((row, idx) => {
        const tone = delayTone(row.delay_days);
        const t = toneClass[tone];

        return (
          <div
            key={idx}
            className={cn("rounded-[28px] border bg-background p-5 shadow-sm", t.border)}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", t.bg)}>
                  <Truck size={19} className={t.text} />
                </div>

                <div>
                  <p className="font-mono text-base font-black text-indigo-600">
                    {row.po_no}
                  </p>
                  <p className="text-sm font-semibold">
                    {row.supplier.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.supplier.vendor_code}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                <Mini label="Expected" value={fmtDate(row.expected_date)} />
                <Mini
                  label="First GRN"
                  value={row.actual_first_grn ? fmtDate(row.actual_first_grn) : "Not received"}
                />
                <Mini
                  label="Delay"
                  value={
                    row.delay_days === null
                      ? "Pending"
                      : row.delay_days === 0
                        ? "On time"
                        : `+${row.delay_days} days`
                  }
                  className={t.text}
                />
                <Mini
                  label="Pending Qty"
                  value={fmtNumber(row.pending_qty)}
                  className={row.pending_qty > 0 ? "text-amber-600" : "text-emerald-600"}
                />
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", t.bar)}
                style={{
                  width:
                    row.delay_days === null
                      ? "45%"
                      : row.delay_days <= 0
                        ? "100%"
                        : `${Math.min(100, 20 + row.delay_days * 8)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mini({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/30 p-3">
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-black", className)}>{value}</p>
    </div>
  );
}