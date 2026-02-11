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
