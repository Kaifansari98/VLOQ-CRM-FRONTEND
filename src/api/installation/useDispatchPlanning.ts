import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

/* ==========================================================
   🔹 1️⃣ GET Dispatch Planning Leads (Paginated)
   @route GET /leads/installation/dispatch-planning/vendorId/:vendorId/userId/:userId
   ========================================================== */
export const getDispatchPlanningLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch-planning/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Dispatch Planning Leads
 */
export const useDispatchPlanningLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["dispatchPlanningLeads", vendorId, userId, page, limit],
    queryFn: () => getDispatchPlanningLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

/* ==========================================================
   🔹 2️⃣ GET Dispatch Planning Info
   @route GET /leads/installation/dispatch-planning/info/vendorId/:vendorId/leadId/:leadId
   ========================================================== */
export const getDispatchPlanningInfo = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch-planning/info/vendorId/${vendorId}/leadId/${leadId}`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Dispatch Planning Info
 */
export const useDispatchPlanningInfo = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["dispatchPlanningInfo", vendorId, leadId],
    queryFn: () => getDispatchPlanningInfo(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 3️⃣ GET Dispatch Planning Payment Info
   @route GET /leads/installation/dispatch-planning/payment/vendorId/:vendorId/leadId/:leadId
   ========================================================== */
export const getDispatchPlanningPayment = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch-planning/payment/vendorId/${vendorId}/leadId/${leadId}`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Dispatch Planning Payment
 */
export const useDispatchPlanningPayment = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["dispatchPlanningPayment", vendorId, leadId],
    queryFn: () => getDispatchPlanningPayment(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 4️⃣ POST Save Dispatch Planning Info
   @route POST /leads/installation/dispatch-planning/info/vendorId/:vendorId/leadId/:leadId
   ========================================================== */
export const saveDispatchPlanningInfo = async (
  vendorId: number,
  leadId: number,
  payload: {
    required_date_for_dispatch: string;
    onsite_contact_person_name: string;
    onsite_contact_person_number: string;
    material_lift_availability: string;
    dispatch_planning_remark: string;
    created_by: number;
  }
) => {
  const { data } = await apiClient.post(
    `/leads/installation/dispatch-planning/info/vendorId/${vendorId}/leadId/${leadId}`,
    payload
  );
  return data;
};

/**
 * ✅ React Query Mutation for Saving Dispatch Planning Info
 */
export const useSaveDispatchPlanningInfo = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: any;
    }) => saveDispatchPlanningInfo(vendorId, leadId, payload),
  });
};

/* ==========================================================
   🔹 5️⃣ POST Save Dispatch Planning Payment
   @route POST /leads/installation/dispatch-planning/payment/vendorId/:vendorId/leadId/:leadId
   ========================================================== */
export const saveDispatchPlanningPayment = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.post(
    `/leads/installation/dispatch-planning/payment/vendorId/${vendorId}/leadId/${leadId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
};

/**
 * ✅ React Query Mutation for Saving Dispatch Planning Payment
 */
export const useSaveDispatchPlanningPayment = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      formData,
    }: {
      vendorId: number;
      leadId: number;
      formData: FormData;
    }) => saveDispatchPlanningPayment(vendorId, leadId, formData),
  });
};

/* ==========================================================
   🔹 6️⃣ GET Pending Project Amount
   @route GET /leads/installation/dispatch-planning/pending-project-amount/vendorId/:vendorId/leadId/:leadId
   ========================================================== */
export const getPendingProjectAmount = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch-planning/pending-project-amount/vendorId/${vendorId}/leadId/${leadId}`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Pending Project Amount
 */
export const usePendingProjectAmount = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["pendingProjectAmount", vendorId, leadId],
    queryFn: () => getPendingProjectAmount(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 7️⃣ GET Check Dispatch Readiness
   @route GET /leads/installation/dispatch-planning/vendorId/:vendorId/leadId/:leadId/check-dispatch-readiness
   ========================================================== */
export const getDispatchReadinessStatus = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/dispatch-planning/vendorId/${vendorId}/leadId/${leadId}/check-dispatch-readiness`
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Dispatch Readiness
 */
export const useDispatchReadinessStatus = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["dispatchReadinessStatus", vendorId, leadId],
    queryFn: () => getDispatchReadinessStatus(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 8️⃣ PUT Move Lead to Dispatch Stage
   @route PUT /leads/installation/dispatch-planning/vendorId/:vendorId/leadId/:leadId/move-to-dispatch
   ========================================================== */
export const moveLeadToDispatch = async (
  vendorId: number,
  leadId: number,
  payload: { updated_by: number }
) => {
  const { data } = await apiClient.put(
    `/leads/installation/dispatch-planning/vendorId/${vendorId}/leadId/${leadId}/move-to-dispatch`,
    payload
  );
  return data;
};

/**
 * ✅ React Query Mutation for Moving Lead to Dispatch
 */
export const useMoveLeadToDispatch = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: { updated_by: number };
    }) => moveLeadToDispatch(vendorId, leadId, payload),
  });
};
