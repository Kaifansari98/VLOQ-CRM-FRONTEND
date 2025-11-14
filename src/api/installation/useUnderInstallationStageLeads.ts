import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

/* ==========================================================
   🔹 1️⃣ Move Lead to Under Installation Stage
   @route PUT /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/move-to-under-installation
   ========================================================== */
export const moveLeadToUnderInstallation = async (
  vendorId: number,
  leadId: number,
  updated_by: number
) => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/move-to-under-installation`,
    { updated_by }
  );
  return data?.data;
};

/**
 * ✅ React Query Mutation Hook — Move Lead to Under Installation Stage
 */
export const useMoveLeadToUnderInstallation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updated_by,
    }: {
      vendorId: number;
      leadId: number;
      updated_by: number;
    }) => moveLeadToUnderInstallation(vendorId, leadId, updated_by),

    onSuccess: (data) => {
      toast.success("Lead successfully moved to Under Installation stage");
      // 🔄 Refresh any affected lists (e.g., dispatch or under-installation leads)
      queryClient.invalidateQueries({
        queryKey: ["leadStats"],
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to move lead to Under Installation stage"
      );
    },
  });
};

/* ==========================================================
   🔹 GET Under Installation Stage Leads (Paginated)
   @route GET /leads/installation/under-installation/vendorId/:vendorId/userId/:userId
   ========================================================== */
export const getUnderInstallationStageLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );

  return data?.data;
};

/**
 * ✅ React Query Hook — Under Installation Stage Leads
 */
export const useUnderInstallationStageLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["underInstallationStageLeads", vendorId, userId, page, limit],
    queryFn: () =>
      getUnderInstallationStageLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

/* ==========================================================
   1️⃣ GET Under Installation Details
   @route GET /installation/under-installation-stage/vendorId/:vendorId/leadId/:leadId/some_under_installation_details
   ========================================================== */
export const getUnderInstallationDetails = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/some_under_installation_details`
  );
  return data?.data;
};

/**
 * 🔹 React Query Hook → Get Under Installation Details
 */
export const useUnderInstallationDetails = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["underInstallationDetails", vendorId, leadId],
    queryFn: () => getUnderInstallationDetails(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   2️⃣ SET Actual Installation Start Date
   @route PUT /installation/under-installation-stage/vendorId/:vendorId/leadId/:leadId/set-actual-installation-start-date
   ========================================================== */
export interface SetActualStartPayload {
  vendorId: number;
  leadId: number;
  updated_by: number;
  actual_installation_start_date: string | Date; // ISO or Date object
}

export const setActualInstallationStartDate = async ({
  vendorId,
  leadId,
  updated_by,
  actual_installation_start_date,
}: SetActualStartPayload) => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/set-actual-installation-start-date`,
    {
      updated_by,
      actual_installation_start_date,
    }
  );

  return data;
};

/**
 * 🔹 React Query Hook → Set Actual Installation Start Date
 */
export const useSetActualInstallationStartDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setActualInstallationStartDate,

    onSuccess: (data) => {
      toast.success("Installation start date updated!");

      // 🔄 Refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ["underInstallationDetails"],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadStats"],
      });
    },

    onError: (err: any) => {
      toast.error(err?.message || "Failed to update installation start date");
    },
  });
};

/** GET mapped installers */
export const getMappedInstallers = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/installers`
  );
  return data.data;
};

export const useMappedInstallers = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["mappedInstallers", vendorId, leadId],
    queryFn: () => getMappedInstallers(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/** POST create installers + date */
export const addInstallersAndEndDate = async ({
  vendorId,
  leadId,
  payload,
}: {
  vendorId: number;
  leadId: number;
  payload: {
    updated_by: number;
    expected_installation_end_date: string;
    installers: { installer_id: number }[];
  };
}) => {
  const res = await apiClient.post(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/add-installers`,
    payload
  );
  return res.data;
};

export const useAddInstallersAndEndDate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addInstallersAndEndDate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["underInstallationDetails"] });
      qc.invalidateQueries({ queryKey: ["mappedInstallers"] });
    },
  });
};

/** PUT update installers + date */
export const updateInstallationDetailsAPI = async ({
  vendorId,
  leadId,
  payload,
}: {
  vendorId: number;
  leadId: number;
  payload: {
    updated_by: number;
    expected_installation_end_date?: string;
    installers?: { installer_id: number }[];
  };
}) => {
  const res = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/update-installation-details`,
    payload
  );
  return res.data;
};

export const useUpdateInstallationDetails = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateInstallationDetailsAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["underInstallationDetails"] });
      qc.invalidateQueries({ queryKey: ["mappedInstallers"] });
    },
  });
};

