"use client";

import { cn } from "@/lib/utils";
import {
  Building2,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import {
  CalculatedTotals,
  PIMapping,
  RowErrors,
  SelectionState,
} from "../../types/inventory/convertToPO.types";
import { fmtMoney, fmtQty, toNum } from "../../utils/convertToPO.utils";

import { PaymentTermOption } from "@/api/inventory/purchaseIntent";

const inputClass =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-300/60";

const errorInputClass =
  "h-10 w-full rounded-xl border border-red-400 bg-red-50 px-3 text-sm outline-none focus:ring-2 focus:ring-red-300/60 dark:bg-red-950/20";

const labelClass =
  "mb-1.5 block text-[10px] font-black uppercase tracking-wide text-muted-foreground";

export function SupplierQuoteCard({
  vm,
  selection,
  errors,
  totals,
  isBestPrice,
  paymentTerms,
  onToggle,
  onUpdateField,
}: {
  vm: PIMapping;
  selection: SelectionState;
  errors?: RowErrors;
  totals: CalculatedTotals;
  isBestPrice: boolean;
  paymentTerms: PaymentTermOption[];
  onToggle: () => void;
  onUpdateField: (field: keyof SelectionState, value: string) => void;
}) {
  const availablePaymentTerms = paymentTerms.filter(
    (term) =>
      term.company_vendor_id === null ||
      Number(term.company_vendor_id) === Number(vm.company_vendor_id)
  );

  const hasPiTermInList =
    vm.paymentTerm &&
    !availablePaymentTerms.some((term) => Number(term.id) === Number(vm.paymentTerm?.id));

  const finalPaymentTerms = hasPiTermInList && vm.paymentTerm
    ? [
      {
        id: vm.paymentTerm.id,
        term_name: vm.paymentTerm.term_name,
        description: vm.paymentTerm.description,
        company_vendor_id: vm.company_vendor_id,
      } as any,
      ...availablePaymentTerms,
    ]
    : availablePaymentTerms;
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 transition-all",
        selection.checked
          ? "border-indigo-300 bg-indigo-50/50 shadow-sm dark:bg-indigo-950/20"
          : "bg-muted/20 hover:bg-muted/30",
        errors && "border-red-300 bg-red-50/40 dark:bg-red-950/20"
      )}
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onToggle} className="mt-1">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                selection.checked
                  ? "border-indigo-600 bg-indigo-600"
                  : "border-muted-foreground/30 hover:border-indigo-400"
              )}
            >
              {selection.checked && (
                <CheckCircle2 size={12} className="text-white" />
              )}
            </div>
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-indigo-600">
            <Building2 size={17} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black">
                {vm.companyVendor.company_name}
              </p>

              {isBestPrice && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                  <Trophy size={10} />
                  Best Price
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {vm.companyVendor.vendor_code} • PI Qty: {fmtQty((vm as any).required_qty)}
            </p>
            <p className="text-xs text-muted-foreground">
              PI Term: {vm.paymentTerm?.term_name || "Not selected"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-background px-4 py-2 text-right">
          <p className="text-[9px] font-black uppercase text-muted-foreground">
            Quote Total
          </p>
          <p className="text-lg font-black text-indigo-600">
            {fmtMoney(totals.totalAmount)}
          </p>
        </div>
      </div>

      <div className={cn(!selection.checked && "pointer-events-none opacity-50")}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={labelClass}>Qty *</label>
            <input
              type="number"
              min="0"
              value={selection.ordered_qty}
              onChange={(e) => onUpdateField("ordered_qty", e.target.value)}
              className={errors?.ordered_qty ? errorInputClass : inputClass}
              placeholder="0"
            />
            {errors?.ordered_qty && (
              <p className="mt-1 text-xs text-red-500">{errors.ordered_qty}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>MRP</label>
            <input
              type="number"
              min="0"
              value={selection.mrp}
              onChange={(e) => onUpdateField("mrp", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelClass}>Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={selection.discount_pct}
              onChange={(e) => onUpdateField("discount_pct", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>Rate *</label>
            <input
              type="number"
              min="0"
              value={selection.unit_price}
              onChange={(e) => onUpdateField("unit_price", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelClass}>GST %</label>
            <input
              type="number"
              min="0"
              value={selection.tax_pct}
              onChange={(e) => onUpdateField("tax_pct", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>CGST %</label>
            <input
              type="number"
              min="0"
              value={selection.cgst_pct}
              onChange={(e) => onUpdateField("cgst_pct", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>SGST %</label>
            <input
              type="number"
              min="0"
              value={selection.sgst_pct}
              onChange={(e) => onUpdateField("sgst_pct", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>IGST %</label>
            <input
              type="number"
              min="0"
              value={selection.igst_pct}
              onChange={(e) => onUpdateField("igst_pct", e.target.value)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>UOM</label>
            <input
              value={selection.uom}
              onChange={(e) => onUpdateField("uom", e.target.value)}
              className={inputClass}
              placeholder="UOM"
            />
          </div>

          <div>
            <label className={labelClass}>Delivery *</label>
            <input
              type="date"
              value={selection.expected_delivery_date}
              onChange={(e) =>
                onUpdateField("expected_delivery_date", e.target.value)
              }
              className={
                errors?.expected_delivery_date ? errorInputClass : inputClass
              }
            />
            {errors?.expected_delivery_date && (
              <p className="mt-1 text-xs text-red-500">
                {errors.expected_delivery_date}
              </p>
            )}
          </div>


        </div>

        <div className="mt-3">
          <label className={labelClass}>Remarks</label>
          <input
            value={selection.remarks}
            onChange={(e) => onUpdateField("remarks", e.target.value)}
            className={inputClass}
            placeholder="Supplier-specific PO remark"
          />
        </div>

        <div>
          <label className={labelClass}>Payment Term *</label>

          <select
            value={selection.payment_term_id || ""}
            onChange={(e) => onUpdateField("payment_term_id", e.target.value)}
            className={errors?.payment_term_id ? errorInputClass : inputClass}
          >
            <option value="">Select payment term</option>

            {finalPaymentTerms.map((term) => (
              <option key={term.id} value={String(term.id)}>
                {term.term_name}
                {Number(term.id) === Number(vm.payment_term_id) ? " · PI Selected" : ""}
                {term.company_vendor_id ? " · Supplier specific" : ""}
              </option>
            ))}
          </select>

          {errors?.payment_term_id && (
            <p className="mt-1 text-xs text-red-500">
              {errors.payment_term_id}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <QuoteStat label="Base Amount" value={fmtMoney(totals.amount)} />
          <QuoteStat label="Tax Amount" value={fmtMoney(totals.taxAmount)} />
          <QuoteStat label="GST" value={`${toNum(selection.tax_pct)}%`} />
          <QuoteStat
            label="Split"
            value={`CGST ${toNum(selection.cgst_pct)}% • SGST ${toNum(
              selection.sgst_pct
            )}% • IGST ${toNum(selection.igst_pct)}%`}
          />
        </div>
      </div>
    </div>
  );
}

function QuoteStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <p className="text-[9px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-bold">{value}</p>
    </div>
  );
}