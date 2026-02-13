export interface Vendor {
  id: number;
  vendor_name: string;
  vendor_code: string;
  primary_contact_number: string;
  primary_contact_email: string;
  primary_contact_name: string;
  country_code: string;
  status: string;
  logo: string;
  time_zone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedByUser {
  id: number;
  vendor_id: number;
  user_name: string;
  user_contact: string;
  user_email: string;
  user_timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TrackTraceProject {
  id: number;
  project_name: string;
  vendor_id: number;
  client_id: number;
  created_by: number;
  project_status: string;
  created_at: string;
  unique_project_id: string;
  is_grouping: boolean;
  vendor: Vendor;
  createdByUser: CreatedByUser;
  track_trace_status : string;
  details: any[];
  items: any[];
}
