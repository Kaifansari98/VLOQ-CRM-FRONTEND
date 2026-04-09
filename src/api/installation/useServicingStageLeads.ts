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

export interface ServiceScheduleUser {
  id: number;
  user_name: string;
  user_type?: {
    user_type: string;
  };
}

export interface ServiceScheduleDocument {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_at: string;
  signed_url: string;
}

export interface ServiceSchedule {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  service_no: number;
  service_type: "free" | "amc";
  scheduled_for: string;
  original_scheduled_for: string;
  status: "open" | "completed" | "rejected";
  rescheduled_once: boolean;
  rescheduled_from: string | null;
  completed_at: string | null;
  completion_remark: string | null;
  completion_document_id: number | null;
  rejected_at: string | null;
  rejection_remark: string | null;
  closure_reason: string | null;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string;
  createdBy: ServiceScheduleUser;
  updatedBy: ServiceScheduleUser | null;
  completedBy: ServiceScheduleUser | null;
  rejectedBy: ServiceScheduleUser | null;
  completionDocument: ServiceScheduleDocument | null;
}

export const getServiceSchedules = async (
  vendorId: number,
  leadId: number,
): Promise<ServiceSchedule[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/servicing/vendorId/${vendorId}/leadId/${leadId}/schedules`,
  );

  return data?.data || [];
};

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

export const useGetServiceSchedules = (
  vendorId?: number,
  leadId?: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["serviceSchedules", vendorId, leadId],
    queryFn: () => getServiceSchedules(vendorId!, leadId!),
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
