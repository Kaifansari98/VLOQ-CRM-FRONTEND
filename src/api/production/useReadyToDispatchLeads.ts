import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * ✅ Fetch Ready-To-Dispatch Leads (paginated)
 */
export const getReadyToDispatchLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/production/ready-to-dispatch/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );

  return data?.data;
};

/**
 * ✅ React Query Hook for Ready-To-Dispatch Leads
 */
export const useReadyToDispatchLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["readyToDispatchLeads", vendorId, userId, page, limit],
    queryFn: () => getReadyToDispatchLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

export const moveLeadToReadyToDispatch = async (
  vendorId: number,
  leadId: number,
  updated_by: number
) => {
  const { data } = await apiClient.put(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/move-to-ready-to-dispatch`,
    { updated_by }
  );
  return data;
};

export const useMoveLeadToReadyToDispatch = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updated_by,
    }: {
      vendorId: number;
      leadId: number;
      updated_by: number;
    }) => moveLeadToReadyToDispatch(vendorId, leadId, updated_by),
  });
};

// ✅ --- Fetch Current Site Photos (Ready-To-Dispatch)
export const getCurrentSitePhotos = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/ready-to-dispatch/vendorId/${vendorId}/leadId/${leadId}/current-site-photos`
  );
  return data?.data || [];
};

// ✅ --- React Query Hook
export const useCurrentSitePhotos = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["currentSitePhotos", vendorId, leadId],
    queryFn: () => getCurrentSitePhotos(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

// ✅ --- Upload Current Site Photos (Ready-To-Dispatch)
export const uploadCurrentSitePhotos = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.post(
    `/leads/production/ready-to-dispatch/vendorId/${vendorId}/leadId/${leadId}/upload-current-site-photos`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ✅ --- React Query Hook
export const useUploadCurrentSitePhotos = (
  vendorId?: number,
  leadId?: number
) => {
  return useMutation({
    mutationFn: (formData: FormData) =>
      uploadCurrentSitePhotos(vendorId!, leadId!, formData),
  });
};

export interface AssignToSiteReadinessPayload {
  task_type: "Site Readiness" | "Follow Up";
  due_date: string;
  remark?: string;
  user_id: number;
  created_by: number;
}

/**
 * ✅ Assign Site Readiness Task (POST)
 * @route POST /leads/production/ready-to-dispatch/leadId/:leadId/tasks/assign-site-readiness
 */
export const assignSiteReadinessTask = async (
  leadId: number,
  payload: {
    task_type: string;
    due_date: string;
    remark?: string;
    user_id: number;
    created_by: number;
  }
) => {
  const { data } = await apiClient.post(
    `/leads/production/ready-to-dispatch/leadId/${leadId}/tasks/assign-site-readiness`,
    payload
  );
  return data;
};

/**
 * ✅ React Query Hook for Assign Site Readiness Task
 */
export const useAssignSiteReadinessTask = (leadId: number) => {
  return useMutation({
    mutationFn: (payload: {
      task_type: string;
      due_date: string;
      remark?: string;
      user_id: number;
      created_by: number;
    }) => assignSiteReadinessTask(leadId, payload),
  });
};

export const useAssignToSiteReadiness = (leadId: number) => {
  return useAssignSiteReadinessTask(leadId);
};
