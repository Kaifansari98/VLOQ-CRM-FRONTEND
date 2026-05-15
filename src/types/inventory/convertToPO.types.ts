import { PIForConversion } from "@/api/purchaseOrder/purchaseOrder";

export type PIItem = PIForConversion["items"][0];
export type PIMapping = PIItem["vendorMappings"][0];

export interface SelectionState {
  checked: boolean;
  ordered_qty: string;

  mrp: string;
  discount_pct: string;
  unit_price: string;

  tax_pct: string;
  cgst_pct: string;
  sgst_pct: string;
  igst_pct: string;

  uom: string;
  expected_delivery_date: string;
  remarks: string;
}

export type SelectionsMap = Record<number, SelectionState>;

export interface RowErrors {
  ordered_qty?: string;
  expected_delivery_date?: string;
}

export type ErrorsMap = Record<number, RowErrors>;

export interface CalculatedTotals {
  amount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface POPreviewItem {
  company_vendor_id: number;
  vendorName: string;
  vendorCode: string;
  items: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface ConversionSummaryData {
  selectedRows: number;
  poCount: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  poPreview: POPreviewItem[];
}