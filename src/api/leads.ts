import { apiClient } from "@/lib/apiClient";

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
}

export interface AssignToPayload {
  assign_to: number;
  assign_by: number;
  assignment_reason?: string;
}

export interface EditLeadPayload {
  firstname: string; // yes
  lastname: string; // yes
  country_code: string; // yes
  contact_no: number; // yes
  alt_contact_no?: string; // yes
  email?: string; // yes
  site_address?: string; // yes
  site_type_id?: number; // yes
  priority?: string; // yes
  billing_name?: string; // yes
  source_id?: number; // yes 
  archetech_name?: string; // yes
  designer_remark?: string; // yes
  product_types?: number[]; // yes
  product_structures?: string[]; // yes
  updated_by: string; // yes
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
  for (let pair of formData.entries()) {
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
  return response.data
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


export const getLeadById = async (leadId: number,vendorId: number, userId: number) => {
  const response = await apiClient.get(`/leads/get-lead/${leadId}/vendor/${vendorId}/user/${userId}`);
  return response.data;
}

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