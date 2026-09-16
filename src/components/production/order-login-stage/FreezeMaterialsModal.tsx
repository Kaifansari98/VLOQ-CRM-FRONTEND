"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, PackageCheck, Snowflake } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type ProductionPreviewRow } from "./production-file-preview";

const round2 = (value: number) => Math.round(value * 100) / 100;

function rowLimits(row: ProductionPreviewRow) {
  const required = row.qty;
  const issued = row.issuedQty ?? 0;
  const remaining = Math.max(0, round2(required - issued));
  const available = row.product?.current_stock != null && Number.isFinite(Number(row.product.current_stock)) ? Number(row.product.current_stock) : 0;
  const max = Math.max(0, round2(Math.min(remaining, available)));
  return { required, issued, remaining, available, max };
}

export default function FreezeMaterialsModal({ open, onOpenChange, rows, onConfirm, submitting = false }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ProductionPreviewRow[];
  onConfirm: (items: { id: number; qty: number }[]) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const rowsSignature = rows.map((row) => `${row.key}:${row.issuedQty ?? 0}:${row.product?.current_stock ?? ""}`).join("|");

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    rows.forEach((row) => { next[row.key] = String(rowLimits(row).max || 0); });
    setDraft(next);
    // Re-seeds every row to its fresh remaining amount whenever the modal opens or a freeze
    // round updates issued/stock quantities, so "remaining" stays accurate across repeat freezes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rowsSignature]);

  const items = useMemo(() => rows.map((row) => {
    const limits = rowLimits(row);
    const raw = draft[row.key];
    const parsed = raw === undefined || raw === "" ? 0 : Number(raw);
    const rawValid = raw === undefined || raw === "" || (Number.isFinite(parsed) && parsed >= 0 && parsed <= limits.max);
    const qty = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), limits.max) : 0;
    return { row, limits, qty, rawValid };
  }), [rows, draft]);

  const selectedToFreeze = items.filter((item) => item.qty > 0);
  const totalToFreeze = round2(selectedToFreeze.reduce((sum, item) => sum + item.qty, 0));
  const canSubmit = !submitting && selectedToFreeze.length > 0 && items.every((item) => item.rawValid);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await onConfirm(selectedToFreeze.map((item) => ({ id: Number(item.row.key), qty: item.qty })));
    } catch {
      // Surfaced to the user via a toast from the mutation's error handler.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent
        className="flex max-h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={!submitting}
        onPointerDownOutside={(event) => { if (submitting) event.preventDefault(); }}
      >
        <DialogHeader className="border-b bg-blue-50 px-6 py-5 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-blue-200 bg-white p-2.5 text-blue-600 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400">
              <Snowflake className="size-5" />
            </div>
            <div>
              <DialogTitle>Freeze materials</DialogTitle>
              <DialogDescription className="mt-1">
                Reserve stock for {rows.length} selected item{rows.length === 1 ? "" : "s"}. Freeze the full quantity or only part of it — the rest stays available to freeze later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {items.map(({ row, limits, qty, rawValid }) => (
            <div key={row.key} className={cn("rounded-xl border p-3.5 transition-opacity", limits.max <= 0 && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.name || "Unnamed product"}</p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{row.articleCode || "No article code"}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>Required: <span className="font-medium text-foreground">{limits.required} {row.unit}</span></p>
                  <p>Already frozen: <span className="font-medium text-foreground">{limits.issued} {row.unit}</span></p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor={`freeze-qty-${row.key}`} className="text-xs font-medium text-muted-foreground">Freeze qty</label>
                  <Input
                    id={`freeze-qty-${row.key}`}
                    type="number"
                    min={0}
                    max={limits.max}
                    step="any"
                    disabled={limits.max <= 0 || submitting}
                    value={draft[row.key] ?? ""}
                    onChange={(event) => setDraft((previous) => ({ ...previous, [row.key]: event.target.value }))}
                    className={cn("h-8 w-28", !rawValid && "border-destructive focus-visible:ring-destructive/40")}
                  />
                  <span className="text-xs text-muted-foreground">{row.unit}</span>
                </div>
                {limits.max <= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-muted-foreground dark:border-slate-700 dark:bg-slate-900">
                    {limits.remaining <= 0 ? "Fully frozen" : "No stock available"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400">
                    {round2(limits.remaining - qty)} {row.unit} will remain
                  </span>
                )}
              </div>
              {!rawValid && <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="size-3" />Enter a quantity between 0 and {limits.max} {row.unit}.</p>}
            </div>
          ))}
          {!rows.length && <p className="p-8 text-center text-sm text-muted-foreground">No items selected.</p>}
        </div>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <div className="mr-auto flex items-center gap-1.5 text-sm text-muted-foreground">
            <PackageCheck className="size-4" />
            Freezing <span className="font-medium tabular-nums text-foreground">{totalToFreeze}</span> unit{totalToFreeze === 1 ? "" : "s"} across {selectedToFreeze.length} item{selectedToFreeze.length === 1 ? "" : "s"}
          </div>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="bg-blue-500 text-white hover:bg-blue-600" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Snowflake className="mr-2 size-4" />}
            {submitting ? "Freezing…" : "Freeze selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
