"use client";

import { GRNSummaryReport } from "@/api/grn/grn-reports";
import { AlertTriangle, CheckCircle2, Lightbulb, Truck, XCircle } from "lucide-react";

export function InsightBanner({ summary }: { summary: GRNSummaryReport | null }) {
  if (!summary) return null;

  const rejectionRate = Number(summary.rejection_rate ?? 0);

  const insights = [
    rejectionRate > 5
      ? {
          icon: XCircle,
          text: `Rejection rate is ${summary.rejection_rate}%. Review supplier quality immediately.`,
          tone: "text-red-600 bg-red-50",
        }
      : {
          icon: CheckCircle2,
          text: `Rejection rate is controlled at ${summary.rejection_rate}%.`,
          tone: "text-emerald-600 bg-emerald-50",
        },
    summary.pending_redeliveries > 0
      ? {
          icon: Truck,
          text: `${summary.pending_redeliveries} pending redeliveries require follow-up.`,
          tone: "text-amber-600 bg-amber-50",
        }
      : {
          icon: CheckCircle2,
          text: "No pending redeliveries in this period.",
          tone: "text-emerald-600 bg-emerald-50",
        },
    summary.open_debit_credit_notes > 0
      ? {
          icon: AlertTriangle,
          text: `${summary.open_debit_credit_notes} open debit/credit notes pending.`,
          tone: "text-indigo-600 bg-indigo-50",
        }
      : {
          icon: Lightbulb,
          text: "Financial notes are clean for the selected period.",
          tone: "text-indigo-600 bg-indigo-50",
        },
  ];

  return (
    <div className="rounded-[28px] border bg-background p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb size={18} className="text-indigo-500" />
        <p className="text-base font-black">Operational Insights</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {insights.map((i, idx) => {
          const Icon = i.icon;

          return (
            <div key={idx} className={`rounded-2xl p-4 text-sm font-semibold ${i.tone}`}>
              <Icon size={18} className="mb-2" />
              {i.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}