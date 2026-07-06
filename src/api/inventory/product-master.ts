import { apiClient } from "@/lib/apiClient";

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

  suppliers?: ProductSupplierPayload[];
}

export interface ProductSupplierPayload {
  company_vendor_id: number;
  supplier_item_code?: string | null;
  amount?: number | null;
}

export interface ProductMastersResponse {
  categories: { id: number; category_name: string }[];
  units: { id: number; unit_name: string }[];
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