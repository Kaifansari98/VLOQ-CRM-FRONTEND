import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type CutlistHeaderMapping = { source_header: string; rule_field_id: number | null };
export type CutlistHeaderField = { id: number; field_key: string; label: string; required: boolean; aliases: readonly string[] };
export type CutlistHeaderConfiguration = { fields: CutlistHeaderField[]; mappings: CutlistHeaderMapping[] };
export const normalizeCutlistHeader = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

export const getCutlistHeaderMappings = async (vendorId: number): Promise<CutlistHeaderConfiguration> => {
  const { data } = await apiClient.get(`/vendors/${vendorId}/cutlist-header-mappings`);
  return data.data;
};

export const useCutlistHeaderMappings = (vendorId?: number) => useQuery({
  queryKey: ["cutlistHeaderMappings", vendorId],
  queryFn: () => getCutlistHeaderMappings(vendorId!),
  enabled: !!vendorId,
});

export const useSaveCutlistHeaderMappings = (vendorId: number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (mappings: CutlistHeaderMapping[]): Promise<CutlistHeaderConfiguration> => {
      const { data } = await apiClient.put(`/vendors/${vendorId}/cutlist-header-mappings`, { mappings });
      return data.data;
    },
    onSuccess: (data) => client.setQueryData(["cutlistHeaderMappings", vendorId], data),
  });
};
