// hooks/useVendorSalesExecutiveUsers.ts
import { useQuery } from "@tanstack/react-query";
import { getVendorSalesExecutiveUsers } from "@/api/leads";

export const useVendorSalesExecutiveUsers = (vendorId: number) => {
  return useQuery({
    queryKey: ["vendorSalesExecs", vendorId],
    queryFn: () => getVendorSalesExecutiveUsers(vendorId),
    enabled: !!vendorId, // don’t fetch until vendorId exists
  });
};