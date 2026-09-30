"use client";

import { GRNDetail } from "@/api/grn/grn";
import { cn } from "@/lib/utils";
import {
  ITEM_STATUS_META,
  fmtDate,
  fmtMoney,
  fmtN,
} from "../shared/statusUtils";

export function GRNItemsSection({
  grn,
  onRedelivery,
}: {
  grn: GRNDetail;
  onRedelivery: (item: { id: number; rejected: number }) => void;
}) {
  return (
    <div className="space-y-2">
      {grn.items.map((item) => {
        const rejected = Number(item.rejected_qty || 0);
        const statusMeta = ITEM_STATUS_META[item.status] || {
          label: item.status,
          className: "text-muted-foreground",
        };

        return (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl border bg-card p-4 shadow-sm",
              rejected > 0 && "border-red-200 bg-red-50/30 dark:bg-red-950/10"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black">
                  {item.product.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.product.article_code || "No article code"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-black", statusMeta.className)}>
                  {statusMeta.label}
                </span>

                {grn.status === "Confirmed" &&
                  rejected > 0 &&
                  !item.redeliveryRequests.length && (
                    <button
                      onClick={() =>
                        onRedelivery({
                          id: item.id,
                          rejected,
                        })
                      }
                      className="rounded-full border border-indigo-200 px-2.5 py-1 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                    >
                      + Redelivery
                    </button>
                  )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Received",
                  value: fmtN(item.received_qty),
                  className: "",
                },
                {
                  label: "Accepted",
                  value: fmtN(item.accepted_qty),
                  className: "text-emerald-600",
                },
                {
                  label: "Rejected",
                  value: fmtN(item.rejected_qty),
                  className: rejected > 0 ? "text-red-600" : "",
                },
                {
                  label: "Unit Price",
                  value: item.unit_price ? fmtMoney(item.unit_price) : "—",
                  className: "",
                },
              ].map((x) => (
                <div key={x.label} className="rounded-xl bg-muted/30 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                    {x.label}
                  </p>
                  <p className={cn("mt-1 text-sm font-black", x.className)}>
                    {x.value}
                  </p>
                </div>
              ))}
            </div>

            {item.rejection_reason && (
              <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/20">
                <span className="font-bold">Rejection reason:</span>{" "}
                {item.rejection_reason}
              </div>
            )}

            {item.redeliveryRequests.length > 0 && (
              <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-950/20">
                <span className="font-bold">Redelivery:</span>{" "}
                {item.redeliveryRequests[0].status} ·{" "}
                {fmtN(item.redeliveryRequests[0].requested_qty)} units
                {item.redeliveryRequests[0].expected_date &&
                  ` · by ${fmtDate(item.redeliveryRequests[0].expected_date)}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}