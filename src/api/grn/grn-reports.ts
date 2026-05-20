import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GRNSummaryReport {
  total_grns: number;
  confirmed_grns: number;
  draft_grns: number;

  total_received: number;
  total_accepted: number;
  total_rejected: number;
  rejection_rate: number;

  pending_redeliveries: number;
  open_debit_credit_notes: number;

  subtotal_amount: number;
  taxable_amount: number;

  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  tax_amount: number;

  discount_amount: number;
  packing_amount: number;
  freight_amount: number;
  other_charges_amount: number;
  roundoff_amount: number;

  total_amount: number;
}

export interface RejectionReportItem {
  grn_no:           string;
  po_no:            string;
  received_date:    string;
  product_name:     string;
  article_code:     string | null;
  received_qty:     number;
  accepted_qty:     number;
  rejected_qty:     number;
  rejection_reason: string | null;
  status:           string;
}

export interface RejectionReportVendor {
  vendor:         { id: number; company_name: string; vendor_code: string };
  total_rejected: number;
  total_received: number;
  rejection_rate: number;
  items:          RejectionReportItem[];
}

export interface DelayReportRow {
  po_no:           string;
  supplier:        { id: number; company_name: string; vendor_code: string };
  expected_date:   string;
  actual_first_grn:string | null;
  delay_days:      number | null;
  still_pending:   boolean;
  pending_qty:     number;
  status:          string;
}

export interface VendorPerformanceRow {
  vendor:           { id: number; company_name: string; vendor_code: string };
  po_count:         number;
  fulfillment_rate: number;
  total_received:   number;
  total_rejected:   number;
  rejection_rate:   number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

const buildDateQ = (from: string, to: string) => `from=${from}&to=${to}`;

export const fetchGRNSummary = async (vendorId: number, from: string, to: string) => {
  const { data } = await apiClient.get(`/grn/${vendorId}/reports/summary?${buildDateQ(from, to)}`);
  return data.data as GRNSummaryReport;
};

export const fetchRejectionReport = async (vendorId: number, from: string, to: string) => {
  const { data } = await apiClient.get(`/grn/${vendorId}/reports/rejection?${buildDateQ(from, to)}`);
  return data.data as RejectionReportVendor[];
};

export const fetchDelayReport = async (vendorId: number, from: string, to: string) => {
  const { data } = await apiClient.get(`/grn/${vendorId}/reports/delay?${buildDateQ(from, to)}`);
  return data.data as DelayReportRow[];
};

export const fetchVendorPerformanceReport = async (vendorId: number, from: string, to: string) => {
  const { data } = await apiClient.get(`/grn/${vendorId}/reports/vendor-performance?${buildDateQ(from, to)}`);
  return data.data as VendorPerformanceRow[];
};