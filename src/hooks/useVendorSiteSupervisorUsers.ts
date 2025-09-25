import { useQuery } from "@tanstack/react-query";
import { getVendorSiteSuppervisorUsers } from "@/api/leads";

export const useVendorSiteSupervisorUsers = (vendorId: number) => {
  return useQuery({
    queryKey: ["vendorSiteSupervisors", vendorId],
    queryFn: () => getVendorSiteSuppervisorUsers(vendorId),
    enabled: !!vendorId, // don’t fetch until vendorId exists
  });
};