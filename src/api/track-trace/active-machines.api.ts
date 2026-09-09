import { apiClient } from "@/lib/apiClient";

export interface ActiveMachine {
  id: number;
  machine_name: string;
  machine_code: string;
  machine_type_id: number | null;
  image_path: string | null;
  sequence_no: number | null;
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
