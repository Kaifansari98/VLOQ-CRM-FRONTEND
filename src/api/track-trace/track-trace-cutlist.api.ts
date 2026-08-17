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
    // Product / quantity
    product_types: number;
    total_items: number; // backward-compatible alias of product_types
    total_panels: number;
    total_qty: number;
    total_packed_qty: number;
    total_pending_qty: number;
    packing_progress_pct: number;

    // Packing method
    scanned_packed_qty: number;
    manual_packed_qty: number;
    scanned_packing_pct: number;
    manual_packing_pct: number;
    pending_at_packaging: number;

    // Product packing status
    fully_packed_products: number;
    partially_packed_products: number;
    not_started_products: number;

    // Box / weight
    total_boxes: number;
    packed_boxes: number;
    unpacked_boxes: number;
    boxes_with_items: number;
    empty_boxes: number;
    total_weight: number;
    average_box_weight: number;
    average_qty_per_box: number;

    // Dispatch / site
    factory_out_boxes: number;
    site_received_boxes: number;
    dispatch_progress_pct: number;
    site_receipt_progress_pct: number;

    // Machine
    machine_completion_pct: number;
  };
  machines: {
    machine_id: number; machine_name: string; machine_type: string | null;
    sequence_no: number;
    total: number; scanned: number; pending: number; pct: number;
  }[];
  boxes: {
  id: number;
  box_name: string;
  box_status: string;
  items_count: number;
  total_weight: number;

  factory_out_at: string | null;
  factory_out_by: string | null;
  site_in_at: string | null;
  site_in_by: string | null;

  box_info_values: {
    id?: number;
    field_id: number;
    field_label: string;
    field_key: string;
    field_type: string;
    field_value: string;
    is_required?: boolean;
    sort_order?: number;
  }[];
}[];
}
 
export const getProjectDetail = async (vendorId: number, projectId: string) => {
  
  const { data } = await apiClient.get(
    `/track-trace/project-detail/${vendorId}/${projectId}`
  );
 
  return data.data as ProjectDetailData;
};
 
/*
|--------------------------------------------------------------------------
| Server-side Project Cut List
|--------------------------------------------------------------------------
*/

export type ProjectCutListMachineStatus =
  | "all"
  | "done"
  | "pending";

export type ProjectCutListPackingStatus =
  | "all"
  | "packed"
  | "pending";

export type ProjectCutListPackingMethod =
  | "all"
  | "manual"
  | "scanned";

export type ProjectCutListSortBy =
  | "row_number"
  | "item_name"
  | "unique_code"
  | "group"
  | "category"
  | "weight"
  | "box";

export type ProjectCutListSortOrder =
  | "asc"
  | "desc";

export interface ProjectCutListQuery {
  page?: number;
  limit?: number;

  search?: string;

  group?: string;
  category?: string;

  machine_id?: number | null;
  machine_status?: ProjectCutListMachineStatus;

  packing_status?: ProjectCutListPackingStatus;
  packing_method?: ProjectCutListPackingMethod;

  box_id?: number | null;

  min_weight?: number | null;
  max_weight?: number | null;

  sort_by?: ProjectCutListSortBy;
  sort_order?: ProjectCutListSortOrder;
}

export interface ProjectCutListMachine {
  mapping_id: number;
  machine_id: number;
  machine_name: string;
  sequence_no: number;
  box_id: number | null;
  weight: number;
  qty: number;
  row_created_source: string | null;
  scanned: boolean;
  scanned_at: string | null;
  scanned_by: string | null;
}

export interface ProjectCutListItem {
  id: number;
  row_number: number;

  cut_list_id: number;

  item_name: string;
  unique_code: string | null;
  unique_code_2: string | null;
  description: string;

  qty: number;
  total_qty: number;
  unit_index: number;

  category: string | null;
  group: string | null;

  material_details: string | null;
  procurement: string | null;

  length: string | number | null;
  width: string | number | null;
  thickness: string | number | null;

  weight: number;

  packing_method: "Manual" | "Scanned";

  package_box_id: number | null;
  package_box_name: string | null;

  /*
  |--------------------------------------------------------------------------
  | Site receipt / verification
  |--------------------------------------------------------------------------
  |
  | Because Cut List returns one physical/virtual unit per row,
  | received_qty is always 0 or 1 on the row.
  |--------------------------------------------------------------------------
  */
  received_qty: number;
  is_received: boolean;

