"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeftRight, Check, Loader2, Ruler, ShoppingCart, Warehouse, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryUnits, StandardUnitsData, UnitRelation, UnitRole } from "@/api/standard-units";

// Purchase, stock and consumption units of a category or sub-category. Pick a
// unit class, then a unit in it. Each role uses a different class, and the
// Quantity / Packing classes are for the purchase unit only.

export type UnitSaveStatus = "idle" | "saving" | "saved" | "error" | "pending";

const ROLES: { key: UnitRole; label: string; hint: string; icon: typeof ShoppingCart }[] = [
  { key: "purchase_unit_id", label: "Purchase Unit", hint: "Primary · bought / sold in", icon: ShoppingCart },
  { key: "stock_unit_id", label: "Stock Unit", hint: "Secondary · stored / used in", icon: Warehouse },
  { key: "consumption_unit_id", label: "Consumption Unit", hint: "Third · consumed in", icon: Wrench },
];

const COUNT_CLASSES = new Set(["quantity", "packing"]);
const isCountClass = (name: string) => COUNT_CLASSES.has(name.toLowerCase());

const qty = (n: number) => Number(n.toFixed(6)).toLocaleString("en-IN", { maximumFractionDigits: 6 });

interface Props {
  data?: StandardUnitsData;
  loading?: boolean;
  value: CategoryUnits;
  onChange: (next: CategoryUnits) => void;
  status?: UnitSaveStatus;
  /** Smaller layout for sub-category cards. */
  compact?: boolean;
  className?: string;
}

