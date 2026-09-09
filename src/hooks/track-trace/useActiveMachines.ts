import { useQuery } from "@tanstack/react-query";
import { getActiveMachinesByVendor } from "@/api/track-trace/active-machines.api";

export const useActiveMachines = (vendorId?: number) => {
  return useQuery({
    queryKey: ["active-machines", vendorId],
    queryFn: () => getActiveMachinesByVendor(vendorId!),
    enabled: Number.isInteger(vendorId) && Number(vendorId) > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
