"use client";

import {
  getPIForConversion,
  convertPIToPO,
  PIForConversion,
  ConversionSelection,
} from "@/api/purchaseOrder/purchaseOrder";
import { toastManager } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Calendar,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import {
  ErrorsMap,
  PIItem,
  SelectionState,
  SelectionsMap,
  ConversionSummaryData,
} from "../../types/inventory/convertToPO.types";
import {
  calculateRateFromMrpDiscount,
  fmtMoney,
  getInitialSelectionFromMapping,
  getMappingTotal,
  toNum,
} from "../../utils/convertToPO.utils";
import { ProductQuoteBlock } from "./ProductQuoteBlock";
import { ConversionSummary } from "./ConversionSummary";

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3 text-center">
      <p className="text-[9px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xs font-black">{value}</p>
    </div>
  );
}

export default function ConvertToPOModal({
  piId,
  intentNo,
  onClose,
  onSuccess,
}: {
  piId: number;
  intentNo: string;
  onClose: () => void;
  onSuccess: (pos: { id: number; po_no: string }[]) => void;
}) {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));

  const [pi, setPi] = useState<PIForConversion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selections, setSelections] = useState<SelectionsMap>({});
  const [errors, setErrors] = useState<ErrorsMap>({});
  const [globalDate, setGlobalDate] = useState("");
  const [globalRemark, setGlobalRemark] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getPIForConversion(vendorId, piId)
      .then((data) => {
        setPi(data);

        const init: SelectionsMap = {};
        const exp: Record<number, boolean> = {};

        for (const item of data.items) {
          exp[item.id] = true;

          for (const vm of item.vendorMappings) {
            init[vm.id] = getInitialSelectionFromMapping(
              vm,
              item.uom,
              item.product.unit_of_measure
            );
          }
        }

        setSelections(init);
        setExpanded(exp);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to load intent",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [vendorId, piId]);

  const toggleMapping = useCallback((vmId: number) => {
    setSelections((prev) => ({
      ...prev,
      [vmId]: {
        ...prev[vmId],
        checked: !prev[vmId]?.checked,
      },
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[vmId];
      return next;
    });
  }, []);

  const updateField = useCallback(
    (vmId: number, field: keyof SelectionState, value: string) => {
      setSelections((prev) => {
        const current = prev[vmId];

        const nextRow: SelectionState = {
          ...current,
          [field]: value,
        };

        if (field === "mrp" || field === "discount_pct") {
          const mrp = field === "mrp" ? toNum(value) : toNum(current.mrp);
          const discount =
            field === "discount_pct"
              ? toNum(value)
              : toNum(current.discount_pct);

          const rate = calculateRateFromMrpDiscount(mrp, discount);

          nextRow.unit_price = rate > 0 ? rate.toFixed(2) : "";
        }

        return {
          ...prev,
          [vmId]: nextRow,
        };
      });

      if (field === "ordered_qty" || field === "expected_delivery_date") {
        setErrors((prev) => {
          const next = { ...prev };

          if (next[vmId]) {
            delete (next[vmId] as any)[field];

            if (!Object.keys(next[vmId]).length) {
              delete next[vmId];
            }
          }

          return next;
        });
      }
    },
    []
  );

  const setAllForProduct = (item: PIItem, checked: boolean) => {
    setSelections((prev) => {
      const next = { ...prev };

      for (const vm of item.vendorMappings) {
        next[vm.id] = {
          ...next[vm.id],
          checked,
        };
      }

      return next;
    });
  };

  const selectCheapestForProduct = (item: PIItem) => {
    if (!item.vendorMappings.length) return;

    let cheapestId: number | null = null;
    let cheapestAmount = Infinity;

    for (const vm of item.vendorMappings) {
      const totals = getMappingTotal(vm, selections[vm.id]);
      const amount = totals.totalAmount || toNum((vm as any).total_amount);

      if (amount > 0 && amount < cheapestAmount) {
        cheapestId = vm.id;
        cheapestAmount = amount;
      }
    }

    if (!cheapestId) return;

    setSelections((prev) => {
      const next = { ...prev };

      for (const vm of item.vendorMappings) {
        next[vm.id] = {
          ...next[vm.id],
          checked: vm.id === cheapestId,
        };
      }

      return next;
    });
  };

  const applyGlobalDate = () => {
    if (!globalDate) return;

    setSelections((prev) => {
      const next = { ...prev };

      for (const [id, sel] of Object.entries(next)) {
        if (sel.checked) {
          next[Number(id)] = {
            ...sel,
            expected_delivery_date: globalDate,
          };
        }
      }

      return next;
    });

    toastManager.add({
      title: "Delivery date applied to selected rows",
      type: "success",
    });
  };

  const clearAll = () => {
    setSelections((prev) => {
      const next = { ...prev };

      for (const id of Object.keys(next)) {
        next[Number(id)] = {
          ...next[Number(id)],
          checked: false,
        };
      }

      return next;
    });

    setErrors({});
  };

  const checkedCount = Object.values(selections).filter((s) => s.checked).length;

  const summary: ConversionSummaryData = useMemo(() => {
    if (!pi) {
      return {
        selectedRows: 0,
        poCount: 0,
        amount: 0,
        taxAmount: 0,
        totalAmount: 0,
        poPreview: [],
      };
    }

    const byVendor = new Map<
      number,
      {
        company_vendor_id: number;
        vendorName: string;
        vendorCode: string;
        items: number;
        amount: number;
        taxAmount: number;
        totalAmount: number;
      }
    >();

    let amount = 0;
    let taxAmount = 0;
    let totalAmount = 0;
    let selectedRows = 0;

    for (const item of pi.items) {
      for (const vm of item.vendorMappings) {
        const sel = selections[vm.id];

        if (!sel?.checked) continue;

        const totals = getMappingTotal(vm, sel);

        selectedRows++;
        amount += totals.amount;
        taxAmount += totals.taxAmount;
        totalAmount += totals.totalAmount;

        if (!byVendor.has(vm.company_vendor_id)) {
          byVendor.set(vm.company_vendor_id, {
            company_vendor_id: vm.company_vendor_id,
            vendorName: vm.companyVendor.company_name,
            vendorCode: vm.companyVendor.vendor_code,
            items: 0,
            amount: 0,
            taxAmount: 0,
            totalAmount: 0,
          });
        }

        const vendor = byVendor.get(vm.company_vendor_id)!;
        vendor.items += 1;
        vendor.amount += totals.amount;
        vendor.taxAmount += totals.taxAmount;
        vendor.totalAmount += totals.totalAmount;
      }
    }

    return {
      selectedRows,
      poCount: byVendor.size,
      amount,
      taxAmount,
      totalAmount,
      poPreview: [...byVendor.values()],
    };
  }, [pi, selections]);

  const validate = (): boolean => {
    const checked = Object.entries(selections).filter(([, s]) => s.checked);

    if (!checked.length) return false;

    const nextErrors: ErrorsMap = {};
    let valid = true;

    for (const [id, sel] of checked) {
      const rowError: any = {};

      if (!sel.ordered_qty || Number(sel.ordered_qty) <= 0) {
        rowError.ordered_qty = "Required";
        valid = false;
      }

      if (!sel.expected_delivery_date) {
        rowError.expected_delivery_date = "Required";
        valid = false;
      }

      if (Object.keys(rowError).length) {
        nextErrors[Number(id)] = rowError;
      }
    }

    setErrors(nextErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toastManager.add({
        title: "Fill all required fields for selected rows",
        type: "error",
      });
      return;
    }

    if (!pi) return;

    const convSelections: ConversionSelection[] = [];

    for (const item of pi.items) {
      for (const vm of item.vendorMappings) {
        const sel = selections[vm.id];

        if (!sel?.checked) continue;

        const totals = getMappingTotal(vm, sel);

        convSelections.push({
          pi_item_vendor_mapping_id: vm.id,
          company_vendor_id: vm.company_vendor_id,
          product_id: item.product_id,
          ordered_qty: Number(sel.ordered_qty),

          unit_price: sel.unit_price ? Number(sel.unit_price) : undefined,
          uom: sel.uom || undefined,
          expected_delivery_date: sel.expected_delivery_date || undefined,
          remarks: sel.remarks || undefined,

          mrp: sel.mrp ? Number(sel.mrp) : undefined,
          discount_pct: sel.discount_pct ? Number(sel.discount_pct) : undefined,
          rate: sel.unit_price ? Number(sel.unit_price) : undefined,

          tax_pct: sel.tax_pct ? Number(sel.tax_pct) : undefined,
          cgst_pct: sel.cgst_pct ? Number(sel.cgst_pct) : undefined,
          sgst_pct: sel.sgst_pct ? Number(sel.sgst_pct) : undefined,
          igst_pct: sel.igst_pct ? Number(sel.igst_pct) : undefined,

          amount: totals.amount,
          tax_amount: totals.taxAmount,
          total_amount: totals.totalAmount,
        } as any);
      }
    }

    setSubmitting(true);

    try {
      const result = await convertPIToPO(vendorId, {
        purchase_intent_id: piId,
        user_id: userId,
        expected_delivery_date: globalDate || undefined,
        remarks: globalRemark || undefined,
        selections: convSelections,
      });

      toastManager.add({
        title: `${result.count} Purchase Order${
          result.count > 1 ? "s" : ""
        } created!`,
        type: "success",
      });

      onSuccess(result.purchase_orders);
    } catch {
      toastManager.add({
        title: "Failed to create purchase orders",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[95vh] w-full flex-col overflow-hidden border bg-zinc-50 shadow-2xl dark:bg-zinc-950 sm:max-w-6xl sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b bg-background px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                <ShoppingCart size={21} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-black">
                    Convert to Purchase Orders
                  </p>
                  <span className="rounded-full border bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                    {intentNo}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Edit price, discount, tax and create supplier-wise POs.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-[28px]" />
          </div>
        ) : !pi ? (
          <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
            <AlertCircle size={20} className="mr-2" />
            Failed to load purchase intent.
          </div>
        ) : (
          <>
            <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_340px]">
              <div className="flex min-w-0 flex-col overflow-hidden">
                <div className="shrink-0 border-b bg-background px-5 py-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl text-xs"
                        onClick={() => {
                          pi.items.forEach((item) => setAllForProduct(item, true));
                        }}
                      >
                        <CheckCircle2 size={14} className="mr-1.5" />
                        Select All
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl text-xs"
                        onClick={clearAll}
                      >
                        <RotateCcw size={14} className="mr-1.5" />
                        Clear
                      </Button>

                      <div className="hidden h-5 w-px bg-border sm:block" />

                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted-foreground" />
                        <input
                          type="date"
                          value={globalDate}
                          onChange={(e) => setGlobalDate(e.target.value)}
                          className="h-9 rounded-xl border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        {globalDate && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-50"
                            onClick={applyGlobalDate}
                          >
                            Apply Date
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="relative w-full xl:w-80">
                      <MessageSquare
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        value={globalRemark}
                        onChange={(e) => setGlobalRemark(e.target.value)}
                        placeholder="Overall PO remarks..."
                        className="h-9 w-full rounded-xl border bg-muted/30 pl-9 pr-3 text-xs outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="space-y-4">
                    {pi.items.map((item) => (
                      <ProductQuoteBlock
                        key={item.id}
                        item={item}
                        selections={selections}
                        errors={errors}
                        expanded={!!expanded[item.id]}
                        onToggleExpand={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        onToggleItem={toggleMapping}
                        onUpdateField={updateField}
                        onSelectAll={() => setAllForProduct(item, true)}
                        onClearAll={() => setAllForProduct(item, false)}
                        onSelectCheapest={() => selectCheapestForProduct(item)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <aside className="hidden min-h-0 border-l bg-background lg:block">
                <div className="h-full min-h-0">
                <ConversionSummary
                  summary={summary}
                  checkedCount={checkedCount}
                  submitting={submitting}
                  onClose={onClose}
                  onSubmit={handleSubmit}
                />
                </div>
              </aside>
            </div>

            <div className="shrink-0 border-t bg-background p-4 lg:hidden">
              <div className="mb-3 grid grid-cols-3 gap-2">
                <MiniStat label="Rows" value={summary.selectedRows} />
                <MiniStat label="POs" value={summary.poCount} />
                <MiniStat label="Total" value={fmtMoney(summary.totalAmount)} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {checkedCount} selected → {summary.poCount} PO
                  {summary.poCount !== 1 ? "s" : ""}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting || checkedCount === 0}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ShoppingCart size={13} />
                    )}
                    {submitting ? "Creating..." : "Create PO"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}