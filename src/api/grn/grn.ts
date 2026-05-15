import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GRNStatus = "Draft" | "Confirmed" | "Closed";
export type GRNItemStatus = "Accepted" | "PartiallyAccepted" | "Rejected";
export type DCNType = "DebitNote" | "CreditNote";
export type DCNStatus = "Open" | "Settled" | "Cancelled";
export type RDStatus = "Requested" | "Scheduled" | "Received" | "Cancelled";

export interface GRNSummary {
  id: number;
  grn_no: string;
  status: GRNStatus;
  received_date: string;
  invoice_no: string | null;
  vehicle_no: string | null;
  gate_entry_no: string | null;
  companyVendor: { id: number; company_name: string; vendor_code: string };
  purchaseOrder: { id: number; po_no: string };
  createdBy: { id: number; user_name: string };
  _count: { items: number };
}

export interface GRNItem {
  id: number;
  po_item_id: number;
  product_id: number;

  received_qty: string;
  accepted_qty: string;
  rejected_qty: string;

  unit_price: string | null;
  uom: string | null;
  status: GRNItemStatus;
  rejection_reason: string | null;

  hsn_code: string | null;

  mrp: string | null;
  discount_pct: string | null;
  discount_amount: string | null;

  rate: string | null;
  amount: string | null;
  taxable_amount: string | null;

  tax_pct: string | null;
  cgst_pct: string | null;
  sgst_pct: string | null;
  igst_pct: string | null;
  cess_pct: string | null;

  cgst_amount: string | null;
  sgst_amount: string | null;
  igst_amount: string | null;
  cess_amount: string | null;

  tax_amount: string | null;
  total_amount: string | null;

  product: {
    id: number;
    product_name: string;
    article_code: string | null;
    unit_of_measure: string | null;
    hsn_code?: string | null;
  };

  redeliveryRequests: {
    id: number;
    status: RDStatus;
    requested_qty: string;
    expected_date: string | null;
  }[];
}

export interface GRNDetail {
  id: number;
  grn_no: string;
  status: GRNStatus;
  received_date: string;
  vehicle_no: string | null;
  gate_entry_no: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  invoice_amount: string | null;
  remarks: string | null;
  confirmed_at: string | null;
  companyVendor: { id: number; company_name: string; vendor_code: string; contact_no: string; email: string | null };
  purchaseOrder: { id: number; po_no: string };
  createdBy: { id: number; user_name: string };
  confirmedBy: { id: number; user_name: string } | null;
  items: GRNItem[];
  debitCreditNotes: {
    id: number; note_no: string; type: DCNType;
    amount: string; status: DCNStatus;
  }[];
  subtotal_amount: string | null;
  taxable_amount: string | null;

  cgst_amount: string | null;
  sgst_amount: string | null;
  igst_amount: string | null;
  cess_amount: string | null;
  tax_amount: string | null;

  discount_amount: string | null;
  packing_amount: string | null;
  freight_amount: string | null;
  other_charges_amount: string | null;
  roundoff_amount: string | null;

  total_amount: string | null;

  eway_bill_no?: string | null;
transporter_name?: string | null;
lr_no?: string | null;
lr_date?: string | null;
}

export interface POPrefillItem {
  id: number;
  product_id: number;
  ordered_qty: string;
  received_qty: string;
  unit_price: string | null;
  uom: string | null;
  remaining_qty: number;
  total_accepted: number;
  expected_delivery_date: string | null;
  product: { id: number; product_name: string; article_code: string | null; unit_of_measure: string | null };
}

export interface POPrefill {
  id: number;
  po_no: string;
  status: string;
  companyVendor: { id: number; company_name: string; vendor_code: string; contact_no: string };
  items: POPrefillItem[];
  grns: { id: number; grn_no: string; status: GRNStatus; received_date: string }[];
}

export interface CreateGRNItemPayload {
  purchase_order_item_id: number;
  po_item_id: number;
  product_id: number;

  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;

  unit_price?: number;
  mrp?: number;
  discount_pct?: number;
  discount_amount?: number;

  uom?: string;
  rejection_reason?: string;
}

export type CreateGRNPayload = {
  user_id: number;
  purchase_order_id: number;
  company_vendor_id: number;

  received_date: string;
  vehicle_no?: string;
  gate_entry_no?: string;
  invoice_no?: string;
  invoice_date?: string;
  invoice_amount?: number;
  remarks?: string;

  subtotal_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  cess_amount?: number;

  discount_amount?: number;
  packing_amount?: number;
  freight_amount?: number;
  other_charges_amount?: number;
  roundoff_amount?: number;

  taxable_amount?: number;
  total_amount?: number;

  eway_bill_no?: string;
  transporter_name?: string;
  lr_no?: string;
  lr_date?: string;

  items: CreateGRNItemPayload[];
};

export interface GRNListResponse {
  grns: GRNSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  packing_amount?: number;
freight_amount?: number;
other_charges_amount?: number;
roundoff_amount?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const getPOForGRN = async (vendorId: number, poId: number) => {
  const { data } = await apiClient.get(`/grn/${vendorId}/po/${poId}/prefill`);
  return data.data as POPrefill;
};

export const createGRN = async (vendorId: number, payload: CreateGRNPayload) => {
  const { data } = await apiClient.post(`/grn/${vendorId}`, payload);
  return data.data as { id: number; grn_no: string };
};

export const confirmGRN = async (vendorId: number, grnId: number, userId: number) => {
  const { data } = await apiClient.patch(`/grn/${vendorId}/${grnId}/confirm`, { user_id: userId });
  return data;
};

export const listGRNs = async (
  vendorId: number,
  params: { page?: number; search?: string; status?: string; po_id?: number }
) => {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.po_id) q.set("po_id", String(params.po_id));
  const { data } = await apiClient.get(`/grn/${vendorId}?${q}`);
  return data.data as GRNListResponse;
};

export const getGRNById = async (vendorId: number, grnId: number) => {
  const { data } = await apiClient.get(`/grn/${vendorId}/${grnId}`);
  return data.data as GRNDetail;
};

export const createDebitCreditNote = async (vendorId: number, payload: {
  user_id: number;
  grn_id: number;
  company_vendor_id: number;
  type: DCNType;
  amount: number;
  reason: string;
  remarks?: string;
}) => {
  const { data } = await apiClient.post(`/grn/${vendorId}/dcn`, payload);
  return data.data as { id: number; note_no: string };
};

export const createRedeliveryRequest = async (vendorId: number, payload: {
  user_id: number;
  grn_item_id: number;
  company_vendor_id: number;
  requested_qty: number;
  expected_date?: string;
  remarks?: string;
}) => {
  const { data } = await apiClient.post(`/grn/${vendorId}/redelivery`, payload);
  return data.data as { id: number };
};