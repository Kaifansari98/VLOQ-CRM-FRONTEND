import { apiClient } from "@/lib/apiClient";

export interface FinalMeasurementPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  created_by: number;
  critical_discussion_notes?: string; // optional
  final_measurement_docs: File[]; // accept multiple PDF or image files
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
  productStructureInstanceId?: number;
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
  if (payload.productStructureInstanceId) {
    formData.append(
      "product_structure_instance_id",
      payload.productStructureInstanceId.toString()
    );
  }

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

export interface AddMoreFinalMeasurementFilesPayload {
  leadId: number;
  vendorId: number;
  createdBy: number;
  sitePhotos: File[];
}

export const addMoreFinalMeasurementFiles = async (
  payload: AddMoreFinalMeasurementFilesPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());

  payload.sitePhotos.forEach((file) => {
    formData.append("final_measurement_doc", file);
  });

  const { data } = await apiClient.post(
    `/leads/final-measurement/add-final-measurement-docs`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export interface AddMoreFinalMeasurementSitePhotosPayload {
  leadId: number;
  vendorId: number;
  createdBy: number;
  sitePhotos: File[];
}

export const addMoreFinalMeasurementSitePhotos = async (
  payload: AddMoreFinalMeasurementSitePhotosPayload
) => {
  const formData = new FormData();
  formData.append("lead_id", payload.leadId.toString());
  formData.append("vendor_id", payload.vendorId.toString());
  formData.append("created_by", payload.createdBy.toString());

  payload.sitePhotos.forEach((file) => {
    formData.append("site_photos", file);
  });

  const { data } = await apiClient.post(
    `/leads/final-measurement/add-site-photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export interface UploadCSPBookingPayload {
  lead_id: number;
  account_id: number;
  vendor_id: number;
  assigned_to: number;
  created_by: number;
  site_photos: File[];
}

export const uploadCSPBooking = async (
  payload: UploadCSPBookingPayload
) => {
  const formData = new FormData();

  formData.append("lead_id", payload.lead_id.toString());
  formData.append("account_id", payload.account_id.toString());
  formData.append("vendor_id", payload.vendor_id.toString());
  formData.append("assigned_to", payload.assigned_to.toString());
  formData.append("created_by", payload.created_by.toString());

  payload.site_photos.forEach((file) => {
    formData.append("current_site_photos", file);
  });

  const { data } = await apiClient.post(
    `/leads/bookingStage/upload-CSP-booking`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export interface CSPBookingPhoto {
  id: number;
  originalName: string;
  s3Key: string;
  signedUrl: string;
  createdAt: string;
}

export interface GetCSPBookingResponse {
  count: number;
  documents: CSPBookingPhoto[];
}

export const getCSPBookingPhotos = async (
  vendorId: number,
  leadId: number
): Promise<GetCSPBookingResponse> => {
  const { data } = await apiClient.get(
    `/leads/bookingStage/get-CSP-booking/${vendorId}/${leadId}`
  );

  return data.data;
};
