"use client";

import { POPrefillItem } from "@/api/grn/grn";
import { cn } from "@/lib/utils";
import { inputBase, inputError, fmtN } from "../shared/statusUtils";

export type GRNCreateRow = {
  received_qty: string;
  accepted_qty: string;
  rejected_qty: string;
  rejection_reason: string;
  unit_price: string;
};

export function GRNItemsEditor({
  items,
  rows,
  updateRow,
  autoCalc,
}: {
  items: POPrefillItem[];
  rows: Record<number, GRNCreateRow>;
  updateRow: (id: number, field: keyof GRNCreateRow, value: string) => void;
  autoCalc: (
    id: number,
    field: "accepted_qty" | "rejected_qty",
    value: string
  ) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="hidden grid-cols-[1.5fr_90px_90px_90px_100px_1.2fr] gap-2 border-b bg-muted/30 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-muted-foreground lg:grid">
        <span>Product</span>
        <span>Received</span>
        <span>Accepted</span>
        <span>Rejected</span>
        <span>Unit Price</span>
        <span>Rejection Reason</span>
      </div>

      <div className="divide-y">
        {items.map((item) => {
          const r = rows[item.id] || {
            received_qty: "",
            accepted_qty: "",
            rejected_qty: "0",
            rejection_reason: "",
            unit_price: "",
          };

          const rejected = Number(r.rejected_qty || 0);
          const received = Number(r.received_qty || 0);
          const accepted = Number(r.accepted_qty || 0);
          const invalidTotal =
            received > 0 &&
            Math.round((accepted + rejected) * 1000) !==
              Math.round(received * 1000);

          return (
            <div
              key={item.id}
              className={cn(
                "grid gap-3 px-4 py-4 transition-colors lg:grid-cols-[1.5fr_90px_90px_90px_100px_1.2fr] lg:items-center",
                rejected > 0 && "bg-red-50/30 dark:bg-red-950/10"
              )}
            >
              <div>
                <p className="text-sm font-bold">
                  {item.product.product_name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Ordered: {fmtN(item.ordered_qty)} · Remaining:{" "}
                  {fmtN(item.remaining_qty)}
                </p>

                {invalidTotal && (
                  <p className="mt-1 text-[10px] font-semibold text-red-600">
                    Accepted + Rejected must match Received.
                  </p>
                )}
              </div>

              <input
                type="number"
                min="0"
                value={r.received_qty}
                onChange={(e) =>
                  updateRow(item.id, "received_qty", e.target.value)
                }
                className={invalidTotal ? inputError : inputBase}
                placeholder="0"
              />

              <input
                type="number"
                min="0"
                value={r.accepted_qty}
                onChange={(e) =>
                  autoCalc(item.id, "accepted_qty", e.target.value)
                }
                className={invalidTotal ? inputError : inputBase}
                placeholder="0"
              />

              <input
                type="number"
                min="0"
                value={r.rejected_qty}
                onChange={(e) =>
                  autoCalc(item.id, "rejected_qty", e.target.value)
                }
                className={rejected > 0 || invalidTotal ? inputError : inputBase}
                placeholder="0"
              />

              <input
                type="number"
                min="0"
                value={r.unit_price}
                onChange={(e) =>
                  updateRow(item.id, "unit_price", e.target.value)
                }
                className={inputBase}
                placeholder="0.00"
              />

              <input
                value={r.rejection_reason}
                onChange={(e) =>
                  updateRow(item.id, "rejection_reason", e.target.value)
                }
                placeholder={rejected > 0 ? "Reason required..." : "—"}
                disabled={rejected <= 0}
                className={cn(inputBase, rejected <= 0 && "opacity-45")}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}