"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";

export type BoqMasterKind = "product-type" | "product-structure" | "product-sub-structure" | "product-item-code";

const isBoqRelatedQuery = (queryKey: readonly unknown[]) =>
  /^(product(Types|StructureTypes|SubStructures|ItemCodes)|lead-product-structure-instances)$/.test(String(queryKey[0]));

export function useSaveBoqMaster(kind: BoqMasterKind, editingId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const result = editingId
        ? await apiClient.put(`/leads/boq-masters/${kind}/${editingId}`, payload)
        : await apiClient.post(`/leads/create-${kind}`, payload);
      return result.data;
    },
    onSuccess: () => {
      // Parent names are displayed by their child lists as well.
      queryClient.invalidateQueries({ predicate: query => isBoqRelatedQuery(query.queryKey) });
      toastManager.add({ title: editingId ? "Entry updated successfully." : "Entry created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message || error?.response?.data?.error || "Failed to save entry.", type: "error" });
    },
  });
}

export function useDeleteBoqMaster(kind: BoqMasterKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await apiClient.delete(`/leads/boq-masters/${kind}/${id}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: query => isBoqRelatedQuery(query.queryKey) });
      toastManager.add({ title: "Entry deleted successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message || error?.response?.data?.error || "Failed to delete entry.", type: "error" });
    },
  });
}
