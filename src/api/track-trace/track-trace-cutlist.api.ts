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



export interface ProjectDetailData {
  project: {
    id: number;
    project_name: string;
    project_status: string;
    track_trace_status: string;
    lead_id: number | null;
    lead: { id: number; lead_name: string; lead_email: string; lead_phone: string; lead_address: string } | null;
    details: {
      total_items: number; total_packed: number; total_unpacked: number;
      estimated_completion_date: string | null; start_date: string | null; room_name: string | null;
    } | null;
  };
  stats: {
    total_panels: number; total_items: number;
    total_boxes: number; packed_boxes: number; unpacked_boxes: number;
  };
  machines: {
    machine_id: number; machine_name: string; machine_type: string | null;
    total: number; scanned: number; pending: number; pct: number;
  }[];
  boxes: {
    id: number; box_name: string; box_status: string; items_count: number;
    factory_out_at: string | null; factory_out_by: string | null;
    site_in_at: string | null; site_in_by: string | null;
  }[];
  cutlist: {
    id: number; item_name: string; unique_code: string; description: string;
    qty: number; category: string; group: string;
    length: string; width: string; thickness: string;
    machines: {
      mapping_id: number; machine_id: number; machine_name: string;
      sequence_no: number; box_id: number | null;
      scanned: boolean; scanned_at: string | null; scanned_by: string | null;
    }[];
  }[];
}
 
export const getProjectDetail = async (vendorId: number, projectId: string) => {
  
  const { data } = await apiClient.get(
    `/track-trace/project-detail/${vendorId}/${projectId}`
  );
 
  return data.data as ProjectDetailData;
};
 
export const getBoxItems = async (vendorId: number, projectId: string, boxId: number) => {
  const { data } = await apiClient.get(
    `/track-trace/project-detail/${vendorId}/${projectId}/box/${boxId}`
  );
  return data.data as {
    box: { id: number; box_name: string; box_status: string; factory_out_at: string | null; site_in_at: string | null };
    items: {
      id: number;
      machine: { machine_name: string };
      actual_in_at: string | null;
      site_in_at: string | null;
      inOperator: { id: number; name: string } | null;
      siteInByUser: { id: number; name: string } | null;
      cut_list: {
        id: number; item_name: string; unique_code: string;
        qty: number; category_name: string; group_name: string;
        length: string; width: string; thickness: string;
      };
    }[];
  };
};
 
export const downloadBoxPdf = async (
  boxId: number,
  projectId: string | number,
  vendorId: number
) => {
  const { data } = await apiClient.get(
    `/boxes/boxes/pdf/${boxId}/${projectId}/${vendorId}/web`
  );

  return data;
};

export const downloadProjectFullReport = async (
  projectId: string | number,
  vendorId: number
) => {
  const { data } = await apiClient.get(
    `/boxes/project-full-report/${projectId}/${vendorId}/web`
  );

  return data;
};