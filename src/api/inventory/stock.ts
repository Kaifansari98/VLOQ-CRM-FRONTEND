import { apiClient } from "@/lib/apiClient";

export type StockChangeSource = "GRNConfirmation" | "ExcelUpload" | "ManualAdjustment";

export interface StockHistoryRow {
  id:              number;
  product_id:      number;
  old_stock:       string;
  new_stock:       string;
  change:          string;
  source:          StockChangeSource;
  upload_batch_id: string | null;
  remarks:         string | null;
  created_at:      string;
  changedBy:       { id: number; user_name: string } | null;
}

export interface StockHistoryResponse {
  history:     StockHistoryRow[];
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
}

export interface StockBatch {
  batch_id:         string;
  uploaded_by:      string;
  products_updated: number;
  uploaded_at:      string;
}

export interface UploadResult {
  total:      number;
  updated:    number;
  skipped:    number;
  batch_id:   string;
  errors:     { row: number; id: number; reason: string }[];
}

// Download Excel template with current stock
export const downloadStockSheet = async (
  vendorId: number,
  filters: {
    search?:      string;
    category_id?: number;
    brand_id?:    number;
    active?:      string;
    procurement?: string;
  } = {}
): Promise<void> => {
  const q = new URLSearchParams();
  if (filters.search)      q.set("search",      filters.search);
  if (filters.category_id) q.set("category_id", String(filters.category_id));
  if (filters.brand_id)    q.set("brand_id",    String(filters.brand_id));
  if (filters.active)      q.set("active",      filters.active);
  if (filters.procurement) q.set("procurement", filters.procurement);

  const res = await apiClient.get(
    `/inventory/stock/${vendorId}/download?${q.toString()}`,
    { responseType: "blob" }
  );
  const url  = URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href  = url;
  const date = new Date().toISOString().split("T")[0];
  link.download = `stock_${vendorId}_${date}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

// Upload filled Excel and update stock
export const uploadStockSheet = async (
  vendorId: number,
  userId:   number,
  file:     File
) => {
  const form = new FormData();
  form.append("file",    file);
  form.append("user_id", String(userId));
  const { data } = await apiClient.post(
    `/inventory/stock/${vendorId}/upload`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data as UploadResult;
};

// Stock history for one product
export const getProductStockHistory = async (
  vendorId:  number,
  productId: number,
  page = 1
) => {
  const { data } = await apiClient.get(
    `/inventory/stock/${vendorId}/history/${productId}?page=${page}`
  );
  return data.data as StockHistoryResponse;
};

// Upload batch list
export const getStockUploadBatches = async (vendorId: number, page = 1) => {
  const { data } = await apiClient.get(
    `/inventory/stock/${vendorId}/batches?page=${page}`
  );
  return data.data as { batches: StockBatch[]; total: number; page: number; page_size: number; total_pages: number };
};