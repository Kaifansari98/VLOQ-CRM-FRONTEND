export interface Machine {
  id: string;
  name: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "IDLE";
  operator?: string;
  utilization: number;
  machine_name: string;
  user_name: string;
}

export interface Item {
  id: string;
  itemNumber: string;
  project: Project;
  description: string;
  machine: Machine;
  operator: Operator;
  status: "in_process" | "queued" | "completed" | "on_hold";
  duration?: string;
  timestamp: Date;
  project_name: string;
  lead_code: string;
  lead: Lead;
  cut_list: CutList;
  actual_in_at_formatted: string;


}
export interface Operator {
  user_name: string;
}

export interface CutList {
  item_name: string;
  material_details: string;
  description: string;
}

export interface Operator {
  id: string;
  name: string;
  machine: string;
  itemsProcessed: number;
  avgTime: string;
  efficiency: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  total: number;
  completed: number;
  inProgress: number;
  progress: number;
  project_name: string;
  lead_code: string;
  sqft_processed: string;
  processed: string;
  sqft_pending: string;
  pending: string;
  progress_sqft: string


}

export interface BottleneckData {
  machine: string;
  operator?: string;
  queueCount: number;
  avgWait: string;
  severity: "high" | "medium" | "low";
  percentage: number;
}

export interface Alert {
  id: string;
  type: "error" | "warning" | "success" | "info";
  title: string;
  message: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  itemId: string;
  project: string;
  machine: string;
  operator?: string;
  action: string;
  duration?: string;
  status: "in_process" | "queued" | "completed" | "on_hold";
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: string;
}

// ✅ Updated FilterOptions type — supports custom date range
export type FilterOptions = {
  project: string;
  machine: string;
  operator: string;
  status: string;
  dateRange:
  | "today"
  | "yesterday"
  | "last7days"
  | "thisMonth"
  | "lastMonth"
  | "custom";
  startDate?: string; // format: "YYYY-MM-DD", only used when dateRange === "custom"
  endDate?: string;   // format: "YYYY-MM-DD", only used when dateRange === "custom"
};

export type MachineStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED";
export type MachineScanType = "IN" | "OUT" | "BOTH" | "PASS";

export interface MachineData {
  id: number;
  machine_name: string;
  machine_code: string;
  machine_type_id: number;
  machine_type: string,
  status: MachineStatus;
  scan_type: MachineScanType;
  description: string;
  vendor_id: number;
  factory_id?: number;
  sequence_no: number;
  target_per_hour: string;
  image_path: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  updated_by: number;

}

export interface GetMachinesByVendorResponse {
  success: boolean;
  data: MachineData[];
}

export interface CreateMachinePayload {
  vendor_id?: number;
  machine_name: string;
  machine_code: string;
  machine_type_id: number;
  status: MachineStatus;
  scan_type: MachineScanType;
  description: string;
  factory_id?: number | null;
  sequence_no: number;
  target_per_hour: number;
  created_by?: number;
  machine_image: File;
  updated_by?: number;
}

export interface UpdateMachinePayload {
  machine_name: string;
  machine_code: string;
  machine_type_id: number;
  status: MachineStatus;
  scan_type: MachineScanType;
  description: string;
  factory_id?: number | null;
  sequence_no: number;
  target_per_hour: number;
  machine_image: File;
  updated_by: number;
}

export interface UpdateMachineParams {
  id: number;
  vendor_id: number;
  data: UpdateMachinePayload;
}

// configure leads types
export interface ProductType {
  id: number;
  type: string;
  vendor_id: number;
  tag: string;
  status: string;
}

export interface ProductMapping {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  product_type_id: number;
  created_by: number;
  created_at: string;
  productType: ProductType;
}

export interface ProductStructure {
  id: number;
  type: string;
  vendor_id: number;
  parent: string | null;
  status: string;
}

export interface ProductStructureInstance {
  id: number;
  vendor_id: number;
  lead_id: number;
  account_id: number;
  product_type_id: number;
  product_structure_id: number;
  quantity_index: number;
  title: string;
  status: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  productStructure: ProductStructure;
  productType: ProductType;
}

export interface Account {
  id: number;
  name: string;
  country_code: string;
  contact_no: string;
  email: string | null;
}

export interface Lead {
  id: number;
  firstname: string;
  lastname: string;
  contact_no: string;
  email: string;
  site_address: string;
  site_map_link: string; // ✅ Changed from boolean to string
  lead_code: string;

  productMappings: ProductMapping[];
  productStructureInstances: ProductStructureInstance[];
  account: Account;
}

export interface ConfigureResponse {
  success: boolean;
  message: string;
  data: {
    vendorId: number;
    projectId: string;
    total: number;
    leads: Lead[];
  };
}

export interface ApplyConfigurationPayload {
  projectId: string;
  leadId: number;
}

export interface ApplyConfigurationResponse {
  success: boolean;
  message: string;
  data: {
    projectId: string;
    leadId: number;
    clientId: number;
  };
}

export interface VendorLeadsPostPayload {
  page: number;
  limit: number;

  // 🔎 Global Search (leadcode, name, contact)
  global_search?: string;

  // 🎯 Filters
  product_structure?: number[];
  product_mapping?: number[];

  site_type?: number[];
  assign_to?: number[];
  source?: number[];

  site_map_link?: boolean | null; // ✅ This is correct (filter parameter)
  site_address?: string;

  // 📅 Date Range
  date_range?: {
    from?: string;
    to?: string;
  };
}

export interface VendorLead {
  id: number;
  lead_code: string;
  firstname: string;
  lastname: string;
  email: string;
  site_map_link: string | null; // ✅ Changed from boolean | null to string | null
  contact_no: string;
  site_address: string | null;
  created_at: string;

  productMappings: any[];
  productStructureInstances: any[];

  statusType: any;
  source: any;
  siteType: any;
  account: any;
}

export interface VendorLeadsResponse {
  success: boolean;
  message: string;
  count: number;
  data: VendorLead[];

  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type CreateTrackTraceProjectRequest = {
  vendorId: number;
  projectName: string;
  file?: File;
  lead_id?: number | null;

  order_no?: string;
  client_name?: string;
  client_address?: string;
  client_contact_no?: string;
  packing_type?: PackingType;
  box_info_fields?: ProjectBoxInfoField[];
  no_of_boxes?: number;
remove_box_ids?: number[];

};

export interface CreateTrackTraceProjectResponse {
  success: boolean;
  project_id: number;
  excel_url: string;
  storage_key: string;
  message?: string;
}

export interface TrackTraceLeadOption {
  id: number;
  firstname: string | null;
  email: string | null;
  contact_no: string | null;
  lead_code: string | null;
  created_at: string;
}

export interface TrackTraceVendorConfig {
  vendor_id: number;
  is_crm_enabled: boolean;
}

export enum PackingType {
  DEFAULT =
  "DEFAULT",

  GROUPWISE =
  "GROUPWISE",
}

export type BoxInfoFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "TEXTAREA";

export type ProjectBoxInfoField = {
  id?: number;
  field_label: string;
  field_type: BoxInfoFieldType;
  is_required: boolean;
  sort_order?: number;
  active?: boolean;
};