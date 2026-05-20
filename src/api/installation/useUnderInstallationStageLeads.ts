import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toastManager } from "@/components/ui/toast";
import { AxiosError } from "axios";

export interface ApiErrorResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
}

export interface MiscellaneousDocument {
  document_id: number;
  original_name: string;
  file_key: string;
  signed_url: string;
  uploaded_at: string;
  doc_type_tag?: string | null;
}

export interface MiscellaneousTeam {
  team_id: number;
  team_name: string;
}

export interface MiscellaneousEntry {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  type: {
    id: number;
    name: string;
  };
  problem_description: string | null;
  reorder_material_details: string | null;
  quantity: number | null;
  cost: number | null;
  supervisor_remark: string | null;
  expected_ready_date: string | null;
  required_delivery_date?: string | null;
  misc_approved?: boolean | null;
  exp_of_rejection?: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_by: number;
  created_at: string;
  created_user: {
    id: number;
    user_name: string;
  };
  task?: {
    id: number;
    task_type: string;
    remark?: string | null;
    status?: string;
  } | null;
  delivery_task?: {
    id: number;
    task_type: string;
    status?: string;
    remark?: string | null;
    due_date?: string | null;
  } | null;
  teams: MiscellaneousTeam[];
  documents: MiscellaneousDocument[];
}

export interface CreateMiscellaneousPayload {
  vendorId: number;
  leadId: number;
  account_id: number;
  misc_type_id: number;
  problem_description?: string;
  reorder_material_details?: string;
  quantity?: number;
  cost?: number;
  supervisor_remark?: string;
  expected_ready_date?: string;
  is_resolved: boolean;
  teams?: number[]; // Array of team IDs
  created_by: number;
  files: File[];
}

export interface MiscType {
  id: number;
  name: string;
  vendor_id: number;
  created_at: string;
}

export interface MiscTeam {
  id: number;
  name: string;
  vendor_id: number;
  created_at: string;
}

export interface IssueType {
  id: number;
  name: string;
  vendor_id: number;
  created_at: string;
}

export interface InstallationIssueLog {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  issue_description: string;
  issue_impact: string;
  created_by: number;
  created_at: string;
  createdBy: {
    id: number;
    user_name: string;
  };
  issueTypes: Array<{
    id: number;
    type: IssueType;
  }>;
  responsibleTeams: Array<{
    id: number;
    team: {
      id: number;
      team_name: string;
    };
  }>;
  lead?: {
    id: number;
    lead_code: string;
    firstname: string;
    lastname: string;
  };
  account?: {
    id: number;
    name: string;
    contact_no: string;
  };
}

export interface CreateIssueLogPayload {
  vendor_id: number;
  lead_id: number;
  account_id: number;
  issue_type_ids: number[];
  issue_description: string;
  issue_impact: string;
  responsible_team_ids: number[];
  created_by: number;
}

export interface UpdateIssueLogPayload {
  issue_type_ids?: number[];
  issue_description?: string;
  issue_impact?: string;
  responsible_team_ids?: number[];
  updated_by: number;
}

/* ==========================================================
   🔹 1️⃣ Move Lead to Under Installation Stage
   @route PUT /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/move-to-under-installation
   ========================================================== */
export const moveLeadToUnderInstallation = async (
  vendorId: number,
  leadId: number,
  updated_by: number,
) => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/move-to-under-installation`,
    { updated_by },
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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leadStats"],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          "Failed to move lead to Under Installation stage",
        type: "error",
      });
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
  limit: number = 10,
) => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    },
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
  limit: number = 10,
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
  leadId: number,
) => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/some_under_installation_details`,
  );
  return data?.data;
};

/**
 * 🔹 React Query Hook → Get Under Installation Details
 */
export const useUnderInstallationDetails = (
  vendorId?: number,
  leadId?: number,
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
    },
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

    onSuccess: () => {
      toastManager.add({
        title: "Installation start date updated!",
        type: "success",
      });

      // 🔄 Refetch relevant queries
      queryClient.invalidateQueries({
        queryKey: ["underInstallationDetails"],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadStats"],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.message || "Failed to update installation start date",
        type: "error",
      });
    },
  });
};

