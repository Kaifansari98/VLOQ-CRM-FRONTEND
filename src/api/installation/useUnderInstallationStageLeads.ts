import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export interface MiscellaneousDocument {
  document_id: number;
  original_name: string;
  file_key: string;
  signed_url: string;
  uploaded_at: string;
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
  is_resolved: boolean;
  resolved_at: string | null;
  created_by: number;
  created_at: string;
  created_user: {
    id: number;
    user_name: string;
  };
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

/* ==========================================================
   📤 POST - Create Miscellaneous Entry
   @route POST /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/create
   ========================================================== */
export const createMiscellaneousEntry = async (
  payload: CreateMiscellaneousPayload
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
      payload.reorder_material_details
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
    }
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
      toast.success("Miscellaneous entry created successfully");

      // Invalidate and refetch the list
      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousEntries",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Failed to create miscellaneous entry"
      );
    },
  });
};

/* ==========================================================
   📥 GET - All Miscellaneous Entries
   @route GET /leads/installation/under-installation/vendorId/:vendorId/leadId/:leadId/get-all
   ========================================================== */
export const getMiscellaneousEntries = async (
  vendorId: number,
  leadId: number
): Promise<MiscellaneousEntry[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/get-all`
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
    `/miscellaneous-master/type/vendor/${vendorId}`
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
    `/miscellaneous-master/team/vendor/${vendorId}`
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
    }
  );

  return response.data.data;
};

export const useUpdateMiscERD = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: updateMiscExpectedReadyDate,
    onSuccess: () => {
      toast.success("Expected ready date updated!");
      client.invalidateQueries({ queryKey: ["miscellaneous-details"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update date");
    },
  });
};

/**
 * 📋 GET - All Issue Types by Vendor
 * @route GET /issue-logs/issue-type/vendor/:vendor_id
 */
export const getIssueTypes = async (vendorId: number): Promise<IssueType[]> => {
  const { data } = await apiClient.get(
    `/issue-logs/issue-type/vendor/${vendorId}`
  );
  return data?.data || [];
};

/**
 * 📋 GET - All Installation Issue Logs
 * @route GET /leads/installation/under-installation/issue-log/vendor/:vendor_id/lead/:lead_id
 */
export const getInstallationIssueLogs = async (
  vendorId: number,
  leadId: number
): Promise<InstallationIssueLog[]> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/issue-log/vendor/${vendorId}/lead/${leadId}`
  );
  return data?.data || [];
};

/**
 * 📋 GET - Single Installation Issue Log by ID
 * @route GET /leads/installation/under-installation/issue-log/:id
 */
export const getInstallationIssueLogById = async (
  id: number
): Promise<InstallationIssueLog> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/issue-log/${id}`
  );
  return data?.data;
};

/**
 * ➕ POST - Create Installation Issue Log
 * @route POST /leads/installation/under-installation/issue-log/create
 */
export const createInstallationIssueLog = async (
  payload: CreateIssueLogPayload
): Promise<InstallationIssueLog> => {
  const { data } = await apiClient.post(
    `/leads/installation/under-installation/issue-log/create`,
    payload
  );
  return data?.data;
};

/**
 * 🔄 PUT - Update Installation Issue Log
 * @route PUT /leads/installation/under-installation/issue-log/:id/update
 */
export const updateInstallationIssueLog = async (
  id: number,
  payload: UpdateIssueLogPayload
): Promise<InstallationIssueLog> => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/issue-log/${id}/update`,
    payload
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
  leadId: number
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
      toast.success("Issue log created successfully");

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

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create issue log"
      );
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
      toast.success("Issue log updated successfully");

      // Invalidate the specific issue log
      queryClient.invalidateQueries({
        queryKey: ["installationIssueLog", data.id],
      });

      // Invalidate the list of issue logs
      queryClient.invalidateQueries({
        queryKey: ["installationIssueLogs"],
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update issue log"
      );
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
  leadId: number
): Promise<UsableHandoverData> => {
  const { data } = await apiClient.get(
    `/leads/installation/under-installation/${vendorId}/${leadId}`
  );
  return data?.data;
};

/**
 * 🔄 POST - Update Usable Handover (Upload Files)
 * @route POST /leads/installation/under-installation/usable-handover/update
 */
export const updateUsableHandover = async (
  formData: FormData
): Promise<any> => {
  const { data } = await apiClient.post(
    `/leads/installation/under-installation/usable-handover/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data?.data;
};

/**
 * 🔄 PUT - Update Remarks Only
 * @route PUT /leads/installation/under-installation/update-remarks
 */
export const updateRemarks = async (
  payload: UpdateRemarksPayload
): Promise<any> => {
  const { data } = await apiClient.put(
    `/leads/installation/under-installation/update-remarks`,
    payload
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
      toast.success("Files uploaded successfully");

      // Extract vendor_id and lead_id from FormData
      const vendorId = variables.get("vendor_id");
      const leadId = variables.get("lead_id");

      // Invalidate and refetch usable handover data
      queryClient.invalidateQueries({
        queryKey: ["usableHandover", Number(vendorId), Number(leadId)],
      });
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload files");
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
      toast.success("Remarks updated successfully");

      // Invalidate and refetch usable handover data
      queryClient.invalidateQueries({
        queryKey: ["usableHandover", variables.vendor_id, variables.lead_id],
      });
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update remarks");
    },
  });
};

// 🚀 Move Lead to Final Handover (Type 27)
export async function moveToFinalHandoverApi(
  vendorId: number,
  leadId: number,
  updated_by: number
) {
  const response = await apiClient.put(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/move-to-final-handover`,
    { updated_by }
  );

  return response.data;
}

export function useMoveToFinalHandover() {
  const queryClient = useQueryClient();
  const router = useRouter();

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

    onSuccess: () => {
      toast.success("Lead moved to Final Handover stage");
      router.push("/dashboard/installation/under-installation");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to move lead");
    },
  });
}

export const fetchUsableHandoverReady = async (
  vendorId: number,
  leadId: number
) => {
  const res = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/check-ready-flag`
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
  leadId: number
) => {
  const res = await apiClient.get(
    `/leads/installation/under-installation/vendorId/${vendorId}/leadId/${leadId}/check-final-handover-ready`
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
      bodyData
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
      toast.success("Marked as resolved");

      // Refetch miscellaneous list
      queryClient.invalidateQueries({
        queryKey: [
          "miscellaneousEntries",
          variables.vendorId,
          variables.leadId,
        ],
      });
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error || "Failed to resolve miscellaneous entry"
      );
    },
  });
};
