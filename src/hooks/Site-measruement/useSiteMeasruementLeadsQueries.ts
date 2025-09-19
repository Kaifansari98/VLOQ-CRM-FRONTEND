import { getInitialSiteMeasurement } from "@/api/measurment-leads";
import { useQuery } from "@tanstack/react-query";

export const useInitialSiteMeasurement = (
  vendorId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["siteMeasurementLeads", vendorId],
    queryFn: () => getInitialSiteMeasurement(vendorId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
