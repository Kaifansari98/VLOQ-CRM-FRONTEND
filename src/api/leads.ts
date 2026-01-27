import { VendorUserLeadsOpenResponse } from "@/hooks/useLeadsQueries";
import { apiClient } from "@/lib/apiClient";
import {
  Account,
  AssignTo,
  LeadProductStructureMapping,
  ProductMapping,
  SiteType,
  Source,
  StatusType,
  User,
} from "@/types/comman-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

interface ApiErrorResponse {
  message?: string;
  error?: string;
}
export interface CreateLeadPayload {
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no?: string;
  email?: string;
  site_address: string;
  site_type_id: number;
  source_id: number;
  archetech_name?: string;
  designer_remark?: string;
  vendor_id: number;
  created_by: number;
  product_types: string[];
  product_structures: string[];
  product_structure_instances?: {
    product_structure_id: number;
    title: string;
    description?: string;
  }[];
}

export interface Lead {
  id: number;
  lead_code?: string;
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no: string;
  email: string;
  site_address: string;
  site_type_id: number;
  source_id: number;
  account_id: number;
  archetech_name: string;
  designer_remark: string;
  created_by: number;
  created_at: number;
  updated_by: number | null;
  updated_at: string;
  vendor_id: number;
  assign_to: number | null;
  assigned_by: number | null;
  account: Account;
  leadProductStructureMapping: LeadProductStructureMapping[];
  productMappings: ProductMapping[];
  documents: Document[];
  source: Source;
  siteType: SiteType;
  createdBy: User;
  assignedTo: AssignTo | null;
  statusType: StatusType;
  initial_site_measurement_date: string;
  activity_status?: string;
  count?: number;
  site_map_link: string;
}

export interface LeadProductStructureInstance {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  product_type_id: number;
  product_structure_id: number;
  quantity_index: number;
  title: string;
  status: string;
  description?: string | null;
  created_by: number;
  created_at: string;
  updated_by?: number | null;
  updated_at: string;
  productStructure?: {
    id: number;
    type: string;
    parent?: string | null;
  };
  productType?: {
    id: number;
    type: string;
  };
}

export interface ContactOrEmailCheckPayload {
  phone_number?: string;
  alt_phone_number?: string;
  email?: string;
}

export interface ContactOrEmailCheckResult {
  exists: boolean;
  checked_field: "phone_number" | "alt_phone_number" | "email";
  lead: {
    lead_id: number;
    lead_code: string | null;
    lead_name: string;
  } | null;
}

export interface AssignToPayload {
  assign_to: number;
  assign_by: number;
  assignment_reason?: string;
}

export interface EditLeadPayload {
  firstname: string;
  lastname: string;
  country_code: string;
  contact_no: string;
  alt_contact_no?: string;
  email?: string;
  site_address?: string;
  site_map_link?: string;
  site_type_id?: number;
  source_id?: number;
  archetech_name?: string;
  designer_remark?: string;
  product_types?: number[];
  product_structures?: number[];
  updated_by: number;
  initial_site_measurement_date?: string;
}

