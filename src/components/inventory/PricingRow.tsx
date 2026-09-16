import { cn } from "@/lib/utils";
import { PaymentTermOption } from "@/api/inventory/purchaseIntent";
import {
  VendorEntry,
  VendorEntryErrors,
  toNum,
} from "@/types/inventory/inventory.types";
import {
  Trash2,
  Percent,
  Calculator,
  Building2,
  CalendarDays,
  Boxes,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

const I =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-300/60";

const IE =
  "h-10 w-full rounded-xl border border-red-400 bg-red-50 px-3 text-sm outline-none focus:ring-2 focus:ring-red-300/60 dark:bg-red-950/20";

const L = "mb-1.5 block text-[10px] font-black uppercase tracking-wide text-muted-foreground";

const fmtMoney = (v: string | number) => {
  const n = toNum(v);

  return n > 0
    ? `₹${n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
    : "—";
};

export interface PricingRowProps {
  entry: VendorEntry;
  itemIdx: number;
  vi: number;
  errors?: VendorEntryErrors;
  canEdit: boolean;
  paymentTerms: PaymentTermOption[];
  onUpdate: (
    itemIdx: number,
    vi: number,
    f: keyof VendorEntry,
    v: string
  ) => void;
  onRemove: (itemIdx: number, vi: number) => void;

}

export function PricingRow({
  entry,
  itemIdx,
  vi,
  errors,
  canEdit,
  onUpdate,
  onRemove,
  paymentTerms
}: PricingRowProps) {
  const [advanced, setAdvanced] = useState(false);

  const computed = useMemo(
    () => ({
      amount: toNum(entry.amount),
      tax_amount: toNum(entry.tax_amount),
      total_amount: toNum(entry.total_amount),
    }),
    [entry]
  );


  const availablePaymentTerms = paymentTerms.filter(
    (term) =>
      term.company_vendor_id === null ||
      Number(term.company_vendor_id) === Number(entry.vendor.id)
  );

  const selectedPaymentTerm = availablePaymentTerms.find(
    (term) => String(term.id) === String(entry.payment_term_id)
  );
  const handleField =
    (f: keyof VendorEntry) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        onUpdate(itemIdx, vi, f, e.target.value);

  const handleMrpOrDiscount =
    (f: "mrp" | "discount_pct") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        onUpdate(itemIdx, vi, f, value);

        const mrp =
          f === "mrp" ? parseFloat(value || "0") : toNum(entry.mrp);

        const disc =
          f === "discount_pct"
            ? parseFloat(value || "0")
            : toNum(entry.discount_pct);

        const auto = mrp > 0 ? mrp * (1 - disc / 100) : 0;

        onUpdate(
          itemIdx,
          vi,
          "rate",
          auto > 0 ? auto.toFixed(2) : ""
        );
      };

  return (
    <div className="border-b last:border-0 bg-background p-4 md:p-5 hover:bg-muted/10 transition-colors">
      <div className="rounded-[24px] border bg-background shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-background dark:to-background">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-indigo-600" />
              </div>

              <div>
                <h4 className="text-sm font-semibold leading-none">
                  {entry.vendor.company_name}
                </h4>

                <p className="mt-1 text-xs text-muted-foreground">
                  Vendor Code: {entry.vendor.vendor_code}
                </p>

                {(toNum(entry.mrp) > 0 || toNum(entry.discount_pct) > 0) && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <Sparkles size={12} />
                    Auto calculated pricing active
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdvanced((v) => !v)}
                className="h-9 px-4 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-2"
              >
                Advanced
                {advanced ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onRemove(itemIdx, vi)}
                  className="w-9 h-9 rounded-xl border hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Essentials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={L}>
                <span className="inline-flex items-center gap-1">
                  <Boxes size={11} />
                  Quantity *
                </span>
              </label>

              <input
                type="number"
                min="0"
                value={entry.required_qty}
                onChange={handleField("required_qty")}
                disabled={!canEdit}
                className={errors?.required_qty ? IE : I}
                placeholder="Enter quantity"
              />

              {errors?.required_qty && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.required_qty}
                </p>
              )}
            </div>

            <div>
              <label className={L}>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={11} />
                  Required By
                </span>
              </label>

              <input
                type="date"
                value={entry.required_by_date}
                onChange={handleField("required_by_date")}
                disabled={!canEdit}
                className={I}
              />

              {/* {errors?.required_by_date && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.required_by_date}
                </p>
              )} */}
            </div>

            <div>
              <label className={L}>Remarks</label>

              <input
                value={entry.remarks}
                onChange={handleField("remarks")}
                disabled={!canEdit}
                className={I}
                placeholder="Optional remarks"
              />
            </div>
          </div>

          {/* Core pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={L}>MRP</label>

              <input
                type="number"
                min="0"
                value={entry.mrp}
                onChange={handleMrpOrDiscount("mrp")}
                disabled={!canEdit}
                className={I}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={L}>
                <span className="inline-flex items-center gap-1">
                  Discount <Percent size={11} />
                </span>
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={entry.discount_pct}
                onChange={handleMrpOrDiscount("discount_pct")}
                disabled={!canEdit}
                className={I}
                placeholder="0"
              />
            </div>

            <div>
              <label className={L}>Rate *</label>

              <input
                type="number"
                min="0"
                value={entry.rate}
                onChange={handleField("rate")}
                disabled={!canEdit}
                className={errors?.rate ? IE : I}
                placeholder="0.00"
              />

              {errors?.rate && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.rate}
                </p>
              )}
            </div>
          </div>

          {/* Advanced */}
          {advanced && (
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs font-bold mb-4 text-muted-foreground uppercase tracking-wider">
                Tax Configuration
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={L}>GST %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={entry.tax_pct}
                    onChange={handleField("tax_pct")}
                    disabled={true}
                    className={I}
                  />
                </div>

                {Number(entry.igst_pct) > 0 ? (
                  <div>
                    <label className={L}>IGST %</label>
                    <input
                      type="number"
                      min="0"
                      value={entry.igst_pct}
                      onChange={handleField("igst_pct")}
                      disabled={true}
                      className={I}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={L}>CGST %</label>
                      <input
                        type="number"
                        min="0"
                        value={entry.cgst_pct}
                        onChange={handleField("cgst_pct")}
                        disabled={true}
                        className={I}
                      />
                    </div>

                    <div>
                      <label className={L}>SGST %</label>
                      <input
                        type="number"
                        min="0"
                        value={entry.sgst_pct}
                        onChange={handleField("sgst_pct")}
                        disabled={true}
                        className={I}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Payment Term
            </label>

            <select
              value={entry.payment_term_id ? String(entry.payment_term_id) : ""}
              disabled={!canEdit}
              onChange={(e) =>
                onUpdate(itemIdx, vi, "payment_term_id", e.target.value)
              }
              className={cn(
                "h-10 w-full rounded-xl border bg-background px-3 text-xs font-medium outline-none transition-all focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
                errors?.payment_term_id
                  ? "border-red-400 bg-red-50 focus:ring-red-300 dark:bg-red-950/30"
                  : "focus:ring-indigo-300"
              )}
            >
              <option value="">Select payment term</option>

              {availablePaymentTerms.map((term) => {
                const isSelected =
                  String(term.id) === String(entry.payment_term_id || "");

                return (
                  <option
                    key={term.id}
                    value={String(term.id)}
                  >
                    {term.term_name}
                    {term.company_vendor_id ? " · Supplier specific" : ""}
                    {isSelected ? " ✓" : ""}
                  </option>
                );
              })}
            </select>

            {errors?.payment_term_id && (
              <p className="text-[10px] font-medium text-red-500">
                {errors.payment_term_id}
              </p>
            )}

            {selectedPaymentTerm?.description && (
              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                {selectedPaymentTerm.description}
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-[10px] uppercase font-black text-muted-foreground">
                Amount
              </p>
              <p className="mt-1 text-lg font-bold">
                {fmtMoney(computed.amount)}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-4">
              <p className="text-[10px] uppercase font-black text-amber-700 dark:text-amber-300">
                Tax
              </p>
              <p className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">
                {fmtMoney(computed.tax_amount)}
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 p-4">
              <p className="text-[10px] uppercase font-black text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1">
                <Calculator size={12} />
                Grand Total
              </p>

              <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
                {fmtMoney(computed.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { fmtMoney };