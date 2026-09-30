"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import {
  fmtDate,
  fmtMoney,
  getPOFinancials,
  getReceivedStats,
  StatusBadge,
} from "../shared/poUtils";
import { ReceiptText, Sparkles } from "lucide-react";

export function POHero({ po }: { po: PODetail }) {
  const financials = getPOFinancials(po);
  const received = getReceivedStats(po);

  return (
    <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
      <div className="relative p-5">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-500/10" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles size={13} className="text-indigo-500" />
              Purchase Order Workspace
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{po.po_no}</h2>
              <StatusBadge status={po.status} />
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Supplier: {po.companyVendor.company_name} • PI:{" "}
              {po.purchaseIntent.intent_no} • Created {fmtDate(po.created_at)}
            </p>
          </div>

          <div className="rounded-3xl border bg-indigo-50/70 p-4 text-right dark:bg-indigo-950/30">
            <p className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
              Grand Total
            </p>
            <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
              {fmtMoney(financials.totalAmount)}
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">
              Receipt Progress
            </span>
            <span className="font-black text-indigo-600">
              {received.receivedPct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${received.receivedPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}