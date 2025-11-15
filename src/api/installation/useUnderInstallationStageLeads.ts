import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    formData.append("reorder_material_details", payload.reorder_material_details);
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
        queryKey: ["miscellaneousEntries", variables.vendorId, variables.leadId],
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
export const useMiscellaneousEntries = (
  vendorId?: number,
  leadId?: number
) => {
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