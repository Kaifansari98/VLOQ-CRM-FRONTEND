import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type MachineCostDescription = {
  id: number;
  code: string;
  description: string;
  sequence_no: number;
  amount: string | null;
  formula: string | null;
  text_value: string | null;
  value_format: "percent" | null;
};

export type MachineCostSheet = "MACHINE_COST" | "MACHINE_ELECTRICALS" | "MACHINE_MAINTENANCE" | "MACHINE_CAPACITY" | "MACHINE_TOOL_GLUE" | "MACHINE_LABOUR" | "GENERAL_DATA" | "PROCESS_COST" | `CUSTOM_${string}`;

export const machineCostDescriptionsKey = (vendorId: number | undefined, machineId: string, sheet: MachineCostSheet) =>
  ["machine-cost-descriptions", vendorId, machineId, sheet] as const;

export function useMachineCostDescriptions(vendorId: number | undefined, machineId: string, enabled: boolean, sheet: MachineCostSheet = "MACHINE_COST") {
  return useQuery({
    queryKey: machineCostDescriptionsKey(vendorId, machineId, sheet),
    enabled: !!vendorId && enabled,
    queryFn: async () => {
      const response = await apiClient.get<{ data: MachineCostDescription[] }>(
        `/track-trace-master/machines/${encodeURIComponent(machineId)}/cost-descriptions`,
        { params: { sheet } },
      );
      return response.data.data;
    },
  });
}
