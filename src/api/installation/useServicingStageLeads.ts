import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toastManager } from "@/components/ui/toast";

interface ApiErrorResponse {
  message?: string;
}

export interface ServicingDocument {
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

export const getServicingDocuments = async (
  vendorId: number,
  leadId: number,
): Promise<ServicingDocument[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/servicing/vendorId/${vendorId}/leadId/${leadId}/documents`,
  );

  return data?.data || [];
};

export const uploadServicingDocuments = async (
  formData: FormData,
): Promise<ServicingDocument[]> => {
  const { data } = await apiClient.post(
    "/leads/installation/servicing/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data?.data || [];
};

export const useGetServicingDocuments = (
  vendorId?: number,
  leadId?: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["servicingDocuments", vendorId, leadId],
    queryFn: () => getServicingDocuments(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId && enabled,
  });
};

export const useUploadServicingDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => uploadServicingDocuments(formData),
    onSuccess: (_, variables) => {
      const vendorId = variables.get("vendorId");
      const leadId = variables.get("leadId");

      queryClient.invalidateQueries({
        queryKey: ["servicingDocuments", Number(vendorId), Number(leadId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["finalHandoverReadiness"],
      });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title:
          err?.response?.data?.message ||
          "Failed to upload AMC contract documents",
        type: "error",
      });
    },
  });
};
