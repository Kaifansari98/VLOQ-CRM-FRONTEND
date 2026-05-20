"use client";

import { Button } from "@/components/ui/button";
import {
  Building2,
  CheckCircle2,
  IndianRupee,
  Loader2,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import { ConversionSummaryData } from "../../types/inventory/convertToPO.types";
import { fmtMoney } from "../../utils/convertToPO.utils";

export function ConversionSummary({
  summary,
  checkedCount,
  submitting,
  onClose,
  onSubmit,
}: {
  summary: ConversionSummaryData;
  checkedCount: number;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-5">
        <p className="text-base font-black">Conversion Summary</p>
        <p className="text-xs text-muted-foreground">
          Supplier-wise POs will be generated.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-3">
          <SummaryBox
            icon={CheckCircle2}
            label="Selected Rows"
            value={summary.selectedRows}
          />
          <SummaryBox
            icon={Building2}
            label="Purchase Orders"
            value={summary.poCount}
          />
          <SummaryBox
            icon={IndianRupee}
            label="Base Amount"
            value={fmtMoney(summary.amount)}
          />
          <SummaryBox
            icon={ReceiptText}
            label="Tax Amount"
            value={fmtMoney(summary.taxAmount)}
          />

          <div className="rounded-3xl border bg-indigo-50/70 p-4 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
            <p className="text-[10px] font-black uppercase">Grand Total</p>
            <p className="mt-1 text-2xl font-black">
              {fmtMoney(summary.totalAmount)}
            </p>
          </div>
        </div>

        {summary.poPreview.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-black uppercase text-muted-foreground">
              PO Preview
            </p>

            <div className="space-y-2">
              {summary.poPreview.map((po) => (
                <div
                  key={po.company_vendor_id}
                  className="rounded-2xl border bg-muted/30 p-3"
                >
                  <div className="flex items-start gap-2">
                    <Building2 size={16} className="mt-0.5 text-indigo-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {po.vendorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {po.vendorCode} • {po.items} item
                        {po.items !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-background p-3">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">
                      Total
                    </p>
                    <p className="text-base font-black text-indigo-600">
                      {fmtMoney(po.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-5">
        <div className="mb-3 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
          {checkedCount > 0
            ? `Ready to create ${summary.poCount} PO${
                summary.poCount !== 1 ? "s" : ""
              }.`
            : "Select at least one supplier quotation to continue."}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-2xl"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            className="h-11 flex-1 rounded-2xl bg-indigo-600 font-bold hover:bg-indigo-700"
            onClick={onSubmit}
            disabled={submitting || checkedCount === 0}
          >
            {submitting ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <ShoppingCart size={16} className="mr-2" />
            )}
            {submitting ? "Creating..." : "Create POs"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <Icon size={15} className="mb-2 text-indigo-500" />
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
}