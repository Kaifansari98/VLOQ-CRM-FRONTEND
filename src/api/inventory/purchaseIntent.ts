import { apiClient } from "@/lib/apiClient";
import {
  PICompanyVendor,
  PIProduct,
  PICategory,
} from "@/types/inventory/inventory.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PIStatus = "Draft" | "ConvertToPO" | "ConvertedToPO" | "Cancelled";
export type PIPriority = "Low" | "Medium" | "High" | "Urgent";

export interface PaymentTermStage {
  id: number;
  stage_no: number;
  stage_name: string;
  trigger_type: string;
  percentage: string | null;
  fixed_amount: string | null;
  due_after_days: number | null;
  specific_date: string | null;
  requires_approval: boolean;
  remarks: string | null;
}

export interface PaymentTermOption {
  id: number;
  vendor_id: number;
  company_vendor_id: number | null;
  term_name: string;
  description: string | null;
  is_active: boolean;
  companyVendor?: {
    id: number;
    company_name: string;
    vendor_code: string;
  } | null;
  stages: PaymentTermStage[];
}

// Pricing fields sent per vendor row
export interface CreatePIVendor {
  company_vendor_id: number;
  payment_term_id?: number | null;

  required_qty: number;
  required_by_date?: string;
  estimated_price?: number;
  remarks?: string;

  // Pricing
  mrp?: number | null;
  discount_pct?: number | null;
  rate?: number | null;
  tax_pct?: number | null;
  cgst_pct?: number | null;
  sgst_pct?: number | null;
  igst_pct?: number | null;
  tax_amount?: number | null;
  amount?: number | null;
  total_amount?: number | null;
}

export interface CreatePIItem {
  product_id: number;
  uom?: string;
  remarks?: string;
  vendors: CreatePIVendor[];
}

export interface CreatePIPayload {
  category_id?: number;
  user_id: number;
  priority: PIPriority;
  remarks?: string;
  items: CreatePIItem[];
  supplier_additional_costs?: {
  company_vendor_id: number;
  additional_cost_id: number;
  calculation_type: "Fixed" | "Percentage";
  amount?: number;
  percentage?: number;
  tax_pct?: number;
  remarks?: string;
}[];
}

export interface PISummary {
  id: number;
  intent_no: string;
  status: PIStatus;
  priority: PIPriority;
  remarks: string | null;
  created_at: string;
  approved_at: string | null;
  category: { id: number; category_name: string };
  createdBy: { id: number; user_name: string };
  _count: { items: number };
}

export interface PIListResponse {
  intents: PISummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const fetchPICategories = async (vendorId: number) => {
  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}/categories`
  );

  return data.data as PICategory[];
};

export const fetchPIProducts = async (
  vendorId: number,
  category_id?: number,
  search = ""
) => {
  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}/products?category_id=${category_id}&search=${encodeURIComponent(
      search
    )}`
  );

  return data.data as PIProduct[];
};

export const fetchPICompanyVendors = async (
  vendorId: number,
  search = ""
) => {
  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}/company-vendors?search=${encodeURIComponent(
      search
    )}`
  );

  return data.data as PICompanyVendor[];
};

export const fetchPIPaymentTerms = async (vendorId: number) => {
  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}/payment-terms/get`
  );

  return data.data as PaymentTermOption[];
};

export const fetchCompanyStateId = async (
  vendorId: number
): Promise<number> => {
  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}/company-state-id`
  );

  return data.data.state_id;
};

export const createPurchaseIntent = async (
  vendorId: number,
  payload: CreatePIPayload
) => {
  const { data } = await apiClient.post(
    `/inventory/purchase-intents/${vendorId}`,
    payload
  );

  return data;
};

export const listPurchaseIntents = async (
  vendorId: number,
  params: { page?: number; status?: string; search?: string }
) => {
  const q = new URLSearchParams();

  if (params.page) q.set("page", String(params.page));
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);

  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}?${q.toString()}`
  );

  return data.data as PIListResponse;
};

// Vendor mapping returned from API
export interface PIVendorMapping {
  id: number;
  company_vendor_id: number;
  payment_term_id: number | null;

