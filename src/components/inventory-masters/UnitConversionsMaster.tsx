"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Layers,
  Pencil,
  Plus,
  Ruler,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  type StandardUnit,
  type StandardUnitsData,
  type UnitClass,
  type UnitRelation,
  unitError,
  useStandardUnitChange,
  useStandardUnits,
} from "@/api/standard-units";

// Inventory Masters → Unit Conversions: standard units grouped by unit class,
// and the relations between units of the same class (1 Mtr = 100 CM).

const PRIMARY_BUTTON =
  "gap-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium";

const qty = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 6, useGrouping: false });

type Change = ReturnType<typeof useStandardUnitChange>;
type Pending = { title: string; description: string; run: () => Promise<unknown> } | null;

export default function UnitConversionsMaster() {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id) as number | undefined;
  const { data, isLoading, isError } = useStandardUnits(vendorId);
  const change = useStandardUnitChange(vendorId);
  const [tab, setTab] = useState<"units" | "relations">("units");

  const tabs = [
    { id: "units" as const, label: "Standard Unit & Unit Class", icon: Ruler },
    { id: "relations" as const, label: "Standard Unit Relations within unit class", icon: ArrowRightLeft },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
      <div className="flex w-full flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Unit Conversions</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Standard units for each unit class, and how units convert within a class.
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-1 rounded-xl border bg-card p-1 sm:w-fit" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:flex-none",
                tab === id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load units. Please refresh and try again.
          </div>
        )}

        {isLoading || !data ? (
          !isError && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )
        ) : tab === "units" ? (
          <UnitsTab data={data} change={change} />
        ) : (
          <RelationsTab data={data} change={change} />
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Shared --------------------------------- */

function useConfirm() {
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const dialog = (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && !busy && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={async (e) => {
              e.preventDefault();
              if (!pending) return;
              setBusy(true);
              try {
                await pending.run();
                setPending(null);
              } catch (error) {
                toast.error(unitError(error));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return [setPending, dialog] as const;
}

function ClassFilter({
  classes,
  value,
  onChange,
}: {
  classes: UnitClass[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[160px] text-xs bg-background">
        <SelectValue placeholder="Unit class" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All unit classes</SelectItem>
        {classes.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "size-8 text-muted-foreground",
        danger ? "hover:text-destructive hover:bg-destructive/10" : "hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

const sortedUnits = (data: StandardUnitsData) => {
  const classOrder = new Map(data.classes.map((c, i) => [c.id, i]));
  return [...data.units].sort(
    (a, b) =>
      (classOrder.get(a.unit_class_id) ?? 0) - (classOrder.get(b.unit_class_id) ?? 0) ||
      Number(b.is_base) - Number(a.is_base) ||
      a.sort_order - b.sort_order,
  );
};

/* ------------------------- Tab 1: units & classes ------------------------- */

function UnitsTab({ data, change }: { data: StandardUnitsData; change: Change }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [editing, setEditing] = useState<StandardUnit | "new" | null>(null);
  const [managingClasses, setManagingClasses] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const className = (id: number) => data.classes.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedUnits(data).filter(
      (u) =>
        (classFilter === "all" || String(u.unit_class_id) === classFilter) &&
        (!q || u.name.toLowerCase().includes(q) || className(u.unit_class_id).toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, search, classFilter]);

  const makeBase = async (u: StandardUnit) => {
    try {
      await change.mutateAsync({ kind: "updateUnit", id: u.id, is_base: true });
      toast.success(`${u.name} is now the base unit of ${className(u.unit_class_id)}`);
    } catch (error) {
      toast.error(unitError(error));
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Unit classes" value={data.classes.length} icon={Layers} />
        <Stat label="Units" value={data.units.length} icon={Ruler} />
        <Stat
          label="Relations"
          value={data.relations.length}
          icon={ArrowRightLeft}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <SearchBox value={search} onChange={setSearch} placeholder="Search units..." />
          <ClassFilter classes={data.classes} value={classFilter} onChange={setClassFilter} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setManagingClasses(true)}>
            <Layers className="size-4" /> Unit Classes
          </Button>
          <Button size="sm" className={PRIMARY_BUTTON} onClick={() => setEditing("new")}>
            <Plus className="size-4" /> New Unit
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Unit Class</TableHead>
              <TableHead className="text-xs font-semibold">Unit</TableHead>
              <TableHead className="w-[130px] text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                  No units found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u, i) => {
                const firstOfClass = i === 0 || rows[i - 1].unit_class_id !== u.unit_class_id;
                return (
                  <TableRow key={u.id} className={cn(firstOfClass && i > 0 && "border-t-2")}>
                    <TableCell className="text-sm font-medium">
                      {firstOfClass ? className(u.unit_class_id) : ""}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-2">
                        {u.name}
                        {u.is_base && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                            Base Unit
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        {!u.is_base && (
                          <IconButton label="Make base unit" onClick={() => void makeBase(u)}>
                            <Star className="size-4" />
                          </IconButton>
                        )}
                        <IconButton label="Edit" onClick={() => setEditing(u)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Delete"
                          danger
                          onClick={() =>
                            confirm({
                              title: `Delete ${u.name}?`,
                              description: "Its unit relations are deleted too.",
                              run: async () => {
                                await change.mutateAsync({ kind: "deleteUnit", id: u.id });
                                toast.success(`${u.name} deleted`);
                              },
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <UnitDialog
          unit={editing === "new" ? null : editing}
          classes={data.classes}
          defaultClassId={classFilter === "all" ? undefined : Number(classFilter)}
          change={change}
          onClose={() => setEditing(null)}
        />
      )}
      {managingClasses && (
        <ClassesDialog data={data} change={change} onClose={() => setManagingClasses(false)} />
      )}
      {confirmDialog}
    </>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: typeof Layers;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-2xs", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 text-xs bg-background"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function UnitDialog({
  unit,
  classes,
  defaultClassId,
  change,
  onClose,
}: {
  unit: StandardUnit | null;
  classes: UnitClass[];
  defaultClassId?: number;
  change: Change;
  onClose: () => void;
}) {
  const [name, setName] = useState(unit?.name ?? "");
  const [classId, setClassId] = useState(String(unit?.unit_class_id ?? defaultClassId ?? classes[0]?.id ?? ""));
  const [isBase, setIsBase] = useState(unit?.is_base ?? false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return setError("Unit name is required.");
    if (!classId) return setError("Select the unit class.");
    setError(null);
    try {
      if (unit)
        await change.mutateAsync({
          kind: "updateUnit",
          id: unit.id,
          name: name.trim(),
          unit_class_id: Number(classId),
          ...(isBase && !unit.is_base ? { is_base: true } : {}),
        });
      else
        await change.mutateAsync({ kind: "createUnit", name: name.trim(), unit_class_id: Number(classId), is_base: isBase });
      toast.success(unit ? "Unit updated" : "Unit added");
      onClose();
    } catch (e) {
      setError(unitError(e));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !change.isPending && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="size-5" /> {unit ? "Edit Unit" : "New Unit"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label>Unit Class *</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select unit class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unit_name">Unit *</Label>
            <Input
              id="unit_name"
              value={name}
              placeholder="e.g. Mtr"
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void save()}
            />
          </div>
          {!unit?.is_base && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isBase} onCheckedChange={(v) => setIsBase(v === true)} />
              Base unit of this class
            </label>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={change.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={change.isPending} className={PRIMARY_BUTTON}>
            {change.isPending ? "Saving..." : unit ? "Save Changes" : "Add Unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClassesDialog({
  data,
  change,
  onClose,
}: {
  data: StandardUnitsData;
  change: Change;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setError(null);
    try {
      await fn();
      toast.success(done);
      return true;
    } catch (e) {
      setError(unitError(e));
      return false;
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5" /> Unit Classes
            </DialogTitle>
            <DialogDescription className="text-xs">
              Groups of units that convert into each other, like Length or Weight.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] divide-y overflow-y-auto rounded-lg border">
            {data.classes.map((c) => {
              const units = data.units.filter((u) => u.unit_class_id === c.id);
              const base = units.find((u) => u.is_base);
              return (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                  {renaming?.id === c.id ? (
                    <Input
                      autoFocus
                      value={renaming.name}
                      maxLength={100}
                      onChange={(e) => setRenaming({ id: c.id, name: e.target.value })}
                      onKeyDown={async (e) => {
                        if (e.key === "Escape") setRenaming(null);
                        if (e.key === "Enter" &&
                          (await run(() => change.mutateAsync({ kind: "updateClass", id: c.id, name: renaming.name }), "Unit class renamed")))
                          setRenaming(null);
                      }}
                      className="h-8 flex-1 text-sm"
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {units.length} unit{units.length === 1 ? "" : "s"}
                        {base ? ` · Base unit ${base.name}` : ""}
                      </p>
                    </div>
                  )}
                  <IconButton label="Rename" onClick={() => setRenaming({ id: c.id, name: c.name })}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete"
                    danger
                    onClick={() =>
                      confirm({
                        title: `Delete ${c.name}?`,
                        description: units.length
                          ? "Delete or move its units first."
                          : "This unit class has no units.",
                        run: () => change.mutateAsync({ kind: "deleteClass", id: c.id }),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              value={newName}
              placeholder="New unit class, e.g. Time"
              maxLength={100}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newName.trim() &&
                  (await run(() => change.mutateAsync({ kind: "createClass", name: newName }), "Unit class added")))
                  setNewName("");
              }}
              className="h-9 text-sm"
            />
            <Button
              className={PRIMARY_BUTTON}
              disabled={!newName.trim() || change.isPending}
              onClick={async () => {
                if (await run(() => change.mutateAsync({ kind: "createClass", name: newName }), "Unit class added"))
                  setNewName("");
              }}
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}

/* ---------------------------- Tab 2: relations ---------------------------- */

function RelationsTab({ data, change }: { data: StandardUnitsData; change: Change }) {
  const [classFilter, setClassFilter] = useState("all");
  const [editing, setEditing] = useState<UnitRelation | "new" | null>(null);
  const [confirm, confirmDialog] = useConfirm();
  const unit = (id: number) => data.units.find((u) => u.id === id);
  const className = (id: number) => data.classes.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const classOrder = new Map(data.classes.map((c, i) => [c.id, i]));
    return data.relations
      .filter((r) => classFilter === "all" || String(r.unit_class_id) === classFilter)
      .sort(
        (a, b) =>
          (classOrder.get(a.unit_class_id) ?? 0) - (classOrder.get(b.unit_class_id) ?? 0) ||
          (unit(a.from_unit_id)?.sort_order ?? 0) - (unit(b.from_unit_id)?.sort_order ?? 0) ||
          (unit(a.to_unit_id)?.sort_order ?? 0) - (unit(b.to_unit_id)?.sort_order ?? 0),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, classFilter]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <ClassFilter classes={data.classes} value={classFilter} onChange={setClassFilter} />
        <Button size="sm" className={PRIMARY_BUTTON} onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New Relation
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold">Class</TableHead>
              <TableHead className="text-right text-xs font-semibold">Qty</TableHead>
              <TableHead className="text-xs font-semibold">Unit</TableHead>
              <TableHead className="w-8 text-center text-xs font-semibold" />
              <TableHead className="text-right text-xs font-semibold">Value</TableHead>
              <TableHead className="text-xs font-semibold">Unit</TableHead>
              <TableHead className="w-[100px] text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No unit relations yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const from = unit(r.from_unit_id);
                const to = unit(r.to_unit_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{className(r.unit_class_id)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{qty(r.from_qty)}</TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center gap-2">
                        {from?.name}
                        {from?.is_base && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                            Base
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">=</TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">{qty(r.to_qty)}</TableCell>
                    <TableCell className="text-sm">{to?.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <IconButton label="Edit" onClick={() => setEditing(r)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label="Delete"
                          danger
                          onClick={() =>
                            confirm({
                              title: "Delete this relation?",
                              description: `${qty(r.from_qty)} ${from?.name} = ${qty(r.to_qty)} ${to?.name}`,
                              run: async () => {
                                await change.mutateAsync({ kind: "deleteRelation", id: r.id });
                                toast.success("Relation deleted");
                              },
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <RelationDialog
          relation={editing === "new" ? null : editing}
          data={data}
          defaultClassId={classFilter === "all" ? undefined : Number(classFilter)}
          change={change}
          onClose={() => setEditing(null)}
        />
      )}
      {confirmDialog}
    </>
  );
}

function RelationDialog({
  relation,
  data,
  defaultClassId,
  change,
  onClose,
}: {
  relation: UnitRelation | null;
  data: StandardUnitsData;
  defaultClassId?: number;
  change: Change;
  onClose: () => void;
}) {
  const startClass = relation?.unit_class_id ?? defaultClassId ?? data.classes[0]?.id;
  const baseOf = (classId?: number) =>
    data.units.find((u) => u.unit_class_id === classId && u.is_base)?.id;
  const [classId, setClassId] = useState(String(startClass ?? ""));
  const [fromId, setFromId] = useState(String(relation?.from_unit_id ?? baseOf(startClass) ?? ""));
  const [fromQty, setFromQty] = useState(String(relation?.from_qty ?? 1));
  const [toId, setToId] = useState(String(relation?.to_unit_id ?? ""));
  const [toQty, setToQty] = useState(relation ? String(relation.to_qty) : "");
  const [error, setError] = useState<string | null>(null);
  const classUnits = sortedUnits(data).filter((u) => String(u.unit_class_id) === classId);

  const save = async () => {
    if (!fromId || !toId) return setError("Select both units.");
    if (fromId === toId) return setError("Pick two different units.");
    const a = Number(fromQty);
    const b = Number(toQty);
    if (!(a > 0) || !(b > 0)) return setError("Enter quantities greater than 0.");
    setError(null);
    const body = { from_unit_id: Number(fromId), from_qty: a, to_unit_id: Number(toId), to_qty: b };
    try {
      if (relation) await change.mutateAsync({ kind: "updateRelation", id: relation.id, ...body });
      else await change.mutateAsync({ kind: "createRelation", ...body });
      toast.success(relation ? "Relation updated" : "Relation added");
      onClose();
    } catch (e) {
      setError(unitError(e));
    }
  };

  const unitSelect = (value: string, onChange: (v: string) => void, exclude: string) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm">
        <SelectValue placeholder="Unit" />
      </SelectTrigger>
      <SelectContent>
        {classUnits
          .filter((u) => String(u.id) !== exclude)
          .map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.name}
              {u.is_base ? " (base)" : ""}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );

  const fromName = classUnits.find((u) => String(u.id) === fromId)?.name;
  const toName = classUnits.find((u) => String(u.id) === toId)?.name;

  return (
    <Dialog open onOpenChange={(open) => !open && !change.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-5" /> {relation ? "Edit Relation" : "New Relation"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            How many of one unit make another, within the same unit class.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label>Class *</Label>
            <Select
              value={classId}
              onValueChange={(v) => {
                setClassId(v);
                setFromId(String(baseOf(Number(v)) ?? ""));
                setToId("");
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select unit class" />
              </SelectTrigger>
              <SelectContent>
                {data.classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-2">
            <div className="flex flex-col gap-1.5">
              <Label>Qty *</Label>
              <Input type="number" min={0} step="any" value={fromQty} onChange={(e) => setFromQty(e.target.value)} className="h-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unit *</Label>
              {unitSelect(fromId, setFromId, toId)}
            </div>
          </div>
          <p className="-my-1 text-center text-sm font-semibold text-muted-foreground">=</p>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <div className="flex flex-col gap-1.5">
              <Label>Value *</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={toQty}
                placeholder="e.g. 100"
                onChange={(e) => setToQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void save()}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unit *</Label>
              {unitSelect(toId, setToId, fromId)}
            </div>
          </div>
          {fromName && toName && Number(fromQty) > 0 && Number(toQty) > 0 && (
            <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm">
              {qty(Number(fromQty))} {fromName} = {qty(Number(toQty))} {toName}
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={change.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={change.isPending} className={PRIMARY_BUTTON}>
            {change.isPending ? "Saving..." : relation ? "Save Changes" : "Add Relation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
