import { apiClient } from "@/lib/apiClient";

export interface DefectImage {
  id:          number;
  doc_og_name: string;
  doc_sys_name:string;
  signed_url:  string;
}

export interface DefectItem {
  id:                  number;
  defect_status:       string;
  action:              string | null;
  remark:              string | null;
  created_at:          string;
  defect_completed_at: string | null;
  defect:    { id: number; defect_name: string } | null;
  project:   { id: number; project_name: string; unique_project_id: string };
  machine:   { id: number; machine_name: string };
  cutList:   { id: number; item_name: string; unique_code: string | null } | null;
  createdBy: { id: number; user_name: string };
  images:    DefectImage[];
  completionPhotos?: DefectImage[];
}

export interface PaginatedDefects {
  defects:     DefectItem[];
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
}

export interface DefectSummaryData {
  summary: {
    total: number; pending: number; completed: number;
    rework: number; replace: number;
    completion_rate: number;
    avg_resolution_hours: number | null;
  };
  by_defect_type: { defect_id: number | null; defect_name: string; count: number }[];
  by_machine:     { machine_id: number; machine_name: string; count: number }[];
  by_project:     { project_id: number; project_name: string; count: number }[];
}

export const getDefectSummary = async (vendorId: number) => {
  const { data } = await apiClient.get(`/track-trace/defect-dashboard/${vendorId}/summary`);
  return data.data as DefectSummaryData;
};

export const getPendingDefects = async (vendorId: number, page = 1) => {
  const { data } = await apiClient.get(
    `/track-trace/defect-dashboard/${vendorId}/pending?page=${page}`
  );
  return data.data as PaginatedDefects;
};

export const getResolvedDefects = async (vendorId: number, page = 1) => {
  const { data } = await apiClient.get(
    `/track-trace/defect-dashboard/${vendorId}/resolved?page=${page}`
  );
  return data.data as PaginatedDefects;
};