/** GET mapped installers */
export const getMappedInstallers = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/installers`,
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
    payload,
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
    payload,
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
    `/installer-users/vendorId/${vendorId}/get-all-installers`,
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
    },
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
    },
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
      qc.invalidateQueries({ queryKey: ["usableHandoverReady"] });
      qc.invalidateQueries({ queryKey: ["finalHandoverReady"] });
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
      qc.invalidateQueries({ queryKey: ["usableHandoverReady"] });
      qc.invalidateQueries({ queryKey: ["finalHandoverReady"] });
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
    },
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
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/installation-updates-day-wise`,
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

/* ==========================================================
   📤 POST - Create Miscellaneous Entry
   @route POST /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/create
   ========================================================== */
export const createMiscellaneousEntry = async (
  payload: CreateMiscellaneousPayload,
) => {
  const formData = new FormData();

  // Append basic fields
  formData.append("account_id", payload.account_id.toString());
  formData.append("misc_type_id", payload.misc_type_id.toString());
  formData.append("is_resolved", payload.is_resolved.toString());
  formData.append("created_by", payload.created_by.toString());

  // Append optional fields
  if (payload.problem_description) {
    formData.append("problem_description", payload.problem_description);
  }
  if (payload.reorder_material_details) {
    formData.append(
      "reorder_material_details",
      payload.reorder_material_details,
    );
  }
  if (payload.quantity !== undefined) {
    formData.append("quantity", payload.quantity.toString());
  }
  if (payload.cost !== undefined) {
    formData.append("cost", payload.cost.toString());
  }
  if (payload.supervisor_remark) {
    formData.append("supervisor_remark", payload.supervisor_remark);
  }
  if (payload.expected_ready_date) {
    formData.append("expected_ready_date", payload.expected_ready_date);
  }

  // Append teams as comma-separated string
  if (payload.teams && payload.teams.length > 0) {
    formData.append("teams", payload.teams.join(","));
  }

  // Append files
  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await apiClient.post(
    `/leads/installation/under-installation/vendorId/${payload.vendorId}/leadId/${payload.leadId}/create`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data?.data;
};

/**
 * ✅ React Query Mutation Hook - Create Miscellaneous Entry
 */
export const useCreateMiscellaneousEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMiscellaneousEntry,

    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Miscellaneous entry created successfully",
        type: "success",
      });

      // Invalidate and refetch the list
      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousEntries",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title:
          error?.response?.data?.error ||
          "Failed to create miscellaneous entry",
        type: "error",
      });
    },
  });
};

/* ==========================================================
   📥 GET - All Miscellaneous Entries
   @route GET /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/get-all
   ========================================================== */
export const getMiscellaneousEntries = async (
  vendorId: number,
  leadId: number,
): Promise<MiscellaneousEntry[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/get-all`,
  );

  return data?.data || [];
};

/**
 * ✅ React Query Hook - Get All Miscellaneous Entries
 */
export const useMiscellaneousEntries = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["miscellaneousEntries", vendorId, leadId],
    queryFn: () => getMiscellaneousEntries(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   📥 GET - All Misc Types (Vendor Wise)
   @route GET /miscellaneous-master/type/vendor/:vendor_id
   ========================================================== */
export const getMiscTypes = async (vendorId: number): Promise<MiscType[]> => {
  const { data } = await apiClient.get(
    `/miscellaneous-master/type/vendor/${vendorId}`,
  );

  return data?.data || [];
};

/**
 * ✅ React Query Hook - Get All Misc Types
 */
export const useMiscTypes = (vendorId?: number) => {
  return useQuery({
    queryKey: ["miscTypes", vendorId],
    queryFn: () => getMiscTypes(vendorId!),
    enabled: !!vendorId,
  });
};

/* ==========================================================
     📥 GET - All Teams (Vendor Wise)
     @route GET /miscellaneous-master/team/vendor/:vendor_id
     ========================================================== */
export const getMiscTeams = async (vendorId: number): Promise<MiscTeam[]> => {
  const { data } = await apiClient.get(
    `/miscellaneous-master/team/vendor/${vendorId}`,
  );

  return data?.data || [];
};

/**
 * ✅ React Query Hook - Get All Teams
 */
export const useMiscTeams = (vendorId?: number) => {
  return useQuery({
    queryKey: ["miscTeams", vendorId],
    queryFn: () => getMiscTeams(vendorId!),
    enabled: !!vendorId,
  });
};

export const updateMiscExpectedReadyDate = async ({
  vendorId,
  miscId,
  expected_ready_date,
  updated_by,
}: {
  vendorId: number;
  miscId: number;
  expected_ready_date?: string;
  updated_by: number;
}) => {
  const response = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/miscId/${miscId}/update-erd`,
    {
      expected_ready_date,
      updated_by,
    },
  );

  return response.data.data;
};

