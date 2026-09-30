import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGrades, createGrade, updateGrade, toggleGradeStatus, deleteGrade,
  getFinishes, createFinish, updateFinish, toggleFinishStatus, deleteFinish,
  getTypes, createType, updateType, toggleTypeStatus, deleteType,
  getCoreProducts, createCoreProduct, updateCoreProduct, toggleCoreProductStatus, deleteCoreProduct,
} from "@/api/track-trace/masters.api";
import { toast } from "sonner";

// ─── Grade ────────────────────────────────────────────────────────────────────
export const useGrades = (vendorId?: number) =>
  useQuery({
    queryKey: ["grades", vendorId],
    queryFn: () => getGrades(vendorId!),
    enabled: !!vendorId,
  });

export const useCreateGrade = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGrade,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades", vendorId] }); toast.success("Grade created"); },
    onError: () => toast.error("Failed to create grade"),
  });
};

export const useUpdateGrade = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; grade_name: string; updated_by?: number }) => updateGrade(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades", vendorId] }); toast.success("Grade updated"); },
    onError: () => toast.error("Failed to update grade"),
  });
};

export const useToggleGradeStatus = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => toggleGradeStatus(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades", vendorId] }); },
  });
};

export const useDeleteGrade = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGrade(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades", vendorId] }); toast.success("Grade deleted"); },
    onError: () => toast.error("Failed to delete grade"),
  });
};

// ─── Finish ───────────────────────────────────────────────────────────────────
export const useFinishes = (vendorId?: number) =>
  useQuery({
    queryKey: ["finishes", vendorId],
    queryFn: () => getFinishes(vendorId!),
    enabled: !!vendorId,
  });

export const useCreateFinish = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFinish,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finishes", vendorId] }); toast.success("Finish created"); },
    onError: () => toast.error("Failed to create finish"),
  });
};

export const useUpdateFinish = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; finish_name: string; updated_by?: number }) => updateFinish(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finishes", vendorId] }); toast.success("Finish updated"); },
    onError: () => toast.error("Failed to update finish"),
  });
};

export const useToggleFinishStatus = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => toggleFinishStatus(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finishes", vendorId] }); },
  });
};

export const useDeleteFinish = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFinish(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finishes", vendorId] }); toast.success("Finish deleted"); },
    onError: () => toast.error("Failed to delete finish"),
  });
};

// ─── Type ─────────────────────────────────────────────────────────────────────
export const useTypes = (vendorId?: number) =>
  useQuery({
    queryKey: ["types", vendorId],
    queryFn: () => getTypes(vendorId!),
    enabled: !!vendorId,
  });

export const useCreateType = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createType,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["types", vendorId] }); toast.success("Type created"); },
    onError: () => toast.error("Failed to create type"),
  });
};

export const useUpdateType = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; type_name: string; updated_by?: number }) => updateType(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["types", vendorId] }); toast.success("Type updated"); },
    onError: () => toast.error("Failed to update type"),
  });
};

export const useToggleTypeStatus = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => toggleTypeStatus(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["types", vendorId] }); },
  });
};

export const useDeleteType = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteType(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["types", vendorId] }); toast.success("Type deleted"); },
    onError: () => toast.error("Failed to delete type"),
  });
};

// ─── Core Product ─────────────────────────────────────────────────────────────
export const useCoreProducts = (vendorId?: number) =>
  useQuery({
    queryKey: ["core-products", vendorId],
    queryFn: () => getCoreProducts(vendorId!),
    enabled: !!vendorId,
  });

export const useCreateCoreProduct = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCoreProduct,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["core-products", vendorId] }); toast.success("Core Product created"); },
    onError: () => toast.error("Failed to create core product"),
  });
};

export const useUpdateCoreProduct = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; core_product_name: string; updated_by?: number }) => updateCoreProduct(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["core-products", vendorId] }); toast.success("Core Product updated"); },
    onError: () => toast.error("Failed to update core product"),
  });
};

export const useToggleCoreProductStatus = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => toggleCoreProductStatus(id, is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["core-products", vendorId] }); },
  });
};

export const useDeleteCoreProduct = (vendorId?: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCoreProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["core-products", vendorId] }); toast.success("Core Product deleted"); },
    onError: () => toast.error("Failed to delete core product"),
  });
};

