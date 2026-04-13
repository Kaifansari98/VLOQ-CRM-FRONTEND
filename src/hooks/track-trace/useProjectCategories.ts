// useProjectCategories.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";

import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
  createProjectCategory,
  getProjectCategories,
  getProjectCategoryTypes,
  toggleProjectCategoryStatus,
  updateProjectCategory,
} from "@/api/track-trace/project-categories.api";

const KEYS = {
  categories: (vendorId: number) => ["project-categories", vendorId] as const,
  types: () => ["project-category-types"] as const,
};

export function useProjectCategories(vendorId?: number) {
  return useQuery({
    queryKey: KEYS.categories(vendorId ?? 0),
    queryFn: () => getProjectCategories(vendorId!),
    enabled: !!vendorId,
    staleTime: 30_000,
  });
}

export function useProjectCategoryTypes() {
  return useQuery({
    queryKey: KEYS.types(),
    queryFn: getProjectCategoryTypes,
    staleTime: Infinity, // types rarely change
  });
}

export function useCreateProjectCategory(vendorId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createProjectCategory(payload),
    onSuccess: () => {
      toastManager.add({ title: "Category created successfully", type: "success" });
      queryClient.invalidateQueries({ queryKey: KEYS.categories(vendorId) });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message ?? "Failed to create category",
        type: "error",
      });
    },
  });
}

export function useUpdateProjectCategory(vendorId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCategoryPayload) => updateProjectCategory(payload),
    onSuccess: () => {
      toastManager.add({ title: "Category updated successfully", type: "success" });
      queryClient.invalidateQueries({ queryKey: KEYS.categories(vendorId) });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message ?? "Failed to update category",
        type: "error",
      });
    },
  });
}

export function useToggleCategoryStatus(vendorId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "Yes" | "No" }) =>
      toggleProjectCategoryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.categories(vendorId) });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message ?? "Failed to update status",
        type: "error",
      });
    },
  });
}