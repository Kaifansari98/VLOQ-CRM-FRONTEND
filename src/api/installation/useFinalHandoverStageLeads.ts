/* ==========================================================
   📦 Final Handover Stage API & React Query Hooks
   
   Add these to: @/api/installation/useFinalHandoverStageLeads.ts
   ========================================================== */

import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

/* ==========================================================
      🔹 TYPES & INTERFACES
      ========================================================== */

export interface FinalHandoverLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;
  contact_no: string;
  // ... add other lead fields as needed
}

export interface FinalHandoverLeadsResponse {
  total: number;
  leads: FinalHandoverLead[];
}

export interface FinalHandoverDocument {
  id: number;
  vendor_id: number;
  account_id: number;
  lead_id: number;
  doc_type_id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_by: number;
  created_at: string;
  signed_url: string;
  doc_type_tag: string;
}

/* ==========================================================
      🔹 API FUNCTIONS
      ========================================================== */

/**
 * 📋 GET - Final Handover Stage Leads (Paginated)
 * @route GET /leads/installation/final-handover/vendorId/:vendorId/userId/:userId
 */
export const getFinalHandoverStageLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<FinalHandoverLeadsResponse> => {
  const { data } = await apiClient.get(
    `/leads/installation/final-handover/vendorId/${vendorId}/userId/${userId}`,
    { params: { page, limit } }
  );

  return data?.data; // { total, leads }
};

/**
 * 📋 GET - Final Handover Documents
 * @route GET /leads/installation/final-handover/vendorId/:vendorId/leadId/:leadId/documents
 */
export const getFinalHandoverDocuments = async (
  vendorId: number,
  leadId: number
): Promise<FinalHandoverDocument[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/final-handover/vendorId/${vendorId}/leadId/${leadId}/documents`
  );

  return data?.data || [];
};

/**
 * ➕ POST - Upload Final Handover Documents
 * @route POST /leads/installation/final-handover/upload
 */
export const uploadFinalHandoverDocuments = async (
  formData: FormData
): Promise<FinalHandoverDocument[]> => {
  const { data } = await apiClient.post(
    `/leads/installation/final-handover/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data?.data || [];
};

/* ==========================================================
      🔹 REACT QUERY HOOKS
      ========================================================== */

/**
 * ✅ React Query Hook - Get Final Handover Stage Leads
 */
export const useFinalHandoverStageLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["finalHandoverStageLeads", vendorId, userId, page, limit],
    queryFn: () => getFinalHandoverStageLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

/**
 * ✅ React Query Hook - Get Final Handover Documents
 */
export const useGetFinalHandoverDocuments = (
  vendorId: number,
  leadId: number
) => {
  return useQuery({
    queryKey: ["finalHandoverDocuments", vendorId, leadId],
    queryFn: () => getFinalHandoverDocuments(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
    refetchOnMount: true,
  });
};

/**
 * ✅ React Query Mutation Hook - Upload Final Handover Documents
 */
export const useUploadFinalHandoverDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => uploadFinalHandoverDocuments(formData),

    onSuccess: (data, variables) => {
      toast.success("Documents uploaded successfully");

      // Extract vendorId and leadId from FormData
      const vendorId = variables.get("vendorId");
      const leadId = variables.get("leadId");

      // Invalidate and refetch documents
      queryClient.invalidateQueries({
        queryKey: ["finalHandoverDocuments", Number(vendorId), Number(leadId)],
      });

      // Also invalidate leads list if needed
      queryClient.invalidateQueries({
        queryKey: ["finalHandoverStageLeads"],
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to upload documents"
      );
    },
  });
};