export const updateMiscApproval = async ({
  vendorId,
  miscId,
  misc_approved,
  exp_of_rejection,
  updated_by,
}: {
  vendorId: number;
  miscId: number;
  misc_approved: boolean;
  exp_of_rejection?: string;
  updated_by: number;
}) => {
  const response = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/miscId/${miscId}/update-approval`,
    {
      misc_approved,
      exp_of_rejection,
      updated_by,
    },
  );

  return response.data.data;
};

export const useUpdateMiscERD = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: updateMiscExpectedReadyDate,

    onSuccess: () => {
      toastManager.add({
        title: "Expected ready date updated!",
        type: "success",
      });

      client.invalidateQueries({ queryKey: ["miscellaneous-details"] });
      client.invalidateQueries({ queryKey: ["miscellaneousEntries"] });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.message || "Failed to update date",
        type: "error",
      });
    },
  });
};

export const updateMiscRequiredDeliveryDate = async ({
  vendorId,
  miscId,
  required_delivery_date,
  updated_by,
}: {
  vendorId: number;
  miscId: number;
  required_delivery_date?: string;
  updated_by: number;
}) => {
  const response = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/miscId/${miscId}/update-required-delivery-date`,
    {
      required_delivery_date,
      updated_by,
    },
  );

  return response.data.data;
};

export const useUpdateMiscRequiredDeliveryDate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: updateMiscRequiredDeliveryDate,

    onSuccess: () => {
      toastManager.add({
        title: "Required delivery date updated!",
        type: "success",
      });

      client.invalidateQueries({ queryKey: ["miscellaneous-details"] });
      client.invalidateQueries({ queryKey: ["miscellaneousEntries"] });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.message || "Failed to update delivery date",
        type: "error",
      });
    },
  });
};

export const updateMiscRequiredDeliveryDateByTaskId = async ({
  vendorId,
  taskId,
  required_delivery_date,
  updated_by,
}: {
  vendorId: number;
  taskId: number;
  required_delivery_date?: string;
  updated_by: number;
}) => {
  const response = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/taskId/${taskId}/update-required-delivery-date`,
    {
      required_delivery_date,
      updated_by,
    },
  );

  return response.data.data;
};

export const useUpdateMiscRequiredDeliveryDateByTaskId = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: updateMiscRequiredDeliveryDateByTaskId,

    onSuccess: () => {
      toastManager.add({
        title: "Required delivery date updated!",
        type: "success",
      });

      client.invalidateQueries({ queryKey: ["miscellaneous-details"] });
      client.invalidateQueries({ queryKey: ["miscellaneousEntries"] });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.message || "Failed to update delivery date",
        type: "error",
      });
    },
  });
};

export const uploadMiscCompletionDocumentsByTaskId = async ({
  vendorId,
  taskId,
  formData,
}: {
  vendorId: number;
  taskId: number;
  formData: FormData;
}) => {
  const response = await apiClient.post(
    `/leads/installation/under-installation/vendorId/${vendorId}/taskId/${taskId}/upload-completion-docs`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data;
};

export const useUploadMiscCompletionDocumentsByTaskId = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: uploadMiscCompletionDocumentsByTaskId,

    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["miscellaneousEntries"] });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.message || "Failed to upload documents",
        type: "error",
      });
    },
  });
};

export const useUpdateMiscApproval = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: updateMiscApproval,

    onSuccess: () => {
      toastManager.add({ title: "Miscellaneous updated!", type: "success" });

      client.invalidateQueries({ queryKey: ["miscellaneous-details"] });
      client.invalidateQueries({ queryKey: ["miscellaneousEntries"] });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.message || "Failed to update miscellaneous",
        type: "error",
      });
    },
  });
};

/**
 * 📋 GET - All Issue Types by Vendor
 * @route GET /issue-logs/issue-type/vendor/:vendor_id
 */
export const getIssueTypes = async (vendorId: number): Promise<IssueType[]> => {
  const { data } = await apiClient.get(
    `/issue-logs/issue-type/vendor/${vendorId}`,
  );
  return data?.data || [];
};

/**
 * 📋 GET - All Installation Issue Logs
 * @route GET /leads/installation/under-installation/issue-log/vendor/:vendor_id/lead/:lead_id
 */
export const getInstallationIssueLogs = async (
  vendorId: number,
  leadId: number,
): Promise<InstallationIssueLog[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/issue-log/vendor/${vendorId}/lead/${leadId}`,
  );
  return data?.data || [];
};

