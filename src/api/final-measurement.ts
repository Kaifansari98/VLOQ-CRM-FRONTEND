import { apiClient } from "@/lib/apiClient";

export interface FinalMeasurementPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  created_by: number;
  critical_discussion_notes?: string; // optional
  final_measurement_docs: File[]; // accept multiple PDF file
  site_photos: File[]; // multiple images
}

export interface AssignToFinalMeasurementPayload {
  task_type: string;
  due_date: string;
  remark?: string;
  user_id: number;
  created_by: number;
}

export const assignToFinalMeasurement = async (
  leadId: number,
  payload: AssignToFinalMeasurementPayload
) => {
  const { data } = await apiClient.post(
    `/leads/final-measurement/leadId/${leadId}/tasks/assign-fm`,
    payload
  );

  return data;
};

export const UploadFinalMeasurement = async (
  payload: FinalMeasurementPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.lead_id.toString());
  formData.append("account_id", payload.account_id.toString());
  formData.append("vendor_id", payload.vendor_id.toString());
  formData.append("created_by", payload.created_by.toString());

  formData.append(
    "critical_discussion_notes",
    payload.critical_discussion_notes || ""
  );

  if (payload.final_measurement_docs?.length) {
    payload.final_measurement_docs.forEach((file) => {
      formData.append("final_measurement_doc", file); // ✅ multiple files with same field name
    });
  }

  payload.site_photos.forEach((file) => {
    formData.append("site_photos", file);
  });

  const { data } = await apiClient.post(
    `/leads/final-measurement/onboard`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const getAllFinalMeasurementLeads = async (
  vendorId: number,
  userId: number
) => {
  const { data } = await apiClient.get(
    `/leads/final-measurement/all/${vendorId}`,
    { params: { userId } } // ✅ send userId as query param
  );
  return data;
};

export interface uploadClientDocPayload {
  leadId: number;
  accountId: number;
  vendorId: number;
  createdBy: number;
  pptDocuments: File[];
  pythaDocuments: File[];
}

export const UploadClientDocumantation = async (
  payload: uploadClientDocPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("account_id", payload.accountId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());

  payload.pptDocuments.forEach((file) => {
    formData.append("client_documentations_ppt", file);
  });

  payload.pythaDocuments.forEach((file) => {
    formData.append("client_documentations_pytha", file);
  });

  const { data } = await apiClient.post(
    `/leads/client-documentation/submit-documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return data;
};

export const getFinalMeasurmentLeadById = async (
  vendorId: number,
  leadId: number
) => {
  const { data } = await apiClient.get(
    `/leads/final-measurement/vendorId/${vendorId}/LeadId/${leadId}`
  );
  return data?.data;
};

export const UpdateNotes = async (
  vendorId: number,
  leadId: number,
  notes: string
) => {
  const { data } = await apiClient.put(
    `/leads/final-measurement/vendorId/${vendorId}/leadId/${leadId}/notes`,
    { notes }
  );

  return data;
};

export interface addFinalMeasurmentDocPayload {
  leadId: number;
  vendorId: number;
  accountId: number;
  createdBy: number;
  sitePhotos: File[];
}

export const addFinalMeasurmentDoc = async (
  payload: addFinalMeasurmentDocPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("account_id", payload.accountId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());

  payload.sitePhotos.forEach((file) => {
    formData.append("site_photos", file);
  });

  const { data } = await apiClient.post(
    `/leads/final-measurement/add-files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};