  receipt_status:
    | "Not Packed"
    | "Not At Site"
    | "Pending Verification"
    | "Received";

  receipt_method:
    | "Manual Verification"
    | "QR Scan";

  received_at: string | null;
  received_by_id: number | null;
  received_by: string | null;

  box_site_in_at: string | null;

  /*
  |--------------------------------------------------------------------------
  | Original aggregated DB mapping quantity, useful for manual rows.
  |--------------------------------------------------------------------------
  */
  mapping_packed_qty: number;
  mapping_received_qty: number;

  machines: ProjectCutListMachine[];
}

export interface ProjectCutListResponse {
  project: {
    id: number;
    project_name: string;
    unique_project_id: string;
  };

  items: ProjectCutListItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    from: number;
    to: number;
    has_previous: boolean;
    has_next: boolean;
  };

  summary: {
    total_project_qty: number;
    filtered_qty: number;
    packed_qty: number;
    pending_qty: number;
    filtered_weight: number;

    received_qty: number;
    pending_receipt_qty: number;
    receipt_progress_pct: number;

    scanned_received_qty: number;
    manual_received_qty: number;

    site_in_qty: number;
    site_in_received_qty: number;
    pending_verification_qty: number;
    site_verification_pct: number;
  };

  filter_options: {
    groups: string[];
    categories: string[];

    machines: {
      id: number;
      name: string;
      sequence_no: number;
    }[];

    boxes: {
      id: number;
      name: string;
    }[];
  };
}

export const getProjectCutListPaginated = async (
  vendorId: number,
  projectId: string,
  query: ProjectCutListQuery = {}
): Promise<ProjectCutListResponse> => {
  const params: Record<string, string | number> = {};

  if (query.page !== undefined) {
    params.page = query.page;
  }

  if (query.limit !== undefined) {
    params.limit = query.limit;
  }

  if (query.search?.trim()) {
    params.search = query.search.trim();
  }

  if (
    query.group &&
    query.group !== "all"
  ) {
    params.group = query.group;
  }

  if (
    query.category &&
    query.category !== "all"
  ) {
    params.category = query.category;
  }

  if (
    query.machine_id !== undefined &&
    query.machine_id !== null
  ) {
    params.machine_id = query.machine_id;
  }

  if (
    query.machine_status &&
    query.machine_status !== "all"
  ) {
    params.machine_status =
      query.machine_status;
  }

  if (
    query.packing_status &&
    query.packing_status !== "all"
  ) {
    params.packing_status =
      query.packing_status;
  }

  if (
    query.packing_method &&
    query.packing_method !== "all"
  ) {
    params.packing_method =
      query.packing_method;
  }

  if (
    query.box_id !== undefined &&
    query.box_id !== null
  ) {
    params.box_id = query.box_id;
  }

  if (
    query.min_weight !== undefined &&
    query.min_weight !== null
  ) {
    params.min_weight =
      query.min_weight;
  }

  if (
    query.max_weight !== undefined &&
    query.max_weight !== null
  ) {
    params.max_weight =
      query.max_weight;
  }

  if (query.sort_by) {
    params.sort_by =
      query.sort_by;
  }

  if (query.sort_order) {
    params.sort_order =
      query.sort_order;
  }

  const { data } =
    await apiClient.get(
      `/track-trace/project-detail/${vendorId}/${projectId}/cut-list`,
      {
        params,
      }
    );

  return data.data as ProjectCutListResponse;
};

export const getBoxItems = async (vendorId: number, projectId: string, boxId: number) => {
  const { data } = await apiClient.get(
    `/track-trace/project-detail/${vendorId}/${projectId}/box/${boxId}`
  );
  return data.data as {
    box: { id: number; box_name: string; box_status: string; factory_out_at: string | null; site_in_at: string | null; total_weight?: number };
    items: {
      id: number;
      machine: { machine_name: string };
      actual_in_at: string | null;
      site_in_at: string | null;
      weight?: number;
      qty?: number;
      row_created_source?: string | null;
      inOperator: { id: number; name: string } | null;
      siteInByUser: { id: number; name: string } | null;
      cut_list: {
        id: number; item_name: string; unique_code: string;
        qty: number; category_name: string; group_name: string;
        length: string; width: string; thickness: string;
        weight?: number;
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