/**
 * 📋 GET - Single Installation Issue Log by ID
 * @route GET /leads/installation/under-installation/issue-log/:id
 */
export const getInstallationIssueLogById = async (
  id: number,
): Promise<InstallationIssueLog> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/issue-log/${id}`,
  );
  return data?.data;
};

/**
 * ➕ POST - Create Installation Issue Log
 * @route POST /leads/installation/under-installation/issue-log/create
 */
export const createInstallationIssueLog = async (
  payload: CreateIssueLogPayload,
): Promise<InstallationIssueLog> => {
  const { data } = await apiClient.post(
    `/leads/installation/under-installation/issue-log/create`,
    payload,
  );
  return data?.data;
};

/**
 * 🔄 PUT - Update Installation Issue Log
 * @route PUT /leads/installation/under-installation/issue-log/:id/update
 */
export const updateInstallationIssueLog = async (
  id: number,
  payload: UpdateIssueLogPayload,
): Promise<InstallationIssueLog> => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/issue-log/${id}/update`,
    payload,
  );
  return data?.data;
};

/* ==========================================================
   🔹 REACT QUERY HOOKS
   ========================================================== */

/**
 * ✅ React Query Hook - Get Issue Types
 */
export const useGetIssueTypes = (vendorId: number) => {
  return useQuery({
    queryKey: ["issueTypes", vendorId],
    queryFn: () => getIssueTypes(vendorId),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * ✅ React Query Hook - Get Installation Issue Logs
 */
export const useGetInstallationIssueLogs = (
  vendorId: number,
  leadId: number,
) => {
  return useQuery({
    queryKey: ["installationIssueLogs", vendorId, leadId],
    queryFn: () => getInstallationIssueLogs(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};

/**
 * ✅ React Query Hook - Get Installation Issue Log by ID
 */
export const useGetInstallationIssueLogById = (id: number) => {
  return useQuery({
    queryKey: ["installationIssueLog", id],
    queryFn: () => getInstallationIssueLogById(id),
    enabled: !!id,
  });
};

/**
 * ✅ React Query Mutation Hook - Create Installation Issue Log
 */
export const useCreateInstallationIssueLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIssueLogPayload) =>
      createInstallationIssueLog(payload),

    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Issue log created successfully",
        type: "success",
      });

      // Invalidate and refetch issue logs for this lead
      queryClient.invalidateQueries({
        queryKey: [
          "installationIssueLogs",
          variables.vendor_id,
          variables.lead_id,
        ],
      });

      // Also invalidate lead stats if you have them
      queryClient.invalidateQueries({
        queryKey: ["leadStats"],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to create issue log",
        type: "error",
      });
    },
  });
};

/**
 * ✅ React Query Mutation Hook - Update Installation Issue Log
 */
export const useUpdateInstallationIssueLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateIssueLogPayload;
    }) => updateInstallationIssueLog(id, payload),

    onSuccess: (data) => {
      toastManager.add({
        title: "Issue log updated successfully",
        type: "success",
      });

      // Invalidate the specific issue log
      queryClient.invalidateQueries({
        queryKey: ["installationIssueLog", data.id],
      });

      // Invalidate the list of issue logs
      queryClient.invalidateQueries({
        queryKey: ["installationIssueLogs"],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update issue log",
        type: "error",
      });
    },
  });
};

