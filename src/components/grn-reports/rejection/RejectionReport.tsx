"use client";

import { RejectionReportVendor } from "@/api/grn/grn-reports";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useState } from "react";
import {
  fmtDate,
  fmtNumber,
  rejectionTone,
  toneClass,
} from "../shared/reportUtils";
import { EmptyState } from "../shared/EmptyState";

export function RejectionReport({ data }: { data: RejectionReportVendor[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (!data.length) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No rejections in this period"
        subtitle="Supplier quality looks good for the selected date range."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {data.map((v) => {
        const tone = rejectionTone(Number(v.rejection_rate));
        const t = toneClass[tone];

        return (
          <div key={v.vendor.id} className={cn("overflow-hidden rounded-[28px] border bg-background shadow-sm", t.border)}>
            <button
              type="button"
              className={cn("flex w-full items-center justify-between gap-4 p-5 text-left", t.bg)}
              onClick={() =>
                setExpanded((p) => ({
                  ...p,
                  [v.vendor.id]: !p[v.vendor.id],
                }))
              }
            >
              <div>
                <p className="text-base font-black">{v.vendor.company_name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.vendor.vendor_code}
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className={cn("text-xl font-black", t.text)}>
                    {v.rejection_rate}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fmtNumber(v.total_rejected)} rejected of{" "}
                    {fmtNumber(v.total_received)}
                  </p>
                </div>

                {expanded[v.vendor.id] ? (
                  <ChevronUp size={18} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={18} className="text-muted-foreground" />
                )}
              </div>
            </button>

            {expanded[v.vendor.id] && (
              <div className="p-4">
                <div className="grid gap-3">
                  {v.items.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border bg-muted/20 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-black">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.grn_no} • {fmtDate(item.received_date)}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-right">
                          <Mini label="Received" value={fmtNumber(item.received_qty)} />
                          <Mini label="Accepted" value={fmtNumber(item.accepted_qty)} good />
                          <Mini label="Rejected" value={fmtNumber(item.rejected_qty)} danger />
                        </div>
                      </div>

                      {item.rejection_reason && (
                        <div className="mt-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                          {item.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Mini({
  label,
  value,
  good,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  good?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-sm font-black", good && "text-emerald-600", danger && "text-red-600")}>
        {value}
      </p>
    </div>
  );
}