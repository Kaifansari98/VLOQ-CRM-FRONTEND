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

export interface UserRef {
  id: number;
  user_name: string;
}

export interface ProductType {
  id: number;
  type: string;
  tag: string;
}

export interface ProductMapping {
  productType: ProductType;
}

export interface ProductStructure {
  id: number;
  type: string;
}

export interface LeadProductStructureMapping {
  productStructure: ProductStructure;
}

export  interface TaskDetails {
  id: number;
  remark: string;
  due_date: string;
  status: string;
} 

export interface FinalMeasurementLead {
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
  updated_by: number | null;
  updated_at: string | null;
  followStatus?: string,
  tasks?:TaskDetails[]

  siteType: SiteType;
  source: SourceType;
  statusType: StatusType;
  createdBy: UserRef;
  updatedBy: UserRef | null;
  assignedTo: UserRef;
  assignedBy: UserRef;

  productMappings: ProductMapping[];
  leadProductStructureMapping: LeadProductStructureMapping[];
}

export type ProcessedFinalMeasurementLead = {
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
  final_booking_amt: number;
  source?: string;
  siteType?: string;
  createdAt: string;
  updatedAt?: string;
  altContact?: string;
  status?: string;
  assignedTo: string;
  accountId: number;
  followStatus?: string,
  taskId: number;
  tasks?:TaskDetails[]
};

export interface FinalMeasurementLeadsResponse {
  success: boolean;
  message: string;
  data: FinalMeasurementLead[];
  count: number;
}

{
  /* Tyeps for FinalMeasurementLeadBydId */
}

export interface FinalMeasurementDoc {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  doc_type_id: number;
  created_at: string;
  signedUrl: string;
}

export interface FinalMeasurementLeadDetails {
  id: number;
  final_desc_note: string;
  status_id: number;
  vendor_id: number;
  measurementDocs?: FinalMeasurementDoc[]; 
  sitePhotos: FinalMeasurementDoc[];
}