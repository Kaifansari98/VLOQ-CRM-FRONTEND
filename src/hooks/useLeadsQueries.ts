// hooks/useLeadsQueries.ts
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  assignToSiteMeasurement,
  AssignToSiteMeasurementPayload,
  getInitialSiteMeasurementTaskConflicts,
  InitialSiteMeasurementFollowUpTaskConflict,
  InitialSiteMeasurementTaskConflict,
  fetchLeadLogs,
  getLeadById,
  getLeadBlockStatus,
  getVendorLeads,
  getVendorUserLeads,
  getVendorUserLeadsOpen,
  blockLead,
  Lead,
  LeadBlockStatus,
  VendorLeadsResponse,
  VendorUserLeadsResponse,
  checkContactOrEmailExists,
  ContactOrEmailCheckPayload,
  ContactOrEmailCheckResult,
  checkSimilarLeadExists,
  SimilarLeadCheckPayload,
  SimilarLeadCheckResult,
  createFastProductionRequest,
  CreateFastProductionRequestPayload,
  finalizeFastProductionRequest,
  FinalizeFastProductionRequestPayload,
  checkFastProductionLimit,
  CheckFastProductionLimitPayload,
  CheckFastProductionLimitResponse,
  checkFastProductionStatus,
  getFastProductionDetailsForLead,
  revokeFastProductionRequest,
  RevokeFastProductionPayload,
  createSmallOrderRequest,
  CreateSmallOrderRequestPayload,
  getSmallOrderRequestsByLead,
  getLeadProductStructureInstances,
  getLeadUniqueProductTypes,
  getClientVisits,
  markSmallOrderRequestResolved,
  SmallOrderRequestListItem,
  uploadMoreSitePhotos,
  unblockLead,
  ClientVisit,
  getFastProductionRequestDraft,
  updateLeadStageAPI,
  UpdateLeadStagePayload,
} from "@/api/leads";
import {
  assignToFinalMeasurement,
  AssignToFinalMeasurementPayload,
  FollowUpTaskConflict,
  getRestrictedTaskConflicts,
  RestrictedTaskConflict,
} from "@/api/final-measurement";
import { apiClient } from "@/lib/apiClient";

interface UseLeadLogsOptions {
  leadId: number;
  vendorId: number;
  limit?: number;
}

