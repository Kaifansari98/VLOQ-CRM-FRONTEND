"use client";

import { POPrefill } from "@/api/grn/grn";
import { PackageCheck, ReceiptText, XCircle, WalletCards } from "lucide-react";
import { GRNCreateRow } from "./GRNItemsEditor";
import { GRNAdditionalAmountState } from "./GRNAdditionalAmountForm";
import { fmtMoney, fmtN } from "../shared/statusUtils";

const toNum = (value: string | number | null | undefined) => Number(value || 0);

export function GRNFinancialSummary({
  poData,
  rows,
  amountInfo,
}: {
  poData: POPrefill | null;
  rows: Record<number, GRNCreateRow>;
  amountInfo: GRNAdditionalAmountState;
}) {
  if (!poData) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center">
        <ReceiptText className="mx-auto mb-2 text-muted-foreground" size={22} />
        <p className="text-sm font-bold">Load a PO to view summary</p>
        <p className="text-xs text-muted-foreground">
          Item quantity and value summary will appear here.
        </p>
      </div>
    );
  }

  let receivedQty = 0;
  let acceptedQty = 0;
  let rejectedQty = 0;
  let subtotalAmount = 0;

  for (const item of poData.items) {
    const row = rows[item.id];
    if (!row) continue;

    const received = toNum(row.received_qty);
    const accepted = toNum(row.accepted_qty);
    const rejected = toNum(row.rejected_qty);
    const price = toNum(row.unit_price);

    receivedQty += received;
    acceptedQty += accepted;
    rejectedQty += rejected;
    subtotalAmount += accepted * price;
  }

  const discountAmount = toNum(amountInfo.discount_amount);
  const packingAmount = toNum(amountInfo.packing_amount);
  const freightAmount = toNum(amountInfo.freight_amount);
  const otherChargesAmount = toNum(amountInfo.other_charges_amount);
  const cessAmount = toNum(amountInfo.cess_amount);
  const roundoffAmount = toNum(amountInfo.roundoff_amount);

  /**
   * Frontend preview only.
   * Backend should still calculate the final trusted amount.
   */
  const taxableAmount = Math.max(0, subtotalAmount - discountAmount);

  const additionalAmount =
    packingAmount +
    freightAmount +
    otherChargesAmount +
    cessAmount +
    roundoffAmount;

  const totalAmount = taxableAmount + additionalAmount;

  const cards = [
    {
      label: "Received Qty",
      value: fmtN(receivedQty),
      icon: <PackageCheck size={16} />,
    },
    {
      label: "Accepted Qty",
      value: fmtN(acceptedQty),
      icon: <PackageCheck size={16} />,
    },
    {
      label: "Rejected Qty",
      value: fmtN(rejectedQty),
      icon: <XCircle size={16} />,
    },
    {
      label: "Subtotal",
      value: fmtMoney(subtotalAmount),
      icon: <ReceiptText size={16} />,
    },
    {
      label: "Taxable Amount",
      value: fmtMoney(taxableAmount),
      icon: <ReceiptText size={16} />,
    },
    {
      label: "Additional Charges",
      value: fmtMoney(additionalAmount),
      icon: <WalletCards size={16} />,
    },
    {
      label: "Estimated Total",
      value: fmtMoney(totalAmount),
      icon: <WalletCards size={16} />,
      highlight: true,
    },
  ];

  return (
    <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
      <div className="border-b bg-muted/20 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Amount Summary</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Preview based on accepted quantity and additional charges.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={
              card.highlight
                ? "rounded-xl border border-foreground/30 bg-muted/40 p-4 shadow-2xs"
                : "rounded-xl border bg-background p-4 shadow-2xs"
            }
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <span className={card.highlight ? "text-foreground" : "text-muted-foreground"}>
                {card.icon}
              </span>
            </div>

            <p className="text-lg font-bold tracking-tight text-foreground">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}