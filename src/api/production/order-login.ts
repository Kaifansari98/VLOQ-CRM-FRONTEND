
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

// ✅ --- Fetch Order-Login Leads (paginated) ---
export const getOrderLoginLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/production/order-login/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );
  return data?.data;
};

// ✅ --- React Query Hook: My Order-Login Leads ---
export const useOrderLoginLeads = (
  vendorId: number | undefined,
  userId: number | undefined,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["orderLoginLeads", vendorId, userId, page, limit],
    queryFn: () => getOrderLoginLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};



// ✅ --- Fetch all company vendors by vendor_id ---
export const getCompanyVendorsByVendorId = async (vendorId: number) => {
  const { data } = await apiClient.get(
    `/vendor/company-vendors/vendorId/${vendorId}`
  );
  console.log("company vendor data: ", data)
  return data?.data;
};

// ✅ --- React Query Hook: Company Vendors ---
export const useCompanyVendors = (vendorId: number | undefined) => {
  return useQuery({
    queryKey: ["companyVendors", vendorId],
    queryFn: () => getCompanyVendorsByVendorId(vendorId!),
    enabled: !!vendorId,
  });
};



export interface uploadFileBreakupPropa {
  lead_id: number | string;
  account_id: number | string;
  item_type: string;
  item_desc: string;
  company_vendor_id: number | string;
  created_by: number | string;
}

// ✅ --- Upload File Breakup ---
export const uploadFileBreakup = async (vendorId: number, payload: any) => {
  const { data } = await apiClient.post(
    `/leads/production/order-login/vendorId/${vendorId}/upload-file-breakups`,
    payload
  );
  return data;
};

// ✅ --- Mutation Hook
export const useUploadFileBreakup = (vendorId: number | undefined) =>
  useMutation({
    mutationFn: (payload: any) => uploadFileBreakup(vendorId!, payload),
  });

// ✅ --- Fetch order login details by lead ---
export const getOrderLoginByLead = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/production/order-login/vendorId/${vendorId}/get-order-login-details`,
    { params: { lead_id: leadId } }
  );
  return data?.data;
};

export const useOrderLoginByLead = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useQuery({
    queryKey: ["orderLoginByLead", vendorId, leadId],
    queryFn: () => getOrderLoginByLead(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });

// ✅ --- Update order login details ---
export const updateOrderLogin = async (
  vendorId: number,
  orderLoginId: number,
  payload: any
) => {
  // replace empty string with N/A for item_desc
  if (!payload.item_desc || payload.item_desc.trim() === "") {
    payload.item_desc = "N/A";
  }

  const { data } = await apiClient.put(
    `/leads/production/order-login/vendorId/${vendorId}/order-login-id/${orderLoginId}/update`,
    payload
  );
  return data;
};

export const useUpdateOrderLogin = (vendorId: number | undefined) =>
  useMutation({
    mutationFn: (vars: { orderLoginId: number; payload: any }) =>
      updateOrderLogin(vendorId!, vars.orderLoginId, vars.payload),
  });

// ✅ --- Delete order login detail ---
export const deleteOrderLogin = async (
  vendorId: number,
  orderLoginId: number,
  deleted_by: number
) => {
  const { data } = await apiClient.delete(
    `/leads/production/order-login/vendorId/${vendorId}/order-login-id/${orderLoginId}/delete`,
    { data: { deleted_by } }
  );
  return data;
};

export const useDeleteOrderLogin = (vendorId: number | undefined) =>
  useMutation({
    mutationFn: (vars: { orderLoginId: number; deleted_by: number }) =>
      deleteOrderLogin(vendorId!, vars.orderLoginId, vars.deleted_by),
  });

// ✅ --- Fetch Approved Tech Check Documents ---
export const getApprovedTechCheckDocuments = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/tech-check-approved`
  );
  return data?.data;
};

// ✅ --- React Query Hook: Approved Tech Check Docs ---
export const useApprovedTechCheckDocuments = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useQuery({
    queryKey: ["approvedTechCheckDocuments", vendorId, leadId],
    queryFn: () => getApprovedTechCheckDocuments(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });

// ✅ --- Upload Production Files ---
export const uploadProductionFiles = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.post(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/upload-production-files`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ✅ --- Mutation Hook: Upload Production Files ---
export const useUploadProductionFiles = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useMutation({
    mutationFn: (formData: FormData) =>
      uploadProductionFiles(vendorId!, leadId!, formData),
  });

// ✅ --- Fetch Production Files ---
export const getProductionFiles = async (vendorId: number, leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/production-files`
  );
  return data?.data;
};

