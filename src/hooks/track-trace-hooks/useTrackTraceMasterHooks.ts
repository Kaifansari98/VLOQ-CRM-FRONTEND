import {
  createMachine,
  getMachinesByVendor,
  updateMachine,
} from "@/api/trackAndTrace/track-trace-master";
import { CreateMachinePayload, MachineData } from "@/types/track-trace";
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