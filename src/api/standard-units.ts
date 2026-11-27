import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/apiClient";

// Standard units for inventory: unit classes (Length, Area…), their units
// (one base unit per class) and unit relations within a class (1 Mtr = 100 CM).

export interface UnitClass {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface StandardUnit {
  id: number;
  unit_class_id: number;
  name: string;
  is_base: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface UnitRelation {
  id: number;
  unit_class_id: number;
  from_unit_id: number;
  from_qty: number;
  to_unit_id: number;
  to_qty: number;
  is_active: boolean;
}

export interface StandardUnitsData {
  classes: UnitClass[];
  units: StandardUnit[];
  relations: UnitRelation[];
}

const path = (vendorId: number) => `/standard-units/vendor/${vendorId}`;
const key = (vendorId?: number) => ["standard-units", vendorId] as const;

export function unitError(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return "Something went wrong. Please try again.";
}

export function useStandardUnits(vendorId?: number) {
  return useQuery({
    queryKey: key(vendorId),
    enabled: !!vendorId,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: StandardUnitsData }>(path(vendorId!));
      return data.data;
    },
  });
}

type Request =
  | { kind: "createClass"; name: string }
  | { kind: "updateClass"; id: number; name: string }
  | { kind: "deleteClass"; id: number }
  | { kind: "createUnit"; name: string; unit_class_id: number; is_base?: boolean }
  | { kind: "updateUnit"; id: number; name?: string; unit_class_id?: number; is_base?: boolean }
  | { kind: "deleteUnit"; id: number }
  | { kind: "createRelation"; from_unit_id: number; from_qty: number; to_unit_id: number; to_qty: number }
  | { kind: "updateRelation"; id: number; from_unit_id: number; from_qty: number; to_unit_id: number; to_qty: number }
  | { kind: "deleteRelation"; id: number };

/** One mutation for every change on the page; refreshes the data afterwards. */
export function useStandardUnitChange(vendorId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: Request) => {
      const base = path(vendorId!);
      const { kind, ...body } = request;
      const id = "id" in request ? request.id : 0;
      switch (kind) {
        case "createClass":
          return apiClient.post(`${base}/classes`, body);
        case "updateClass":
          return apiClient.put(`${base}/classes/${id}`, body);
        case "deleteClass":
          return apiClient.delete(`${base}/classes/${id}`);
        case "createUnit":
          return apiClient.post(`${base}/units`, body);
        case "updateUnit":
          return apiClient.put(`${base}/units/${id}`, body);
        case "deleteUnit":
          return apiClient.delete(`${base}/units/${id}`);
        case "createRelation":
          return apiClient.post(`${base}/relations`, body);
        case "updateRelation":
          return apiClient.put(`${base}/relations/${id}`, body);
        case "deleteRelation":
          return apiClient.delete(`${base}/relations/${id}`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(vendorId) }),
  });
}

/* ----------------------------- Category units ----------------------------- */

// Purchase, stock and consumption units of a category or sub-category.

export type UnitRole = "purchase_unit_id" | "stock_unit_id" | "consumption_unit_id";

export type CategoryUnits = Record<UnitRole, number | null>;

export interface CategoryUnitSetting extends CategoryUnits {
  category_id: number;
}

export const EMPTY_CATEGORY_UNITS: CategoryUnits = {
  purchase_unit_id: null,
  stock_unit_id: null,
  consumption_unit_id: null,
};

const categoryUnitsKey = (vendorId?: number) => ["category-units", vendorId] as const;

export function useCategoryUnits(vendorId?: number) {
  return useQuery({
    queryKey: categoryUnitsKey(vendorId),
    enabled: !!vendorId,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: CategoryUnitSetting[] }>(
        `${path(vendorId!)}/category-units`
      );
      return data.data;
    },
  });
}

/** Saves a category's units; the change shows at once and is undone if it fails. */
export function useSaveCategoryUnits(vendorId?: number) {
  const queryClient = useQueryClient();
  const queryKey = categoryUnitsKey(vendorId);
  return useMutation({
    mutationFn: async ({ categoryId, units }: { categoryId: number; units: CategoryUnits }) => {
      const { data } = await apiClient.put<{ data: CategoryUnitSetting }>(
        `${path(vendorId!)}/category-units/${categoryId}`,
        units
      );
      return data.data;
    },
    onMutate: async ({ categoryId, units }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CategoryUnitSetting[]>(queryKey);
      queryClient.setQueryData<CategoryUnitSetting[]>(queryKey, (list = []) => [
        ...list.filter((s) => s.category_id !== categoryId),
        { category_id: categoryId, ...units },
      ]);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
