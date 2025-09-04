import { getInitialSiteMeasurement2 } from "@/api/measurment-leads";
import { SiteMeasurmentResponse } from "@/types/site-measrument-types";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

export const useInitialSiteMeasurement = (
  vendorId: number,
  statusId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["siteMeasurementLeads"],
    queryFn: () => getInitialSiteMeasurement2(vendorId, statusId),
    enabled: enabled && !!vendorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};