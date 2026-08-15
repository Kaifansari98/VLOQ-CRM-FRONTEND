import { apiClient } from "@/lib/apiClient";

export interface RequirementDocumentType {
  id: number;
  type: string;
  tag: string;
  stage?: string | null;
  doc_title?: string | null;
  vendor_id: number;
}

export interface RequirementDocumentItem {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  vendor_id: number;
  lead_id: number;
  product_type_id?: number | null;
  b2b_requirement_type_id?: number | null;
  doc_type_id: number;
  created_at: string;
  created_by: number;
  signedUrl?: string;
  documentType?: RequirementDocumentType;
  createdBy?: {
    id: number;
    user_name: string;
    user_email?: string;
  };
}

export const fetchRequirementDocumentTypesApi = async (vendorId: number) => {
  const { data } = await apiClient.get(`/leads/requirement-documents/types?vendor_id=${vendorId}`);
  return data;
};

export const fetchRequirementDocumentsApi = async (
  leadId: number,
  vendorId: number,
  productTypeId?: number
) => {
  let url = `/leads/requirement-documents?lead_id=${leadId}&vendor_id=${vendorId}`;
  if (productTypeId) {
    url += `&product_type_id=${productTypeId}`;
  }
  const { data } = await apiClient.get(url);
  return data;
};

export const uploadRequirementDocumentApi = async ({
  file,
  lead_id,
  vendor_id,
  product_type_id,
  doc_type_id,
  created_by,
}: {
  file: File;
  lead_id: number;
  vendor_id: number;
  product_type_id: number;
  doc_type_id: number;
  created_by: number;
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lead_id", String(lead_id));
  formData.append("vendor_id", String(vendor_id));
  formData.append("product_type_id", String(product_type_id));
  formData.append("doc_type_id", String(doc_type_id));
  formData.append("created_by", String(created_by));

  const { data } = await apiClient.post("/leads/requirement-documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const deleteRequirementDocumentApi = async (documentId: number, deletedBy: number) => {
  const { data } = await apiClient.delete(`/leads/requirement-documents/${documentId}`, {
    data: { deleted_by: deletedBy },
  });
  return data;
};