export interface pagination {
  currentPage: number;
  totalPages: number;
  totalRecoards: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface VendorOverallLeadsResponse {
  count: number;
  data: Lead[];
  pagination: pagination;
}

export interface VendorUserLeadsOpenResponse {
  count: number;
  data: Lead[];
}

// Hook for getting vendor leads
export const useVendorLeads = (
  vendorId: number,
  enabled: boolean = true
): UseQueryResult<VendorLeadsResponse, Error> => {
  return useQuery({
    queryKey: ["vendorLeads", vendorId],
    queryFn: () => getVendorLeads(vendorId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for getting vendor user leads
export const useVendorUserLeads = (
  vendorId: number,
  userId: number,
  enabled: boolean = true
): UseQueryResult<VendorUserLeadsResponse, Error> => {
  return useQuery({
    queryKey: ["vendorUserLeads", vendorId, userId],
    queryFn: () => getVendorUserLeads(vendorId, userId),
    enabled: enabled && !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook for getting vendor user leads
export const useVendorUserLeadsOpen = (
  vendorId: number,
  userId: number,
  franchiseId?: number | null,
): UseQueryResult<VendorUserLeadsOpenResponse, Error> => {
  return useQuery({
    queryKey: ["vendorUserLeadsOpen", vendorId, userId, franchiseId ?? null],
    queryFn: () => getVendorUserLeadsOpen(vendorId, userId, franchiseId),
    enabled: !!vendorId && !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// ✅ Get all vendor leads (Overall Leads) for a given tag (e.g. Type 1)
export const getVendorOverallLeads = async (
  vendorId: number,
  userId: number,
  tag: string,
  page: number,
  limit: number
): Promise<VendorOverallLeadsResponse> => {
  const response = await apiClient.get(
    `/leads/bookingStage/vendorId/${vendorId}/all-leads`,
    {
      params: { userId, tag, page, limit },
    }    
  );
  return response.data; // keep full shape: { count, data }
};

export const useVendorOverallLeads = (
  vendorId: number,
  userId: number,
  tag: string,
  page: number,
  limit: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["vendorOverallLeads", vendorId, userId, tag, page, limit], 
    queryFn: () => getVendorOverallLeads(vendorId, userId, tag, page, limit),
    enabled: enabled && !!vendorId && !!tag,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

export function useLeadById(leadId?: number, vendorId?: number, userId?: number) {
  const query = useQuery({
    queryKey: ["lead", leadId, vendorId, userId],
    queryFn: () => getLeadById(leadId!, vendorId!, userId!),
    enabled: !!leadId && !!vendorId && !!userId,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 1000 * 60 * 5,        // 5 min — baar baar refetch nahi hoga
    refetchOnWindowFocus: false,      // ← YEH SABSE IMPORTANT FIX HAI
    refetchOnReconnect: false,
  });

  const waitingForQueryPrerequisites =
    !!leadId && (!vendorId || !userId);

  return {
    ...query,
    isLoading: query.isLoading || waitingForQueryPrerequisites,
    isPending: query.isPending || waitingForQueryPrerequisites,
  };
}

export function useLeadBlockStatus(leadId?: number, vendorId?: number) {
  return useQuery<LeadBlockStatus>({
    queryKey: ["leadBlockStatus", vendorId, leadId],
    queryFn: () => getLeadBlockStatus(vendorId!, leadId!),
    enabled: !!leadId && !!vendorId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}

export function useBlockLead() {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updatedBy,
    }: {
      vendorId: number;
      leadId: number;
      updatedBy: number;
    }) => blockLead(vendorId, leadId, updatedBy),
  });
}

export function useUnblockLead() {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updatedBy,
    }: {
      vendorId: number;
      leadId: number;
      updatedBy: number;
    }) => unblockLead(vendorId, leadId, updatedBy),
  });
}

export function useLeadProductStructureInstances(
  leadId?: number,
  vendorId?: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["lead-product-structure-instances", leadId, vendorId],
    queryFn: () => getLeadProductStructureInstances(vendorId!, leadId!),
    enabled: !!leadId && !!vendorId && enabled,
  });
}

export function useLeadUniqueProductTypes(
  leadId?: number,
  vendorId?: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["lead-unique-product-types", leadId, vendorId],
    queryFn: () => getLeadUniqueProductTypes(vendorId!, leadId!),
    enabled: !!leadId && !!vendorId && enabled,
  });
}

export function useClientVisits(leadId?: number) {
  return useQuery<ClientVisit[]>({
    queryKey: ["clientVisits", leadId],
    queryFn: () => getClientVisits(leadId!),
    enabled: !!leadId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}

export const useAssignToSiteMeasurement = (leadId: number) => {
  return useMutation({
    mutationFn: (payload: AssignToSiteMeasurementPayload) =>
      assignToSiteMeasurement(leadId, payload),
  });
};

export const useInitialSiteMeasurementTaskConflicts = (leadId?: number) => {
  return useQuery<{
    restrictedTaskConflicts: InitialSiteMeasurementTaskConflict[];
    followUpConflicts: InitialSiteMeasurementFollowUpTaskConflict[];
  }>({
    queryKey: ["initialSiteMeasurementTaskConflicts", leadId],
    queryFn: () => getInitialSiteMeasurementTaskConflicts(leadId!),
    enabled: !!leadId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
};

export const useAssignToFinalMeasurement = (leadId: number) => {
  return useMutation({
    mutationFn: (payload: AssignToFinalMeasurementPayload) =>
      assignToFinalMeasurement(leadId, payload),
  });
};

export const useRestrictedTaskConflicts = (leadId?: number) => {
  return useQuery<{
    restrictedTaskConflicts: RestrictedTaskConflict[];
    followUpConflicts: FollowUpTaskConflict[];
  }>({
    queryKey: ["restrictedTaskConflicts", leadId],
    queryFn: () => getRestrictedTaskConflicts(leadId!),
    enabled: !!leadId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
};

export const useLeadLogs = ({
  leadId,
  vendorId,
  limit = 10,
}: UseLeadLogsOptions) => {
  return useInfiniteQuery({
    queryKey: ["leadLogs", leadId, vendorId],
    queryFn: async ({ pageParam }) =>
      await fetchLeadLogs({
        leadId,
        vendorId,
        limit,
        cursor: pageParam ?? undefined, // null-safe cursor
      }),
    getNextPageParam: (lastPage) =>
      lastPage?.meta?.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined, // ✅ REQUIRED in v5+
    staleTime: 60 * 1000, // 1 min cache
    refetchOnWindowFocus: false,
  });
};

export const useCheckSiteSupervisorAssigned = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["siteSupervisorAssigned", vendorId, leadId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/leads/vendorId/${vendorId}/leadId/${leadId}/check-site-supervisor-assigned`
      );
      return data?.data as { isSiteSupervisorAssigned: boolean };
    },
    enabled: !!vendorId && !!leadId,
    staleTime: 1000 * 30,
  });
};

export interface LeadSuperAdminApprovalLockIn {
  id: number;
  vendor_id: number;
  franchise_id: number | null;
  lead_id: number;
  approval_type: "booking_done" | "order_login" | "dispatch_planning";
  is_approved: boolean;
  approved_at: string | null;
  approved_by: number | null;
  approval_remark: string | null;
  pending_tasks?: Array<{
    id: number;
    instance_id: number | null;
    status: "open" | "in_progress" | "completed";
    due_date: string | null;
  }>;
}

export const useLeadSuperAdminApprovalLockIns = (
  vendorId?: number,
  leadId?: number,
  approvalType?: "booking_done" | "order_login" | "dispatch_planning"
) => {
  return useQuery({
    queryKey: ["leadSuperAdminApprovalLockIns", vendorId, leadId, approvalType ?? null],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/leads/super-admin-approval-lockins/vendor/${vendorId}/lead/${leadId}`,
        {
          params: approvalType ? { approval_type: approvalType } : undefined,
        }
      );
      return (data?.data ?? []) as LeadSuperAdminApprovalLockIn[];
    },
    enabled: !!vendorId && !!leadId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
};

export const approveBookingDoneTask = async (
  leadId: number,
  taskId: number,
  payload: {
    approved_by: number;
    approval_remark?: string | null;
  }
) => {
  const { data } = await apiClient.patch(
    `/leads/super-admin-approval-lockins/booking-done/lead/${leadId}/task/${taskId}/approve`,
    payload
  );
  return data;
};

export const useApproveBookingDoneTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: {
        approved_by: number;
        approval_remark?: string | null;
      };
    }) => approveBookingDoneTask(leadId, taskId, payload),
  });
};

export const approveOrderLoginTask = async (
  leadId: number,
  taskId: number,
  payload: {
    approved_by: number;
    approval_remark?: string | null;
  }
) => {
  const { data } = await apiClient.patch(
    `/leads/super-admin-approval-lockins/order-login/lead/${leadId}/task/${taskId}/approve`,
    payload
  );
  return data;
};

export const useApproveOrderLoginTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: {
        approved_by: number;
        approval_remark?: string | null;
      };
    }) => approveOrderLoginTask(leadId, taskId, payload),
  });
};

