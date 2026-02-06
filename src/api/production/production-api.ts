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
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/pre-production/vendorId/${vendorId}/get-latest-order-login`,
    {
      params: { lead_id: leadId },
    }
  );
  return data;
};

export const useLatestOrderLoginByLead = (
  vendorId: number | undefined,
  leadId: number | undefined
) => {
  return useQuery({
    queryKey: ["latestOrderLogin", vendorId, leadId],
    queryFn: () => getLatestOrderLoginByLead(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

export const useQcPhotos = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["qcPhotos", vendorId, leadId],
    queryFn: async () => {
      if (!vendorId || !leadId) return [];
      const { data } = await apiClient.get(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-qc-photos`
      );
      return data?.data || [];
    },
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadQcPhotos = (vendorId?: number, leadId?: number) => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      if (!vendorId || !leadId) throw new Error("Missing vendorId or leadId");
      const { data } = await apiClient.post(
        `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-qc-photos`,
        formData,
        {
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
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-hardware-packing-details`
  );
  return data;
};

// ──────────────────────────────────────────────
// 🔹 POST - Upload Hardware Packing Details
// ──────────────────────────────────────────────
export const uploadHardwarePackingDetails = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.post(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-hardware-packing-details`,
    formData,
    {
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
  leadId?: number
) => {
  return useQuery({
    queryKey: ["hardwarePackingDetails", vendorId, leadId],
    queryFn: () => getHardwarePackingDetails(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadHardwarePackingDetails = (
  vendorId?: number,
  leadId?: number
) => {
  return useMutation({
    mutationFn: (formData: FormData) =>
      uploadHardwarePackingDetails(vendorId!, leadId!, formData),
  });
};

// ──────────────────────────────────────────────
// 🔹 GET - Fetch Woodwork Packing Details
// ──────────────────────────────────────────────
export const getWoodworkPackingDetails = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-woodwork-packing-details`
  );
  return data;
};

// ──────────────────────────────────────────────
// 🔹 POST - Upload Woodwork Packing Details
// ──────────────────────────────────────────────
export const uploadWoodworkPackingDetails = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.post(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/upload-woodwork-packing-details`,
    formData,
    {
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
  leadId?: number
) => {
  return useQuery({
    queryKey: ["woodworkPackingDetails", vendorId, leadId],
    queryFn: () => getWoodworkPackingDetails(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

export const useUploadWoodworkPackingDetails = (
  vendorId?: number,
  leadId?: number
) => {
  return useMutation({
    mutationFn: (formData: FormData) =>
      uploadWoodworkPackingDetails(vendorId!, leadId!, formData),
  });
};

// ✅ PUT - Update No. of Boxes
export const updateNoOfBoxes = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.put(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/update-no-of-boxes`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ✅ React Query Hook
export const useUpdateNoOfBoxes = (vendorId?: number, leadId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      updateNoOfBoxes(vendorId!, leadId!, formData),
    onSuccess: async () => {
      // ♻️ Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["noOfBoxes"] }),
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
      ]);
    },
  });
};

export const getNoOfBoxes = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/get-no-of-boxes`
  );
  return data;
};

export const useGetNoOfBoxes = (vendorId?: number, leadId?: number) => {
  return useQuery({
    queryKey: ["noOfBoxes", vendorId, leadId],
    queryFn: () => getNoOfBoxes(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};

// ✅ --- Check Post-Production Completeness ---
export const getPostProductionCompleteness = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/post-production/vendorId/${vendorId}/leadId/${leadId}/check-post-production-completeness`
  );
  return data?.data;
};

// ✅ --- React Query Hook: Post-Production Completeness ---
export const usePostProductionCompleteness = (
  vendorId?: number,
  leadId?: number
) => {
  return useQuery({
    queryKey: ["postProductionCompleteness", vendorId, leadId],
    queryFn: () => getPostProductionCompleteness(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });
};
