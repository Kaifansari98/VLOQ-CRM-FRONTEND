import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface LeadStatsResponse {
  success: boolean;
  data: {
    total_leads: number;
    total_open_leads: number;
    total_initial_site_measurement_leads: number;
    total_designing_stage_leads: number;
    total_booking_stage_leads: number;
    total_final_measurement_leads: number;
    total_client_documentation_leads: number;
    total_my_tasks: number;
  };
}

const fetchLeadStats = async (
  vendorId: number,
  userId?: number
): Promise<LeadStatsResponse> => {
  const url = userId
    ? `/leads/stats/count/vendor/${vendorId}?userId=${userId}`
    : `/leads/stats/count/vendor/${vendorId}`;

  const response = await apiClient.get<LeadStatsResponse>(url);
  return response.data;
};

export const useLeadStats = (vendorId?: number, userId?: number) => {
  return useQuery({
    queryKey: ["leadStats", vendorId, userId],
    queryFn: () => fetchLeadStats(vendorId!, userId),
    enabled: !!vendorId, // Only run query if vendorId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });
};
