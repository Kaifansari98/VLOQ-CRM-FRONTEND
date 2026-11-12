// Mirrors the ComplaintMaster enums in the backend Prisma schema.

export type ComplaintRegistrationChannel = "CLIENT_PORTAL" | "WEBSITE" | "STAFF";

export type ComplaintClientType = "CRM_LEAD" | "EXTERNAL" | "EXCEPTIONAL";

export type ComplaintComponent = "SHUTTER" | "CARCASS" | "HARDWARE" | "ACCESSORY";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ComplaintStatus =
  | "NEW"
  | "UNDER_VERIFICATION"
  | "MORE_INFORMATION_REQUIRED"
  | "REJECTED"
  | "APPROVED_FOR_VISIT"
  | "AWAITING_CLIENT_ACCEPTANCE"
  | "PAYMENT_PENDING"
  | "VISIT_SCHEDULED"
  | "INSPECTION_SUBMITTED"
  | "QUOTATION_PREPARATION"
  | "DEPARTMENT_HEAD_APPROVAL"
  | "QUOTATION_SHARED"
  | "AWAITING_CLIENT_APPROVAL"
  | "AWAITING_PAYMENT"
  | "PROCUREMENT_PENDING"
  | "MATERIAL_RECEIVED"
  | "REPAIR_SCHEDULED"
  | "WORK_IN_PROGRESS"
  | "AWAITING_CLIENT_CONFIRMATION"
  | "AWAITING_HO_CLOSURE_APPROVAL"
  | "CLOSED"
  | "REOPENED"
  | "ON_HOLD"
  | "CANCELLED";

export interface ClientComplaintRow {
  id: number;
  complaint_code: string;
  registration_channel: ComplaintRegistrationChannel;
  client_type: ComplaintClientType;
  lead_code: string | null;
  client_name: string;
  client_mobile: string;
  client_email: string | null;
  site_address: string;
  product_type: string | null;
  component: ComplaintComponent;
  category: string;
  description: string;
  priority: ComplaintPriority | null;
  status: ComplaintStatus;
  possible_duplicate: boolean;
  cycle_number: number;
  assigned_ss: { id: number; name: string } | null;
  assigned_hss: { id: number; name: string } | null;
  created_at: string;
}

export interface ComplaintLeadLookup {
  lead_id: number;
  lead_code: string;
  client_name: string;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  site_address: string | null;
  usable_handover_date: string | null;
  final_handover_date: string | null;
  products: { instance_id: number; title: string; product_type: string }[];
  site_supervisor: { id: number; name: string } | null;
  existing_complaints: {
    complaint_code: string;
    status: ComplaintStatus;
    created_at: string;
    description: string;
  }[];
}

export interface ComplaintPossibleDuplicates {
  external_clients: {
    id: number;
    external_client_code: string;
    client_name: string;
    mobile: string;
    email: string | null;
    address: string;
    city: string;
    complaints: { complaint_code: string; status: ComplaintStatus; created_at: string }[];
  }[];
  leads: { lead_id: number; lead_code: string; client_name: string; site_address: string | null }[];
}

interface ComplaintDetailsInput {
  component: ComplaintComponent;
  category_id: number;
  description: string;
  additional_remarks?: string;
  preferred_visit_date?: string;
  photos: File[];
  videos: File[];
}

export type CreateClientComplaintInput = ComplaintDetailsInput &
  (
    | {
        client_mode: "CRM_LEAD";
        lead_code: string;
        instance_id?: number;
        usable_handover_date?: string;
        final_handover_date?: string;
        site_address?: string;
      }
    | {
        client_mode: "EXTERNAL";
        external_client_id?: number;
        client_name: string;
        client_mobile: string;
        client_alternate_mobile?: string;
        client_email?: string;
        site_address: string;
        city: string;
        product_type: string;
        installation_date?: string;
      }
  );
