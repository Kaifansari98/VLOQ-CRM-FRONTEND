// track-trace-cutlist.api.ts
import { apiClient } from "@/lib/apiClient";


export interface CutListSavePayload {
  project_id: string;
  vendor_id: number;
  cutListIds: string;
  machine_id: number;
  machine_name: string;
  assigned: boolean;
}

export const getProjectCutList = async (vendorId: Number, projectId: string) => {
  const { data } = await apiClient.get(
    `/track-trace/cut-list-machine/${vendorId}/${projectId}`
  );

  return data.data.cutlist;
};


export const updateCutListMachine = async (payload: CutListSavePayload) => {
  const response = await apiClient.post(
    `/track-trace/assign-machine`,
    payload,
  );
  return response.data;
};



export const generateQRLabels = async (vendorId: number, projectId: string, cutListIds?: number[]) => {
  const { data } = await apiClient.post(
    `/track-trace/create-qr-code`,
    {
      vendorId,
      projectId,
      cutListIds
    }
  );
  return data.data; // Returns the PDF URL
};



export const downloadCutListExcel = async (vendorId: number, unique_project_id: string) => {
  const { data } = await apiClient.post(
    `/track-trace/download-cut-list-excel`,
    {
      vendorId,
      unique_project_id,
    }
  );
  return data.data; // Returns the PDF URL
};

export const downloadCutListBasicExcel = async (vendorId: number, unique_project_id: string) => {
  const { data } = await apiClient.post(
    `/track-trace/download-cut-list-basic-excel`,
    {
      vendorId,
      unique_project_id,
    }
  );
  return data.data; // Returns the file URL
};


export interface Lead {
  id: number;
  lead_code: string;
  lead_name?: string;
  firstname:string;
  lastname:string;
  [key: string]: unknown;
}

// Search leads by query string
export const searchLeads = async (query: string, vendorId: Number): Promise<Lead[]> => {
  const { data } = await apiClient.get(`/track-trace/leads/search/${vendorId}/${query}`, {    
  });
  console.log(data.data)
  return data.data.leads; // ✏️ adjust to match your actual response shape
};


export interface LinkLeadPayload {
  project_id: number;
  lead_id: number;
  vendor_id:number;
}

// Link a lead to a project
export const linkLeadToProject = async (payload: LinkLeadPayload) => {
  const { data } = await apiClient.post(
    `/track-trace/link-lead/${payload.project_id}/lead`,
    { lead_id: payload.lead_id,vendor_id:payload.vendor_id }
  );
  return data.data; // ✏️ adjust to match your actual response shape
};



export const uploadMachineAssignApi = async (
  vendorId: number,
  projectToken: string,
  file: File,
  userId: number
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("user_id", String(userId));

  const response = await apiClient.post(
    `/track-trace/upload-machine-excel/${vendorId}/${projectToken}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
