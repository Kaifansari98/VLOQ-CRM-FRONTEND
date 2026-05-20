import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductHistoryStats {
  total_pi:       number;
  total_po:       number;
  total_grn:      number;
  total_ordered:  number;
  total_accepted: number;
  total_rejected: number;
  total_pending:  number;
  current_stock:  number;
}

export interface ProductHistoryPI {
  id: number; intent_no: string; status: string; priority: string;
  created_at: string; created_by: string; category: string;
  uom: string | null; remarks: string | null;
  vendors: {
    vendor_name: string; vendor_code: string;
    required_qty: string; estimated_price: string | null; required_by: string | null;
  }[];
}

export interface ProductHistoryPO {
  id: number; po_no: string; status: string;
  created_at: string; expected_delivery_date: string | null;
  supplier: string; supplier_code: string; intent_no: string | null;
  ordered_qty: string; received_qty: string;
  unit_price: string | null; uom: string | null;
  expected_delivery_date_item: string | null;
}

export interface ProductHistoryGRN {
  id: number; grn_id: number; grn_no: string;
  status: string; received_date: string; confirmed_at: string | null;
  confirmed_by: string | null; po_no: string; supplier: string;
  received_qty: string; accepted_qty: string; rejected_qty: string;
  unit_price: string | null; item_status: string;
  rejection_reason: string | null;
  redeliveries: { id: number; status: string; requested_qty: string; expected_date: string | null }[];
}

export interface ProductHistory {
  product: {
    id: number; product_name: string; article_code: string | null;
    unit_of_measure: string | null; moq: number; level1_price: string | null;
    current_stock: string | null; stock_updated_at: string | null;
    dimension_1: number; dimension_2: number; dimension_3: number;
    board_length: number; board_width: number; procurement: string | null;
    category: { id: number; category_name: string };
  };
  stats:            ProductHistoryStats;
  purchase_intents: ProductHistoryPI[];
  purchase_orders:  ProductHistoryPO[];
  grn_receipts:     ProductHistoryGRN[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const getProductPurchaseHistory = async (vendorId: number, productId: number) => {
  const { data } = await apiClient.get(`/inventory/products/${vendorId}/${productId}/history`);
  return data.data as ProductHistory;
};