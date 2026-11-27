"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, ChevronRight, ChevronsDownUp, ChevronsUpDown, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  LOCATION_LEVELS,
  type LocationOption,
  levelName,
  locationError,
  toLocationOptions,
  useInventoryLocations,
  useLocationChange,
} from "@/api/inventory-locations";

// Masters Management → Inventory Masters → Locations: the storage tree
// Factory > Shed > Floor > Store > Rack > Shelf > Position.

type Editing = { mode: "add"; parentId: number | null; level: number } | { mode: "rename"; id: number };

export default function LocationsMaster() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const { data, isLoading } = useInventoryLocations(vendorId);
  const change = useLocationChange(vendorId);

  const options = useMemo(() => toLocationOptions(data ?? []), [data]);
  const byParent = useMemo(() => {
    const map = new Map<number | null, LocationOption[]>();
    for (const o of options) map.set(o.parent_id, [...(map.get(o.parent_id) ?? []), o]);
    return map;
  }, [options]);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [draft, setDraft] = useState("");
  const [toDelete, setToDelete] = useState<LocationOption | null>(null);

  // While searching: matches plus everything above them, all opened.
  const query = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!query) return null;
    const byId = new Map(options.map((o) => [o.id, o]));
    const keep = new Set<number>();
    for (const o of options) {
      if (`${o.label} ${o.name}`.toLowerCase().includes(query)) {
        let cur: LocationOption | undefined = o;
        while (cur) {
          keep.add(cur.id);
          cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
        }
      }
    }
    return keep;
  }, [options, query]);

  const isOpen = (id: number) => (visible ? true : expanded.has(id));
  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startAdd = (parentId: number | null, level: number) => {
    if (parentId) setExpanded((p) => new Set(p).add(parentId));
    setEditing({ mode: "add", parentId, level });
    setDraft("");
  };
  const startRename = (o: LocationOption) => {
    setEditing({ mode: "rename", id: o.id });
    setDraft(o.name);
  };

  const save = async () => {
    if (!editing || !draft.trim() || change.isPending) return;
    try {
      if (editing.mode === "add") {
        await change.mutateAsync({ kind: "create", name: draft.trim(), parent_id: editing.parentId });
        toast.success(`${levelName(editing.level)} ${draft.trim()} added`);
        // Stay open to add the next one at the same place.
        setDraft("");
      } else {
        await change.mutateAsync({ kind: "rename", id: editing.id, name: draft.trim() });
        toast.success("Renamed");
        setEditing(null);
      }
    } catch (error) {
      toast.error(locationError(error));
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await change.mutateAsync({ kind: "delete", id: toDelete.id });
      toast.success(`${toDelete.label} deleted`);
    } catch (error) {
      toast.error(locationError(error));
    } finally {
      setToDelete(null);
    }
  };

  const counts = useMemo(() => {
    const c = new Array(LOCATION_LEVELS.length).fill(0);
    for (const o of options) c[o.level - 1]++;
    return c as number[];
  }, [options]);

  const editRow = (level: number, depth: number) => (
    <div className="flex items-center gap-2 py-1.5 pr-3" style={{ paddingLeft: 12 + depth * 22 }}>
      <span className="w-4" />
      <LevelBadge level={level} />
      <Input
        autoFocus
        value={draft}
        maxLength={50}
        placeholder={`${levelName(level)} no. / name, e.g. ${level === 7 ? "P1" : level === 1 ? "1" : "A"}`}
        className="h-8 max-w-64 text-sm"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") setEditing(null);
        }}
      />
      <Button size="icon" variant="ghost" className="size-8" disabled={!draft.trim() || change.isPending} onClick={() => void save()} title="Save">
        <Check className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditing(null)} title="Cancel">
        <X className="size-4" />
      </Button>
    </div>
  );

  const renderLevel = (parentId: number | null, depth: number): React.ReactNode => {
    const rows = (byParent.get(parentId) ?? []).filter((o) => !visible || visible.has(o.id));
    const adding = editing?.mode === "add" && editing.parentId === parentId;
    return (
      <>
        {rows.map((o) => {
          const kids = byParent.get(o.id) ?? [];
          const open = isOpen(o.id);
          const nextLevel = o.level < LOCATION_LEVELS.length ? levelName(o.level + 1) : null;
          const items = o._count?.products ?? 0;
          const hit = !!query && `${o.label} ${o.name}`.toLowerCase().includes(query);
          return (
            <Fragment key={o.id}>
              {editing?.mode === "rename" && editing.id === o.id ? (
                editRow(o.level, depth)
              ) : (
                <div
                  className={cn(
                    "group flex items-center gap-2 border-b border-border/50 py-1.5 pr-3 transition-colors hover:bg-muted/40",
                    hit && "bg-amber-50/60 dark:bg-amber-500/5"
                  )}
                  style={{ paddingLeft: 12 + depth * 22 }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(o.id)}
                    className={cn("flex size-4 items-center justify-center text-muted-foreground", kids.length === 0 && "invisible")}
                    aria-label={open ? "Collapse" : "Expand"}
                  >
                    <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
                  </button>
                  <LevelBadge level={o.level} />
                  <span className="text-sm font-semibold text-foreground">{o.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {kids.length > 0 && `${kids.length} ${levelName(o.level + 1).toLowerCase()}${kids.length === 1 ? "" : "s"}`}
                    {kids.length > 0 && items > 0 && " · "}
                    {items > 0 && `${items} item${items === 1 ? "" : "s"}`}
                  </span>
                  <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    {nextLevel && (
                      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => startAdd(o.id, o.level + 1)}>
                        <Plus className="size-3.5" /> {nextLevel}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => startRename(o)} title="Rename">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setToDelete(o)}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              {open && renderLevel(o.id, depth + 1)}
            </Fragment>
          );
        })}
        {adding && editing && editRow(editing.level, depth)}
      </>
    );
  };

  const empty = !isLoading && options.length === 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
      <div className="flex w-full flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Locations</h1>
          <p className="mt-1 text-xs text-muted-foreground">Where items are kept, from factory down to the exact position.</p>
        </div>

        {/* The hierarchy, with how many of each there are */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-3">
          {LOCATION_LEVELS.map((name, i) => (
            <Fragment key={name}>
              <span className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold">
                <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">{i + 1}</span>
                {name}
                <span className="font-normal text-muted-foreground">{counts[i]}</span>
              </span>
              {i < LOCATION_LEVELS.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            </Fragment>
          ))}
        </div>

        <div className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative min-w-0 flex-1 sm:max-w-80">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search e.g. Rack 3, Position P5…"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() =>
                setExpanded((prev) => (prev.size ? new Set() : new Set(options.filter((o) => byParent.has(o.id)).map((o) => o.id))))
              }
              disabled={!options.length || !!query}
            >
              {expanded.size ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
              {expanded.size ? "Collapse all" : "Expand all"}
            </Button>
            <Button size="sm" className="ml-auto h-9 gap-1.5 text-xs" onClick={() => startAdd(null, 1)}>
              <Plus className="size-3.5" /> Add Factory
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8" style={{ marginLeft: i * 22 }} />
              ))}
            </div>
          ) : empty && !(editing?.mode === "add") ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <MapPin className="size-5" />
              </div>
              <p className="text-sm font-semibold">No locations yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Start with a factory, then add sheds, floors, stores, racks, shelves and positions inside it.
              </p>
              <Button size="sm" className="mt-2 gap-1.5 text-xs" onClick={() => startAdd(null, 1)}>
                <Plus className="size-3.5" /> Add Factory
              </Button>
            </div>
          ) : visible && visible.size === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">No location matches “{search.trim()}”.</p>
          ) : (
            <div className="py-1">{renderLevel(null, 0)}</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && [...toDelete.path, toDelete.label].join(" › ")}. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md border bg-muted/60 px-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {levelName(level)}
    </span>
  );
}
