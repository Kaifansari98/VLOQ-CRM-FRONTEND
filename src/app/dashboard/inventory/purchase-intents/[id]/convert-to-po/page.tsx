"use client";

import {
  getPIForConversion,
  convertPIToPO,
} from "@/api/purchaseOrder/purchaseOrder";
import {
  fetchPIPaymentTerms,
  PaymentTermOption,
} from "@/api/inventory/purchaseIntent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  ArrowLeft,
  CheckSquare,
  Loader2,
  Package,
  Save,
  ShoppingCart,
  Square,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type SelectionState = {
  checked: boolean;

  ordered_qty: string;
  mrp: string;
  discount_pct: string;
  unit_price: string;

  tax_pct: string;
  cgst_pct: string;
  sgst_pct: string;
  igst_pct: string;

  amount: number;
  tax_amount: number;
  total_amount: number;

  uom: string;
  expected_delivery_date: string;
  remarks: string;

  payment_term_id: string;
};

type SelectionsMap = Record<number, SelectionState>;
type SelectedRow = {
  item: any;
  vm: any;
  selection: SelectionState;
};

const inputClass =
  "h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300";

const n = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const fmtMoney = (value: any) => {
  const num = n(value);

  return num > 0
    ? `₹${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "₹0.00";
};

const fmt = (iso: string | null | undefined) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateTotals = (sel: SelectionState) => {
  const qty = n(sel.ordered_qty);
  const mrp = n(sel.mrp);
  const discount = n(sel.discount_pct);
  const manualRate = n(sel.unit_price);

  const rate =
    manualRate > 0
      ? manualRate
      : mrp > 0
        ? mrp - (mrp * discount) / 100
        : 0;

  const amount = qty * rate;
  const taxAmount = (amount * n(sel.tax_pct)) / 100;
  const totalAmount = amount + taxAmount;

  return {
    amount: Number(amount.toFixed(2)),
    tax_amount: Number(taxAmount.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2)),
  };
};

const getInitialSelection = (
  vm: any,
  itemUom?: string | null,
  productUom?: string | null
): SelectionState => {
  const base: SelectionState = {
    checked: false,

    ordered_qty: vm.required_qty ? String(parseFloat(vm.required_qty)) : "",
    mrp: vm.mrp ? String(parseFloat(vm.mrp)) : "",
    discount_pct: vm.discount_pct ? String(parseFloat(vm.discount_pct)) : "0",
    unit_price: vm.rate
      ? String(parseFloat(vm.rate))
      : vm.estimated_price
        ? String(parseFloat(vm.estimated_price))
        : "",

    tax_pct: vm.tax_pct ? String(parseFloat(vm.tax_pct)) : "",
    cgst_pct: vm.cgst_pct ? String(parseFloat(vm.cgst_pct)) : "",
    sgst_pct: vm.sgst_pct ? String(parseFloat(vm.sgst_pct)) : "",
    igst_pct: vm.igst_pct ? String(parseFloat(vm.igst_pct)) : "",

    amount: 0,
    tax_amount: 0,
    total_amount: 0,

    uom: itemUom || productUom || "",
    expected_delivery_date: vm.required_by_date
      ? String(vm.required_by_date).slice(0, 10)
      : "",
    remarks: vm.remarks || "",

    payment_term_id: vm.payment_term_id ? String(vm.payment_term_id) : "",
  };

  return {
    ...base,
    ...calculateTotals(base),
  };
};

export default function ConvertPIToPOPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const { id } = useParams<{ id: string }>();
  const piId = Number(id);
  const router = useRouter();

  const [pi, setPi] = useState<any>(null);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);
  const [selections, setSelections] = useState<SelectionsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vendorId || !piId) return;

    setLoading(true);

    Promise.all([
      getPIForConversion(vendorId, piId),
      fetchPIPaymentTerms(vendorId),
    ])
      .then(([data, terms]) => {
        setPi(data);
        setPaymentTerms(terms ?? []);

        const init: SelectionsMap = {};

        for (const item of data.items ?? []) {
          for (const vm of item.vendorMappings ?? []) {
            init[vm.id] = getInitialSelection(
              vm,
              item.uom,
              item.product?.unit_of_measure
            );
          }
        }

        setSelections(init);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to load purchase intent",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [vendorId, piId]);

  const selectedRows = useMemo<SelectedRow[]>(() => {
    if (!pi) return [];

    return (pi.items ?? []).flatMap((item: any) =>
      (item.vendorMappings ?? [])
        .filter((vm: any) => selections[vm.id]?.checked)
        .map((vm: any) => ({
          item,
          vm,
          selection: selections[vm.id],
        }))
    );
  }, [pi, selections]);

  const totals = useMemo(() => {
    return selectedRows.reduce(
      (
        sum: { amount: number; tax_amount: number; total_amount: number },
        row: any,
      ) => {
        sum.amount += n(row.selection.amount);
        sum.tax_amount += n(row.selection.tax_amount);
        sum.total_amount += n(row.selection.total_amount);
        return sum;
      },
      {
        amount: 0,
        tax_amount: 0,
        total_amount: 0,
      }
    );
  }, [selectedRows]);

  const updateField = (
  mappingId: number,
  field: keyof SelectionState,
  value: string | boolean
) => {
  setSelections((prev) => {
    const current = prev[mappingId];
    if (!current) return prev;

    // Checkbox should not run calculation
    if (field === "checked") {
      return {
        ...prev,
        [mappingId]: {
          ...current,
          checked: Boolean(value),
        },
      };
    }

    const next: SelectionState = {
      ...current,
      [field]: String(value),
    };

    const calculated = calculateTotals(next);

    return {
      ...prev,
      [mappingId]: {
        ...next,
        ...calculated,
      },
    };
  });
};

  const toggleAllForProduct = (item: any, checked: boolean) => {
    setSelections((prev) => {
      const next = { ...prev };

      for (const vm of item.vendorMappings ?? []) {
        if (next[vm.id]) {
          next[vm.id] = {
            ...next[vm.id],
            checked,
          };
        }
      }

      return next;
    });
  };

  const validate = () => {
    if (!selectedRows.length) {
      toastManager.add({
        title: "Please select at least one supplier row",
        type: "error",
      });
      return false;
    }

    for (const row of selectedRows) {
      const sel = row.selection;

      if (!sel.ordered_qty || n(sel.ordered_qty) <= 0) {
        toastManager.add({
          title: "Ordered qty is required for selected rows",
          type: "error",
        });
        return false;
      }

      if (!sel.unit_price || n(sel.unit_price) <= 0) {
        toastManager.add({
          title: "Rate is required for selected rows",
          type: "error",
        });
        return false;
      }

      if (!sel.payment_term_id) {
        toastManager.add({
          title: "Payment term is required for selected rows",
          type: "error",
        });
        return false;
      }
    }

    return true;
  };

  const handleCreatePO = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const payload = {
        vendor_id: vendorId,
        user_id: userId,
        purchase_intent_id: piId,
        remarks: pi?.remarks || undefined,

        selections: selectedRows.map(({ item, vm, selection }) => ({
          pi_item_vendor_mapping_id: vm.id,
          company_vendor_id: vm.company_vendor_id,
          product_id: item.product_id,

          payment_term_id: selection.payment_term_id
            ? Number(selection.payment_term_id)
            : null,
          paymentTerm: vm.paymentTerm
            ? {
                id: vm.paymentTerm.id,
                term_name: vm.paymentTerm.term_name,
                description: vm.paymentTerm.description ?? null,
                company_vendor_id: vm.company_vendor_id ?? null,
              }
            : null,

          ordered_qty: n(selection.ordered_qty),
          unit_price: n(selection.unit_price),
          uom: selection.uom || undefined,
          expected_delivery_date: selection.expected_delivery_date || undefined,
          remarks: selection.remarks || undefined,

          mrp: n(selection.mrp) || undefined,
          discount_pct: n(selection.discount_pct) || undefined,
          rate: n(selection.unit_price) || undefined,

          tax_pct: n(selection.tax_pct) || undefined,
          cgst_pct: n(selection.cgst_pct) || undefined,
          sgst_pct: n(selection.sgst_pct) || undefined,
          igst_pct: n(selection.igst_pct) || undefined,

          amount: selection.amount,
          tax_amount: selection.tax_amount,
          total_amount: selection.total_amount,
        })),
      };

      const result = await convertPIToPO(vendorId, payload);

      toastManager.add({
        title: `${result.count} PO${result.count > 1 ? "s" : ""} created successfully`,
        type: "success",
      });

      router.push("/dashboard/inventory/purchase-orders");
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create PO",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/inventory/purchase-intents">
                  Purchase Intents
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Convert to PO</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/inventory/purchase-intents/${piId}`)
                  }
                >
                  <ArrowLeft size={14} className="mr-1" />
                  Back
                </Button>
              </div>

              <h1 className="text-xl font-bold">
                Convert PI to PO {pi?.intent_no ? `- ${pi.intent_no}` : ""}
              </h1>

              <p className="text-sm text-muted-foreground">
                Select supplier rows and confirm quantity, payment term, rate and delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border bg-muted/30 px-4 py-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Selected Total
                </p>
                <p className="text-lg font-bold text-indigo-600">
                  {fmtMoney(totals.total_amount)}
                </p>
              </div>

              <Button
                type="button"
                disabled={saving || selectedRows.length === 0}
                onClick={handleCreatePO}
              >
                {saving ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <Save size={14} className="mr-1" />
                )}
                Create PO
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
          ) : !pi ? (
            <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground">
              Failed to load purchase intent.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryBox label="Intent No" value={pi.intent_no} />
                <SummaryBox label="Products" value={pi.items?.length ?? 0} />
                <SummaryBox label="Selected Rows" value={selectedRows.length} />
                <SummaryBox label="Selected Amount" value={fmtMoney(totals.total_amount)} />
              </div>

              <div className="space-y-4">
                {(pi.items ?? []).map((item: any) => {
                  const mappings = item.vendorMappings ?? [];
                  const selectedCount = mappings.filter(
                    (vm: any) => selections[vm.id]?.checked
                  ).length;

                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-2xl border bg-background shadow-sm"
                    >
                      <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                            <Package size={18} />
                          </div>

                          <div>
                            <p className="font-bold">
                              {item.product?.product_name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[item.product?.article_code, item.uom]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {selectedCount}/{mappings.length} selected
                          </span>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAllForProduct(item, true)}
                          >
                            Select All
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAllForProduct(item, false)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1450px] text-xs">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="px-3 py-3 text-center">Select</th>
                              <th className="px-3 py-3 text-left">Supplier</th>
                              <th className="px-3 py-3 text-left">Supplier Code</th>
                              <th className="px-3 py-3 text-left">Payment Term *</th>
                              <th className="px-3 py-3 text-right">Qty *</th>
                              <th className="px-3 py-3 text-left">Delivery</th>
                              <th className="px-3 py-3 text-right">MRP</th>
                              <th className="px-3 py-3 text-right">Disc %</th>
                              <th className="px-3 py-3 text-right">Rate *</th>
                              <th className="px-3 py-3 text-right">Base</th>
                              <th className="px-3 py-3 text-right">GST %</th>
                              <th className="px-3 py-3 text-right">Tax</th>
                              <th className="px-3 py-3 text-right">Total</th>
                              <th className="px-3 py-3 text-left">Remarks</th>
                            </tr>
                          </thead>

                          <tbody>
                            {mappings.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={14}
                                  className="px-3 py-8 text-center text-muted-foreground"
                                >
                                  No supplier quotations found.
                                </td>
                              </tr>
                            ) : (
                              mappings.map((vm: any) => {
                                const sel = selections[vm.id];
                                if (!sel) return null;

                                const availablePaymentTerms = paymentTerms.filter(
                                  (term) =>
                                    term.company_vendor_id === null ||
                                    Number(term.company_vendor_id) ===
                                      Number(vm.company_vendor_id)
                                );

                                const hasPiTerm =
                                  vm.paymentTerm &&
                                  !availablePaymentTerms.some(
                                    (term) =>
                                      Number(term.id) === Number(vm.paymentTerm.id)
                                  );

                                const finalTerms = hasPiTerm
                                  ? [vm.paymentTerm, ...availablePaymentTerms]
                                  : availablePaymentTerms;

                                return (
                                  <tr
                                    key={vm.id}
                                    className={
                                      sel.checked
                                        ? "border-t bg-indigo-50/40 dark:bg-indigo-950/20"
                                        : "border-t"
                                    }
                                  >
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateField(vm.id, "checked", !sel.checked)
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                                      >
                                        {sel.checked ? (
                                          <CheckSquare
                                            size={17}
                                            className="text-indigo-600"
                                          />
                                        ) : (
                                          <Square
                                            size={17}
                                            className="text-muted-foreground"
                                          />
                                        )}
                                      </button>
                                    </td>

                                    <td className="px-3 py-2 font-medium">
                                      {vm.companyVendor?.company_name ?? "—"}
                                    </td>

                                    <td className="px-3 py-2">
                                      {vm.companyVendor?.vendor_code ?? "—"}
                                    </td>

                                    <td className="px-3 py-2">
                                      <select
                                        value={sel.payment_term_id}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "payment_term_id",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                      >
                                        <option value="">Select</option>
                                        {finalTerms.map((term: any) => (
                                          <option key={term.id} value={term.id}>
                                            {term.term_name}
                                            {Number(term.id) ===
                                            Number(vm.payment_term_id)
                                              ? " · PI Selected"
                                              : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        value={sel.ordered_qty}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "ordered_qty",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        type="date"
                                        value={sel.expected_delivery_date}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "expected_delivery_date",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        value={sel.mrp}
                                        onChange={(e) =>
                                          updateField(vm.id, "mrp", e.target.value)
                                        }
                                        className={inputClass}
                                      />
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        value={sel.discount_pct}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "discount_pct",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        value={sel.unit_price}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "unit_price",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </td>

                                    <td className="px-3 py-2 text-right font-medium">
                                      {fmtMoney(sel.amount)}
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        value={sel.tax_pct}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "tax_pct",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </td>

                                    <td className="px-3 py-2 text-right font-medium">
                                      {fmtMoney(sel.tax_amount)}
                                    </td>

                                    <td className="px-3 py-2 text-right font-bold text-indigo-600">
                                      {fmtMoney(sel.total_amount)}
                                    </td>

                                    <td className="px-3 py-2">
                                      <input
                                        value={sel.remarks}
                                        onChange={(e) =>
                                          updateField(
                                            vm.id,
                                            "remarks",
                                            e.target.value
                                          )
                                        }
                                        className={inputClass}
                                        placeholder="Remarks"
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-4 z-20 rounded-2xl border bg-background p-4 shadow-xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold">
                      Selected {selectedRows.length} supplier row(s)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Base {fmtMoney(totals.amount)} · Tax{" "}
                      {fmtMoney(totals.tax_amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Grand Total
                      </p>
                      <p className="text-xl font-bold text-indigo-600">
                        {fmtMoney(totals.total_amount)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={saving || selectedRows.length === 0}
                      onClick={handleCreatePO}
                    >
                      {saving ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : (
                        <ShoppingCart size={14} className="mr-1" />
                      )}
                      Create PO
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
