"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import {
  fmtDate,
  fmtMoney,
  fmtQty,
  toNum,
} from "../shared/poUtils";

export function POReceiptsSection({
  po,
  onCreateGRN,
}: {
  po: PODetail;
  onCreateGRN: () => void;
}) {
  const confirmedItems = (po.grns ?? [])
    .filter((g) => g.status === "Confirmed")
    .flatMap((g) => g.items ?? []);

  return (
    <div className="rounded-[28px] border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <p className="text-base font-black">GRN Receipts</p>
          <p className="text-xs text-muted-foreground">
            Goods received against this purchase order.
          </p>
        </div>

        {["Approved", "PartiallyReceived"].includes(po.status) && (
          <button
            onClick={onCreateGRN}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            + Create GRN
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="mb-5 overflow-hidden rounded-2xl border">
          <div className="border-b bg-muted/30 px-4 py-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground">
              Receipt Summary per Item
            </p>
          </div>

          {po.items.map((item) => {
            const itemReceipts = confirmedItems.filter(
              (gi) => gi.product_id === item.product.id
            );

            const accepted = itemReceipts.reduce(
              (s, gi) => s + toNum(gi.accepted_qty),
              0
            );

            const rejected = itemReceipts.reduce(
              (s, gi) => s + toNum(gi.rejected_qty),
              0
            );

            const ordered = toNum(item.ordered_qty);
            const pending = Math.max(0, ordered - accepted);
            const pct = ordered > 0 ? Math.round((accepted / ordered) * 100) : 0;

            return (
              <div key={item.id} className="border-b p-4 last:border-b-0">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{item.product.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Ordered {fmtQty(ordered)} • Accepted {fmtQty(accepted)} • Rejected{" "}
                      {fmtQty(rejected)} • Pending {fmtQty(pending)}
                    </p>
                  </div>
                  <p className="text-xs font-black text-indigo-600">{pct}%</p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-muted-foreground/20"
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {!po.grns?.length ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-muted/10 py-10 text-muted-foreground">
            <ClipboardList size={24} className="mb-2 opacity-30" />
            <p className="text-sm font-semibold">No GRNs created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {po.grns.map((grn) => {
              const totalReceived = grn.items.reduce(
                (s, i) => s + toNum(i.received_qty),
                0
              );
              const totalAccepted = grn.items.reduce(
                (s, i) => s + toNum(i.accepted_qty),
                0
              );
              const totalRejected = grn.items.reduce(
                (s, i) => s + toNum(i.rejected_qty),
                0
              );

              return (
                <div key={grn.id} className="overflow-hidden rounded-3xl border">
                  <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-black text-indigo-600">
                        {grn.grn_no}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Received {fmtDate(grn.received_date)} • Invoice{" "}
                        {grn.invoice_no || "—"}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                      {grn.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 divide-x border-b">
                    <Mini label="Received" value={fmtQty(totalReceived)} />
                    <Mini label="Accepted" value={fmtQty(totalAccepted)} good />
                    <Mini label="Rejected" value={fmtQty(totalRejected)} danger />
                  </div>

                  {grn.items.map((gi) => (
                    <div key={gi.id} className="border-b px-4 py-3 last:border-b-0">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{gi.product.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Accepted {fmtQty(gi.accepted_qty)} • Rejected{" "}
                            {fmtQty(gi.rejected_qty)}
                          </p>
                        </div>
                        <p className="text-xs font-bold">
                          {gi.unit_price ? fmtMoney(gi.unit_price) : "—"}
                        </p>
                      </div>

                      {gi.rejection_reason && (
                        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                          {gi.rejection_reason}
                        </p>
                      )}
                    </div>
                  ))}

                  {grn.confirmedBy && (
                    <div className="flex items-center gap-1 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      Confirmed by {grn.confirmedBy.user_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    <div className="p-3 text-center">
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-black",
          good && "text-emerald-600",
          danger && "text-red-600"
        )}
      >
        {value}
      </p>
    </div>
  );
}