import {
  applyConfigurationApi,
  createMachine,
  createTrackTraceProjectApi,
  fetchVendorLeads,
  getMachinesByVendor,
  postVendorLeads,
  updateMachine,
} from "@/api/trackAndTrace/track-trace-master";
import {
  ApplyConfigurationPayload,
  CreateMachinePayload,
  CreateTrackTraceProjectRequest,
  CreateTrackTraceProjectResponse,
  MachineData,
  VendorLeadsPostPayload,
  VendorLeadsResponse,
} from "@/types/track-trace";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useMachinesByVendor = (vendorId: number) => {
  return useQuery({
    queryFn: async (): Promise<MachineData[]> => {
      const response = await getMachinesByVendor(vendorId);
      return response.data;
    },
    queryKey: ["machines", vendorId],
    enabled: !!vendorId, // only run if vendorId exists
    staleTime: 1000 * 60 * 5, // 5 minutes caching
    retry: 1,
  });
};

export const useCreateMachine = () => {
  const queryClient = useQueryClient();

  return useMutation<MachineData, Error, CreateMachinePayload>({
    mutationFn: createMachine,
    onSuccess: () => {
      // invalidate machines list
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
  });
};

export const useUpdateMachine = (vendorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMachine,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["machines", vendorId],
      });
    },
  });
};

export const useConfigureVendorLeads = (token: string, projectId: string) => {
  return useQuery({
    queryKey: ["configure-leads", token, projectId],
    queryFn: () => fetchVendorLeads(token, projectId),
    enabled: !!token && !!projectId,
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: 1,
  });
};

export const useApplyConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplyConfigurationPayload) =>
      applyConfigurationApi(payload),

    onSuccess: () => {
      // refresh leads list automatically
      queryClient.invalidateQueries({
        queryKey: ["vendor-leads"],
      });
    },

    onError: (error: any) => {
      console.error("Apply configuration failed:", error);
    },
  });
};

// api/universalstage.ts or wherever your hook is

export const useVendorLeads = (
  token: string,
  projectId: string,
  payload: VendorLeadsPostPayload,
  options?: { enabled?: boolean }, // ✅ Add options parameter
) => {
  return useQuery<VendorLeadsResponse>({
    queryKey: ["vendor-leads", token, projectId, payload],
    queryFn: () => postVendorLeads(token, projectId, payload),
    enabled: options?.enabled ?? (!!token && !!projectId), // ✅ Use options
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};



export const useCreateTrackTraceProject = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateTrackTraceProjectResponse,
    Error,
    CreateTrackTraceProjectRequest
  >({
    mutationFn: createTrackTraceProjectApi,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["track-trace-projects"] });
    },

    onError: (error: Error) => {
      console.error("Create Project Failed:", error.message);
    },
  });
};
