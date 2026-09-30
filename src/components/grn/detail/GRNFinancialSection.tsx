"use client";

import { GRNDetail } from "@/api/grn/grn";
import { fmtMoney, fmtN } from "../shared/statusUtils";

const toNum = (value: string | number | null | undefined) => Number(value || 0);

export function GRNFinancialSection({ grn }: { grn: GRNDetail }) {
  const itemSubtotal = grn.items.reduce((sum, item) => {
    return sum + toNum(item.accepted_qty) * toNum(item.unit_price);
  }, 0);

  const subtotalAmount = toNum((grn as any).subtotal_amount) || itemSubtotal;

  const cgstAmount = toNum((grn as any).cgst_amount);
  const sgstAmount = toNum((grn as any).sgst_amount);
  const igstAmount = toNum((grn as any).igst_amount);
  const cessAmount = toNum((grn as any).cess_amount);

  const discountAmount = toNum((grn as any).discount_amount);
  const packingAmount = toNum((grn as any).packing_amount);
  const freightAmount = toNum((grn as any).freight_amount);
  const otherChargesAmount = toNum((grn as any).other_charges_amount);
  const roundoffAmount = toNum((grn as any).roundoff_amount);

  const taxableAmount =
    toNum((grn as any).taxable_amount) ||
    Math.max(0, subtotalAmount - discountAmount);

  const taxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;

  const additionalAmount =
    packingAmount + freightAmount + otherChargesAmount + roundoffAmount;

  const totalAmount =
    toNum((grn as any).total_amount) ||
    taxableAmount + taxAmount + additionalAmount;

  const quantityCards = [
    {
      label: "Received Qty",
      value: fmtN(
        grn.items.reduce((sum, item) => sum + toNum(item.received_qty), 0)
      ),
    },
    {
      label: "Accepted Qty",
      value: fmtN(
        grn.items.reduce((sum, item) => sum + toNum(item.accepted_qty), 0)
      ),
    },
    {
      label: "Rejected Qty",
      value: fmtN(
        grn.items.reduce((sum, item) => sum + toNum(item.rejected_qty), 0)
      ),
    },
  ];

  const amountRows = [
    {
      label: "Subtotal",
      value: fmtMoney(subtotalAmount),
    },
    {
      label: "Discount",
      value: `- ${fmtMoney(discountAmount)}`,
      danger: discountAmount > 0,
    },
    {
      label: "Taxable Amount",
      value: fmtMoney(taxableAmount),
      strong: true,
    },
    {
      label: "CGST",
      value: fmtMoney(cgstAmount),
    },
    {
      label: "SGST",
      value: fmtMoney(sgstAmount),
    },
    {
      label: "IGST",
      value: fmtMoney(igstAmount),
    },
    {
      label: "CESS",
      value: fmtMoney(cessAmount),
    },
    {
      label: "Packing",
      value: fmtMoney(packingAmount),
    },
    {
      label: "Freight",
      value: fmtMoney(freightAmount),
    },
    {
      label: "Other Charges",
      value: fmtMoney(otherChargesAmount),
    },
    {
      label: "Round Off",
      value: fmtMoney(roundoffAmount),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {quantityCards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 text-lg font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/20 px-4 py-3">
          <p className="text-sm font-black">Amount Breakup</p>
          <p className="text-xs text-muted-foreground">
            GST, discount, freight, packing and final GRN amount.
          </p>
        </div>

        <div className="divide-y">
          {amountRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p
                className={
                  row.danger
                    ? "text-sm font-black text-red-600"
                    : row.strong
                    ? "text-sm font-black text-foreground"
                    : "text-sm font-semibold"
                }
              >
                {row.value}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between bg-indigo-50 px-4 py-4 dark:bg-indigo-950/20">
            <div>
              <p className="text-sm font-black">Total GRN Amount</p>
              <p className="text-xs text-muted-foreground">
                Final payable / booked value
              </p>
            </div>

            <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
              {fmtMoney(totalAmount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}