export function CategoryUnitsPicker({ data, loading, value, onChange, status = "idle", compact, className }: Props) {
  // A class picked before its unit lives here until a unit is chosen.
  const [pickedClass, setPickedClass] = useState<Partial<Record<UnitRole, number | null>>>({});

  const classOfUnit = (unitId: number | null) =>
    unitId ? data?.units.find((u) => u.id === unitId)?.unit_class_id ?? null : null;
  const classFor = (role: UnitRole) =>
    pickedClass[role] !== undefined ? pickedClass[role]! : classOfUnit(value[role]);

  const takenBy = (role: UnitRole, classId: number) =>
    ROLES.find((r) => r.key !== role && classFor(r.key) === classId);

  const chooseClass = (role: UnitRole, classId: number | null) => {
    setPickedClass((p) => ({ ...p, [role]: classId }));
    // A unit from another class no longer fits.
    if (value[role] !== null && classOfUnit(value[role]) !== classId) onChange({ ...value, [role]: null });
  };

  const chooseUnit = (role: UnitRole, unitId: number) => {
    setPickedClass((p) => {
      const next = { ...p };
      delete next[role];
      return next;
    });
    if (value[role] !== unitId) onChange({ ...value, [role]: unitId });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn("flex shrink-0 items-center justify-center rounded-lg border bg-muted text-foreground", compact ? "size-6" : "size-8")}>
            <Ruler className={compact ? "size-3" : "size-4"} />
          </div>
          <div>
            <h4 className={cn("font-bold tracking-tight text-foreground", compact ? "text-xs" : "text-sm")}>Unit Conversions</h4>
            {!compact && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choose a unit class, then the unit. Each unit comes from a different class.
              </p>
            )}
          </div>
        </div>
        <SaveStatus status={status} />
      </div>

      {loading || !data ? (
        <div className={cn("grid grid-cols-1 gap-3", "md:grid-cols-3")}>
          {ROLES.map((r) => (
            <Skeleton key={r.key} className={compact ? "h-24" : "h-32"} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {ROLES.map((role) => {
            const classId = classFor(role.key);
            const unitClass = data.classes.find((c) => c.id === classId);
            const units = data.units.filter(
              (u) => u.unit_class_id === classId && (u.is_active || u.id === value[role.key])
            );
            const unit = data.units.find((u) => u.id === value[role.key]);
            const relations = data.relations.filter((r) => r.unit_class_id === classId && r.is_active);
            const Icon = role.icon;
            return (
              <div
                key={role.key}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border bg-background transition-colors",
                  compact ? "p-2.5" : "p-3.5",
                  unit ? "border-foreground/25" : "border-border/80"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{role.label}</p>
                      <p className="text-[10px] text-muted-foreground">{role.hint}</p>
                    </div>
                  </div>
                  {(classId !== null || unit) && (
                    <button
                      type="button"
                      title={`Clear ${role.label.toLowerCase()}`}
                      onClick={() => chooseClass(role.key, null)}
                      className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={classId ? String(classId) : ""}
                    onValueChange={(v) => chooseClass(role.key, Number(v))}
                  >
                    <SelectTrigger size="sm" className="w-full bg-background text-xs">
                      <SelectValue placeholder="Unit class" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.classes
                        .filter((c) => c.is_active || c.id === classId)
                        .map((c) => {
                          const other = takenBy(role.key, c.id);
                          const countBlocked = role.key !== "purchase_unit_id" && isCountClass(c.name);
                          const reason = other ? `Used for ${other.label}` : countBlocked ? "Purchase unit only" : null;
                          return (
                            <SelectItem key={c.id} value={String(c.id)} disabled={!!reason} className="text-xs">
                              {c.name}
                              {reason && <span className="ml-auto text-[10px] text-muted-foreground">{reason}</span>}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>

                  <Select
                    value={unit ? String(unit.id) : ""}
                    onValueChange={(v) => chooseUnit(role.key, Number(v))}
                    disabled={!classId}
                  >
                    <SelectTrigger size="sm" className="w-full bg-background text-xs">
                      <SelectValue placeholder={classId ? "Select unit" : "Unit"} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-muted-foreground">No units in this class.</p>
                      ) : (
                        units.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)} className="text-xs">
                            {u.name}
                            {u.is_base && <span className="text-[10px] text-muted-foreground">(base)</span>}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {unitClass && (
                  <Relations
                    title={unitClass.name}
                    relations={relations}
                    unitName={(id) => data.units.find((u) => u.id === id)?.name ?? "—"}
                    selectedId={unit?.id}
                    compact={compact}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Relations({
  title,
  relations,
  unitName,
  selectedId,
  compact,
}: {
  title: string;
  relations: UnitRelation[];
  unitName: (id: number) => string;
  selectedId?: number;
  compact?: boolean;
}) {
  // The selected unit's relations come first.
  const sorted = [...relations].sort((a, b) => {
    const rank = (r: UnitRelation) => (r.from_unit_id === selectedId || r.to_unit_id === selectedId ? 0 : 1);
    return rank(a) - rank(b);
  });
  const shown = compact ? sorted.slice(0, 3) : sorted;
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <ArrowLeftRight className="size-3" /> {title} relations
      </p>
      {relations.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No relations in this class yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {shown.map((r) => {
            const active = r.from_unit_id === selectedId || r.to_unit_id === selectedId;
            return (
              <span
                key={r.id}
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                  active
                    ? "border-foreground/40 bg-background font-semibold text-foreground"
                    : "border-transparent text-muted-foreground"
                )}
              >
                {qty(r.from_qty)} {unitName(r.from_unit_id)} = {qty(r.to_qty)} {unitName(r.to_unit_id)}
              </span>
            );
          })}
          {shown.length < sorted.length && (
            <span className="px-1 py-0.5 text-[10px] text-muted-foreground">+{sorted.length - shown.length} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function SaveStatus({ status }: { status: UnitSaveStatus }) {
  if (status === "idle") return null;
  const map = {
    saving: { icon: <Loader2 className="size-3 animate-spin" />, text: "Saving…", cls: "text-muted-foreground" },
    saved: { icon: <Check className="size-3" />, text: "Saved", cls: "text-emerald-600 dark:text-emerald-400" },
    error: { icon: <AlertCircle className="size-3" />, text: "Not saved", cls: "text-destructive" },
    pending: { icon: null, text: "Saved with the category", cls: "text-muted-foreground" },
  }[status];
  return (
    <span className={cn("flex shrink-0 items-center gap-1 text-[11px] font-medium", map.cls)}>
      {map.icon}
      {map.text}
    </span>
  );
}