export const approveDispatchPlanningTask = async (
  leadId: number,
  taskId: number,
  payload: {
    approved_by: number;
    approval_remark?: string | null;
  }
) => {
  const { data } = await apiClient.patch(
    `/leads/super-admin-approval-lockins/dispatch-planning/lead/${leadId}/task/${taskId}/approve`,
    payload
  );
  return data;
};

export const useApproveDispatchPlanningTask = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      taskId,
      payload,
    }: {
      leadId: number;
      taskId: number;
      payload: {
        approved_by: number;
        approval_remark?: string | null;
      };
    }) => approveDispatchPlanningTask(leadId, taskId, payload),
  });
};

export const useCheckContactOrEmailExists = () => {
  return useMutation<
    ContactOrEmailCheckResult,
    Error,
    { vendorId: number; payload: ContactOrEmailCheckPayload }
  >({
    mutationFn: ({ vendorId, payload }) =>
      checkContactOrEmailExists(vendorId, payload),
  });
};

export const useCheckSimilarLeadExists = () => {
  return useMutation<
    SimilarLeadCheckResult,
    Error,
    { vendorId: number; payload: SimilarLeadCheckPayload }
  >({
    mutationFn: ({ vendorId, payload }) =>
      checkSimilarLeadExists(vendorId, payload),
  });
};

