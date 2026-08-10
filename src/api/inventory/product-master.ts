import { apiClient } from "@/lib/apiClient";

export type CostingMethod = "FIFO" | "MANUAL";
export type ProductItemType = "CapitalGoods" | "Goods" | "Services";

export interface ProductPayload {
  user_id?: number;

  category_id: number;
  sub_category_id?: number | null;
  product_name: string;
  article_code: string;
  item_code?: string;
  barcode?: string | null;

  brand_id?: number | null;
  item_group_id?: number | null;

  primary_unit_id?: number | null;
  purchase_unit_id?: number | null;
  stock_unit_id?: number | null;
  consumption_unit_id?: number | null;

  shelf_life_days?: number | null;
  costing_method: "FIFO" | "MANUAL";

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
  item_type: "CapitalGoods" | "Goods" | "Services";
  item_type_master_id?: number | null;

  core_product_id?: number | null;
  grade_id?: number | null;
  type_id?: number | null;
  finish_id?: number | null;
 
  length?: number | null;
  height?: number | null;
  thickness?: number | null;
  size?: string | null;
 
  suppliers?: ProductSupplierPayload[];
}
 
export interface ProductSupplierPayload {
  company_vendor_id: number;
  supplier_item_code?: string | null;
  amount?: number | null;
  procurement_expense_amount?: number | null;
  procurement_expense_pct?: number | null;
  procurement_expense_total?: number | null;
 
  final_amount?: number | null;
}
 
export interface ProductMastersResponse {
  categories: { id: number; category_name: string; parent_id?: number | null }[];
  brands: { id: number; brand_name: string; brand_short_name?: string | null; logo?: string | null }[];
  grades: { id: number; grade_name: string }[];
  finishes: { id: number; finish_name: string }[];
  types: { id: number; type_name: string }[];
  coreProducts: { id: number; core_product_name: string }[];
  itemTypeMasters: { id: number; item_type_name: string }[];
  units: { id: number; unit_name: string; short_name?: string | null; decimal_allowed?: boolean }[];
  itemGroups: { id: number; group_name: string }[];
  hsns: {
    id: number;
    hsn_code: string;
    description: string | null;
    cgst_rate?: string | null;
    sgst_rate?: string | null;
    igst_rate?: string | null;
  }[];
  suppliers: {
    id: number;
    company_name: string;
    vendor_code: string;
  }[];
  costingMethods: ("FIFO" | "MANUAL")[];
  itemTypes: ("CapitalGoods" | "Goods" | "Services")[];
}


export const fetchProductMasters = async (vendorId: number) => {
  const { data } = await apiClient.get(
    `/inventory/products/${vendorId}/masters`
  );

  return data.data as ProductMastersResponse;
};

export const fetchProductById = async (
  vendorId: number,
  productId: number
) => {
  const { data } = await apiClient.get(
    `/inventory/products/${vendorId}/${productId}`
  );

  return data.data;
};

export const createProductMasterApi = async (
  vendorId: number,
  payload: ProductPayload
) => {
  const { data } = await apiClient.post(
    `/inventory/products/${vendorId}`,
    payload
  );

  return data;
};

export const updateProductMasterApi = async (
  vendorId: number,
  productId: number,
  payload: ProductPayload
) => {
  const { data } = await apiClient.put(
    `/inventory/products/${vendorId}/${productId}`,
    payload
  );

  return data;
};

export type CreateHSNPayload = {
  hsn_code: string;
  description?: string;
  igst_rate: number;
};

export const createHSNApi = async (
  vendorId: number,
  payload: CreateHSNPayload
) => {
  const res = await apiClient.post(`/inventory/hsn/${vendorId}`, payload);

  const data = res.data;

  if (data.status === 0) {
    throw new Error(data.message || "Failed to create HSN");
  }

  return data.data;
};