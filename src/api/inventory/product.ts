import { apiClient } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductHistoryStats {
  total_pi: number;
  total_po: number;
  total_grn: number;
  total_ordered: number;
  total_accepted: number;
  total_rejected: number;
  total_pending: number;
  current_stock: number;
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
  stats: ProductHistoryStats;
  purchase_intents: ProductHistoryPI[];
  purchase_orders: ProductHistoryPO[];
  grn_receipts: ProductHistoryGRN[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const getProductPurchaseHistory = async (vendorId: number, productId: number) => {
  const { data } = await apiClient.get(`/inventory/products/${vendorId}/${productId}/history`);
  return data.data as ProductHistory;
};


export type CostingMethod = "FIFO" | "MANUAL";
export type ProductItemType = "CapitalGoods" | "Goods" | "Services";

export interface ProductPayload {
  user_id?: number;

  category_id: number;
  product_name: string;
  article_code: string;

  item_group_id?: number | null;

  primary_unit_id?: number | null;
  stock_unit_id?: number | null;
  consumption_unit_id?: number | null;

  shelf_life_days?: number | null;
  costing_method: CostingMethod;

  level1_price?: number | null;

  min_stock_qty?: number | null;
  min_stock_unit_id?: number | null;

  max_stock_qty?: number | null;
  max_stock_unit_id?: number | null;

  reorder_level_qty?: number | null;
  reorder_level_unit_id?: number | null;

  reorder_batch_qty?: number | null;
  reorder_batch_unit_id?: number | null;

  hsn_id?: number | null;
  item_type: ProductItemType;
}

export interface ProductMasterOption {
  id: number;
  category_name?: string;
  unit_name?: string;
  group_name?: string;
  hsn_code?: string;
  description?: string | null;
  cgst_rate?: string;
  sgst_rate?: string;
  igst_rate?: string;
}

export interface ProductMastersResponse {
  categories: { id: number; category_name: string }[];
  units: { id: number; unit_name: string }[];
  itemGroups: { id: number; group_name: string }[];
  hsns: {
    id: number;
    hsn_code: string;
    description: string | null;
    cgst_rate: string;
    sgst_rate: string;
    igst_rate: string;
  }[];
  costingMethods: CostingMethod[];
  itemTypes: ProductItemType[];
}

export const fetchProductMasters = async (vendorId: number) => {
  const { data } = await apiClient.get(`/inventory/products/${vendorId}/masters`);
  return data.data as ProductMastersResponse;
};

export const fetchProducts = async (
  vendorId: number,
  params: { page?: number; search?: string; page_size?: number }
) => {
  const q = new URLSearchParams();

  if (params.page) q.set("page", String(params.page));
  if (params.search) q.set("search", params.search);
  if (params.page_size) q.set("page_size", String(params.page_size));

  const { data } = await apiClient.get(
    `/inventory/products/${vendorId}?${q.toString()}`
  );

  return data.data as {
    products: any[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
};

export const fetchProductById = async (vendorId: number, id: number) => {
  const { data } = await apiClient.get(`/inventory/products/${vendorId}/${id}`);
  return data.data;
};

export const createProductApi = async (
  vendorId: number,
  payload: ProductPayload
) => {
  const { data } = await apiClient.post(`/inventory/products/${vendorId}`, payload);
  return data;
};

export const updateProductApi = async (
  vendorId: number,
  id: number,
  payload: ProductPayload
) => {
  const { data } = await apiClient.put(
    `/inventory/products/${vendorId}/${id}`,
    payload
  );

  return data;
};

export const deleteProductApi = async (
  vendorId: number,
  id: number,
  userId?: number
) => {
  const { data } = await apiClient.delete(
    `/inventory/products/${vendorId}/${id}`,
    {
      data: {
        user_id: userId,
      },
    }
  );

  return data;
};