"use client";

import { GRNSummaryReport } from "@/api/grn/grn-reports";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  IndianRupee,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { fmtMoney, fmtNumber } from "../shared/reportUtils";
import { ReportCard } from "../shared/ReportCard";

export function KPIGrid({ summary }: { summary: GRNSummaryReport | null }) {
  if (!summary) return null;

  const rejectionRate = Number(summary.rejection_rate ?? 0);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <ReportCard
        large
        icon={IndianRupee}
        label="Total GRN Amount"
        value={fmtMoney(summary.total_amount)}
        sub="Accepted + tax included"
        tone="green"
      />

      <ReportCard
        large
        icon={Package}
        label="Total Received"
        value={fmtNumber(summary.total_received)}
        sub={`${fmtNumber(summary.total_accepted)} accepted`}
        tone="blue"
      />

      <ReportCard
        large
        icon={XCircle}
        label="Rejection Rate"
        value={`${summary.rejection_rate}%`}
        sub={`${fmtNumber(summary.total_rejected)} rejected`}
        tone={rejectionRate >= 5 ? "red" : "green"}
      />

      <ReportCard
        large
        icon={Truck}
        label="Pending Redeliveries"
        value={summary.pending_redeliveries}
        sub="Needs vendor follow-up"
        tone="amber"
      />

      <ReportCard
        icon={ClipboardList}
        label="Total GRNs"
        value={summary.total_grns}
        tone="indigo"
      />

      <ReportCard
        icon={CheckCircle2}
        label="Confirmed"
        value={summary.confirmed_grns}
        tone="green"
      />

      <ReportCard
        icon={ClipboardList}
        label="Draft GRNs"
        value={summary.draft_grns}
        tone="amber"
      />

      <ReportCard
        icon={FileText}
        label="Open Notes"
        value={summary.open_debit_credit_notes}
        tone="slate"
      />
    </div>
  );
}