"use client";

import { cn } from "@/lib/utils";
import {
  Button,
} from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Trophy,
} from "lucide-react";
import { useMemo } from "react";
import {
  ErrorsMap,
  PIItem,
  SelectionState,
  SelectionsMap,
} from "../../types/inventory/convertToPO.types";
import {
  fmtMoney,
  getMappingTotal,
  toNum,
} from "../../utils/convertToPO.utils";
import { SupplierQuoteCard } from "./SupplierQuoteCard";

export function ProductQuoteBlock({
  item,
  selections,
  errors,
  expanded,
  onToggleExpand,
  onToggleItem,
  onUpdateField,
  onSelectAll,
  onClearAll,
  onSelectCheapest,
}: {
  item: PIItem;
  selections: SelectionsMap;
  errors: ErrorsMap;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleItem: (vmId: number) => void;
  onUpdateField: (
    vmId: number,
    field: keyof SelectionState,
    value: string
  ) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSelectCheapest: () => void;
}) {
  const checkedInItem = item.vendorMappings.filter(
    (vm) => selections[vm.id]?.checked
  ).length;

  const hasErrors = item.vendorMappings.some((vm) => errors[vm.id]);

  const cheapestId = useMemo(() => {
    let cheapest: number | null = null;
    let cheapestAmount = Infinity;

    for (const vm of item.vendorMappings) {
      const totals = getMappingTotal(vm, selections[vm.id]);
      const total = totals.totalAmount || toNum((vm as any).total_amount);

      if (total > 0 && total < cheapestAmount) {
        cheapest = vm.id;
        cheapestAmount = total;
      }
    }

    return cheapest;
  }, [item.vendorMappings, selections]);

  const selectedTotal = item.vendorMappings.reduce((sum, vm) => {
    const sel = selections[vm.id];
    if (!sel?.checked) return sum;

    return sum + getMappingTotal(vm, sel).totalAmount;
  }, 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[28px] border bg-background shadow-sm transition-all",
        hasErrors ? "border-red-300" : "border-border/70"
      )}
    >
      <div
        className={cn(
          "cursor-pointer border-b p-4 transition-colors",
          hasErrors
            ? "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20"
            : "bg-muted/20 hover:bg-muted/40"
        )}
        onClick={onToggleExpand}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
              checkedInItem > 0
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Package size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {item.product.product_name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.product.article_code, item.uom ?? item.product.unit_of_measure]
                    .filter(Boolean)
                    .join(" · ")}
                  {" · "}
                  {item.vendorMappings.length} supplier
                  {item.vendorMappings.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {checkedInItem > 0 && (
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {checkedInItem} selected
                  </span>
                )}

                {selectedTotal > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {fmtMoney(selectedTotal)}
                  </span>
                )}

                {hasErrors && (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-black text-red-600">
                    !
                  </span>
                )}

                {expanded ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-xl text-xs"
              onClick={onSelectAll}
            >
              Select All
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-xl text-xs"
              onClick={onClearAll}
            >
              Clear
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-xl border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
              onClick={onSelectCheapest}
            >
              <Trophy size={13} className="mr-1.5" />
              Select Cheapest
            </Button>
          </div>

          <div className="grid gap-3">
            {item.vendorMappings.map((vm) => {
              const sel =
                selections[vm.id] ?? {
                  checked: false,
                  ordered_qty: "",
                  mrp: "",
                  discount_pct: "0",
                  unit_price: "",
                  tax_pct: "",
                  cgst_pct: "",
                  sgst_pct: "",
                  igst_pct: "",
                  uom: "",
                  expected_delivery_date: "",
                  remarks: "",
                };

              const rowError = errors[vm.id];
              const totals = getMappingTotal(vm, sel);
              const isBestPrice = cheapestId === vm.id;

              return (
                <SupplierQuoteCard
                  key={vm.id}
                  vm={vm}
                  selection={sel}
                  errors={rowError}
                  totals={totals}
                  isBestPrice={isBestPrice}
                  onToggle={() => onToggleItem(vm.id)}
                  onUpdateField={(field, value) =>
                    onUpdateField(vm.id, field, value)
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}