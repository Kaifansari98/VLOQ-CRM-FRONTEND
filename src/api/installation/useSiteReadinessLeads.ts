import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * ✅ Fetch Site Readiness Leads (paginated)
 * @route GET /leads/installation/site-readiness/vendorId/:vendorId/userId/:userId
 */
export const getSiteReadinessLeads = async (
  vendorId: number,
  userId: number,
  page: number = 1,
  limit: number = 10
) => {
  const { data } = await apiClient.get(
    `/leads/installation/site-readiness/vendorId/${vendorId}/userId/${userId}`,
    {
      params: { page, limit },
    }
  );
  return data?.data;
};

/**
 * ✅ React Query Hook for Site Readiness Leads
 */
export const useSiteReadinessLeads = (
  vendorId?: number,
  userId?: number,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["siteReadinessLeads", vendorId, userId, page, limit],
    queryFn: () => getSiteReadinessLeads(vendorId!, userId!, page, limit),
    enabled: !!vendorId && !!userId,
  });
};
