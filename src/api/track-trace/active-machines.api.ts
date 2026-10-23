import { apiClient } from "@/lib/apiClient";
import type { MachineFabrication } from "@/types/track-trace";

export interface ActiveMachine {
  id: number;
  machine_name: string;
  machine_code: string;
  machine_type_id: number | null;
  image_path: string | null;
  sequence_no: number | null;
  fabrication?: MachineFabrication;
}

interface ActiveMachinesResponse {
  success: boolean;
  message: string;
  data: ActiveMachine[];
}

export const getActiveMachinesByVendor = async (
  vendorId: number,
): Promise<ActiveMachine[]> => {
  const { data } = await apiClient.get<ActiveMachinesResponse>(
    `/track-trace-project/onboard/${vendorId}/machines`,
  );

  return data.data ?? [];
};

export interface PreviewMachineInfo {
  id: number;
  machine_code: string;
  machine_name: string;
  machine_type_id: number | null;
  sequence_no: number | null;
}

export interface PreviewRowMapping {
  rowIndex: number;
  assignedMachineIds: number[];
  assignedMachineCodes: string[];
  machineAssignments: Record<string, boolean>;
}

export interface PreviewMachineMappingResponse {
  success: boolean;
  message: string;
  data: {
    machines: PreviewMachineInfo[];
    rowMappings: PreviewRowMapping[];
  };
}

export const previewCutlistMachineMapping = async (
  vendorId: number,
  items: Array<Record<string, any>>,
  packingType?: string,
  fabrication?: "WOODWORK" | "METALWORK",
): Promise<{ machines: PreviewMachineInfo[]; rowMappings: PreviewRowMapping[] }> => {
  const { data } = await apiClient.post<PreviewMachineMappingResponse>(
    `/track-trace-project/onboard/${vendorId}/preview-machine-mapping`,
    {
      items,
      packing_type: packingType,
      fabrication,
    },
  );

  return data.data ?? { machines: [], rowMappings: [] };
};

