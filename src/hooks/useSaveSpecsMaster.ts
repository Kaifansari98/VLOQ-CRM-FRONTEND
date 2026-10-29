"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toastManager } from "@/components/ui/toast";

export type SpecsMasterKind =
  | "carcass-type" | "carcas-material" | "carcass-material-finish"
  | "shutter-type" | "shutter-material" | "shutter-material-finish"
  | "carcass-legs" | "skirting-carcass-legs" | "skirting-carcass-legs-color"
  | "light-carcas-type" | "light-carcas-unit" | "other-appliances";

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
      queryClient.invalidateQueries({ predicate: query =>
        /^(all)?(carcass|carcas|shutter|skirting|lightCarcas|otherAppliances)/i.test(String(query.queryKey[0])),
      });
      toastManager.add({ title: editingId ? "Entry updated successfully." : "Entry created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({ title: error?.response?.data?.message || error?.response?.data?.error || "Failed to save entry.", type: "error" });
    },
  });
}
