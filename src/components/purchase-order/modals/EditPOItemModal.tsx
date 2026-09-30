"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import { Button } from "@/components/ui/button";
import { X, Save, Loader2, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtMoney, toNum } from "../shared/poUtils";

type POItem = PODetail["items"][0];

const inputClass =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300";

export function EditPOItemModal({
  item,
  loading,
  onClose,
  onSave,
}: {
  item: POItem;
  loading: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
}) {
  const [form, setForm] = useState({
    ordered_qty: item.ordered_qty ? String(parseFloat(item.ordered_qty)) : "",
    mrp: item.mrp ? String(parseFloat(item.mrp)) : "",
    discount_pct: item.discount_pct ? String(parseFloat(item.discount_pct)) : "0",
    rate: item.rate
      ? String(parseFloat(item.rate))
      : item.unit_price
        ? String(parseFloat(item.unit_price))
        : "",
    tax_pct: item.tax_pct ? String(parseFloat(item.tax_pct)) : "",
    cgst_pct: item.cgst_pct ? String(parseFloat(item.cgst_pct)) : "",
    sgst_pct: item.sgst_pct ? String(parseFloat(item.sgst_pct)) : "",
    igst_pct: item.igst_pct ? String(parseFloat(item.igst_pct)) : "",
    expected_delivery_date: item.expected_delivery_date
      ? new Date(item.expected_delivery_date).toISOString().split("T")[0]
      : "",
    remarks: item.remarks ?? "",
  });

  const totals = useMemo(() => {
    const amount = toNum(form.ordered_qty) * toNum(form.rate);
    const taxAmount = amount * (toNum(form.tax_pct) / 100);
    const totalAmount = amount + taxAmount;

    return {
      amount,
      taxAmount,
      totalAmount,
    };
  }, [form]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "mrp" || key === "discount_pct") {
        const mrp = key === "mrp" ? toNum(value) : toNum(prev.mrp);
        const discount = key === "discount_pct" ? toNum(value) : toNum(prev.discount_pct);
        const rate = mrp > 0 ? mrp * (1 - discount / 100) : 0;
        next.rate = rate > 0 ? rate.toFixed(2) : "";
      }

      return next;
    });
  };

  const submit = () => {
    if (!form.ordered_qty || toNum(form.ordered_qty) <= 0) return;

    onSave({
      ordered_qty: toNum(form.ordered_qty),
      unit_price: toNum(form.rate),
      mrp: form.mrp ? toNum(form.mrp) : undefined,
      discount_pct: form.discount_pct ? toNum(form.discount_pct) : undefined,
      rate: form.rate ? toNum(form.rate) : undefined,
      tax_pct: form.tax_pct ? toNum(form.tax_pct) : undefined,
      cgst_pct: form.cgst_pct ? toNum(form.cgst_pct) : undefined,
      sgst_pct: form.sgst_pct ? toNum(form.sgst_pct) : undefined,
      igst_pct: form.igst_pct ? toNum(form.igst_pct) : undefined,
      amount: totals.amount,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      expected_delivery_date: form.expected_delivery_date || null,
      remarks: form.remarks || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Package size={19} />
            </div>
            <div>
              <p className="text-base font-black">Edit PO Item</p>
              <p className="text-xs text-muted-foreground">
                {item.product.product_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Qty *">
            <input
              type="number"
              value={form.ordered_qty}
              onChange={(e) => update("ordered_qty", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="MRP">
            <input
              type="number"
              value={form.mrp}
              onChange={(e) => update("mrp", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Discount %">
            <input
              type="number"
              value={form.discount_pct}
              onChange={(e) => update("discount_pct", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Rate">
            <input
              type="number"
              value={form.rate}
              onChange={(e) => update("rate", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="GST %">
            <input
              type="number"
              value={form.tax_pct}
              disabled={true}
              onChange={(e) => update("tax_pct", e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* <Field label="CGST %">
            <input
              type="number"
              value={form.cgst_pct}
              onChange={(e) => update("cgst_pct", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="SGST %">
            <input
              type="number"
              value={form.sgst_pct}
              onChange={(e) => update("sgst_pct", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="IGST %">
            <input
              type="number"
              value={form.igst_pct}
              onChange={(e) => update("igst_pct", e.target.value)}
              className={inputClass}
            />
          </Field> */}

          <Field label="Delivery">
            <input
              type="date"
              value={form.expected_delivery_date}
              onChange={(e) => update("expected_delivery_date", e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Remarks">
              <input
                value={form.remarks}
                onChange={(e) => update("remarks", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-3 border-t bg-muted/20 p-5 md:grid-cols-3">
          <MiniTotal label="Base Amount" value={fmtMoney(totals.amount)} />
          <MiniTotal label="Tax Amount" value={fmtMoney(totals.taxAmount)} />
          <MiniTotal label="Line Total" value={fmtMoney(totals.totalAmount)} highlight />
        </div>

        <div className="flex justify-end gap-2 border-t p-5">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Save size={15} className="mr-2" />}
            Save Item
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function MiniTotal({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "rounded-2xl bg-indigo-50 p-4 text-indigo-700" : "rounded-2xl bg-background p-4"}>
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}