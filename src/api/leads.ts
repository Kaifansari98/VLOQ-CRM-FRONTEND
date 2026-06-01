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
import { toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/utils";

interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: unknown;
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
  franchise_id: number;
  created_by: number;
  priority: string;
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
  is_draft?: boolean;
  is_blocked?: boolean;
  lead_blocked_at?: string | null;
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
  franchise_id?: number | null;
  priority?: string;
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
  assigned_designer_from_mapping?: {
    user_id: number;
    user_name: string | null;
    created_at: string;
  } | null;
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
  is_order_login_filled?: boolean | null;
  is_order_login_completed?: boolean | null;
  is_pre_prod_done?: boolean | null;
  is_under_production?: boolean | null;
  is_post_production?: boolean | null;
  is_production_completed?: boolean | null;
  production_erd_date?: string | null;
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

export interface SimilarLeadCheckPayload {
  phone_number: string;
  product_types: number[];
}

export interface SimilarLeadCheckResult {
  exists: boolean;
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
  firstname?: string;
  lastname?: string;
  country_code?: string;
  contact_no?: string;
  alt_contact_no?: string;
  email?: string;
  site_address?: string;
  site_map_link?: string;
  site_type_id?: number;
  source_id?: number;
  priority?: string;
  archetech_name?: string;
  designer_remark?: string;
  updated_by: number;
  initial_site_measurement_date?: string;
}

export interface CreateClientVisitPayload {
  leadId: number;
  created_by: number;
  visit_type: "physical_visit" | "follow_up_call";
  date: string;
  meeting_type_id: number;
  remark: string;
  location?: string;
  expense_incurred?: number;
  documents?: File[];
  payment_proof_documents?: File[];
}

export interface ClientVisitDocument {
  id: number;
  role: "supporting_document" | "payment_proof";
  original_name: string;
  signedUrl: string;
  created_at: string;
}

export interface ClientVisit {
  id: number;
  visit_type: "physical_visit" | "follow_up_call";
  date: string;
  location: string | null;
  remark: string;
  expense_incurred: number | null;
  created_at: string;
  meeting_type: {
    id: number;
    type: string;
  } | null;
  created_by: {
    id: number;
    user_name: string | null;
    user_email: string | null;
  } | null;
  documents: ClientVisitDocument[];
  supporting_documents: ClientVisitDocument[];
  payment_proof_documents: ClientVisitDocument[];
}

export interface LeadBlockStatus {
  id: number;
  vendor_id: number;
  is_blocked: boolean;
  lead_blocked_at: string | null;
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

export const createClientVisit = async (payload: CreateClientVisitPayload) => {
  const formData = new FormData();

  formData.append("created_by", payload.created_by.toString());
  formData.append("visit_type", payload.visit_type);
  formData.append("date", new Date(payload.date).toISOString());
  formData.append("meeting_type_id", payload.meeting_type_id.toString());
  formData.append("remark", payload.remark);

  if (payload.location?.trim()) {
    formData.append("location", payload.location.trim());
  }

  if (payload.expense_incurred != null) {
    formData.append("expense_incurred", payload.expense_incurred.toString());
  }

  (payload.documents ?? []).forEach((file) => {
    formData.append("documents", file);
  });

  (payload.payment_proof_documents ?? []).forEach((file) => {
    formData.append("payment_proof_documents", file);
  });

  const response = await apiClient.post(
    `/leads/client-visits/leadId/${payload.leadId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const getClientVisits = async (leadId: number) => {
  const response = await apiClient.get<{
    success: boolean;
    message: string;
    data: ClientVisit[];
  }>(`/leads/client-visits/leadId/${leadId}`);

  return response.data.data ?? [];
};

export const createLead = async (
  payload: CreateLeadPayload,
  files: File[] = [],
  onUploadProgress?: (info: UploadProgressInfo) => void,
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

  // Pre-calculate total file bytes for accurate progress reporting
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  try {
    const response = await apiClient.post("leads/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            const serverTotal = progressEvent.total ?? totalBytes;
            const loaded = progressEvent.loaded ?? 0;
            const percent =
              serverTotal > 0
                ? Math.min(99, Math.round((loaded / serverTotal) * 100))
                : 0;
            onUploadProgress({
              percent,
              uploadedBytes: Math.min(loaded, totalBytes),
              totalBytes,
            });
          }
        : undefined,
    });

    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<ApiErrorResponse>;
    console.error("Failed to create lead:", getErrorMessage(err));
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

export const updateLeadProductType = async (
  leadId: number,
  userId: number,
  payload: { productTypeId?: number; productType?: string },
) => {
  const response = await apiClient.put(
    `/leads/update-product-type/${leadId}/userId/${userId}`,
    {
      ...(payload.productTypeId
        ? { product_type_id: payload.productTypeId }
        : {}),
      ...(payload.productType ? { product_type: payload.productType } : {}),
    },
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
  updatedBy?: number,
) => {
  const response = await apiClient.delete(
    `/leads/lead/${leadId}/vendor/${vendorId}/product-structure-instances/${instanceId}`,
    updatedBy ? { data: { updated_by: updatedBy } } : undefined,
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
    pre_prod_remark?: string;
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
  franchiseId?: number | null,
): Promise<VendorUserLeadsOpenResponse> => {
  const response = await apiClient.get(
    `/leads/bookingStage/status1-leads/vendorId/${vendorId}`,
    {
      params: {
        userId,
        ...(franchiseId ? { franchise_id: franchiseId } : {}),
      },
    },
  );
  return response.data;
};

export const deleteLead = async (leadId: number, userId: number) => {
  const response = await apiClient.delete(
    `/leads/delete-lead/${leadId}/user-id/${userId}`,
  );
  return response.data;
};

export const getVendorSalesExecutiveUsers = async (
  vendorId: number,
  franchiseId?: number,
  options?: {
    assigneeUserType?: string;
    requiredPrivilegeCode?: string;
    taskType?: string;
  },
) => {
  const params: Record<string, string | number> = {};
  if (franchiseId) params.franchise_id = franchiseId;
  if (options?.assigneeUserType) {
    params.assignee_user_type = options.assigneeUserType;
  }
  if (options?.requiredPrivilegeCode) {
    params.required_privilege_code = options.requiredPrivilegeCode;
  }
  if (options?.taskType) {
    params.task_type = options.taskType;
  }

  const response = await apiClient.get(
    `/leads/sales-executives/vendor/${vendorId}`,
    Object.keys(params).length > 0 ? { params } : undefined,
  );
  return response.data;
};

export const assignDesignerToLead = async (
  vendorId: number,
  leadId: number,
  payload: {
    account_id: number;
    assign_to_user_id: number;
    created_by: number;
  },
) => {
  const response = await apiClient.post(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/assign-designer`,
    payload,
  );
  return response.data;
};

export const getVendorSiteSuppervisorUsers = async (vendorId: number) => {
  const response = await apiClient.get(
    `/leads/site-supervisor/vendor/${vendorId}`,
  );
  return response.data;
};

export const getFollowUpUsers = async (
  vendorId: number,
  leadId: number,
  franchiseId?: number | null,
) => {
  const params = franchiseId ? `?franchise_id=${franchiseId}` : "";
  const response = await apiClient.get(
    `/leads/follow-up-users/vendor/${vendorId}/lead/${leadId}${params}`,
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

export const getLeadBlockStatus = async (
  vendorId: number,
  leadId: number,
): Promise<LeadBlockStatus> => {
  const response = await apiClient.get(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/block-status`,
  );
  return response.data?.data as LeadBlockStatus;
};

export const blockLead = async (
  vendorId: number,
  leadId: number,
  updatedBy: number,
): Promise<LeadBlockStatus> => {
  const response = await apiClient.patch(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/block`,
    { updated_by: updatedBy },
  );
  return response.data?.data as LeadBlockStatus;
};

export const unblockLead = async (
  vendorId: number,
  leadId: number,
  updatedBy: number,
): Promise<LeadBlockStatus> => {
  const response = await apiClient.patch(
    `/leads/vendorId/${vendorId}/leadId/${leadId}/unblock`,
    { updated_by: updatedBy },
  );
  return response.data?.data as LeadBlockStatus;
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

export const checkSimilarLeadExists = async (
  vendorId: number,
  payload: SimilarLeadCheckPayload,
): Promise<SimilarLeadCheckResult> => {
  const { data } = await apiClient.post(
    `/leads/vendorId/${vendorId}/check-similar-lead`,
    payload,
  );
  return data?.data as SimilarLeadCheckResult;
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

export interface InitialSiteMeasurementTaskConflict {
  id: number;
  task_type: "Initial Site Measurement";
  status: string;
  due_date: string;
  assignee: {
    id: number;
    user_name: string;
  } | null;
}

export interface InitialSiteMeasurementFollowUpTaskConflict {
  id: number;
  task_type: "Follow Up";
  status: string;
  due_date: string;
  assignee: {
    id: number;
    user_name: string;
  } | null;
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

export const getInitialSiteMeasurementTaskConflicts = async (leadId: number) => {
  const { data } = await apiClient.get(
    `/leads/initial-site-measurement/leadId/${leadId}/task-conflicts`
  );

  return {
    restrictedTaskConflicts: (data?.data?.conflicts?.restrictedTaskConflicts ??
      []) as InitialSiteMeasurementTaskConflict[],
    followUpConflicts: (data?.data?.conflicts?.followUpConflicts ??
      []) as InitialSiteMeasurementFollowUpTaskConflict[],
  };
};

export const fetchLeadLogs = async ({
  leadId,
  vendorId,
  limit = 10,
  cursor,
  historyType,
  search,
  userTypeId,
}: {
  leadId: number;
  vendorId: number;
  limit?: number;
  cursor?: number;
  historyType?: "Lead" | "Task" | "FollowUp" | "Approval";
  search?: string;
  userTypeId?: number;
}) => {
  const query = new URLSearchParams();
  query.append("limit", String(limit));
  if (cursor) query.append("cursor", String(cursor));
  if (historyType) query.append("history_type", historyType);
  if (search?.trim()) query.append("search", search.trim());
  if (userTypeId) query.append("user_type_id", String(userTypeId));

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
  user_email: string;
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
      toastManager.add({
        title: "Document deleted successfully!",
        type: "success",
      });

      // ✅ Invalidate both queries safely
      queryClient.invalidateQueries({ queryKey: ["lead"] });

      if (leadId) {
        queryClient.invalidateQueries({
          queryKey: ["siteMeasurementLeadDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["getQuotationDoc"],
        });

        queryClient.invalidateQueries({
          queryKey: ["meetings"],
        });

        queryClient.invalidateQueries({
          queryKey: ["getDesignsDoc"],
        });

        queryClient.invalidateQueries({
          queryKey: ["clientApprovalDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["bookingLead"],
        });

        queryClient.invalidateQueries({
          queryKey: ["csp-booking-photos"],
        });

        queryClient.invalidateQueries({
          queryKey: ["finalMeasurementLead"],
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
          queryKey: ["usableHandover"],
        });

        queryClient.invalidateQueries({
          queryKey: ["underInstallationDetails"],
        });

        queryClient.invalidateQueries({
          queryKey: ["installation-updates"],
        });

        queryClient.invalidateQueries({
          queryKey: ["miscellaneousEntries"],
        });
        queryClient.invalidateQueries({
          queryKey: ["lead-product-structure-instances"],
          exact: false,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ["postProductionReady"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["postProductionCompleteness"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["checkSiteReadinessCompletion"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["preProductionFiles"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["currentSitePhotosAtSiteReadiness"],
        exact: false,
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to delete document",
        type: "error",
      });
    },
  });
};

// @/api/leads.ts

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadDocument {
  id: number;
  doc_og_name: string;
  doc_sys_name: string;
  doc_type_id: number;
  doc_type_tag: string;
  doc_type_type: string;
  doc_title: string | null;
  stage: string | null;
  tech_check_status: string | null;
  product_structure_instance_id: number | null;
  instance_title: string | null;
  instance_type: string | null;  
  created_at: string;
  signed_url: string;
}

export interface DocGroup {
  title: string;
  totalDocs: number;
  docs: LeadDocument[];
}

export interface InstanceGroup {
  instanceId: number | null;
  instanceTitle: string | null;  
  instanceType: string | null;    
  docGroups: DocGroup[];
}

export interface StageDocResult {
  stageId: string;
  totalFiles: number;
  instanceGroups: InstanceGroup[];   
}


export const useAllLeadDocuments = (
  vendorId?: number,
  leadId?: number,
  instanceId?: number | null,
) => {
  return useQuery<StageDocResult[]>({
    queryKey: ["allLeadDocuments", vendorId, leadId, instanceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (instanceId) params.set("instance_id", String(instanceId));

      const { data } = await apiClient.get(
        `/leads/vendorId/${vendorId}/leadId/${leadId}/all-documents?${params.toString()}`,
      );

      return data.data as StageDocResult[];
    },
    enabled: !!vendorId && !!leadId,
    staleTime: 2 * 60 * 1000,
  });
};
