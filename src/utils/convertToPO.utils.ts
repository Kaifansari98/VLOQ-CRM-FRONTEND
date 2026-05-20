import { PIMapping, SelectionState } from "../types/inventory/convertToPO.types";

export const toNum = (value: any): number => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export const fmtMoney = (value: any): string => {
  const amount = toNum(value);

  return amount > 0
    ? `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
};

export const fmtQty = (value: any): string => {
  const qty = toNum(value);

  return qty > 0
    ? qty.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })
    : "—";
};

export const fmtDateInput = (dateValue: any): string => {
  if (!dateValue) return "";
  return new Date(dateValue).toISOString().split("T")[0];
};

export const calculateRateFromMrpDiscount = (
  mrp: number,
  discountPct: number
): number => {
  return mrp > 0 ? mrp * (1 - discountPct / 100) : 0;
};

export const calculateTotals = ({
  qty,
  rate,
  taxPct,
}: {
  qty: number;
  rate: number;
  taxPct: number;
}) => {
  const amount = qty * rate;
  const taxAmount = amount * (taxPct / 100);
  const totalAmount = amount + taxAmount;

  return {
    amount,
    taxAmount,
    totalAmount,
  };
};

export const getMappingTotal = (
  vm: PIMapping,
  selection?: SelectionState
) => {
  const qty = selection?.ordered_qty
    ? toNum(selection.ordered_qty)
    : toNum((vm as any).required_qty);

  const rate =
    selection?.unit_price && toNum(selection.unit_price) > 0
      ? toNum(selection.unit_price)
      : toNum((vm as any).rate || (vm as any).estimated_price);

  const taxPct =
    selection?.tax_pct !== undefined && selection.tax_pct !== ""
      ? toNum(selection.tax_pct)
      : toNum((vm as any).tax_pct);

  return calculateTotals({
    qty,
    rate,
    taxPct,
  });
};

export const getInitialSelectionFromMapping = (
  vm: PIMapping,
  itemUom?: string | null,
  productUom?: string | null
): SelectionState => {
  return {
    checked: false,
    ordered_qty: String(parseFloat(String((vm as any).required_qty || "0"))),

    mrp: (vm as any).mrp ? String(parseFloat(String((vm as any).mrp))) : "",
    discount_pct: (vm as any).discount_pct
      ? String(parseFloat(String((vm as any).discount_pct)))
      : "0",

    unit_price: (vm as any).rate
      ? String(parseFloat(String((vm as any).rate)))
      : (vm as any).estimated_price
        ? String(parseFloat(String((vm as any).estimated_price)))
        : "",

    tax_pct: (vm as any).tax_pct
      ? String(parseFloat(String((vm as any).tax_pct)))
      : "",
    cgst_pct: (vm as any).cgst_pct
      ? String(parseFloat(String((vm as any).cgst_pct)))
      : "",
    sgst_pct: (vm as any).sgst_pct
      ? String(parseFloat(String((vm as any).sgst_pct)))
      : "",
    igst_pct: (vm as any).igst_pct
      ? String(parseFloat(String((vm as any).igst_pct)))
      : "",

    uom: itemUom ?? productUom ?? "",
    expected_delivery_date: fmtDateInput((vm as any).required_by_date),
    remarks: (vm as any).remarks ?? "",
    payment_term_id: vm.payment_term_id ? String(vm.payment_term_id) : "",
  };
};