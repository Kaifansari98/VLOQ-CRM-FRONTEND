export interface User {
  id: number;
  vendor_id: number;
  user_name: string;
  user_contact: string;
  user_email: string;
  user_timezone: string;
  password: string;
  user_type_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  name: string;
  country_code: string;
  contact_no: string;
  alt_contact_no: string;
  email: string;
  vendor_id: number;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string;
}

export interface ProductStructure {
  id: number;
  type: string;
  vendor_id: number;
}

export interface ProductType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface LeadProductStructureMapping {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  product_structure_id: number;
  created_by: number;
  created_at: string;
  productStructure: ProductStructure;
}

export interface ProductMapping {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  product_type_id: number;
  created_by: number;
  created_at: string;
  productType: ProductType;
}

export interface Document {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_by: number;
  created_at: string;
  deleted_by: number | null;
  deleted_at: string | null;
  doc_type: string;
  account_id: number | null;
  lead_id: number;
  vendor_id: number;
}

export interface Source {
  id: number;
  type: string;
  vendor_id: number;
}

export interface SiteType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface AssignTo {
  user_name: string;
  id?: number;
}

export interface StatusType {
  type: string;
}