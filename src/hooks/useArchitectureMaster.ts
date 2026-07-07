import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import {
  getArchitectureMasters,
  getArchitectureMasterById,
  createArchitectureMaster,
  updateArchitectureMaster,
  updateArchitectureMasterStatus,
  deleteArchitectureMaster,
  getArchitectureMastersDropdownList,
} from "../api/architectureMaster";
import { CreateArchitectureMasterDTO, UpdateArchitectureMasterDTO, UpdateArchitectureMasterStatusDTO, ArchitectureMasterDropdownResponse } from "../types/architectureMaster";

export const architectureMasterKeys = {
  all: ["architecture-masters"] as const,
  lists: () => [...architectureMasterKeys.all, "list"] as const,
  list: (params: any) => [...architectureMasterKeys.lists(), params] as const,
  details: () => [...architectureMasterKeys.all, "detail"] as const,
  detail: (id: number) => [...architectureMasterKeys.details(), id] as const,
  dropdownList: (vendorId: number) => [...architectureMasterKeys.all, "dropdownList", vendorId] as const,
};

export const useArchitectureMasters = (params?: { page?: number; limit?: number; search?: string }) => {
  return useQuery({
    queryKey: architectureMasterKeys.list(params),
    queryFn: () => getArchitectureMasters(params),
  });
};

export const useArchitectureMaster = (id: number) => {
  return useQuery({
    queryKey: architectureMasterKeys.detail(id),
    queryFn: () => getArchitectureMasterById(id),
    enabled: !!id,
  });
};

export const useCreateArchitectureMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArchitectureMasterDTO) => createArchitectureMaster(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: architectureMasterKeys.lists() });
      toastManager.add({ title: res.message || "Architect created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to create architect.", type: "error" });
    },
  });
};

export const useUpdateArchitectureMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateArchitectureMasterDTO }) => updateArchitectureMaster(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: architectureMasterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: architectureMasterKeys.details() });
      toastManager.add({ title: res.message || "Architect updated successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to update architect.", type: "error" });
    },
  });
};

export const useUpdateArchitectureMasterStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateArchitectureMasterStatusDTO }) => updateArchitectureMasterStatus(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: architectureMasterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: architectureMasterKeys.details() });
      toastManager.add({ title: res.message || "Architect status updated successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to update architect status.", type: "error" });
    },
  });
};

export const useDeleteArchitectureMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteArchitectureMaster(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: architectureMasterKeys.lists() });
      toastManager.add({ title: res.message || "Architect deleted successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error.response?.data?.message || "Failed to delete architect.", type: "error" });
    },
  });
};

export const useArchitectureMastersDropdownList = (vendorId: number) => {
  return useQuery({
    queryKey: architectureMasterKeys.dropdownList(vendorId),
    queryFn: () => getArchitectureMastersDropdownList(vendorId),
    enabled: !!vendorId,
  });
};
