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
  checkExternalToken,
  syncCategoriesFromExternal,
} from "@/api/track-trace/project-categories.api";
// import {
//   checkExternalToken,
//   syncCategoriesFromExternal,
// } from "@/api/track-trace/syncCategories.api";

const KEYS = {
  categories: (vendorId: number) => ["project-categories", vendorId] as const,
  types: () => ["project-category-types"] as const,
  externalToken: (vendorId: number) => ["external-token", vendorId] as const,
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
    staleTime: Infinity,
  });
}

export function useCheckExternalToken(vendorId?: number) {
  return useQuery({
    queryKey: KEYS.externalToken(vendorId ?? 0),
    queryFn: () => checkExternalToken(vendorId!),
    enabled: !!vendorId,
    staleTime: 60_000,
    select: (data) => data.has_token,
  });
}

export function useSyncCategories(vendorId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncCategoriesFromExternal(vendorId),
    onSuccess: (data) => {
      toastManager.add({
        title: `Sync complete — ${data.created} created, ${data.updated} updated, ${data.skipped} unchanged`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: KEYS.categories(vendorId) });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.message ?? "Sync failed. Please try again.",
        type: "error",
      });
    },
  });
}

export function useCreateProjectCategory(vendorId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      createProjectCategory(payload),
    onSuccess: (data, variables) => {
      const hasStructure = !!variables?.naming_structure;
      const onlyStructure = !!variables?.only_naming_structure_updated;
      toastManager.add({
        title: onlyStructure
          ? "Product Name Structure saved successfully"
          : hasStructure 
            ? "Category and Product Name Structure created successfully"
            : "Category created successfully",
        type: "success",
      });
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
    mutationFn: (payload: UpdateCategoryPayload) =>
      updateProjectCategory(payload),
    onSuccess: (data, variables) => {
      const hasStructure = !!variables?.naming_structure;
      const onlyStructure = !!variables?.only_naming_structure_updated;
      toastManager.add({
        title: onlyStructure
          ? "Product Name Structure updated successfully"
          : hasStructure
            ? "Category and Product Name Structure updated successfully"
            : "Category updated successfully",
        type: "success",
      });
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