/* ==========================================================
   📦 Usable Handover API & React Query Hooks
   ========================================================== */

export interface LeadDocument {
  id: number;
  vendor_id: number;
  account_id: number;
  lead_id: number;
  doc_type_id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_by: number;
  created_at: string;
  signedUrl?: string;
}

export interface UsableHandoverData {
  pending_work_details: string | null;
  final_site_photos: LeadDocument[];
  handover_documents: LeadDocument[];
  usable_handover_completed?: boolean;
}

export interface UpdateUsableHandoverPayload {
  vendor_id: number;
  lead_id: number;
  account_id: number;
  created_by: number;
  pending_work_details?: string;
  files: File[];
}

export interface UpdateRemarksPayload {
  vendor_id: number;
  lead_id: number;
  pending_work_details: string;
}

/* ==========================================================
      🔹 API FUNCTIONS
      ========================================================== */

/**
 * 📋 GET - Usable Handover Data
 * @route GET /leads/installation/under-installation/:vendor_id/:lead_id
 */
export const getUsableHandover = async (
  vendorId: number,
  leadId: number,
): Promise<UsableHandoverData> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/${vendorId}/${leadId}`,
  );
  return data?.data;
};

/**
 * 🔄 POST - Update Usable Handover (Upload Files)
 * @route POST /leads/installation/under-installation/usable-handover/update
 */
export const updateUsableHandover = async (formData: FormData) => {
  const { data } = await apiClient.post<ApiErrorResponse<UsableHandoverData>>(
    `/leads/installation/under-installation/usable-handover/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data.data;
};

/**
 * 🔄 PUT - Update Remarks Only
 * @route PUT /leads/installation/under-installation/update-remarks
 */
export const updateRemarks = async (payload: UpdateRemarksPayload) => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/update-remarks`,
    payload,
  );
  return data?.data;
};

/* ==========================================================
      🔹 REACT QUERY HOOKS
      ========================================================== */

/**
 * ✅ React Query Hook - Get Usable Handover Data
 */
export const useGetUsableHandover = (vendorId: number, leadId: number) => {
  return useQuery({
    queryKey: ["usableHandover", vendorId, leadId],
    queryFn: () => getUsableHandover(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
    refetchOnMount: true,
  });
};

/**
 * ✅ React Query Mutation Hook - Update Usable Handover (Upload Files)
 */
export const useUpdateUsableHandover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => updateUsableHandover(formData),

    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Files uploaded successfully",
        type: "success",
      });

      // Extract vendor_id and lead_id from FormData
      const vendorId = variables.get("vendor_id");
      const leadId = variables.get("lead_id");

      // Invalidate and refetch usable handover data
      queryClient.invalidateQueries({
        queryKey: ["usableHandover", Number(vendorId), Number(leadId)],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to upload files",
        type: "error",
      });
    },
  });
};

/**
 * ✅ React Query Mutation Hook - Update Remarks Only
 */
export const useUpdateRemarks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateRemarksPayload) => updateRemarks(payload),

    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Remarks updated successfully",
        type: "success",
      });

      // Invalidate and refetch usable handover data
      queryClient.invalidateQueries({
        queryKey: ["usableHandover", variables.vendor_id, variables.lead_id],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update remarks",
        type: "error",
      });
    },
  });
};

export const markUsableHandoverCompleted = async ({
  vendorId,
  leadId,
  updated_by,
}: {
  vendorId: number;
  leadId: number;
  updated_by: number;
}) => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/mark-usable-handover-completed`,
    { updated_by },
  );
  return data?.data;
};

export const useMarkUsableHandoverCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markUsableHandoverCompleted,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["usableHandover", variables.vendorId, variables.leadId],
      });
    },
  });
};

