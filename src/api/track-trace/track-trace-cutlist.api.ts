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




