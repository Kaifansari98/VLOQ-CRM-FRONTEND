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

export function POSummaryCards({ po }: { po: PODetail }) {
  const financials = getPOFinancials(po);
  const received = getReceivedStats(po);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={Package} label="Items" value={po.items.length} />
      <SummaryCard
        icon={PackageCheck}
        label="Accepted Qty"
        value={fmtQty(received.acceptedQty)}
      />
      <SummaryCard
        icon={ReceiptText}
        label="Pending Qty"
        value={fmtQty(received.pendingQty)}
      />
      <SummaryCard
        icon={IndianRupee}
        label="Total Amount"
        value={fmtMoney(financials.totalAmount)}
        highlight
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <Icon size={17} className="mb-3 text-indigo-500" />
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className={highlight ? "mt-1 text-lg font-black text-indigo-600" : "mt-1 text-lg font-black"}>
        {value}
      </p>
    </div>
  );
}