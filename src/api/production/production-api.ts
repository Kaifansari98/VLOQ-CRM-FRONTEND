import { apiClient } from "@/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ✅ --- Fetch Production (Pre-Production) Leads (paginated) ---
export const getProductionLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/production/pre-production/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );

  return data?.data;
};

// ✅ --- React Query Hook: My Production Leads ---
export const useProductionLeads = (
  vendorId: number | undefined,
  userId: number | undefined,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["productionLeads", vendorId, userId, page, limit],
    queryFn: () => getProductionLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};

export const handleOrderLoginCompletion = async (
  vendorId: number,
  leadId: number,
  updates: any[]
) => {
  const { data } = await apiClient.put(
    `/leads/production/pre-production/vendorId/${vendorId}/leadId/${leadId}/handle-order-login-completion`,
    { updates }
  );
  return data;
};

export const useHandleOrderLoginCompletion = () =>
  useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updates,
    }: {
      vendorId: number;
      leadId: number;
      updates: any[];
    }) => handleOrderLoginCompletion(vendorId, leadId, updates),
  });

// ✅ --- Update / Change Factory Vendor Selection ---
export const handleFactoryVendorSelection = async (
  vendorId: number,
  leadId: number,
  updates: any[]
) => {
  const { data } = await apiClient.put(
    `/leads/production/pre-production/vendorId/${vendorId}/leadId/${leadId}/handle-factory-vendor-selection`,
    { updates }
  );
  return data;
};

export const useHandleFactoryVendorSelection = () =>
  useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      updates,
    }: {
      vendorId: number;
      leadId: number;
      updates: any[];
    }) => handleFactoryVendorSelection(vendorId, leadId, updates),
  });

// ✅ --- Check if Lead is Ready for Post Production ---
export const checkPostProductionReady = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/pre-production/vendorId/${vendorId}/leadId/${leadId}/check-post-production-ready`,
    {
      params:
        typeof instanceId !== "undefined" ? { instance_id: instanceId } : undefined,
    }
  );
  return data;
};

export const useCheckPostProductionReady = (
  vendorId: number | undefined,
  leadId: number | undefined,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["postProductionReady", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => checkPostProductionReady(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
  });
};

// ✅ --- Update Expected Order Login Ready Date ---
export const updateExpectedOrderLoginReadyDate = async (
  vendorId: number,
  leadId: number,
  expected_order_login_ready_date: string,
  updated_by: number
) => {
  const { data } = await apiClient.put(
    `/leads/production/pre-production/vendorId/${vendorId}/leadId/${leadId}/update-expected-order-login-date`,
    {
      expected_order_login_ready_date,
      updated_by,
    }
  );
  return data;
};

export const useUpdateExpectedOrderLoginReadyDate = () =>
  useMutation({
    mutationFn: ({
      vendorId,
      leadId,
      expected_order_login_ready_date,
      updated_by,
    }: {
      vendorId: number;
      leadId: number;
      expected_order_login_ready_date: string;
      updated_by: number;
    }) =>
      updateExpectedOrderLoginReadyDate(
        vendorId,
        leadId,
        expected_order_login_ready_date,
        updated_by
      ),
  });

// ✅ --- Get Latest Order Login by Lead ---
export const getLatestOrderLoginByLead = async (
  vendorId: number,
  leadId: number,
  instanceId?: number,
) => {
  const { data } = await apiClient.get(
    `/leads/production/pre-production/vendorId/${vendorId}/get-latest-order-login`,
    {
      params: {
        lead_id: leadId,
        ...(typeof instanceId !== "undefined" ? { instance_id: instanceId } : {}),
      },
    }
  );
  return data;
};

export const useLatestOrderLoginByLead = (
  vendorId: number | undefined,
  leadId: number | undefined,
  instanceId: number | undefined,
) => {
  return useQuery({
    queryKey: ["latestOrderLogin", vendorId, leadId, instanceId], // ✅ include instanceId
    queryFn: () =>
      getLatestOrderLoginByLead(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
    staleTime: 0, // optional: always treat fresh (good for production tracking)
  });
};

export const useQcPhotos = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["qcPhotos", vendorId, leadId, instanceId ?? "all"],
    queryFn: async () => {
      if (!vendorId || !leadId) return [];
      const { data } = await apiClient.get(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-qc-photos`,
        {
          params: instanceId != null ? { instance_id: instanceId } : undefined,
        }
      );
      return data?.data || [];
    },
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadQcPhotos = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      if (!vendorId || !leadId) throw new Error("Missing vendorId or leadId");
      if (instanceId != null) {
        formData.append("instance_id", String(instanceId));
      }
      const { data } = await apiClient.post(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-qc-photos`,
        formData,
        {
          params: instanceId != null ? { instance_id: instanceId } : undefined,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data;
    },
  });
};

// ──────────────────────────────────────────────
// 🔹 GET - Fetch Hardware Packing Details
// ──────────────────────────────────────────────
export const getHardwarePackingDetails = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-hardware-packing-details`,
    {
      params: instanceId != null ? { instance_id: instanceId } : undefined,
    }
  );
  return data;
};