export const uploadMoreSitePhotos = async ({
  vendorId,
  leadId,
  createdBy,
  files,
}: {
  vendorId: number;
  leadId: number;
  createdBy: number;
  files: File[];
}) => {
  const formData = new FormData();
  formData.append("vendor_id", vendorId.toString());
  formData.append("lead_id", leadId.toString());
  formData.append("created_by", createdBy.toString());
  files.forEach((file) => formData.append("documents", file));

  const response = await apiClient.post(
    "/leads/upload-more-site-photos",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
};

export const createLead = async (
  payload: CreateLeadPayload,
  files: File[] = [],
) => {
  const formData = new FormData();

  // Append all form fields
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          value.forEach((item) => {
            formData.append(key, item.toString());
          });
        }
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  // Append files
  files.forEach((file) => {
    formData.append("documents", file);
  });

  for (const pair of formData.entries()) {
    console.log(pair[0] + ": " + pair[1]);
  }

  try {
    const response = await apiClient.post("leads/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>;
    console.error("Failed to create lead:", err.response?.data?.error);
    throw err;
  }
};

export const updateLead = async (
  payload: EditLeadPayload,
  leadId: number,
  userId: number,
) => {
  const response = await apiClient.put(
    `/leads/update/${leadId}/userId/${userId}`,
    payload,
  );
  return response.data;
};

export const getLeadProductStructureInstances = async (
  vendorId: number,
  leadId: number,
) => {
  const response = await apiClient.get(
    `/leads/lead/${leadId}/vendor/${vendorId}/product-structure-instances`,
  );
  return response.data;
};

export const deleteLeadProductStructureInstance = async (
  vendorId: number,
  leadId: number,
  instanceId: number,
) => {
  const response = await apiClient.delete(
    `/leads/lead/${leadId}/vendor/${vendorId}/product-structure-instances/${instanceId}`,
  );
  return response.data;
};

export const updateLeadProductStructureInstance = async (
  vendorId: number,
  leadId: number,
  instanceId: number,
  payload: {
    product_structure_id: number;
    title: string;
    description?: string;
    updated_by?: number;
  },
) => {
  const response = await apiClient.put(
    `/leads/lead/${leadId}/vendor/${vendorId}/product-structure-instances/${instanceId}`,
    payload,
  );
  return response.data;
};

export const createLeadProductStructureInstance = async (
  vendorId: number,
  leadId: number,
  payload: {
    product_structure_id: number;
    title: string;
    description?: string;
    created_by: number;
  },
) => {
  const response = await apiClient.post(
    `/leads/lead/${leadId}/vendor/${vendorId}/product-structure-instances`,
    payload,
  );
  return response.data;
};

export type VendorLeadsResponse = Lead[];
export type VendorUserLeadsResponse = Lead[];

// Get all leads for a vendor
export const getVendorLeads = async (
  vendorId: number,
): Promise<VendorLeadsResponse> => {
  const response = await apiClient.get(
    `/leads/get-vendor-leads/vendor/${vendorId}`,
  );
  return response.data;
};

// Get leads for a specific user of a vendor
export const getVendorUserLeads = async (
  vendorId: number,
  userId: number,
): Promise<Lead[]> => {
  const response = await apiClient.get(
    `/leads/get-vendor-user-leads/vendor/${vendorId}/user/${userId}`,
  );
  return response.data.data.leads; // <-- notice the extra .data.leads
};

// Get leads for a specific user of a vendor
export const getVendorUserLeadsOpen = async (
  vendorId: number,
  userId: number,
): Promise<VendorUserLeadsOpenResponse> => {
  const response = await apiClient.get(
    `/leads/bookingStage/status1-leads/vendorId/${vendorId}`,
    { params: { userId } },
  );
  return response.data;
};

export const deleteLead = async (leadId: number, userId: number) => {
  const response = await apiClient.delete(
    `/leads/delete-lead/${leadId}/user-id/${userId}`,
  );
  return response.data;
};

export const getVendorSalesExecutiveUsers = async (vendorId: number) => {
  const response = await apiClient.get(
    `/leads/sales-executives/vendor/${vendorId}`,
  );
  return response.data;
};

export const getVendorSiteSuppervisorUsers = async (vendorId: number) => {
  const response = await apiClient.get(
    `/leads/site-supervisor/vendor/${vendorId}`,
  );
  return response.data;
};

export const getLeadById = async (
  leadId: number,
  vendorId: number,
  userId: number,
) => {
  const response = await apiClient.get(
    `/leads/get-lead/${leadId}/vendor/${vendorId}/user/${userId}`,
  );
  return response.data;
};

export const checkContactOrEmailExists = async (
  vendorId: number,
  payload: ContactOrEmailCheckPayload,
): Promise<ContactOrEmailCheckResult> => {
  const { data } = await apiClient.post(
    `/leads/vendorId/${vendorId}/check-contact-number`,
    payload,
  );
  return data?.data as ContactOrEmailCheckResult;
};

export const assignLeadToAnotherSalesExecutive = async (
  vendorId: number,
  leadId: number,
  payload: AssignToPayload,
) => {
  const response = await apiClient.put(
    `/leads/sales-executives/vendor/${vendorId}/lead/${leadId}`,
    payload,
  );
  return response.data;
};

export const uploadInitialSiteMeasurement = async (payload: FormData) => {
  const response = await apiClient.post(
    "/leads/initial-site-measurement/payment-upload",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const uploadBookingDoneIsm = async (payload: FormData) => {
  const response = await apiClient.post(
    "/leads/initial-site-measurement/booking-done-ism/upload",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const getBookingDoneIsmDetails = async (
  leadId: number,
  vendorId: number,
) => {
  const response = await apiClient.get(
    `/leads/initial-site-measurement/booking-done-ism/${leadId}`,
    {
      params: { vendor_id: vendorId },
    },
  );

  return response.data?.data;
};

export interface AssignToSiteMeasurementPayload {
  task_type: string;
  due_date: string;
  remark?: string;
  user_id: number;
  created_by: number;
}

export const assignToSiteMeasurement = async (
  leadId: number,
  payload: AssignToSiteMeasurementPayload,
) => {
  const { data } = await apiClient.post(
    `/leads/initial-site-measurement/leadId/${leadId}/tasks/assign-ism`,
    payload,
  );

  return data;
};

export const fetchLeadLogs = async ({
  leadId,
  vendorId,
  limit = 10,
  cursor,
}: {
  leadId: number;
  vendorId: number;
  limit?: number;
  cursor?: number;
}) => {
  const query = new URLSearchParams();
  query.append("limit", String(limit));
  if (cursor) query.append("cursor", String(cursor));

  const response = await apiClient.get(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/logs?${query.toString()}`,
  );

  // ✅ return both "data" (array) and "meta" (pagination info)
  return {
    data: response.data.data, // logs array
    meta: response.data.meta, // pagination info
  };
};

// vendor all user list
export interface VendorUserItem {
  id: number;
  user_name: string;
}

export interface VendorUsersResponse {
  success: boolean;
  message: string;
  data: VendorUserItem[];
}

export const fetchVendorUsers = async (
  vendorId: number,
): Promise<VendorUsersResponse> => {
  const { data } = await apiClient.get(
    `/vendors/vendor-users?vendor_id=${vendorId}`,
  );

  return data;
};

export const useVendorUsers = (vendorId: number) => {
  return useQuery<VendorUsersResponse>({
    queryKey: ["vendor-users", vendorId],

    queryFn: () => fetchVendorUsers(vendorId),

    enabled: !!vendorId,

    staleTime: 5 * 60 * 1000, // 5 min cache

    refetchOnWindowFocus: false,
  });
};

// vendor all status type list
export interface VendorStatusType {
  id: number;
  type: string;
  tag: string;
}

export interface VendorStatusTypeResponse {
  success: boolean;
  message: string;
  data: VendorStatusType[];
}

export const fetchVendorStatusTypes = async (
  vendorId: number,
): Promise<VendorStatusTypeResponse> => {
  const { data } = await apiClient.get(
    `/vendors/status-types?vendor_id=${vendorId}`,
  );

  return data;
};

export const useVendorStatusTypes = (vendorId: number) => {
  return useQuery<VendorStatusTypeResponse>({
    queryKey: ["vendorStatusTypes", vendorId],

    queryFn: () => fetchVendorStatusTypes(vendorId),

    enabled: !!vendorId,

    staleTime: 10 * 60 * 1000, // cache for 10 minutes
  });
};

/**
 * Soft delete a document (LeadDocuments)
 */
export const useDeleteDocument = (leadId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      documentId,
      deleted_by,
    }: {
      vendorId: number;
      documentId: number;
      deleted_by: number;
    }) => {
      const { data } = await apiClient.delete(
        `/leads/delete-doc/vendorId/${vendorId}/documentId/${documentId}`,
        { data: { deleted_by } },
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Document deleted successfully!");

      // ✅ Invalidate both queries safely
      queryClient.invalidateQueries({ queryKey: ["lead"] });

      if (leadId) {
        queryClient.invalidateQueries({
          queryKey: ["siteMeasurementLeadDetails", leadId],
        });

        queryClient.invalidateQueries({
          queryKey: ["getQuotationDoc", leadId],
        });

        queryClient.invalidateQueries({
          queryKey: ["meetings", leadId],
        });

        queryClient.invalidateQueries({
          queryKey: ["getDesignsDoc", leadId],
        });

        queryClient.invalidateQueries({
          queryKey: ["clientApprovalDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["bookingLead"],
        });

        queryClient.invalidateQueries({
          queryKey: ["clientDocumentationDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["currentSitePhotos"],
        });

        queryClient.invalidateQueries({
          queryKey: ["woodworkPackingDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["hardwarePackingDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["qcPhotos"],
        });

        queryClient.invalidateQueries({
          queryKey: ["currentSitePhotosAtSiteReadiness"],
        });
        queryClient.invalidateQueries({
          queryKey: ["client-approval-stage"],
        });
        queryClient.invalidateQueries({
          queryKey: ["productionFiles"],
        });
        queryClient.invalidateQueries({
          queryKey: ["dispatchDocuments"],
        });
        queryClient.invalidateQueries({
          queryKey: ["postDispatchDocuments"],
        });
        queryClient.invalidateQueries({
          queryKey: ["miscellaneousEntries"],
        });
        queryClient.invalidateQueries({
          queryKey: ["finalHandoverDocuments"],
        });

        queryClient.invalidateQueries({
          queryKey: ["underInstallationDetails"],
        });
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete document",
      );
    },
  });
};