export const useUploadMoreSitePhotos = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      createdBy,
      files,
    }: {
      vendorId: number;
      leadId: number;
      createdBy: number;
      files: File[];
    }) => uploadMoreSitePhotos({ vendorId, leadId, createdBy, files }),
  });
};

export const useCreateSmallOrderRequest = () => {
  return useMutation({
    mutationFn: (payload: CreateSmallOrderRequestPayload) =>
      createSmallOrderRequest(payload),
  });
};

export const useCreateFastProductionRequest = () => {
  return useMutation({
    mutationFn: (payload: CreateFastProductionRequestPayload) =>
      createFastProductionRequest(payload),
  });
};

export const useFinalizeFastProductionRequest = () => {
  return useMutation({
    mutationFn: (payload: FinalizeFastProductionRequestPayload) =>
      finalizeFastProductionRequest(payload),
  });
};

export const useCheckFastProductionLimit = (
  vendorId?: number,
  userId?: number,
  franchiseId?: number | null,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["checkFastProductionLimit", vendorId, userId, franchiseId],
    queryFn: () => checkFastProductionLimit({ 
      vendorId: vendorId!, 
      userId: userId!, 
      franchiseId: franchiseId ?? undefined 
    }),
    enabled: enabled && !!vendorId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 mins
    retry: false, // Don't retry since a 400 error means the limit is reached
  });
};

export const useCheckFastProductionStatus = (
  vendorId?: number,
  leadId?: number,
  franchiseId?: number | null,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["checkFastProductionStatus", vendorId, leadId, franchiseId],
    queryFn: () => checkFastProductionStatus({
      vendorId: vendorId!,
      leadId: leadId!,
      franchiseId: franchiseId ?? undefined
    }),
    enabled: enabled && !!vendorId && !!leadId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};

export const useGetFastProductionDetailsForLead = (
  vendorId?: number,
  leadId?: number,
  franchiseId?: number | null,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["getFastProductionDetailsForLead", vendorId, leadId, franchiseId],
    queryFn: () => getFastProductionDetailsForLead({
      vendorId: vendorId!,
      leadId: leadId!,
      franchiseId: franchiseId ?? undefined
    }),
    enabled: enabled && !!vendorId && !!leadId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};

export const useRevokeFastProductionRequest = () => {
  return useMutation({
    mutationFn: (payload: RevokeFastProductionPayload) =>
      revokeFastProductionRequest(payload),
  });
};

export const useSmallOrderRequestsByLead = (
  vendorId?: number,
  leadId?: number,
) => {
  return useQuery<{ data: SmallOrderRequestListItem[]; message: string }, Error>({
    queryKey: ["smallOrderRequestsByLead", vendorId, leadId],
    queryFn: () => getSmallOrderRequestsByLead(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};

export const useMarkSmallOrderRequestResolved = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      requestId,
      updatedBy,
    }: {
      vendorId: number;
      requestId: number;
      updatedBy: number;
    }) => markSmallOrderRequestResolved({ vendorId, requestId, updatedBy }),
  });
};

export const useFastProductionRequestDraft = (
  vendorId?: number,
  leadId?: number,
) => {
  return useQuery({
    queryKey: ["fastProductionRequestDraft", vendorId, leadId],
    queryFn: () => getFastProductionRequestDraft(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateLeadStage = () => {
  return useMutation({
    mutationFn: ({
      leadId,
      payload,
    }: {
      leadId: number;
      payload: UpdateLeadStagePayload;
    }) => updateLeadStageAPI(leadId, payload),
  });
};
