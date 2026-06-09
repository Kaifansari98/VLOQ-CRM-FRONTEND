import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";

import type { AxiosError } from "axios";

/* ==========================================================
   🔹 1️⃣ GET Dispatch Stage Leads (Paginated)
   @route GET /leads/installation/dispatch/vendorId/:vendorId/userId/:userId
   ========================================================== */

interface ApiErrorResponse {
  message?: string;
}

export const getDispatchStageLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Dispatch Stage Leads
 */
export const useDispatchStageLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["dispatchStageLeads", vendorId, userId, page, limit],
    queryFn: () => getDispatchStageLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

/**
 * 🔹 Fetch required_date_for_dispatch by Lead ID and Vendor ID
 * @route GET /leads/installation/dispatch/vendor/:vendorId/lead/:leadId/required-date
 */
export const getRequiredDateForDispatch = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendor/${vendorId}/lead/${leadId}/required-date`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook
 */
export const useRequiredDateForDispatch = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["requiredDateForDispatch", vendorId, leadId],
    queryFn: () => getRequiredDateForDispatch(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 1️⃣ GET Dispatch Details
   @route GET /leads/installation/dispatch/vendor/:vendorId/lead/:leadId/dispatch-details
   ========================================================== */
export const getDispatchDetails = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendor/${vendorId}/lead/${leadId}/dispatch-details`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Fetching Dispatch Details
 */
export const useDispatchDetails = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["dispatchDetails", vendorId, leadId],
    queryFn: () => getDispatchDetails(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
     🔹 2️⃣ POST Dispatch Details
     @route POST /leads/installation/dispatch/vendor/:vendorId/lead/:leadId/dispatch-details
     ========================================================== */
export interface AddDispatchDetailsPayload {
  dispatch_date?: string; // ISO string
  driver_name?: string;
  driver_number?: string;
  vehicle_no?: string;
  dispatch_remark?: string;
  updated_by?: number;
}

/**
 * ✅ Save Dispatch Details (Mutation Hook)
 */
export const useAddDispatchDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: AddDispatchDetailsPayload;
    }) => {
      const { data } = await apiClient.post(
        `/leads/installation/dispatch/vendor/${vendorId}/lead/${leadId}/dispatch-details`,
        payload
      );
      return data?.data;
    },
    onSuccess: () => {
      toastManager.add({ title: "Dispatch details saved successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["dispatchDetails"] });
      queryClient.invalidateQueries({ queryKey: ["readyForPostDispatch"] });
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({ title: err?.message || "Failed to save dispatch details", type: "error" });
    },
  });
};

/* ==========================================================
   🔹 GET Dispatch Photos & Documents (Signed URLs)
   ========================================================== */
export const getDispatchDocuments = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/dispatch-documents`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Dispatch Documents
 */
export const useDispatchDocuments = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["dispatchDocuments", vendorId, leadId],
    queryFn: () => getDispatchDocuments(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 Upload Dispatch Photos & Documents
   @route POST /leads/installation/dispatch/vendorId/:vendorId/leadId/:leadId/upload-dispatch-documents
   ========================================================== */
export const uploadDispatchDocuments = async (
  vendorId: number,
  leadId: number,
  payload: {
    files: File[];
    account_id?: number | null;
    created_by: number;
  }
) => {
  const formData = new FormData();

  if (!payload.files || payload.files.length === 0) {
    throw new Error("At least one file must be selected for upload.");
  }

  payload.files.forEach((file) => formData.append("files", file));
  formData.append("created_by", payload.created_by.toString());
  if (payload.account_id)
    formData.append("account_id", payload.account_id.toString());

  const { data } = await apiClient.post(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/upload-dispatch-documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data?.data;
};

/* ==========================================================
     ✅ React Query Hook for Uploading Dispatch Docs
     ========================================================== */
export const useUploadDispatchDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: {
        files: File[];
        account_id?: number | null;
        created_by: number;
      };
    }) => uploadDispatchDocuments(vendorId, leadId, payload),

    onSuccess: () => {
      toastManager.add({ title: "Dispatch Photos & Documents uploaded successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["dispatchDocuments"] }); // refresh doc list
      queryClient.invalidateQueries({ queryKey: ["readyForPostDispatch"] });
    },

    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({ title: err?.message || "Failed to upload Dispatch Documents", type: "error" });
    },
  });
};

/* ==========================================================
   🔹 CHECK if Lead is Ready for Post-Dispatch
   @route GET /leads/installation/dispatch/vendorId/:vendorId/leadId/:leadId/check-ready-for-post-dispatch
   ========================================================== */

/**
 * ✅ API call — Checks readiness for Post-Dispatch stage
 */
export const checkReadyForPostDispatch = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/check-ready-for-post-dispatch`
  );
  return data; // includes { success, readyForPostDispatch, message, missingFields }
};

/**
 * ✅ React Query Hook for readiness check
 */
