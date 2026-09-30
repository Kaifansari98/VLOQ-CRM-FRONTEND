"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, PackageCheck, Snowflake, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type ProductionPreviewRow } from "./production-file-preview";

const round2 = (value: number) => Math.round(value * 100) / 100;

function rowLimits(row: ProductionPreviewRow) {
  const required = row.qty;
  const frozen = row.frozenQty ?? 0;
  const issued = row.issuedQty ?? 0;
  // Issuing is only capped by what's still outstanding overall (issued is the final state).
  const remainingToIssue = Math.max(0, round2(required - issued));
  // Frozen-but-not-yet-issued stock was already deducted at freeze time — issuing it is free.
  const frozenNotYetIssued = Math.max(0, round2(frozen - issued));
  const available = row.product?.current_stock != null && Number.isFinite(Number(row.product.current_stock)) ? Number(row.product.current_stock) : 0;
  const max = Math.max(0, round2(Math.min(remainingToIssue, frozenNotYetIssued + available)));
  return { required, frozen, issued, remainingToIssue, frozenNotYetIssued, available, max };
}

export default function IssueMaterialsModal({ open, onOpenChange, rows, onConfirm, submitting = false }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ProductionPreviewRow[];
  onConfirm: (items: { id: number; qty: number }[]) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const rowsSignature = rows.map((row) => `${row.key}:${row.frozenQty ?? 0}:${row.issuedQty ?? 0}:${row.product?.current_stock ?? ""}`).join("|");

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    rows.forEach((row) => { next[row.key] = String(rowLimits(row).max || 0); });
    setDraft(next);
    // Re-seeds every row to its fresh remaining amount whenever the modal opens or an issue
    // round updates frozen/issued/stock quantities, so "remaining" stays accurate on repeat issues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rowsSignature]);

  const items = useMemo(() => rows.map((row) => {
    const limits = rowLimits(row);
    const raw = draft[row.key];
    const parsed = raw === undefined || raw === "" ? 0 : Number(raw);
    const rawValid = raw === undefined || raw === "" || (Number.isFinite(parsed) && parsed >= 0 && parsed <= limits.max);
    const qty = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), limits.max) : 0;
    const coveredByFreeze = round2(Math.min(qty, limits.frozenNotYetIssued));
    const newDeduction = round2(qty - coveredByFreeze);
    return { row, limits, qty, rawValid, coveredByFreeze, newDeduction };
  }), [rows, draft]);

  const selectedToIssue = items.filter((item) => item.qty > 0);
  const totalToIssue = round2(selectedToIssue.reduce((sum, item) => sum + item.qty, 0));
  const totalNewDeduction = round2(selectedToIssue.reduce((sum, item) => sum + item.newDeduction, 0));
  const canSubmit = !submitting && selectedToIssue.length > 0 && items.every((item) => item.rawValid);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await onConfirm(selectedToIssue.map((item) => ({ id: Number(item.row.key), qty: item.qty })));
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
        <DialogHeader className="border-b bg-green-50 px-6 py-5 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-green-200 bg-white p-2.5 text-green-600 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
              <Truck className="size-5" />
            </div>
            <div>
              <DialogTitle>Issue materials</DialogTitle>
              <DialogDescription className="mt-1">
                Hand off stock for {rows.length} selected item{rows.length === 1 ? "" : "s"}. Anything already frozen is issued for free — only the remainder is newly deducted from stock.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {items.map(({ row, limits, qty, rawValid, coveredByFreeze, newDeduction }) => (
            <div key={row.key} className={cn("rounded-xl border p-3.5 transition-opacity", limits.max <= 0 && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.name || "Unnamed product"}</p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{row.articleCode || "No article code"}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>Required: <span className="font-medium text-foreground">{limits.required} {row.unit}</span></p>
                  {!!limits.frozen && <p>Frozen: <span className="font-medium text-foreground">{limits.frozen} {row.unit}</span></p>}
                  {!!limits.issued && <p>Already issued: <span className="font-medium text-foreground">{limits.issued} {row.unit}</span></p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor={`issue-qty-${row.key}`} className="text-xs font-medium text-muted-foreground">Issue qty</label>
                  <Input
                    id={`issue-qty-${row.key}`}
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
                {limits.max <= 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-muted-foreground dark:border-slate-700 dark:bg-slate-900">
                    {limits.remainingToIssue <= 0 ? "Nothing left to issue" : "No stock or frozen reserve available"}
                  </span>
                )}
              </div>
              {(coveredByFreeze > 0 || newDeduction > 0) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {coveredByFreeze > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
                      <Snowflake className="size-3" />{coveredByFreeze} {row.unit} from frozen stock — no stock impact
                    </span>
                  )}
                  {newDeduction > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400">
                      <Truck className="size-3" />{newDeduction} {row.unit} newly deducted from stock
                    </span>
                  )}
                </div>
              )}
              {!rawValid && <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="size-3" />Enter a quantity between 0 and {limits.max} {row.unit}.</p>}
            </div>
          ))}
          {!rows.length && <p className="p-8 text-center text-sm text-muted-foreground">No items selected.</p>}
        </div>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <div className="mr-auto flex items-center gap-1.5 text-sm text-muted-foreground">
            <PackageCheck className="size-4" />
            Issuing <span className="font-medium tabular-nums text-foreground">{totalToIssue}</span> unit{totalToIssue === 1 ? "" : "s"} across {selectedToIssue.length} item{selectedToIssue.length === 1 ? "" : "s"}
            {totalNewDeduction > 0 && <> · <span className="font-medium tabular-nums text-foreground">{totalNewDeduction}</span> newly deducted</>}
          </div>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="bg-green-500 text-white hover:bg-green-600" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Truck className="mr-2 size-4" />}
            {submitting ? "Issuing…" : "Issue selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
