import { apiClient } from "@/lib/apiClient";

export type ComplaintStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export interface EmployeeComplaintItem {
  id: number;
  vendor_id: number;
  user_id: number;
  franchise_id?: number | null;
  subject: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  admin_remarks?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  attachment_key?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    user_name: string;
    email?: string;
    user_email?: string;
    user_code?: string;
    designation?: string | null;
  };
  vendor?: {
    id: number;
    company_name: string;
  };
  franchise?: {
    id: number;
    franchise_name: string;
    Department?: string | null;
  } | null;
  reviewer?: {
    id: number;
    user_name: string;
  } | null;
}

export type ComplaintItem = EmployeeComplaintItem;

export interface ComplaintListResponse {
  items: EmployeeComplaintItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  is_super_admin: boolean;
}

export async function submitEmployeeComplaint(formData: FormData): Promise<EmployeeComplaintItem> {
  const { data } = await apiClient.post<{ success: boolean; data: EmployeeComplaintItem }>("/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function fetchEmployeeComplaints(params?: {
  status?: string;
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<ComplaintListResponse> {
  const { data } = await apiClient.get<{ success: boolean; data: ComplaintListResponse }>("/complaints", { params });
  return data.data;
}

export async function updateComplaintStatus(
  id: number,
  payload: { status: string; admin_remarks?: string }
): Promise<EmployeeComplaintItem> {
  const { data } = await apiClient.patch<{ success: boolean; data: EmployeeComplaintItem }>(
    `/complaints/${id}/status`,
    payload
  );
  return data.data;
}

export async function getComplaintAttachmentUrl(id: number): Promise<{ url: string; name: string }> {
  const { data } = await apiClient.get<{ success: boolean; data: { url: string; name: string } }>(
    `/complaints/${id}/attachment`
  );
  return data.data;
}