// ──────────────────────────────────────────────
// 🔹 POST - Upload Hardware Packing Details
// ──────────────────────────────────────────────
export const uploadHardwarePackingDetails = async (
  vendorId: number,
  leadId: number,
  formData: FormData,
  instanceId?: number | null
) => {
  if (instanceId != null) {
    formData.append("instance_id", String(instanceId));
  }
  const { data } = await apiClient.post(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-hardware-packing-details`,
    formData,
    {
      params: instanceId != null ? { instance_id: instanceId } : undefined,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ──────────────────────────────────────────────
// 🔹 React Query Hooks
// ──────────────────────────────────────────────
export const useGetHardwarePackingDetails = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["hardwarePackingDetails", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => getHardwarePackingDetails(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadHardwarePackingDetails = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useMutation({
    mutationFn: (formData: FormData) =>
      uploadHardwarePackingDetails(vendorId!, leadId!, formData, instanceId),
  });
};

// ──────────────────────────────────────────────
// 🔹 GET - Fetch Woodwork Packing Details
// ──────────────────────────────────────────────
export const getWoodworkPackingDetails = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-woodwork-packing-details`,
    {
      params: instanceId != null ? { instance_id: instanceId } : undefined,
    }
  );
  return data;
};

// ──────────────────────────────────────────────
// 🔹 POST - Upload Woodwork Packing Details
// ──────────────────────────────────────────────
export const uploadWoodworkPackingDetails = async (
  vendorId: number,
  leadId: number,
  formData: FormData,
  instanceId?: number | null
) => {
  if (instanceId != null) {
    formData.append("instance_id", String(instanceId));
  }
  const { data } = await apiClient.post(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-woodwork-packing-details`,
    formData,
    {
      params: instanceId != null ? { instance_id: instanceId } : undefined,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ──────────────────────────────────────────────
// 🔹 React Query Hooks
// ──────────────────────────────────────────────
export const useGetWoodworkPackingDetails = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["woodworkPackingDetails", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => getWoodworkPackingDetails(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadWoodworkPackingDetails = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useMutation({
    mutationFn: (formData: FormData) =>
      uploadWoodworkPackingDetails(vendorId!, leadId!, formData, instanceId),
  });
};

// ✅ PUT - Update No. of Boxes
export const updateNoOfBoxes = async (
  vendorId: number,
  leadId: number,
  formData: FormData,
  instanceId?: number | null
) => {
  const { data } = await apiClient.put(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/update-no-of-boxes`,
    formData,
    {
      params: instanceId != null ? { instance_id: instanceId } : undefined,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ✅ React Query Hook
export const useUpdateNoOfBoxes = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      updateNoOfBoxes(vendorId!, leadId!, formData, instanceId),
    onSuccess: async () => {
      // ♻️ Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["noOfBoxes"] }),
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
      ]);
    },
  });
};

export const getNoOfBoxes = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-no-of-boxes`,
    { params: instanceId != null ? { instance_id: instanceId } : undefined }
  );
  return data;
};

export const useGetNoOfBoxes = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["noOfBoxes", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => getNoOfBoxes(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
  });
};

// ✅ --- Check Post-Production Completeness ---
export const getPostProductionCompleteness = async (
  vendorId: number,
  leadId: number,
  instanceId?: number | null
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/check-post-production-completeness`,
    {
      params: instanceId != null ? { instance_id: instanceId } : undefined,
    }
  );
  return data?.data;
};

// ✅ --- React Query Hook: Post-Production Completeness ---
export const usePostProductionCompleteness = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["postProductionCompleteness", vendorId, leadId, instanceId ?? "all"],
    queryFn: () => getPostProductionCompleteness(vendorId!, leadId!, instanceId),
    enabled: !!vendorId && !!leadId,
  });
};

// ✅ Pre-Production Files (Type 37)
export const usePreProductionFiles = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["preProductionFiles", vendorId, leadId, instanceId ?? "all"],
    queryFn: async () => {
      if (!vendorId || !leadId) return [];
      const { data } = await apiClient.get(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-pre-production-files`,
        {
          params: instanceId != null ? { instance_id: instanceId } : undefined,
        }
      );
      return data?.data || [];
    },
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadPreProductionFiles = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      if (!vendorId || !leadId) throw new Error("Missing vendorId or leadId");
      if (instanceId != null) {
        formData.append("instance_id", String(instanceId));
      }
      const { data } = await apiClient.post(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-pre-production-files`,
        formData,
        {
          params: instanceId != null ? { instance_id: instanceId } : undefined,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data;
    },
  });
};

export const useCheckPreProductionFilesReady = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  return useQuery({
    queryKey: ["preProductionFilesReady", vendorId, leadId, instanceId ?? "all"],
    queryFn: async () => {
      if (!vendorId || !leadId) return { readyForUnderProduction: false };
      const { data } = await apiClient.get(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/check-pre-production-files-ready`,
        {
          params: instanceId != null ? { instance_id: instanceId } : undefined,
        }
      );
      return data;
    },
    enabled: !!vendorId && !!leadId,
  });
};

export const useMarkPreProdDone = (
  vendorId?: number,
  leadId?: number,
) => {
  return useMutation({
    mutationFn: async ({ instanceId, updatedBy }: { instanceId: number; updatedBy: number }) => {
      if (!vendorId || !leadId) throw new Error("Missing vendorId or leadId");
      const { data } = await apiClient.put(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/mark-pre-prod-done`,
        { instance_id: instanceId, updated_by: updatedBy },
      );
      return data;
    },
  });
};

export const markProductionCompleted = async (
  vendorId: number,
  leadId: number,
  instanceId: number,
  updatedBy: number
) => {
  const { data } = await apiClient.put(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/mark-production-completed`,
    { updated_by: updatedBy, instance_id: instanceId }
  );
  return data;
};

export const useMarkProductionCompleted = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { updatedBy: number }) =>
      markProductionCompleted(vendorId!, leadId!, instanceId!, payload.updatedBy),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances", leadId, vendorId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["postProductionCompleteness", vendorId, leadId],
        }),
      ]);
    },
  });
};
