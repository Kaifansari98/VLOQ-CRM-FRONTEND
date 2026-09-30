// ─────────── Processed Booking Lead (UI Table) ───────────
export type ProcessedOrderLoginLead = {
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
    siteSupervisorId: number;
    accountId: number;
  };
  
  export interface orderLoginLead {
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
    updatedBy: UserRef | null;
    assignedTo: AssignedTo | null;
    assignedBy: UserRef | null;
    created_at: string;
    updated_at: string;
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

  export interface PaymentInfo {
    id: number;
    amount: number;
    payment_date: string;
    payment_text: string;
    payment_file_id: number | null;
  }

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