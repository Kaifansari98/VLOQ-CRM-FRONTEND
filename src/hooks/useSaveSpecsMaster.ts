"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";

export type SpecsMasterKind =
  | "carcass-type" | "carcas-material" | "carcass-material-finish"
  | "shutter-type" | "shutter-material" | "shutter-outer-finish" | "shutter-inner-finish"
  | "hardware-type" | "hardware-item" | "hardware-item-option"
  | "light-carcas-type" | "light-carcas-unit" | "other-appliances";

/** Specs master query keys (parent names and statuses show up in child lists too). */
const isSpecsMasterQuery = (queryKey: readonly unknown[]) =>
  /^(all)?(carcass|carcas|shutter|hardware|lightCarcas|otherAppliances)/i.test(String(queryKey[0]));

export function useSaveSpecsMaster(kind: SpecsMasterKind, editingId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const result = editingId
        ? await apiClient.put(`/leads/specs-masters/${kind}/${editingId}`, payload)
        : await apiClient.post(`/leads/create-${kind}`, payload);
      return result.data;
    },
    onSuccess: () => {
      // Parent names are displayed by their child lists as well.
      queryClient.invalidateQueries({ predicate: query => isSpecsMasterQuery(query.queryKey) });
      toastManager.add({ title: editingId ? "Entry updated successfully." : "Entry created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message || error?.response?.data?.error || "Failed to save entry.", type: "error" });
    },
  });
}

/** Marks specs master entries active / inactive. */
export function useUpdateSpecsMasterStatus(kind: SpecsMasterKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: "active" | "inactive" }) => {
      const result = await apiClient.patch(`/leads/specs-masters/${kind}/status`, { ids, status });
      return result.data;
    },
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ predicate: query => isSpecsMasterQuery(query.queryKey) });
      toastManager.add({ title: status === "active" ? "Marked as active." : "Marked as inactive.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message || "Failed to update status.", type: "error" });
    },
  });
}

export function useDeleteSpecsMaster(kind: SpecsMasterKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await apiClient.delete(`/leads/specs-masters/${kind}/${id}`);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: query => isSpecsMasterQuery(query.queryKey) });
      toastManager.add({ title: "Entry deleted successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message || error?.response?.data?.error || "Failed to delete entry.", type: "error" });
    },
  });
}

