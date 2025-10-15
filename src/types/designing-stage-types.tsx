// Base interfaces for common entities
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

export interface Vendor {
  id: number;
  vendor_name: string;
  vendor_code: string;
  primary_contact_number: string;
  primary_contact_email: string;
  primary_contact_name: string;
  country_code: string;
  head_office_id: number | null;
  status: string;
  logo: string;
  time_zone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: number;
  name: string;
  country_code: string;
  contact_no: string;
  alt_contact_no: string;
  email: string;
  vendor_id: number;
  is_deleted: boolean;
  deleted_by: number | null;
  deleted_at: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  contact: string;
  alt_contact: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  clientCode: string;
}

export interface SiteType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface Source {
  id: number;
  type: string;
  vendor_id: number;
}

export interface StatusType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface DocumentType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface ProductType {
  id: number;
  type: string;
  vendor_id: number;
}

export interface ProductStructure {
  id: number;
  type: string;
  vendor_id: number;
}

// Document interface
export interface Document {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_by: number;
  created_at: string;
  deleted_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
  doc_type_id: number;
  account_id: number;
  lead_id: number;
  vendor_id: number;
  documentType: DocumentType;
  createdBy: User;
  signedUrl: string;
}

// Payment interface
export interface Payment {
  id: number;
  lead_id: number;
  account_id: number;
  amount: number;
  payment_date: string;
  payment_text: string;
  payment_file_id: number | null;
  created_at: string;
  created_by: number;
  vendor_id: number;
  document: Document | null;
  createdBy: User;
}

// Ledger interface
export interface Ledger {
  id: number;
  lead_id: number;
  account_id: number;
  client_id: number;
  vendor_id: number;
  amount: number;
  payment_date: string;
  type: string;
  created_by: number;
  created_at: string;
  account: Account;
  client: Client;
  createdBy: User;
}

// Product mapping interfaces
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

export interface AssignTo {
  id: number;
  user_email: string;
  user_name: string;
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

// Main Lead interface
export interface DesigningLead {
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
  vendor_id: number;
  assignedTo: AssignTo | null;
  assigned_by: number | null;
  is_deleted: boolean;
  deleted_by: number | null;
  deleted_at: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string;
  vendor: Vendor;
  siteType: SiteType;
  source: Source;
  statusType: StatusType;
  account: Account;
  documents: Document[];
  payments: Payment[];
  ledgers: Ledger[];
  productMappings: ProductMapping[];
  leadProductStructureMapping: LeadProductStructureMapping[];
  initial_site_measurement_date: string;
}

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Main API response data interface
export interface LeadsData {
  leads: DesigningLead[];
  pagination: Pagination;
  count: number;
}

// Complete API response interface
export interface GetDesigningStageResponse {
  success: boolean;
  message: string;
  data: LeadsData;
  statusCode: number;
  timestamp: string;
}

export type ProcessedDesigningStageLead = {
  id: number;
  srNo: number;
  name: string;
  email: string;
  contact: string;
  siteAddress: string;
  architechName: string;
  designerRemark: string;
  productTypes: string;
  productStructures: string;
  source: string;
  siteType: string;
  createdAt: string;
  updatedAt: string;
  altContact?: string;
  status: string;
  assignedTo: string;
  documentUrl: Document[];
  paymentInfo: Payment | null;
  accountId: number;
  initial_site_measurement_date: string;
};

{
  /* Types for Meetings */
}

export interface MeetingDocument {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_by: number;
  created_at: string;
  deleted_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
  doc_type_id: number;
  account_id: number;
  lead_id: number;
  vendor_id: number;
  signedUrl: string;
}

// Document Mapping interface
export interface DesignMeetingDocsMapping {
  id: number;
  lead_id: number;
  account_id: number;
  vendor_id: number;
  meeting_id: number;
  document_id: number;
  created_at: string;
  created_by: number;
  document: MeetingDocument;
}

// Meeting interface
export interface Meeting {
  id: number;
  lead_id: number;
  account_id: number;
  vendor_id: number;
  date: string;
  desc: string;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string | null;
  designMeetingDocsMapping: DesignMeetingDocsMapping[];
}

// API Response interface
export interface GetMeetingsResponse {
  success: boolean;
  logs: string[];
  meetings: Meeting[];
}

{
  /* Types or Interface for get designs */
}

export interface DocumentType {
  id: number;
  type: string;
  tag: string;
}

export interface User {
  id: number;
  user_name: string;
  user_email: string;
  user_contact: string;
}

export interface DesignsDocument {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_by: number;
  created_at: string;
  deleted_by: number | null;
  deleted_at: string | null;
  is_deleted: boolean;
  doc_type_id: number;
  account_id: number;
  lead_id: number;
  vendor_id: number;
  signedUrl: string;
  documentType: DocumentType;
  createdBy: User;
  deletedBy: User | null;
}

export interface DesignsData {
  lead_id: number;
  vendor_id: number;
  document_type: string;
  total_documents: number;
  documents: DesignsDocument[];
}

export interface GetDesignsResponse {
  success: boolean;
  message: string;
  logs: string[];
  data: DesignsData;
}

{
  /* Types for Selection */
}

export interface DesignSelection {
  id: number;
  lead_id: number;
  account_id: number;
  vendor_id: number;
  type: string;
  desc: string;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  account: Account;
}

export interface DesignSelectionsResponse {
  success: boolean;
  message: string;
  logs: string[];
  data: DesignSelection[];
}
