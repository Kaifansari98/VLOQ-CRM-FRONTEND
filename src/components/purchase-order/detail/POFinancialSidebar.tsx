"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import {
  fmtMoney,
  fmtQty,
  getPOFinancials,
  getReceivedStats,
} from "../shared/poUtils";
import {
  Building2,
  IndianRupee,
  Package,
  PackageCheck,
  ReceiptText,
} from "lucide-react";

export function POFinancialSidebar({ po }: { po: PODetail }) {
  const financials = getPOFinancials(po);
  const received = getReceivedStats(po);

  return (
    <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
      <div className="border-b p-5">
        <p className="text-base font-black">Financial Summary</p>
        <p className="text-xs text-muted-foreground">
          PO value and receipt progress.
        </p>
      </div>

      <div className="space-y-3 p-5">
        <Box icon={Package} label="Items" value={po.items.length} />
        <Box icon={PackageCheck} label="Accepted Qty" value={fmtQty(received.acceptedQty)} />
        <Box icon={ReceiptText} label="Pending Qty" value={fmtQty(received.pendingQty)} />

        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-[10px] font-black uppercase text-muted-foreground">
            Base Amount
          </p>
          <p className="mt-1 text-lg font-black">
            {fmtMoney(financials.amount)}
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/30">
          <p className="text-[10px] font-black uppercase">Tax Amount</p>
          <p className="mt-1 text-lg font-black">
            {fmtMoney(financials.taxAmount)}
          </p>
        </div>

        <div className="rounded-3xl border bg-indigo-50/70 p-4 text-indigo-700 dark:bg-indigo-950/30">
          <p className="text-[10px] font-black uppercase">Grand Total</p>
          <p className="mt-1 text-2xl font-black">
            {fmtMoney(financials.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Box({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={15} />
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}