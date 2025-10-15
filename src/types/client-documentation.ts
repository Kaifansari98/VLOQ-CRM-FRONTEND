// Root API response
export interface ClientDocumentationResponse {
  success: boolean;
  message: string;
  data: ClientDocumentationLead[];
  count: number;
}

// Single lead item
export interface ClientDocumentationLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no: string;
  email: string;
  site_address: string;
  site_type_id: number;
  status_id: number;
  source_id: number;
  account_id: number;
  archetech_name: string;
  designer_remark: string;
  final_desc_note: string;
  initial_site_measurement_date: string;
  final_booking_amt: number;
  vendor_id: number;
  assign_to: number;
  assigned_by: number;
  is_deleted: boolean;
  deleted_by: number | null;
  deleted_at: string | null;
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;

  siteType: SiteType;
  source: SourceType;
  statusType: StatusType;
  createdBy: UserBasic;
  updatedBy: UserFull;
  assignedTo: UserBasic;
  assignedBy: UserBasic;
  productMappings: ProductMapping[];
  leadProductStructureMapping: LeadProductStructureMapping[];
}

// Nested types
export interface SiteType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface SourceType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface StatusType {
  id: number;
  type: string;
  vendor_id: number;
}

// User types
export interface UserBasic {
  id: number;
  user_name: string;
}

export interface UserFull {
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

// Product mappings
export interface ProductMapping {
  productType: ProductType;
}

export interface ProductType {
  id: number;
  type: string;
  tag: string;
}

// Lead product structure
export interface LeadProductStructureMapping {
  productStructure: ProductStructure;
}

export interface ProductStructure {
  id: number;
  type: string;
}
// Processed data for table / UI
export type ProcessedClientDocumentationLead = {
  id: number;
  srNo: number;
  name: string;
  email: string;
  contact: string;
  altContact?: string;
  siteAddress: string;
  architechName: string;
  designerRemark: string;
  productTypes: string;
  productStructures: string;
  final_booking_amt: number;
  source?: string;
  siteType?: string;
  status?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt?: string;
  accountId: number;
};

{
  /* Types for Client Documentation Details */
}

export interface ClientDocDetails {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  signed_url: string;
  created_at: string;
}

export interface ClientDocDetailsResponse {
  documents: ClientDocDetails[] | undefined;
}