export const useCheckReadyForPostDispatch = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["readyForPostDispatch", vendorId, leadId],
    queryFn: () => checkReadyForPostDispatch(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

export const getPostDispatchDocuments = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/post-dispatch-documents`
  );
  return data?.data;
};

export const usePostDispatchDocuments = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["postDispatchDocuments", vendorId, leadId],
    queryFn: () => getPostDispatchDocuments(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 Upload Post Dispatch Photos & Documents
   @route POST /leads/installation/dispatch/vendorId/:vendorId/leadId/:leadId/upload-post-dispatch-documents
   ========================================================== */
export const uploadPostDispatchDocuments = async (
  vendorId: number,
  leadId: number,
  payload: {
    files: File[];
    account_id?: number | null;
    created_by: number;
  }
) => {
  const formData = new FormData();

  if (!payload.files || payload.files.length === 0) {
    throw new Error("At least one file must be selected for upload.");
  }

  payload.files.forEach((file) => formData.append("files", file));
  formData.append("created_by", payload.created_by.toString());
  if (payload.account_id)
    formData.append("account_id", payload.account_id.toString());

  const { data } = await apiClient.post(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/upload-post-dispatch-documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data?.data;
};

/* ==========================================================
     ✅ React Query Hook for Uploading Post Dispatch Docs
     ========================================================== */
export const useUploadPostDispatchDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: {
        files: File[];
        account_id?: number | null;
        created_by: number;
      };
    }) => uploadPostDispatchDocuments(vendorId, leadId, payload),

    onSuccess: () => {
      toastManager.add({ title: "Post Dispatch Photos & Documents uploaded successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["postDispatchDocuments"] }); // ✅ auto-refresh document list
    },
  });
};

/* ==========================================================
   🔹 Create Pending Material Task
   @route POST /leads/installation/dispatch/vendorId/:vendorId/leadId/:leadId/create-pending-material
   ========================================================== */
export interface CreatePendingMaterialPayload {
  account_id: number;
  created_by: number;
  due_date: string; // ISO or yyyy-MM-dd
  remark?: string;
}

export const createPendingMaterialTask = async (
  vendorId: number,
  leadId: number,
  payload: CreatePendingMaterialPayload
) => {
  const { data } = await apiClient.post(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/create-pending-material`,
    payload
  );
  return data?.data;
};

/* ==========================================================
     ✅ React Query Hook — Create Pending Material Task
     ========================================================== */
export const useCreatePendingMaterialTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: CreatePendingMaterialPayload;
    }) => createPendingMaterialTask(vendorId, leadId, payload),

    onSuccess: () => {
      toastManager.add({ title: "Pending Material task created successfully!", type: "success" });
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["leadTasks"] });
    },

    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({ title: err?.response?.data?.message ||
          "Failed to create Pending Material task.", type: "error" });
    },
  });
};

/* ==========================================================
   ✅ GET Pending Material Tasks
   ========================================================== */
export const getPendingMaterialTasks = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/pending-material-tasks`
  );
  return data?.data;
};

/* ==========================================================
     ✅ React Query Hook — Fetch Pending Material Tasks
     ========================================================== */
export const usePendingMaterialTasks = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["pendingMaterialTasks", vendorId, leadId],
    queryFn: () => getPendingMaterialTasks(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 Create Pending Work Task
   @route POST /leads/installation/dispatch/vendorId/:vendorId/leadId/:leadId/create-pending-work
   ========================================================== */
export interface CreatePendingWorkPayload {
  account_id: number;
  created_by: number;
  due_date: string; // ISO or yyyy-MM-dd
  remark?: string;
}

export const createPendingWorkTask = async (
  vendorId: number,
  leadId: number,
  payload: CreatePendingWorkPayload
) => {
  const { data } = await apiClient.post(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/create-pending-work`,
    payload
  );
  return data?.data;
};

/* ==========================================================
     ✅ React Query Hook — Create Pending Work Task
     ========================================================== */
export const useCreatePendingWorkTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: CreatePendingWorkPayload;
    }) => createPendingWorkTask(vendorId, leadId, payload),

    onSuccess: () => {
      toastManager.add({ title: "Pending Work task created successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["pendingWorkTasks"] });
    },

    onError: (err: AxiosError<ApiErrorResponse>) => {
      toastManager.add({ title: err?.response?.data?.message || "Failed to create Pending Work task.", type: "error" });
    },
  });
};

/* ==========================================================
   ✅ GET Pending Work Tasks
   ========================================================== */
export const getPendingWorkTasks = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/leadId/${leadId}/pending-work-tasks`
  );
  return data?.data;
};

/* ==========================================================
     ✅ React Query Hook — Fetch Pending Work Tasks
     ========================================================== */
export const usePendingWorkTasks = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["pendingWorkTasks", vendorId, leadId],
    queryFn: () => getPendingWorkTasks(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 GET Order Login Summary (id & item_type)
   @route GET /vendorId/:vendorId/get-order-login-summary?lead_id=:leadId
   ========================================================== */
export const getOrderLoginSummary = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch/vendorId/${vendorId}/get-order-login-summary`,
    { params: { lead_id: leadId } }
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Order Login Summary
 */
export const useOrderLoginSummary = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["orderLoginSummary", vendorId, leadId],
    queryFn: () => getOrderLoginSummary(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};
