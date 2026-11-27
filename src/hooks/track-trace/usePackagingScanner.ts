import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackagingBox,
  CreatePackagingBoxPayload,
  getPackagingBoxes,
  getPackagingProjectContext,
  getManualPackingItems,
  addManualPackingItem,
  AddManualPackingItemPayload,
  addManualQualityItem,
  AddManualQualityItemPayload,
} from "@/api/track-trace/packaging-scanner.api";

export const usePackagingProjectContext = (
  vendorId?: number,
  projectId?: number,
  enabled = true,
) =>
  useQuery({
    queryKey: ["packaging-project-context", vendorId, projectId],
    queryFn: () => getPackagingProjectContext(vendorId!, projectId!),
    enabled: Boolean(enabled && vendorId && projectId),
  });

export const usePackagingBoxes = (
  vendorId?: number,
  projectId?: number,
  enabled = true,
) =>
  useQuery({
    queryKey: ["packaging-boxes", vendorId, projectId],
    queryFn: () => getPackagingBoxes(vendorId!, projectId!),
    enabled: Boolean(enabled && vendorId && projectId),
  });

export const useCreatePackagingBox = (
  vendorId?: number,
  projectId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePackagingBoxPayload) =>
      createPackagingBox(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["packaging-boxes", vendorId, projectId],
      });
    },
  });
};

export const useManualPackingItems = (
  vendorId?: number,
  projectId?: number,
  enabled = true,
  machineId?: number,
) =>
  useQuery({
    queryKey: ["manual-packing-items", vendorId, projectId, machineId],
    queryFn: () => getManualPackingItems(vendorId!, projectId!, machineId),
    enabled: Boolean(enabled && vendorId && projectId),
  });

export const useAddManualPackingItem = (
  vendorId?: number,
  projectId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddManualPackingItemPayload) =>
      addManualPackingItem(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["manual-packing-items", vendorId, projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["packaging-boxes", vendorId, projectId],
        }),
      ]);
    },
  });
};

export const useAddManualQualityItem = (
  vendorId?: number,
  projectId?: number,
  machineId?: number,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddManualQualityItemPayload) =>
      addManualQualityItem(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["manual-packing-items", vendorId, projectId, machineId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["manual-packing-items", vendorId, projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["packaging-boxes", vendorId, projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["project-cutlist"],
        }),
      ]);
    },
  });
};


