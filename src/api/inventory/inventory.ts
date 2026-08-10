import { apiClient } from "@/lib/apiClient";

export interface Product {
  id:                 number;
  item_id:            number;
  product_name:       string;
  article_code:       string | null;
  vendor_code:        string | null;
  group:              string | null;
  finish:             string | null;
  core_material:      string | null;
  edge_banding_color: string | null;
  unit_of_measure:    string | null;
  alt_uom_text:       string | null;
  procurement:        string | null;
  hsn_code:           number | null;
  moq:                number;
  board_length:       number;
  board_width:        number;
  dimension_1:        number;
  dimension_2:        number;
  dimension_3:        number;
  item1_weight:       string | null;
  level1_price:       string | null;
  level2_price:       string | null;
  level3_price:       string | null;
  installation_charges: string | null;
  rotation:           number;
  alt_conv_factor:    number;
  no_of_drill_holes:  number;
  pre_mill_width:     number;
  custom_field_1:     string | null;
  custom_field_2:     string | null;
  custom_field_3:     string | null;
  active:             "Yes" | "No";
  created_at:         string;
  updated_at:         string;
  category: { id: number; category_name: string };
  brand:    { id: number; brand_name: string } | null;
  current_stock: number|0;

  // Added relation and price fields
  barcode?: string | null;
  subCategory?: { id: number; name: string } | null;
  coreProduct?: { id: number; name: string } | null;
  grade?: { id: number; name: string } | null;
  productType?: { id: number; type: string; tag: string } | null;
  finishMaster?: { id: number; name: string } | null;
  sizeMaster?: { id: number; name: string } | null;
  primaryUnit?: { id: number; unit_name: string } | null;
  product_as_per_vendor_invoice?: string | null;
  p_code?: string | null;
  color_name?: string | null;
  thickness_mm?: number | null;
  cost_price?: string | number | null;
  b2c_selling_price?: string | number | null;
  b2b_selling_price?: string | number | null;
  mrp?: string | number | null;
}

export interface ProductListResponse {
  products:    Product[];
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
}

export interface ProductFilters {
  categories:   { id: number; category_name: string }[];
  brands:       { id: number; brand_name: string }[];
  procurements: string[];   // ← distinct values from DB
}

export const getProducts = async (
  vendorId: number,
  params: {
    page?: number; search?: string; category_id?: number;
    brand_id?: number; active?: string; procurement?: string;
  }
) => {
  const query = new URLSearchParams();
  if (params.page)        query.set("page",        String(params.page));
  if (params.search)      query.set("search",      params.search);
  if (params.category_id) query.set("category_id", String(params.category_id));
  if (params.brand_id)    query.set("brand_id",    String(params.brand_id));
  if (params.active)      query.set("active",      params.active);
  if (params.procurement) query.set("procurement", params.procurement);

  const { data } = await apiClient.get(`/inventory/products/${vendorId}?${query.toString()}`);
  return data.data as ProductListResponse;
};

export const getProductFilters = async (vendorId: number) => {
  const { data } = await apiClient.get(`/inventory/products/${vendorId}/filters`);
  return data.data as ProductFilters;
};

export interface SyncResult {
  totalCount:    number;
  fetched:       number;
  created:       number;
  updated:       number;
  skipped:       number;
  brandsCreated: number;
}

export const syncCadBidProducts = async (vendorId: number) => {
  const { data } = await apiClient.post(`/inventory/sync-cadbid-products`, { vendor_id: vendorId });
  return data as { success: boolean; message: string; data: SyncResult };
};


