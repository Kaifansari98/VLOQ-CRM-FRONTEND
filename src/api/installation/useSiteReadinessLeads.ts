import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

/* ==========================================================
   🔹 4️⃣ GET Site Readiness Leads (Paginated)
   @route GET /leads/installation/site-readiness/vendorId/:vendorId/userId/:userId
   ========================================================== */
export const getSiteReadinessLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/installation/site-readiness/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Site Readiness Leads
 */
export const useSiteReadinessLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["siteReadinessLeads", vendorId, userId, page, limit],
    queryFn: () => getSiteReadinessLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

/* ==========================================================
   🔹 1️⃣ CREATE Site Readiness Entries
   @route POST /leads/installation/site-readiness/vendorId/:vendorId/leadId/:leadId/create
   ========================================================== */

export interface SiteReadinessCreateItem {
  account_id: number;
  type: string;
  remark: string | null;
  value: boolean | null;
  created_by: number;
  updated_by: number;
}

export const createSiteReadiness = async (
  vendorId: number,
  leadId: number,
  payload: SiteReadinessCreateItem[]
) => {
  const { data } = await apiClient.post(
    `/leads/installation/site-readiness/vendorId/${vendorId}/leadId/${leadId}/create`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return data?.data;
};

export const useCreateSiteReadiness = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: SiteReadinessCreateItem[];
    }) => createSiteReadiness(vendorId, leadId, payload),
  });
};

/* ==========================================================
     🔹 2️⃣ GET Site Readiness Records
     @route GET /leads/installation/site-readiness/vendorId/:vendorId/all?leadId=&accountId=
     ========================================================== */
export const getSiteReadinessRecords = async (
  vendorId: number,
  leadId?: number,
  accountId?: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/site-readiness/vendorId/${vendorId}/all`,
    {
      params: { leadId, accountId },
    }
  );
  return data?.data;
};

export const useSiteReadinessRecords = (
  vendorId?: number,
  leadId?: number,
  accountId?: number
) => {
  return useQuery({
    queryKey: ["siteReadinessRecords", vendorId, leadId, accountId],
    queryFn: () => getSiteReadinessRecords(vendorId!, leadId, accountId),
    enabled: !!vendorId,
  });
};

/* ==========================================================
     🔹 3️⃣ UPDATE Site Readiness Entries
     @route PUT /leads/installation/site-readiness/vendorId/:vendorId/leadId/:leadId/update
     ========================================================== */

export interface SiteReadinessUpdateItem {
  id: number;
  account_id: number;
  type: string;
  remark: string | null;
  value: boolean | null;
  updated_by: number;
}

export const updateSiteReadiness = async (
  vendorId: number,
  leadId: number,
  payload: SiteReadinessUpdateItem[]
) => {
  const { data } = await apiClient.put(
    `/leads/installation/site-readiness/vendorId/${vendorId}/leadId/${leadId}/update`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return data?.data;
};

export const useUpdateSiteReadiness = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      payload,
    }: {
      vendorId: number;
      leadId: number;
      payload: SiteReadinessUpdateItem[];
    }) => updateSiteReadiness(vendorId, leadId, payload),
  });
};

/* ==========================================================
   🔹 5️⃣ Upload Current Site Photos (Site Readiness)
   @route POST /leads/installation/site-readiness/vendorId/:vendorId/leadId/:leadId/upload-current-site-photos
   ========================================================== */
export const uploadCurrentSitePhotosAtSiteReadiness = async (
  vendorId: number,
  leadId: number,
  accountId: number,
  createdBy: number,
  files: File[]
) => {
  const formData = new FormData();
  formData.append("account_id", String(accountId));
  formData.append("created_by", String(createdBy));

  files.forEach((file) => formData.append("files", file));

  const { data } = await apiClient.post(
    `/leads/installation/site-readiness/vendorId/${vendorId}/leadId/${leadId}/upload-current-site-photos`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return data?.data;
};

export const useUploadCurrentSitePhotosAtSiteReadiness = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      accountId,
      createdBy,
      files,
    }: {
      vendorId: number;
      leadId: number;
      accountId: number;
      createdBy: number;
      files: File[];
    }) =>
      uploadCurrentSitePhotosAtSiteReadiness(
        vendorId,
        leadId,
        accountId,
        createdBy,
        files
      ),
  });
};

/* ==========================================================
   🔹 6️⃣ Get Current Site Photos (Site Readiness)
   @route GET /leads/installation/site-readiness/vendorId/:vendorId/leadId/:leadId/current-site-photos
   ========================================================== */
export const getCurrentSitePhotosAtSiteReadiness = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/site-readiness/vendorId/${vendorId}/leadId/${leadId}/current-site-photos`
  );
  return data?.data;
};

export const useCurrentSitePhotosAtSiteReadiness = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["currentSitePhotosAtSiteReadiness", vendorId, leadId],
    queryFn: () =>
      getCurrentSitePhotosAtSiteReadiness(vendorId as number, leadId as number),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 7️⃣ Check Site Readiness Completion
   @route GET /leads/installation/site-readiness/vendorId/:vendorId/leadId/:leadId/is-site-readiness-completed
   ========================================================== */
export const checkSiteReadinessCompletion = async (
  vendorId: number,
  leadId: number
): Promise<{
  vendor_id: number;
  lead_id: number;
  has_photo: boolean;
  has_all_items: boolean;
  is_site_readiness_completed: boolean;
}> => {
  const { data } = await apiClient.get(
    `/leads/installation/site-readiness/vendorId/${vendorId}/leadId/${leadId}/is-site-readiness-completed`
  );
  return data?.data;
};

export const useCheckSiteReadinessCompletion = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["checkSiteReadinessCompletion", vendorId, leadId],
    queryFn: () => checkSiteReadinessCompletion(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   🔹 8️⃣ Move Lead to Dispatch Planning Stage
   @route PUT /leads/installation/site-readiness/vendorId/:vendorId/leadId/:leadId/move-to-dispatch-planning
   ========================================================== */
export const moveLeadToDispatchPlanning = async (
  vendorId: number,
  leadId: number,
  updated_by: number
) => {
  const { data } = await apiClient.put(
    `/leads/installation/site-readiness/vendorId/${vendorId}/leadId/${leadId}/move-to-dispatch-planning`,
    { updated_by }
  );
  return data?.data;
};

export const useMoveLeadToDispatchPlanning = () => {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updated_by,
    }: {
      vendorId: number;
      leadId: number;
      updated_by: number;
    }) => moveLeadToDispatchPlanning(vendorId, leadId, updated_by),
  });
};
