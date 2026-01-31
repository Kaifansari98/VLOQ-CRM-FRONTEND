// ─────────── Reusable Types ───────────
export interface UserRef {
  id: number;
  user_name: string;
  user_email: string;
}

export interface AssignedTo {
  id: number;
  user_name: string;
}

export interface Vendor {
  id: number;
  vendor_name: string;
  vendor_code: string;
}

export interface SiteType {
  id: number;
  type: string;
}

export interface Source {
  id: number;
  type: string;
}

export interface StatusType {
  id: number;
  type: string;
}

export interface Account {
  id: number;
  name: string;
  contact_no: string;
  email: string;
  country_code?: string;
  alt_contact_no?: string | null;
}

export interface Document {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  doc_type_id: number;
  signed_url: string;
  file_type: string;
  is_image: boolean;
  created_at: string;
}

export interface DocumentBooking {
  id: number;
  originalName: string;
  s3Key: string;
  signedUrl: string;
  type: string;
  created_at?: string;
}

export interface PaymentInfo {
  id: number;
  amount: number;
  payment_date: string;
  payment_text: string;
  payment_file_id: number | null;
}

export interface LedgerEntry {
  id: number;
  amount: number;
  type: string;
  payment_date: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────── Upload for Booking ───────────
export interface BookingUpload {
  id: number;
  type: string;
  lead: {
    id: number;
    firstname: string;
    lastname: string;
    contact_no: string;
    email: string;
    status_id: number;
  };
  account: Account;
  paymentInfo?: PaymentInfo | null;
  ledgerEntry?: LedgerEntry | null;
  documents: Document[];
  createdBy: UserRef;
  created_at: string;
}

export interface ProductType {
  id: number;
  type: string;
}

export interface ProductMapping {
  productType: ProductType;
}

export interface ProductStructure {
  id: number;
  type: string;
}

export interface SiteSuperVisor {
  id: number;
  user_name: string;
  userName: string;
}

export interface PaymentDetails {
  amount: number;
  payment_text: string;
  text: string;
}
export interface ProductStructureMapping {
  productStructure: ProductStructure;
}

// ─────────── Main Booking Lead ───────────
export interface BookingLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no?: string | null;
  email: string;
  site_address: string;
  archetech_name: string;
  designer_remark: string;
  final_booking_amt: number;
  account_id: number;
  siteSupervisors: SiteSuperVisor[];
  payments: PaymentDetails[];
  documents: Document[];
  vendor: Vendor;
  siteType: SiteType;
  source: Source;
  account: Account;
  productMappings: ProductMapping[];
  leadProductStructureMapping?: ProductStructureMapping[];
  statusType: StatusType;
  createdBy: UserRef;
  site_map_link: string;  
  updatedBy: UserRef | null;
  assignedTo: AssignedTo | null;
  assignedBy: UserRef | null;
  created_at: string;
  updated_at: string;
}

export interface BookingLeadById {
  id: number;
  firstname: string;
  lastname: string;
  designer_remark: string;
  finalBookingAmount: number;
  account_id: number;
  supervisors: SiteSuperVisor[];
  payments: PaymentDetails[];
  documents: DocumentBooking[];
  account: Account;
  mrpValue: number;
  assignedTo: AssignedTo | null;
  bookingAmount?: number;
}
// ─────────── API Response ───────────
export interface BookingLeadResponse {
  success: boolean;
  message: string;
  data: {
    leads: BookingLead[];
    count: number;
  };
  pagination?: Pagination;
}

// ─────────── Edit Payload for Booking ───────────
export interface BookingEditPayload {
  lead_id: number;
  vendor_id: number;
  account_id: number;
  updated_by: number;
  amount?: number;
  text?: string;
  payment_date?: string;
  final_documents?: string[];
  payment_details_photos?: string[];
}

// ─────────── Processed Booking Lead (UI Table) ───────────
export type ProcessedBookingLead = {
  id: number;
  lead_code: string;
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
  siteSupervisor: string;
  source?: string;
  siteType?: string;
  createdAt: string;
  updatedAt?: string;
  altContact?: string;
  status?: string;
  assignedTo: string;
  documentUrl?: Document[];
  paymentInfo?: PaymentInfo | null;
  paymentsText: string;
  bookingAmount: number;
  siteSupervisorId: number;
  accountId: number;
};
