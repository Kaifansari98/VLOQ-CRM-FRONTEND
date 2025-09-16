import { apiClient } from "@/lib/apiClient";

export interface FinalMeasurementPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  created_by: number;
  critical_discussion_notes?: string; // optional
  final_measurement_doc: File; // only 1 PDF file
  site_photos: File[]; // multiple images
}

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

  if (payload.final_measurement_doc) {
    formData.append("final_measurement_doc", payload.final_measurement_doc);
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
    `/leads/final-measurement/allLeads/vendorId/${vendorId}/userId/${userId}`
  );
  return data;
};

export interface uploadClientDocPayload {
  leadId: number;
  accountId: number;
  vendorId: number;
  createdBy: number;
  documents: File[];
}

export const UploadClientDocumantation = async (
  payload: uploadClientDocPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("account_id", payload.accountId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());
  payload.documents.forEach((file) => {
    formData.append("documents", file);
  });

  const { data } = await apiClient.post(
    `/leads/client-documentation/submit-documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};
