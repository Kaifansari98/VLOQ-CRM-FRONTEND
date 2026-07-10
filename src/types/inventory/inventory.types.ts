// ─────────────────────────────────────────────────────────────────────────────
// inventory.types.ts — shared types for Purchase Intent forms
// ─────────────────────────────────────────────────────────────────────────────

export type PIProductSupplierMapping = {
  id: number;
  company_vendor_id: number;
  supplier_item_code?: string | null;
  amount?: number | string | null;
  procurement_expense_amount?: number | string | null;
  procurement_expense_pct?: number | string | null;
  procurement_expense_total?: number | string | null;

  companyVendor: PICompanyVendor;
};

export interface PICategory      { id: number; category_name: string }
export interface PIProduct {
  id:              number;
  product_name:    string;
  article_code:    string | null;
  vendor_code:     string | null;
  unit_of_measure: string | null;
  moq:             number;
  procurement:     string | null;
  // HSN tax info (pre-fetched on product load)
  hsn_id:          number | null;
  hsn_code:        string | null;
  cgst_rate:       string | null;
  sgst_rate:       string | null;
  igst_rate:       string | null;
  tax_pct:         string | null;   // cgst + sgst for intra-state
  category_id: number;
  supplierMappings?: PIProductSupplierMapping[];

}

export interface PICompanyVendor {
  id: number;
  company_name: string;
  vendor_code: string;
  point_of_contact?: string | null;
  contact_no: string;
  email: string | null;
  state_id?: number | null;

  default_payment_term_id?: number | null;
  defaultPaymentTerm?: PaymentTermMini | null;
}

// ─── Vendor entry (one row per supplier per product in the form) ──────────────

export interface VendorEntry {
  vendor: PICompanyVendor;

  required_qty: string;
  required_by_date: string;
  remarks: string;

  payment_term_id: string;

  mrp: string;
  discount_pct: string;
  rate: string;
  tax_pct: string;
  cgst_pct: string;
  sgst_pct: string;
  igst_pct: string;
  tax_amount: string;
  amount: string;
  total_amount: string;
}

export interface VendorEntryErrors {
  required_qty?: string;
  required_by_date?: string;
  rate?: string;
  payment_term_id?: string;
}
export interface ItemErrors {
  uom?:        string;
  no_vendors?: string;
  vendors?:    VendorEntryErrors[];
}

export interface SelectedItem {
  product:        PIProduct;
  uom:            string;
  remarks:        string;
  vendor_entries: VendorEntry[];
  expanded:       boolean;
  errors?:        ItemErrors;
}

// ─── Pricing helpers ──────────────────────────────────────────────────────────

export const toNum = (v: string | number | null | undefined): number =>
  v !== null && v !== undefined && v !== "" ? parseFloat(String(v)) : 0;

/** Recalculate derived pricing fields from base inputs.
 *  Call whenever mrp, discount_pct, rate, required_qty or tax_pct changes. */
export function recalcVendorEntry(e: VendorEntry): VendorEntry {
  const mrp      = toNum(e.mrp);
  const discPct  = toNum(e.discount_pct);
  const qty      = toNum(e.required_qty);
  const taxPct   = toNum(e.tax_pct);

  // Rate: if user hasn't typed a rate yet, derive from MRP × (1 - discount/100)
  const rate     = toNum(e.rate) > 0
    ? toNum(e.rate)
    : mrp > 0 ? mrp * (1 - discPct / 100) : 0;

  const amount      = rate * qty;
  const tax_amount  = amount * taxPct / 100;
  const total_amount= amount + tax_amount;

  return {
    ...e,
    rate:         rate > 0 ? String(rate) : e.rate,
    amount:       String(amount),
    tax_amount:   String(tax_amount),
    total_amount: String(total_amount),
  };
}

/** Build an empty vendor entry pre-filled from a product's HSN rates */
export const emptyVendorEntry = (
  vendor: PICompanyVendor,
  product: PIProduct
): VendorEntry => ({
  vendor,

  required_qty: "",
  required_by_date: "",
  remarks: "",

  payment_term_id: vendor.default_payment_term_id
    ? String(vendor.default_payment_term_id)
    : "",

  mrp: "",
  discount_pct: "",
  rate: "",
  tax_pct: product.tax_pct ? String(product.tax_pct) : "",
  cgst_pct: product.cgst_rate ? String(product.cgst_rate) : "",
  sgst_pct: product.sgst_rate ? String(product.sgst_rate) : "",
  igst_pct: product.igst_rate ? String(product.igst_rate) : "",
  tax_amount: "0",
  amount: "0",
  total_amount: "0",
});
export interface PaymentTermMini {
  id: number;
  term_name: string;
  description: string | null;
}