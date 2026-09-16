import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBrandMaster,
  CreateBrandPayload,
  deleteBrandMaster,
  getBrandMasters,
  toggleBrandMasterStatus,
  updateBrandMaster,
  UpdateBrandPayload,
} from "@/api/track-trace/brand.api";
import { toastManager } from "@/components/ui/toast";

export const useBrandMasters = (vendorId?: number) => {
  return useQuery({
    queryKey: ["brand-masters", vendorId],
    queryFn: () => getBrandMasters(vendorId!),
    enabled: !!vendorId,
  });
};

export const useCreateBrandMaster = (vendorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandPayload) => createBrandMaster(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-masters", vendorId] });
      toastManager.add({ title: "Brand created successfully", type: "success" });
    },
    onError: (err: any) => {
      toastManager.add({
        title: err?.response?.data?.message || err?.message || "Failed to create brand",
        type: "error",
      });
    },
  });
};

export const useUpdateBrandMaster = (vendorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBrandPayload) => updateBrandMaster(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-masters", vendorId] });
      toastManager.add({ title: "Brand updated successfully", type: "success" });
    },
    onError: (err: any) => {
      toastManager.add({
        title: err?.response?.data?.message || err?.message || "Failed to update brand",
        type: "error",
      });
    },
  });
};

export const useToggleBrandStatus = (vendorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleBrandMasterStatus(id, is_active),
    onSuccess: (_: any, variables: { id: number; is_active: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["brand-masters", vendorId] });
      toastManager.add({
        title: `Brand ${variables.is_active ? "activated" : "deactivated"} successfully`,
        type: "success",
      });
    },
    onError: (err: any) => {
      toastManager.add({
        title: err?.response?.data?.message || err?.message || "Failed to toggle brand status",
        type: "error",
      });
    },
  });
};

export const useDeleteBrandMaster = (vendorId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBrandMaster(id, vendorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-masters", vendorId] });
      toastManager.add({ title: "Brand deleted successfully", type: "success" });
    },
    onError: (err: any) => {
      toastManager.add({
        title: err?.response?.data?.message || err?.message || "Failed to delete brand",
        type: "error",
      });
    },
  });
};