  required_qty: string;
  required_by_date: string | null;
  estimated_price: string | null;
  remarks: string | null;

  // Pricing
  mrp: string | null;
  discount_pct: string | null;
  rate: string | null;
  tax_pct: string | null;
  cgst_pct: string | null;
  sgst_pct: string | null;
  igst_pct: string | null;
  tax_amount: string | null;
  amount: string | null;
  total_amount: string | null;

  companyVendor: {
    id: number;
    company_name: string;
    vendor_code: string;
    contact_no: string;
    email: string | null;
    state_id?: number | null;
    default_payment_term_id?: number | null;
  };

  paymentTerm: {
    id: number;
    term_name: string;
    description: string | null;
    company_vendor_id: number | null;
  } | null;
}

export interface PIDetailItem {
  id: number;
  product_id: number;
  uom: string | null;
  remarks: string | null;
  product: {
    id: number;
    product_name: string;
    article_code: string | null;
    vendor_code: string | null;
    unit_of_measure: string | null;
    moq: number;
    level1_price: string | null;
    procurement: string | null;
    hsn_id: number | null;
  };
  vendorMappings: PIVendorMapping[];
}

export interface PIDetail {
  id: number;
  intent_no: string;
  status: PIStatus;
  priority: PIPriority;
  remarks: string | null;
  rejection_reason: string | null;
  created_at: string;
  approved_at: string | null;
  category: { id: number; category_name: string };
  createdBy: { id: number; user_name: string };
  updatedBy: { id: number; user_name: string } | null;
  approvedBy: { id: number; user_name: string } | null;
  rejectedBy: { id: number; user_name: string } | null;
  items: PIDetailItem[];
  statusLogs: {
    id: number;
    from_status: PIStatus | null;
    to_status: PIStatus;
    remarks: string | null;
    created_at: string;
    changedBy: { id: number; user_name: string };
  }[];
}

export const getPurchaseIntentById = async (
  vendorId: number,
  id: number
) => {
  const { data } = await apiClient.get(
    `/inventory/purchase-intents/${vendorId}/${id}`
  );

  return data.data as PIDetail;
};

export const updatePurchaseIntent = async (
  vendorId: number,
  id: number,
  payload: CreatePIPayload & { user_id?: number }
) => {
  const { data } = await apiClient.put(
    `/inventory/purchase-intents/${vendorId}/${id}`,
    payload
  );

  return data;
};

export const updatePIStatus = async (
  vendorId: number,
  id: number,
  status: PIStatus,
  remarks?: string
) => {
  const { data } = await apiClient.patch(
    `/inventory/purchase-intents/${vendorId}/${id}/status`,
    { status, remarks }
  );

  return data;
};

export const deletePurchaseIntent = async (
  vendorId: number,
  id: number
) => {
  const { data } = await apiClient.delete(
    `/inventory/purchase-intents/${vendorId}/${id}`
  );

  return data;
};

export type AdditionalCostOption = {
  id: number;
  cost_name: string;
  cost_code?: string | null;
  description?: string | null;
  is_taxable: boolean;
  tax_pct: string | number;
};

export type SupplierAdditionalCostPayload = {
  company_vendor_id: number;
  additional_cost_id: number;
  calculation_type: "Fixed" | "Percentage";
  amount: number;
  percentage: number;
  tax_pct: number;
  remarks?: string;
};


export const fetchAdditionalCosts = async (vendorId: number) => {
  const res = await apiClient.get(`/inventory/additional-costs/${vendorId}`);

  const data = res.data;

  if (data.status === 0) {
    throw new Error(data.message || "Failed to fetch additional costs");
  }

  return data.data as AdditionalCostOption[];
};


export const createAdditionalCostApi = async (
  vendorId: number,
  payload: {
    cost_name: string;
    cost_code?: string;
    description?: string;
    is_taxable?: boolean;
    tax_pct?: number;
    created_by?: number;
  }
) => {
  const res = await apiClient.post(
    `/inventory/additional-costs/${vendorId}`,
    payload
  );

  const data = res.data;

  if (data.status === 0) {
    throw new Error(data.message || "Failed to create additional cost");
  }

  return data.data as AdditionalCostOption;
};