// ✅ --- React Query Hook: Production Files ---
export const useProductionFiles = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useQuery({
    queryKey: ["productionFiles", vendorId, leadId],
    queryFn: () => getProductionFiles(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });

// ✅ --- Upload Order Login PO Files ---
export const uploadOrderLoginPoFiles = async (
  vendorId: number,
  leadId: number,
  orderLoginId: number,
  formData: FormData
) => {
  const { data } = await apiClient.post(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/order-login-id/${orderLoginId}/upload-po-files`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

export const useUploadOrderLoginPoFiles = (
  vendorId: number | undefined,
  leadId: number | undefined,
  orderLoginId: number | undefined
) =>
  useMutation({
    mutationFn: (formData: FormData) =>
      uploadOrderLoginPoFiles(vendorId!, leadId!, orderLoginId!, formData),
  });

// ✅ --- Fetch Order Login PO Files ---
export const getOrderLoginPoFiles = async (
  vendorId: number,
  leadId: number,
  orderLoginId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/order-login-id/${orderLoginId}/po-files`
  );
  return data?.data || [];
};

export const useOrderLoginPoFiles = (
  vendorId: number | undefined,
  leadId: number | undefined,
  orderLoginId: number | undefined
) =>
  useQuery({
    queryKey: ["orderLoginPoFiles", vendorId, leadId, orderLoginId],
    queryFn: () => getOrderLoginPoFiles(vendorId!, leadId!, orderLoginId!),
    enabled: !!vendorId && !!leadId && !!orderLoginId,
  });

// ✅ --- Move Lead to Production Stage ---
export const moveLeadToProductionStage = async (
  vendorId: number,
  leadId: number,
  formData: FormData
) => {
  const { data } = await apiClient.put(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/move-to-production-stage`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

// ✅ --- Mutation Hook: Move Lead to Production Stage ---
export const useMoveLeadToProductionStage = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useMutation({
    mutationFn: (formData: FormData) =>
      moveLeadToProductionStage(vendorId!, leadId!, formData),
  });

// ✅ --- Production Readiness Check ---
export const getLeadProductionReadiness = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/move-to-production-readiness-check`
  );
  return data?.data;
};

export const useLeadProductionReadiness = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useQuery({
    queryKey: ["leadProductionReadiness", vendorId, leadId],
    queryFn: () => getLeadProductionReadiness(vendorId!, leadId!),
    enabled: !!vendorId && !!leadId,
  });

// ✅ --- Upload Multiple File Breakups ---
export const uploadMultipleFileBreakupsByLead = async (
  vendorId: number,
  leadId: number,
  accountId: number,
  breakups: any[]
) => {
  const { data } = await apiClient.post(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/accountId/${accountId}/upload-multiple-file-breakups`,
    { breakups }
  );
  return data;
};

export const useUploadMultipleFileBreakupsByLead = (
  vendorId: number | undefined,
  leadId: number | undefined,
  accountId: number | undefined
) =>
  useMutation({
    mutationFn: (breakups: any[]) =>
      uploadMultipleFileBreakupsByLead(
        vendorId!,
        leadId!,
        accountId!,
        breakups
      ),
  });

// ✅ --- Update Multiple Order Logins ---
export const updateMultipleOrderLogins = async (
  vendorId: number,
  leadId: number,
  updates: any[]
) => {
  const { data } = await apiClient.put(
    `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/update-multiple`,
    { updates }
  );
  return data;
};

export const useUpdateMultipleOrderLogins = (
  vendorId: number | undefined,
  leadId: number | undefined
) =>
  useMutation({
    mutationFn: (updates: any[]) =>
      updateMultipleOrderLogins(vendorId!, leadId!, updates),
  });

// ✅ --- Request To Production Stage ---
export const useRequestToProduction = () => {
  return useMutation({
    mutationFn: async ({
      vendorId,
      leadId,
      accountId,
      assign_to_user_id,
      created_by,
      client_required_order_login_complition_date, // ✅ ADD THIS
    }: {
      vendorId: number;
      leadId: number;
      accountId: number;
      assign_to_user_id: number;
      created_by: number;
      client_required_order_login_complition_date: string; // ✅ ADD THIS
    }) => {
      const { data } = await apiClient.put(
        `/leads/production/order-login/vendorId/${vendorId}/leadId/${leadId}/move-to-production-stage`,
        {
          account_id: accountId,
          user_id: created_by,
          assign_to_user_id,
          client_required_order_login_complition_date, // ✅ ADD THIS
        }
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Lead successfully moved to Production Stage!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to move lead.");
    },
  });
};

// ✅ --- Fetch Factory Users ---
export const useFactoryUsers = (vendorId: number) => {
  return useQuery({
    queryKey: ["factoryUsers", vendorId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/leads/production/order-login/factory-users/vendorId/${vendorId}`
      );
      return data?.data?.factory_users || [];
    },
    enabled: !!vendorId,
  });
};