// 🚀 Move Lead to Final Handover (Type 27)
export async function moveToFinalHandoverApi(
  vendorId: number,
  leadId: number,
  updated_by: number,
) {
  const response = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/move-to-final-handover`,
    { updated_by },
  );

  return response.data;
}

export function useMoveToFinalHandover() {
  return useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updated_by,
    }: {
      vendorId: number;
      leadId: number;
      updated_by: number;
    }) => moveToFinalHandoverApi(vendorId, leadId, updated_by),

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to move lead",
        type: "error",
      });
    },
  });
}

export const fetchUsableHandoverReady = async (
  vendorId: number,
  leadId: number,
) => {
  const res = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/check-ready-flag`,
  );
  return res.data.data;
};

export const useUsableHandoverReady = (vendorId: number, leadId: number) => {
  return useQuery({
    queryKey: ["usableHandoverReady", vendorId, leadId],
    queryFn: () => fetchUsableHandoverReady(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};

// 🔥 NEW — Check Lead Ready for Final Handover
export const fetchFinalHandoverReady = async (
  vendorId: number,
  leadId: number,
) => {
  const res = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/check-final-handover-ready`,
  );

  return res.data.data; // contains { success, isReady, message, step }
};

export const useFinalHandoverReady = (vendorId: number, leadId: number) => {
  return useQuery({
    queryKey: ["finalHandoverReady", vendorId, leadId],
    queryFn: () => fetchFinalHandoverReady(vendorId, leadId),
    enabled: !!vendorId && !!leadId,
  });
};

/* ==========================================================
   ✔️ PUT - Resolve Miscellaneous Entry
   @route PUT /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/misc/:miscId/resolve
   ========================================================== */

export const resolveMiscellaneousEntry = async (payload: {
  vendorId: number;
  leadId: number;
  miscId: number;
  resolved_by: number;
}) => {
  const bodyData = {
    resolved_by: payload.resolved_by,
  };

  const { data } = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${payload.vendorId}/leadId/${payload.leadId}/misc/${payload.miscId}/resolve`,
    bodyData,
  );

  return data?.data;
};

/**
 * ✅ React Query Mutation Hook - Resolve Miscellaneous Entry
 */
export const useResolveMiscellaneousEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveMiscellaneousEntry,

    onSuccess: (data, variables) => {
      toastManager.add({ title: "Marked as resolved", type: "success" });

      // Refetch miscellaneous list
      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousEntries",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title:
          error?.response?.data?.error ||
          "Failed to resolve miscellaneous entry",
        type: "error",
      });
    },
  });
};

/* ==========================================================
   ✔️ PUT - Mark Miscellaneous Task Ready
   @route PUT /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/misc/:miscId/mark-ready
   ========================================================== */

export const markMiscellaneousTaskReady = async (payload: {
  vendorId: number;
  leadId: number;
  miscId: number;
  ready_by: number;
}) => {
  const bodyData = {
    ready_by: payload.ready_by,
  };

  const { data } = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${payload.vendorId}/leadId/${payload.leadId}/misc/${payload.miscId}/mark-ready`,
    bodyData,
  );

  return data?.data;
};

/**
 * ✅ React Query Mutation Hook - Mark Miscellaneous Task Ready
 */
export const useMarkMiscellaneousTaskReady = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markMiscellaneousTaskReady,

    onSuccess: (data, variables) => {
      toastManager.add({ title: "Marked as ready", type: "success" });

      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousEntries",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to mark task as ready",
        type: "error",
      });
    },
  });
};

export interface MiscellaneousResolutionStatus {
  vendor_id: number;
  lead_id: number;
  all_resolved: boolean;
}

// 🔹 API Call
export const getMiscellaneousResolutionStatus = async (
  vendorId: number,
  leadId: number,
): Promise<MiscellaneousResolutionStatus> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendor/${vendorId}/lead/${leadId}/resolution-status`,
  );

  return data?.data;
};

