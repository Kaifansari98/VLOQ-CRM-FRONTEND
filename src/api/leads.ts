import { apiClient } from "@/lib/apiClient";
import {
  Account,
  AssignTo,
  LeadProductStructureMapping,
  ProductMapping,
  SiteType,
  Source,
  StatusType,
  User,
} from "@/types/comman-types";

export interface CreateLeadPayload {
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no?: string;
  email: string;
  site_address: string;
  site_type_id: number;
  priority: string;
  billing_name?: string;
  source_id: number;
  archetech_name?: string;
  designer_remark?: string;
  vendor_id: number;
  created_by: number;
  product_types?: string[];
  product_structures?: string[];
}

export interface Lead {
  id: number;
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no: string;
  email: string;
  site_address: string;
  site_type_id: number;
  priority: string;
  billing_name: string;
  source_id: number;
  account_id: number;
  archetech_name: string;
  designer_remark: string;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string;
  vendor_id: number;
  assign_to: number | null;
  assigned_by: number | null;
  account: Account;
  leadProductStructureMapping: LeadProductStructureMapping[];
  productMappings: ProductMapping[];
  documents: Document[];
  source: Source;
  siteType: SiteType;
  createdBy: User;
  assignedTo: AssignTo | null;
  statusType: StatusType;
  initial_site_measurement_date: string;
}

export interface AssignToPayload {
  assign_to: number;
  assign_by: number;
  assignment_reason?: string;
}

export interface EditLeadPayload {
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no?: string;
  email?: string;
  site_address?: string;
  site_type_id?: number;
  priority?: string;
  billing_name?: string;
  source_id?: number;
  archetech_name?: string;
  designer_remark?: string;
  product_types?: number[];
  product_structures?: number[];
  updated_by: number;
  initial_site_measurement_date?: string;
}

export const createLead = async (
  payload: CreateLeadPayload,
  files: File[] = []
) => {
  const formData = new FormData();

  console.log("[DEBUG] Frontend payload:", payload);

  // Append all form fields
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          formData.append(key, item.toString());
        });
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  // Append files
  files.forEach((file) => {
    formData.append("documents", file);
  });

  // Debug FormData contents
  console.log("[DEBUG] FormData entries:");
  for (const pair of formData.entries()) {
    console.log(pair[0] + ": " + pair[1]);
  }

  try {
    const response = await apiClient.post("leads/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("[DEBUG] API Error:", error.response?.data);
    throw error;
  }
};

export const updateLead = async (
  payload: EditLeadPayload,
  leadId: number,
  userId: number
) => {
  const response = await apiClient.put(
    `/leads/update/${leadId}/userId/${userId}`,
    payload
  );
  return response.data;
};

export type VendorLeadsResponse = Lead[];
export type VendorUserLeadsResponse = Lead[];

// Get all leads for a vendor
export const getVendorLeads = async (
  vendorId: number
): Promise<VendorLeadsResponse> => {
  const response = await apiClient.get(
    `/leads/get-vendor-leads/vendor/${vendorId}`
  );
  return response.data;
};

// Get leads for a specific user of a vendor
export const getVendorUserLeads = async (
  vendorId: number,
  userId: number
): Promise<Lead[]> => {
  const response = await apiClient.get(
    `/leads/get-vendor-user-leads/vendor/${vendorId}/user/${userId}`
  );
  return response.data.data.leads; // <-- notice the extra .data.leads
};

// Get leads for a specific user of a vendor
export const getVendorUserLeadsOpen = async (
  vendorId: number,
): Promise<Lead[]> => {
  const response = await apiClient.get(
    `/leads/bookingStage/status1-leads/${vendorId}`
  );
  return response.data.data; 
};

export const deleteLead = async (leadId: number, userId: number) => {
  const response = await apiClient.delete(
    `/leads/delete-lead/${leadId}/user-id/${userId}`
  );
  return response.data;
};

export const getVendorSalesExecutiveUsers = async (vendorId: number) => {
  const response = await apiClient.get(
    `/leads/sales-executives/vendor/${vendorId}`
  );
  return response.data;
};

export const getLeadById = async (
  leadId: number,
  vendorId: number,
  userId: number
) => {
  const response = await apiClient.get(
    `/leads/get-lead/${leadId}/vendor/${vendorId}/user/${userId}`
  );
  return response.data;
};

export const assignLeadToAnotherSalesExecutive = async (
  vendorId: number,
  leadId: number,
  payload: AssignToPayload
) => {
  const response = await apiClient.put(
    `/leads/sales-executives/vendor/${vendorId}/lead/${leadId}`,
    payload
  );
  return response.data;
};

export const uploadInitialSiteMeasurement = async (payload: any) => {
  const response = await apiClient.post(
    "/leads/initial-site-measurement/payment-upload",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};