export const getAllInstallersAPI = async (vendorId: number) => {
  const res = await apiClient.get(
    `/installer-users/vendorId/${vendorId}/get-all-installers`
  );
  return res.data;
};

export const useInstallerUsers = (vendorId?: number) => {
  return useQuery({
    queryKey: ["installerUsers", vendorId],
    queryFn: () => getAllInstallersAPI(vendorId!),
    enabled: !!vendorId,
  });
};

// POST → Set completion status (first time)
export const setInstallationCompletionAPI = async ({
  vendorId,
  leadId,
  updated_by,
  is_carcass_installation_completed,
  is_shutter_installation_completed,
}: {
  vendorId: number;
  leadId: number;
  updated_by: number;
  is_carcass_installation_completed?: boolean;
  is_shutter_installation_completed?: boolean;
}) => {
  const res = await apiClient.post(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/set-installation-completion`,
    {
      updated_by,
      is_carcass_installation_completed,
      is_shutter_installation_completed,
    }
  );
  return res.data;
};

// PUT → Update completion status
export const updateInstallationCompletionAPI = async ({
  vendorId,
  leadId,
  updated_by,
  is_carcass_installation_completed,
  is_shutter_installation_completed,
}: {
  vendorId: number;
  leadId: number;
  updated_by: number;
  is_carcass_installation_completed?: boolean;
  is_shutter_installation_completed?: boolean;
}) => {
  const res = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/update-installation-completion`,
    {
      updated_by,
      is_carcass_installation_completed,
      is_shutter_installation_completed,
    }
  );
  return res.data;
};

// SET (POST)
export const useSetInstallationCompletion = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: setInstallationCompletionAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["underInstallationDetails"] });
      qc.invalidateQueries({ queryKey: ["mappedInstallers"] });
    },
  });
};

// UPDATE (PUT)
export const useUpdateInstallationCompletion = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateInstallationCompletionAPI,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["underInstallationDetails"] });
      qc.invalidateQueries({ queryKey: ["mappedInstallers"] });
    },
  });
};

// ✅ POST — Upload Installation Updates (Day Wise)
export const uploadInstallationDayWise = async ({
  vendorId,
  leadId,
  created_by,
  account_id,
  update_date,
  remark,
  files,
}: {
  vendorId: number;
  leadId: number;
  created_by: number;
  account_id?: number | null;
  update_date: string; // yyyy-mm-dd
  remark?: string;
  files: File[];
}) => {
  const formData = new FormData();
  formData.append("created_by", created_by.toString());
  if (account_id) formData.append("account_id", account_id.toString());
  formData.append("update_date", update_date);
  if (remark) formData.append("remark", remark);

  files.forEach((file) => formData.append("files", file));

  const response = await apiClient.post(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/upload-installation-updates-day-wise`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ✅ GET — Fetch Day-Wise Installation Updates
export const fetchInstallationUpdates = async ({
  vendorId,
  leadId,
}: {
  vendorId: number;
  leadId: number;
}) => {
  const response = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/installation-updates-day-wise`
  );

  return response.data.data;
};

export const useUploadInstallationUpdate = () => {
  return useMutation({
    mutationFn: uploadInstallationDayWise,
  });
};

export const useInstallationUpdates = (vendorId: number, leadId: number) => {
  return useQuery({
    queryKey: ["installation-updates", vendorId, leadId],
    queryFn: () => fetchInstallationUpdates({ vendorId, leadId }),
  });
};
