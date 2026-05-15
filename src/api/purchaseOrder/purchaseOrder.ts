import { apiClient } from "@/lib/apiClient";

export type POStatus = "Draft"|"Approved"|"PartiallyReceived"|"Received"|"Cancelled";

export interface PIForConversion {
  id: number; intent_no: string; status: string; priority: string;
  category: { id: number; category_name: string };
  items: {
    id: number; product_id: number; uom: string | null; remarks: string | null;
    product: { id: number; product_name: string; article_code: string | null; unit_of_measure: string | null; moq: number; level1_price: string | null };
    vendorMappings: {
      id: number; company_vendor_id: number; required_qty: string;
      estimated_price: string | null; required_by_date: string | null; remarks: string | null;
      companyVendor: { id: number; company_name: string; vendor_code: string; contact_no: string; email: string | null; point_of_contact: string };
    }[];
  }[];
}

export interface ConversionSelection {
  pi_item_vendor_mapping_id: number;
  company_vendor_id:         number;
  product_id:                number;
  ordered_qty:               number;
  unit_price?:               number;
  uom?:                      string;
  expected_delivery_date?:   string;
  remarks?:                  string;
  mrp?: number;
discount_pct?: number;
rate?: number;

tax_pct?: number;
cgst_pct?: number;
sgst_pct?: number;
igst_pct?: number;

amount?: number;
tax_amount?: number;
total_amount?: number;
}

export interface PurchaseOrder {
  id: number;
  po_no: string;
  status: POStatus;
  expected_delivery_date: string | null;
  remarks: string | null;
  created_at: string;

  amount: string | null;
  tax_amount: string | null;
  total_amount: string | null;

  companyVendor: {
    id: number;
    company_name: string;
    vendor_code: string;
    contact_no?: string | null;
    email?: string | null;
    point_of_contact?: string | null;
  };

  purchaseIntent: {
    id: number;
    intent_no: string;
  };

  createdBy: {
    id: number;
    user_name: string;
  };

  _count: {
    items: number;
  };
}


export const getPIForConversion = async (vendorId: number, piId: number) => {
  const { data } = await apiClient.get(`/purchase-orders/${vendorId}/pi/${piId}/prefill`);
  return data.data as PIForConversion;
};

export const convertPIToPO = async (vendorId: number, payload: {
  purchase_intent_id: number; user_id: number; expected_delivery_date?: string; remarks?: string;
  selections: ConversionSelection[];
}) => {
  const { data } = await apiClient.post(`/purchase-orders/${vendorId}/convert`, payload);
  return data.data as { purchase_orders: { id: number; po_no: string }[]; count: number };
};

export const listPurchaseOrders = async (vendorId: number, params: { page?: number; status?: string; search?: string }) => {
  const q = new URLSearchParams();
  if (params.page)   q.set("page",   String(params.page));
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  const { data } = await apiClient.get(`/purchase-orders/${vendorId}?${q}`);
  return data.data as { purchase_orders: PurchaseOrder[]; total: number; page: number; page_size: number; total_pages: number };
};

export interface POGRNItem {
  id: number;
  product_id: number;
  received_qty: string;
  accepted_qty: string;
  rejected_qty: string;
  unit_price: string | null;
  uom: string | null;
  status: string;
  rejection_reason: string | null;
  product: { id: number; product_name: string; article_code: string | null };
}

export interface POGRN {
  id: number;
  grn_no: string;
  status: string;
  received_date: string;
  vehicle_no: string | null;
  gate_entry_no: string | null;
  invoice_no: string | null;
  confirmed_at: string | null;
  createdBy:   { id: number; user_name: string };
  confirmedBy: { id: number; user_name: string } | null;
  items: POGRNItem[];
}

export interface PODetail {
  id: number;
  po_no: string;
  status: POStatus;
  expected_delivery_date: string | null;
  remarks: string | null;
  created_at: string;

  amount: string | null;
  tax_amount: string | null;
  total_amount: string | null;

  companyVendor: {
    id: number;
    company_name: string;
    vendor_code: string;
    contact_no: string | null;
    email: string | null;
    point_of_contact?: string | null;
    state_id?: number | null;
  };

  purchaseIntent: {
    id: number;
    intent_no: string;
  };

  createdBy: {
    id: number;
    user_name: string;
  };

  items: {
    id: number;
    ordered_qty: string;
    received_qty: string | null;
    unit_price: string | null;
    uom: string | null;
    expected_delivery_date: string | null;
    remarks: string | null;

    mrp: string | null;
    discount_pct: string | null;
    rate: string | null;
    tax_pct: string | null;
    cgst_pct: string | null;
    sgst_pct: string | null;
    igst_pct: string | null;
    amount: string | null;
    tax_amount: string | null;
    total_amount: string | null;

    product: {
      id: number;
      product_name: string;
      article_code: string | null;
      unit_of_measure: string | null;
    };
  }[];

  grns: POGRN[];
  statusLogs?: POStatusLog[];
}

export interface POStatusLog {
  id: number;
  from_status: POStatus | null;
  to_status: POStatus;
  remarks: string | null;
  created_at: string;
  changedBy: {
    id: number;
    user_name: string;
  };
}


export const getPOById = async (vendorId: number, id: number) => {
  const { data } = await apiClient.get(`/purchase-orders/${vendorId}/${id}`);
  return data.data as PODetail;
};

export const updatePOItem = async (
  vendorId: number,
  poId: number,
  itemId: number,
  payload: {
    ordered_qty?: number;
    unit_price?: number;
    expected_delivery_date?: string | null;
    remarks?: string;

    mrp?: number;
    discount_pct?: number;
    rate?: number;
    tax_pct?: number;
    cgst_pct?: number;
    sgst_pct?: number;
    igst_pct?: number;
    amount?: number;
    tax_amount?: number;
    total_amount?: number;
  }
) => {
  const { data } = await apiClient.patch(
    `/purchase-orders/${vendorId}/${poId}/items/${itemId}`,
    payload
  );
  return data;
};

export const deletePOItem = async (vendorId: number, poId: number, itemId: number) => {
  const { data } = await apiClient.delete(`/purchase-orders/${vendorId}/${poId}/items/${itemId}`);
  return data;
};

export const updatePOStatus = async (vendorId: number, id: number, userId: number, status: string, remarks?: string) => {
  const { data } = await apiClient.patch(
    `/purchase-orders/${vendorId}/${id}/status`,
    { status, remarks, user_id: userId }
  );
  return data;
};

export const cancelPO = async (vendorId: number, id: number, userId: number, remarks?: string) => {
  const { data } = await apiClient.patch(
    `/purchase-orders/${vendorId}/${id}/cancel`,
    { user_id: userId, remarks }
  );
  return data;
};
export interface CreateGRNPayload {
  user_id: number;
  purchase_order_id: number;
  received_date: string;

  invoice_no?: string;
  invoice_date?: string;

  transport_name?: string;
  vehicle_no?: string;
  challan_no?: string;

  remarks?: string;

  items: {
    purchase_order_item_id: number;
    product_id: number;

    received_qty: number;
    accepted_qty: number;
    rejected_qty: number;

    rejection_reason?: string;
  }[];
}

export const createGRN = async (
  vendorId: number,
  payload: CreateGRNPayload
) => {
  const { data } = await apiClient.post(
    `/grn/${vendorId}/grn`,
    payload
  );

  return data.data;
};