import { apiClient } from "@/lib/apiClient";

export interface CreateApprovalRequestPayload {
  due_date: string;
  remark: string;
  user_id: number;
  created_by: number;
  files?: File[];
}

export interface ActOnApprovalRequestPayload {
  action: "approve" | "reject";
  acted_by: number;
  remark?: string | null;
  files?: File[];
}

export interface ApprovalRequestAssignableUser {
  id: number;
  user_name: string;
  user_email: string | null;
  franchise_id: number | null;
  user_type: {
    id: number;
    user_type: string;
  } | null;
}

export interface ApprovalRequestDocument {
  id: number;
  original_name: string;
  signedUrl: string;
  created_at: string;
}

export interface ApprovalRequestDetails {
  id: number;
  task_id: number;
  status: string;
  request_remark: string;
  response_remark: string | null;
  created_at: string;
  responded_at: string | null;
  requester: {
    id: number;
    user_name: string;
    user_email: string | null;
  } | null;
  approver: {
    id: number;
    user_name: string;
    user_email: string | null;
  } | null;
  responder: {
    id: number;
    user_name: string;
    user_email: string | null;
  } | null;
  request_documents: ApprovalRequestDocument[];
  response_documents: ApprovalRequestDocument[];
}

export const createApprovalRequest = async (
  leadId: number,
  payload: CreateApprovalRequestPayload,
) => {
  const formData = new FormData();
  formData.append("due_date", payload.due_date);
  formData.append("remark", payload.remark);
  formData.append("user_id", String(payload.user_id));
  formData.append("created_by", String(payload.created_by));

  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.post(
    `/leads/approval-requests/leadId/${leadId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const getApprovalRequestAssignableUsers = async (
  vendorId: number,
  leadId: number,
) => {
  const response = await apiClient.get(
    `/leads/approval-requests/vendor/${vendorId}/lead/${leadId}/assignable-users`,
  );

  return {
    leadFranchiseId: response.data?.data?.leadFranchiseId ?? null,
    users: (response.data?.data?.users ?? []) as ApprovalRequestAssignableUser[],
  };
};

export const getApprovalRequestDetails = async (
  leadId: number,
  taskId: number,
): Promise<ApprovalRequestDetails> => {
  const response = await apiClient.get(
    `/leads/approval-requests/leadId/${leadId}/taskId/${taskId}`,
  );

  return response.data?.data as ApprovalRequestDetails;
};

export const actOnApprovalRequest = async (
  leadId: number,
  taskId: number,
  payload: ActOnApprovalRequestPayload,
) => {
  const formData = new FormData();
  formData.append("action", payload.action);
  formData.append("acted_by", String(payload.acted_by));
  if (payload.remark != null) {
    formData.append("remark", payload.remark);
  }

  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.patch(
    `/leads/approval-requests/leadId/${leadId}/taskId/${taskId}/action`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};