export const useMiscellaneousResolutionStatus = (
  vendorId?: number,
  leadId?: number,
) => {
  return useQuery<MiscellaneousResolutionStatus>({
    queryKey: ["miscellaneous-status", vendorId, leadId],
    queryFn: () => getMiscellaneousResolutionStatus(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId, // prevents unwanted calls
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
};

// ===============================
// Request Payload
// ===============================
export interface PendingMiscellaneousPayload {
  franchise_id?: number;
  user_type?: string;
  page?: number;
  limit?: number;

  global_search?: string;
  filter_lead_code?: string;
  filter_name?: string;
  contact?: string;

  furniture_type?: Array<number | string>;
  furniture_structure?: Array<number | string>;
  site_map_link?: boolean;
  site_type?: Array<number | string>;
  assign_to?: Array<number | string>;

  site_address?: string;
  archetech_name?: string;
  source?: Array<number | string>;

  date_range?: {
    from: string;
    to: string;
  };
}

// ===============================
// Lead Row Returned
// ===============================
export interface PendingMiscLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;

  contact_no: string;
  alt_contact_no?: string | null;
  email?: string | null;

  site_address?: string | null;
  site_map_link?: string | null;
  archetech_name?: string | null;

  assign_to?: number | null;
  source_id?: number | null;
  site_type_id?: number | null;

  created_at: string;

  productMappings: {
    product_type_id: number;
  }[];

  leadProductStructureMapping: {
    product_structure_id: number;
  }[];
}

export interface PendingMiscellaneousResponse {
  success: boolean;
  message: string;
  count: number;
  data: PendingMiscLead[];

  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const postPendingMiscellaneousLeads = async (
  vendorId: number,
  payload: PendingMiscellaneousPayload,
): Promise<PendingMiscellaneousResponse> => {
  const { data } = await apiClient.post(
    `/miscellaneous-master/vendor/${vendorId}/pending-miscellaneous`,
    payload,
  );

  return data;
};

export const usePendingMiscellaneousLeads = (
  vendorId: number,
  payload: PendingMiscellaneousPayload,
) => {
  return useQuery<PendingMiscellaneousResponse>({
    queryKey: ["pendingMiscellaneousLeads", vendorId, payload],
    queryFn: () => postPendingMiscellaneousLeads(vendorId, payload),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export interface PendingMiscellaneousCountResponse {
  success: boolean;
  pending_miscellaneous_leads: number;
}

export const getPendingMiscellaneousLeadCount = async (
  vendorId: number,
  franchiseId?: number,
  userType?: string,
): Promise<PendingMiscellaneousCountResponse> => {
  const { data } = await apiClient.get(
    `/miscellaneous-master/vendor/${vendorId}/pending-miscellaneous/count`,
    {
      params: {
        ...(franchiseId ? { franchise_id: franchiseId } : {}),
        ...(userType ? { user_type: userType } : {}),
      },
    },
  );

  return data;
};

export const usePendingMiscellaneousCount = (
  vendorId: number,
  franchiseId?: number,
  userType?: string,
) => {
  return useQuery<PendingMiscellaneousCountResponse>({
    queryKey: ["pendingMiscellaneousCount", vendorId, franchiseId, userType],
    queryFn: () =>
      getPendingMiscellaneousLeadCount(vendorId, franchiseId, userType),
    enabled: !!vendorId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export type UploadMiscDocumentsPayload = {
  vendorId: number;
  leadId: number;
  miscId: number;
  created_by: number;
  files: any[]; // React Native file objects
};

export type UploadMiscDocumentsResponse = {
  doc_id: number;
  misc_doc_id: number;
}[];

export const uploadMiscellaneousDocuments = async (
  payload: UploadMiscDocumentsPayload,
): Promise<UploadMiscDocumentsResponse> => {
  const formData = new FormData();

  // ✅ Required fields
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("lead_id", payload.leadId.toString());
  formData.append("created_by", payload.created_by.toString());

  // ✅ Files
  payload.files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await apiClient.post(
    `/leads/installation/under-installation/miscellaneous/${payload.miscId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data?.data;
};

export const useUploadMiscellaneousDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMiscellaneousDocuments,

    onSuccess: (data, variables) => {
      toastManager.add({
        title: "Documents uploaded successfully",
        type: "success",
      });

      // ✅ Refetch misc documents or details
      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousDocuments",
          variables.vendorId,
          variables.leadId,
          variables.miscId,
        ],
      });

      // Optional: refresh misc list also
      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousEntries",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },

    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to upload documents",
        type: "error",
      });
    },
  });
};
