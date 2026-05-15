"use client";

import { PODetail } from "@/api/purchaseOrder/purchaseOrder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Edit3,
  Package,
  Trash2,
} from "lucide-react";
import {
  fmtDate,
  fmtMoney,
  fmtQty,
  toNum,
} from "../shared/poUtils";

export function POItemsSection({
  po,
  canEdit,
  onEditItem,
  onDeleteItem,
}: {
  po: PODetail;
  canEdit: boolean;
  onEditItem: (item: PODetail["items"][0]) => void;
  onDeleteItem: (item: PODetail["items"][0]) => void;
}) {
  return (
    <div className="rounded-[28px] border bg-background shadow-sm">
      <div className="border-b p-5">
        <p className="text-base font-black">Line Items</p>
        <p className="text-xs text-muted-foreground">
          Product, quantity, pricing, tax and delivery breakdown.
        </p>
      </div>

      <div className="grid gap-3 p-5">
        {po.items.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border bg-muted/20 p-4"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-indigo-600">
                  <Package size={17} />
                </div>

                <div>
                  <p className="text-sm font-black">{item.product.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.product.article_code, item.uom ?? item.product.unit_of_measure]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-indigo-600"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="rounded-xl p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="Qty" value={fmtQty(item.ordered_qty)} />
              <Info label="MRP" value={fmtMoney(item.mrp)} />
              <Info
                label="Discount"
                value={item.discount_pct ? `${toNum(item.discount_pct)}%` : "—"}
              />
              <Info label="Rate" value={fmtMoney(item.rate ?? item.unit_price)} />
              <Info
                label="GST"
                value={item.tax_pct ? `${toNum(item.tax_pct)}%` : "—"}
              />
              <Info
                label="GST Split"
                value={`CGST ${toNum(item.cgst_pct)}% • SGST ${toNum(
                  item.sgst_pct
                )}% • IGST ${toNum(item.igst_pct)}%`}
              />
              <Info label="Base Amount" value={fmtMoney(item.amount)} />
              <Info label="Tax Amount" value={fmtMoney(item.tax_amount)} />
              <Info label="Line Total" value={fmtMoney(item.total_amount)} highlight />
              <Info label="Delivery" value={fmtDate(item.expected_delivery_date)} />
              <Info label="Remarks" value={item.remarks || "—"} wide />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  highlight,
  wide,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-background p-3",
        highlight && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30",
        wide && "sm:col-span-2"
      )}
    >
      <p className="text-[9px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-bold">{value}</p>
    </div>
  );
}