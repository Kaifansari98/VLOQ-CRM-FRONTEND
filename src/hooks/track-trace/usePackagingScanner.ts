import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPackagingBox,
  CreatePackagingBoxPayload,
  getPackagingBoxes,
  getPackagingProjectContext,
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
