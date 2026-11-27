import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { apiClient } from "@/lib/apiClient";

// Inventory locations: Factory > Shed > Floor > Store > Rack > Shelf > Position.

export const LOCATION_LEVELS = ["Factory", "Shed", "Floor", "Store", "Rack", "Shelf", "Position"] as const;

export interface InventoryLocation {
  id: number;
  parent_id: number | null;
  /** 1 = Factory … 7 = Position */
  level: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  _count?: { products: number };
}

/** A location with its place in the tree, for lists and search. */
export interface LocationOption extends InventoryLocation {
  levelName: string;
  /** "Rack 3" */
  label: string;
  /** Ancestors, top first: ["Factory 1", "Shed A", …] */
  path: string[];
  depthFirstIndex: number;
}

export const levelName = (level: number) => LOCATION_LEVELS[level - 1] ?? "Location";
export const locationLabel = (l: { level: number; name: string }) => `${levelName(l.level)} ${l.name}`;

/** Orders locations as a tree (parent before children) and adds their paths. */
export function toLocationOptions(list: InventoryLocation[]): LocationOption[] {
  const children = new Map<number | null, InventoryLocation[]>();
  for (const l of list) {
    const key = l.parent_id ?? null;
    children.set(key, [...(children.get(key) ?? []), l]);
  }
  const out: LocationOption[] = [];
  const walk = (parentId: number | null, path: string[]) => {
    const kids = (children.get(parentId) ?? []).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    for (const l of kids) {
      const label = locationLabel(l);
      out.push({ ...l, levelName: levelName(l.level), label, path, depthFirstIndex: out.length });
      walk(l.id, [...path, label]);
    }
  };
  walk(null, []);
  return out;
}

export function locationError(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return "Something went wrong. Please try again.";
}

const path = (vendorId: number) => `/inventory-locations/vendor/${vendorId}`;
const key = (vendorId?: number) => ["inventory-locations", vendorId] as const;

export function useInventoryLocations(vendorId?: number) {
  return useQuery({
    queryKey: key(vendorId),
    enabled: !!vendorId,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: InventoryLocation[] }>(path(vendorId!));
      return data.data;
    },
  });
}

type Change =
  | { kind: "create"; name: string; parent_id: number | null }
  | { kind: "rename"; id: number; name: string }
  | { kind: "delete"; id: number };

export function useLocationChange(vendorId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: Change) => {
      const base = path(vendorId!);
      if (change.kind === "create") {
        const { data } = await apiClient.post<{ data: InventoryLocation }>(base, {
          name: change.name,
          parent_id: change.parent_id,
        });
        return data.data;
      }
      if (change.kind === "rename") {
        const { data } = await apiClient.put<{ data: InventoryLocation }>(`${base}/${change.id}`, { name: change.name });
        return data.data;
      }
      await apiClient.delete(`${base}/${change.id}`);
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(vendorId) }),
  });
}
