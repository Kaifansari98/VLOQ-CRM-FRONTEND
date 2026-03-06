// hooks/useVendorSalesExecutiveUsers.ts
import { useQuery } from "@tanstack/react-query";
import { getVendorSalesExecutiveUsers } from "@/api/leads";

export const useVendorSalesExecutiveUsers = (
  vendorId: number,
  franchiseId?: number,
) => {
  return useQuery({
    queryKey: ["vendorSalesExecs", vendorId, franchiseId],
    queryFn: () => getVendorSalesExecutiveUsers(vendorId, franchiseId),
    enabled: !!vendorId, // don’t fetch until vendorId exists
  });
};
