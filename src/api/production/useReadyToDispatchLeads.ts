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
  updated_by: number,
  instance_id?: number,
) => {
  const { data } = await apiClient.put(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/move-to-ready-to-dispatch`,
    { updated_by, instance_id }
  );
  return data;
};

export const useMoveLeadToReadyToDispatch = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updated_by,
      instance_id,
    }: {
      vendorId: number;
      leadId: number;
      updated_by: number;
      instance_id?: number;
    }) => moveLeadToReadyToDispatch(vendorId, leadId, updated_by, instance_id),
  });
};

// ✅ --- Fetch Current Site Photos (Ready-To-Dispatch)
// Without an instanceId this returns the photos of every instance of the lead.
export const getCurrentSitePhotos = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/ready-to-dispatch/vendorId/${vendorId}/leadId/${leadId}/current-site-photos`,
    { params: instanceId ? { instance_id: instanceId } : undefined }
  );
  return data?.data || [];
};

// ✅ --- React Query Hook
export const useCurrentSitePhotos = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["currentSitePhotos", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => getCurrentSitePhotos(vendorId!, leadId!, instanceId),
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
  task_type: string;
  due_date: string;
  remark?: string;
  user_id: number;
  created_by: number;
  /** Large-scale vendors: the instance that moves to Site Readiness. */
  instance_id?: number | null;
}

export interface SiteReadinessTaskConflict {
  id: number;
  task_type: "Site Readiness";
  status: string;
  due_date: string;
  assignee: {
    id: number;
    user_name: string;
  } | null;
}

export interface SiteReadinessFollowUpTaskConflict {
  id: number;
  task_type: "Follow Up";
  status: string;
  due_date: string;
  assignee: {
    id: number;
    user_name: string;
  } | null;
}

/**
 * ✅ Assign Site Readiness Task (POST)
 * @route POST /leads/production/ready-to-dispatch/leadId/:leadId/tasks/assign-site-readiness
 */
export const assignSiteReadinessTask = async (
  leadId: number,
  payload: AssignToSiteReadinessPayload
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
    mutationFn: (payload: AssignToSiteReadinessPayload) =>
      assignSiteReadinessTask(leadId, payload),
  });
};

export const useAssignToSiteReadiness = (leadId: number) => {
  return useAssignSiteReadinessTask(leadId);
};

// With an instanceId, large-scale vendors only see that instance's open Site Readiness task.
export const getSiteReadinessTaskConflicts = async (
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/ready-to-dispatch/leadId/${leadId}/task-conflicts`,
    { params: instanceId ? { instance_id: instanceId } : undefined }
  );

  return {
    restrictedTaskConflicts: (data?.data?.conflicts?.restrictedTaskConflicts ??
      []) as SiteReadinessTaskConflict[],
    followUpConflicts: (data?.data?.conflicts?.followUpConflicts ??
      []) as SiteReadinessFollowUpTaskConflict[],
  };
};

// ✅ --- Get Current Site Photos COUNT + Flag (Ready-To-Dispatch)
// Without an instanceId this counts the photos of every instance of the lead.
export const getCurrentSitePhotosCount = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
): Promise<{ count: number; hasPhotos: boolean }> => {
  const { data } = await apiClient.get(
    `/leads/production/ready-to-dispatch/vendorId/${vendorId}/leadId/${leadId}/current-site-photos/count`,
    { params: instanceId ? { instance_id: instanceId } : undefined }
  );

  return data?.data || { count: 0, hasPhotos: false };
};

// ✅ --- React Query Hook
export const useCurrentSitePhotosCount = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["currentSitePhotosCount", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => getCurrentSitePhotosCount(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useSiteReadinessTaskConflicts = (
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery<{
    restrictedTaskConflicts: SiteReadinessTaskConflict[];
    followUpConflicts: SiteReadinessFollowUpTaskConflict[];
  }>({
    queryKey: ["siteReadinessTaskConflicts", leadId, instanceId ?? "all"],
    queryFn: () => getSiteReadinessTaskConflicts(leadId!, instanceId),
    enabled: !!leadId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
};
