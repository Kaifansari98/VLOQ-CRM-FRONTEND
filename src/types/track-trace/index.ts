export interface Machine {
  id: string;
  name: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'IDLE';
  operator?: string;
  utilization: number;
}

export interface Item {
  id: string;
  itemNumber: string;
  project: string;
  description: string;
  machine: string;
  operator?: string;
  status: 'in_process' | 'queued' | 'completed' | 'on_hold';
  duration?: string;
  timestamp: Date;
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
}

export interface BottleneckData {
  machine: string;
  operator?: string;
  queueCount: number;
  avgWait: string;
  severity: 'high' | 'medium' | 'low';
  percentage: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
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
  status: 'in_process' | 'queued' | 'completed' | 'on_hold';
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface FilterOptions {
  project: string;
  machine: string;
  operator: string;
  dateRange: string;
  status: string;
}


export type MachineStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED";
export type MachineScanType = "IN" | "OUT" | "BOTH" | "PASS";

export interface MachineData {
  id: number;
  machine_name: string;
  machine_code: string;
  machine_type: string;
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
  vendor_id: number;
  machine_name: string;
  machine_code: string;
  machine_type: string;
  status: MachineStatus;
  scan_type: MachineScanType;
  description: string;
  factory_id?: number | null;
  sequence_no: number;
  target_per_hour: number;
  created_by: number;
  machine_image: File;
}



export interface UpdateMachinePayload {
  machine_name: string;
  machine_code: string;
  machine_type: string;
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
