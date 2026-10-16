import { apiClient } from "@/lib/apiClient";

export interface ItemMachineSummary {
  machine_id: number;
  machine_name: string;
  machine_code: string;
  scan_type: string;
  sequence_no: number;
  is_optional: boolean;
  total_quantity: number;
  scanned_quantity: number;
  status: "scanned" | "pending";
  scanned_at: string | null;
  box_id?: number | null;
  box_name?: string | null;
  box_status?: string | null;
}

export interface ItemPackedBox {
  box_id: number;
  box_name: string;
  box_status: string | null;
  box_sequence_no: number | null;
  quantity: number;
  scanned_at?: string | null;
  is_scanned?: boolean;
  factory_out_at?: string | null;
  factory_out_by?: string | null;
  site_in_at?: string | null;
  site_in_by?: string | null;
  site_verify_at?: string | null;
  site_verify_by?: string | null;
  box_site_in_at?: string | null;
  box_site_in_by?: string | null;
  packed_by?: string | null;
  packed_at?: string | null;
}

export interface ProjectTrackedItem {
  id: number | string;
  item_name: string;
  description: string;
  unique_code: string | null;
  unique_code_2: string | null;
  qty: number;
  total_qty?: number;
  unit_index?: number;
  length: number | null;
  width: number | null;
  thickness: number | null;
  material_details: string | null;
  category_name: string | null;
  group_name: string | null;
  procurement: string | null;
  weight: number;
  item_status: string;
  scan_status: "scanned" | "pending";
  assigned_machines_count: number;
  scanned_machines_count: number;
  machines: ItemMachineSummary[];
  box_id?: number | null;
  box_name?: string | null;
  box_status?: string | null;
  box_sequence_no?: number | null;
  is_packed?: boolean;
  package_box_id?: number | null;
  package_box_name?: string | null;
  package_box_status?: string | null;
  boxes?: ItemPackedBox[];
  packed_quantity?: number;
  remaining_quantity?: number;
  factory_out_at?: string | null;
  factory_out_by?: string | null;
  factory_out_by_id?: number | null;
  site_in_at?: string | null;
  site_in_by?: string | null;
  site_in_by_id?: number | null;
  site_verify_at?: string | null;
  site_verify_by?: string | null;
  box_site_in_at?: string | null;
  box_site_in_by?: string | null;
  packed_by?: string | null;
  packed_at?: string | null;
  packed_by_id?: number | null;
}

export interface ProjectItemTrackingResponse {
  project: {
    id: number;
    project_name: string;
    track_trace_status: string;
  };
  data: ProjectTrackedItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  counts: {
    all: number;
    scanned: number;
    pending: number;
  };
  filters: {
    search?: string;
    scanStatus: "all" | "scanned" | "pending";
    machineId: number | null;
    stage?: string;
    category?: string | null;
    group?: string | null;
  };
  filterOptions: {
    categories?: string[];
    groups?: string[];
    machines: {
      id: number;
      machine_name: string;
      machine_code: string;
      scan_type: string;
      sequence_no: number;
    }[];
  };
}

export interface ProjectItemTrackingQuery {
  page?: number;
  limit?: number;
  search?: string;
  scanStatus?: "all" | "scanned" | "pending";
  machineId?: number | string;
  stage?: "dispatch";
  category?: string;
  group?: string;
}

export const getProjectItemTracking = async (
  vendorId: number,
  projectId: string | number,
  query: ProjectItemTrackingQuery = {},
): Promise<ProjectItemTrackingResponse> => {
  const params: Record<string, string | number> = {};
  if (query.page) params.page = query.page;
  if (query.limit) params.limit = query.limit;
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.scanStatus) params.scanStatus = query.scanStatus;
  if (query.machineId) params.machineId = query.machineId;
  if (query.stage) params.stage = query.stage;
  if (query.category?.trim()) params.category = query.category.trim();
  if (query.group?.trim()) params.group = query.group.trim();

  const { data } = await apiClient.get(
    `/track-trace/vendor/${vendorId}/project/${projectId}/items`,
    { params },
  );

  return data;
};
