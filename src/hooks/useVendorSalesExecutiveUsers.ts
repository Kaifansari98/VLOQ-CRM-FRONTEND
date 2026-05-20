// hooks/useVendorSalesExecutiveUsers.ts
import { useQuery } from "@tanstack/react-query";
import { getVendorSalesExecutiveUsers } from "@/api/leads";

export const useVendorSalesExecutiveUsers = (
  vendorId: number,
  franchiseId?: number,
  options?: {
    assigneeUserType?: string;
    requiredPrivilegeCode?: string;
    taskType?: string;
  },
) => {
  return useQuery({
    queryKey: ["vendorSalesExecs", vendorId, franchiseId, options],
    queryFn: () => getVendorSalesExecutiveUsers(vendorId, franchiseId, options),
    enabled: !!vendorId, // don’t fetch until vendorId exists
  });
};
