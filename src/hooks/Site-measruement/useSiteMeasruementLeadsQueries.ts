import { getInitialSiteMeasurement } from "@/api/measurment-leads";
import { useQuery } from "@tanstack/react-query";

export const useInitialSiteMeasurement = (
  vendorId: number,
  statusId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["siteMeasurementLeads", vendorId, statusId],
    queryFn: () => getInitialSiteMeasurement(vendorId, statusId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
