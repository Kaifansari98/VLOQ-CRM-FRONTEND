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
