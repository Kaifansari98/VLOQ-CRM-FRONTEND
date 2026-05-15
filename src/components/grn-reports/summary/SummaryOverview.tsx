"use client";

import { GRNSummaryReport } from "@/api/grn/grn-reports";
import { ReportCard } from "../shared/ReportCard";
import {
  FileText,
  IndianRupee,
  Percent,
  ReceiptText,
} from "lucide-react";
import { fmtMoney } from "../shared/reportUtils";

export function SummaryOverview({ data }: { data: GRNSummaryReport }) {
  const amountRows = [
    { label: "Subtotal", value: data.subtotal_amount },
    { label: "Taxable", value: data.taxable_amount },
    { label: "CGST", value: data.cgst_amount },
    { label: "SGST", value: data.sgst_amount },
    { label: "IGST", value: data.igst_amount },
    { label: "Total Tax", value: data.tax_amount },
    { label: "Total Amount", value: data.total_amount },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[28px] border bg-background p-5 shadow-sm">
        <p className="mb-4 text-base font-black">Financial Breakdown</p>

        <div className="space-y-3">
          {amountRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3"
            >
              <span className="text-sm font-semibold text-muted-foreground">
                {row.label}
              </span>
              <span className="text-sm font-black">{fmtMoney(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <ReportCard
          icon={IndianRupee}
          label="Tax Amount"
          value={fmtMoney(data.tax_amount)}
          tone="amber"
        />
        <ReportCard
          icon={ReceiptText}
          label="Taxable Amount"
          value={fmtMoney(data.taxable_amount)}
          tone="blue"
        />
        <ReportCard
          icon={FileText}
          label="Open Notes"
          value={data.open_debit_credit_notes}
          tone="indigo"
        />
        <ReportCard
          icon={Percent}
          label="Rejection Rate"
          value={`${data.rejection_rate}%`}
          tone={Number(data.rejection_rate) > 5 ? "red" : "green"}
        />
      </div>
    </div>
  );
}