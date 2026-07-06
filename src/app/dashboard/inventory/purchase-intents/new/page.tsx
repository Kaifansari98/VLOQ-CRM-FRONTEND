"use client";

import {

  fetchPIProducts,
  fetchPICompanyVendors,
  fetchCompanyStateId,
  fetchPIPaymentTerms,
  createPurchaseIntent,
  PIPriority,
  PaymentTermOption,
} from "@/api/inventory/purchaseIntent";

import {

  PIProduct,
  PICompanyVendor,
  VendorEntry,
  recalcVendorEntry,
  emptyVendorEntry,
  toNum,
} from "@/types/inventory/inventory.types";

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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/redux/store";

import {
  Plus,
  Trash2,
  Loader2,
  Send,
  Search,
  Package,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductRow = {
  row_id: string;
  product: PIProduct | null;
  product_id: number | "";
  uom: string;
  remarks: string;
  vendor_entries: VendorEntry[];
};

const PRIORITIES: PIPriority[] = ["Low", "Medium", "High", "Urgent"];

const inputClass =
  "h-9 w-full rounded-lg border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300";

const tableInputClass =
  "h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300";

const toMoney = (value: any) => {
  const n = Number(value || 0);
  if (!n) return "₹0.00";

  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const makeRowId = () => `${Date.now()}-${Math.random()}`;

export default function RaisePurchaseIntentPage() {
  const [supplierPicker, setSupplierPicker] = useState<{
    rowIndex: number;
    vendorIndex: number;
  } | null>(null);
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const router = useRouter();


  
  const [allVendors, setAllVendors] = useState<PICompanyVendor[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);


  const [productSearchMap, setProductSearchMap] = useState<Record<string, string>>({});
  const [productOptionsMap, setProductOptionsMap] = useState<Record<string, PIProduct[]>>({});
  const [openProductBox, setOpenProductBox] = useState<string | null>(null);


  const [priority, setPriority] = useState<PIPriority>("Medium");
  const [remarks, setRemarks] = useState("");
  const [stateId, setStateId] = useState<number>(0);

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!vendorId) return;

    setLoading(true);

    Promise.all([
      fetchCompanyStateId(vendorId),
      fetchPICompanyVendors(vendorId, ""),
      fetchPIPaymentTerms(vendorId),
    ])
      .then(([companyStateId, vendors, terms]) => {
        setStateId(companyStateId);
        setAllVendors(vendors);
        setPaymentTerms(terms ?? []);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to load form data",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [vendorId]);

  const searchProductsForRow = async (rowId: string, search: string) => {
    if (!vendorId) return;

    setProductSearchMap((prev) => ({
      ...prev,
      [rowId]: search,
    }));

    if (!search.trim()) {
      setProductOptionsMap((prev) => ({
        ...prev,
        [rowId]: [],
      }));
      return;
    }

    setProductLoading(true);

    try {
      const result = await fetchPIProducts(
        vendorId,
        undefined,
        search
      );

      setProductOptionsMap((prev) => ({
        ...prev,
        [rowId]: result,
      }));
    } catch {
      toastManager.add({
        title: "Failed to search products",
        type: "error",
      });
    } finally {
      setProductLoading(false);
    }
  };

  const addProductRow = () => {
    setRows((prev) => [
      ...prev,
      {
        row_id: makeRowId(),
        product: null,
        product_id: "",
        uom: "",
        remarks: "",
        vendor_entries: [],
      },
    ]);
  };

  const removeProductRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };


const selectProductForRow = (
  rowIndex: number,
  rowId: string,
  product: PIProduct
) => {
  setRows((prev) => {
    const next = [...prev];
    const row = { ...next[rowIndex] };

    row.product_id = product.id;
    row.product = product;
    row.uom = product.unit_of_measure ?? "";
    row.vendor_entries = [];

    next[rowIndex] = row;
    return next;
  });

  setProductSearchMap((prev) => ({
    ...prev,
    [rowId]: `${product.product_name}${
      product.article_code ? ` - ${product.article_code}` : ""
    }`,
  }));

  setProductOptionsMap((prev) => ({
    ...prev,
    [rowId]: [],
  }));

  setOpenProductBox(null);
};

const updateProductRow = (
  rowIndex: number,
  field: keyof ProductRow,
  value: any
) => {
  setRows((prev) => {
    const next = [...prev];
    const row = { ...next[rowIndex] };

    (row as any)[field] = value;

    next[rowIndex] = row;
    return next;
  });
};



  const addSupplierRow = (rowIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      if (!row.product) {
        toastManager.add({
          title: "Please select product first",
          type: "error",
        });
        return prev;
      }

      const firstVendor = allVendors.find(
        (v) => !row.vendor_entries.some((e) => e.vendor.id === v.id)
      );

      if (!firstVendor) {
        toastManager.add({
          title: "No supplier available",
          type: "error",
        });
        return prev;
      }

      const entry = emptyVendorEntry(firstVendor, row.product);

      entry.payment_term_id = firstVendor.default_payment_term_id
        ? String(firstVendor.default_payment_term_id)
        : "";

      entry.required_qty = "";
      entry.rate = "";

      row.vendor_entries = [...row.vendor_entries, recalcVendorEntry(entry)];
      next[rowIndex] = row;

      const newVendorIndex = row.vendor_entries.length - 1;

      setTimeout(() => {
        setSupplierPicker({
          rowIndex,
          vendorIndex: newVendorIndex,
        });
      }, 0);

      return next;
    });
  };

  const updateSupplierRow = (
    rowIndex: number,
    vendorIndex: number,
    field: keyof VendorEntry,
    value: string
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };
      const entries = [...row.vendor_entries];

      if (field === "vendor" as any) {
        return prev;
      }

      entries[vendorIndex] = recalcVendorEntry({
        ...entries[vendorIndex],
        [field]: value,
      });

      row.vendor_entries = entries;
      next[rowIndex] = row;

      return next;
    });
  };

  const updateSupplierVendor = (
    rowIndex: number,
    vendorIndex: number,
    vendorIdValue: number
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      if (!row.product) return prev;

      const vendor = allVendors.find((v) => v.id === vendorIdValue);
      if (!vendor) return prev;

      const duplicate = row.vendor_entries.some(
        (entry, index) =>
          index !== vendorIndex && Number(entry.vendor.id) === Number(vendor.id)
      );

      if (duplicate) {
        toastManager.add({
          title: "This supplier is already added for this product",
          type: "error",
        });
        return prev;
      }

      let entry = emptyVendorEntry(vendor, row.product);

      entry.payment_term_id = vendor.default_payment_term_id
        ? String(vendor.default_payment_term_id)
        : "";

      const oldEntry = row.vendor_entries[vendorIndex];

      entry = {
        ...entry,
        required_qty: oldEntry.required_qty,
        required_by_date: oldEntry.required_by_date,
        remarks: oldEntry.remarks,
        mrp: oldEntry.mrp,
        discount_pct: oldEntry.discount_pct,
        rate: oldEntry.rate,
      };

      const isSameState = Number(vendor.state_id) === Number(stateId);

      if (isSameState) {
        entry.cgst_pct = String(row.product.cgst_rate || 0);
        entry.sgst_pct = String(row.product.sgst_rate || 0);
        entry.igst_pct = "0";
        entry.tax_pct = String(
          Number(row.product.cgst_rate || 0) +
          Number(row.product.sgst_rate || 0)
        );
      } else {
        entry.cgst_pct = "0";
        entry.sgst_pct = "0";
        entry.igst_pct = String(row.product.tax_pct || 0);
        entry.tax_pct = String(row.product.tax_pct || 0);
      }

      row.vendor_entries[vendorIndex] = recalcVendorEntry(entry);
      next[rowIndex] = row;

      return next;
    });
  };

  const removeSupplierRow = (rowIndex: number, vendorIndex: number) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[rowIndex] };

      row.vendor_entries = row.vendor_entries.filter(
        (_, index) => index !== vendorIndex
      );

      next[rowIndex] = row;
      return next;
    });
  };

  const grandTotal = useMemo(() => {
    return rows.reduce((sum, row) => {
      return (
        sum +
        row.vendor_entries.reduce(
          (innerSum, entry) => innerSum + toNum(entry.total_amount),
          0
        )
      );
    }, 0);
  }, [rows]);

  const validate = () => {


    if (!rows.length) {
      toastManager.add({
        title: "Please add at least one product",
        type: "error",
      });
      return false;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.product_id || !row.product) {
        toastManager.add({
          title: `Please select product in row ${i + 1}`,
          type: "error",
        });
        return false;
      }

      if (!row.uom.trim()) {
        toastManager.add({
          title: `Please enter UOM in row ${i + 1}`,
          type: "error",
        });
        return false;
      }

      if (!row.vendor_entries.length) {
        toastManager.add({
          title: `Please add supplier in row ${i + 1}`,
          type: "error",
        });
        return false;
      }

      for (let j = 0; j < row.vendor_entries.length; j++) {
        const vendor = row.vendor_entries[j];

        if (!vendor.vendor?.id) {
          toastManager.add({
            title: `Please select supplier in row ${i + 1}`,
            type: "error",
          });
          return false;
        }

        if (!vendor.required_qty || toNum(vendor.required_qty) <= 0) {
          toastManager.add({
            title: `Please enter qty in row ${i + 1}, supplier ${j + 1}`,
            type: "error",
          });
          return false;
        }

        if (!vendor.rate || toNum(vendor.rate) <= 0) {
          toastManager.add({
            title: `Please enter rate in row ${i + 1}, supplier ${j + 1}`,
            type: "error",
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      await createPurchaseIntent(vendorId, {
        category_id: rows[0]?.product?.category_id
          ? Number(rows[0].product.category_id)
          : undefined,
        user_id: userId,
        priority,
        remarks: remarks || undefined,
        items: rows.map((row) => ({
          product_id: Number(row.product_id),
          uom: row.uom || undefined,
          remarks: row.remarks || undefined,
          vendors: row.vendor_entries.map((entry) => ({
            company_vendor_id: entry.vendor.id,

            payment_term_id: entry.payment_term_id
              ? Number(entry.payment_term_id)
              : null,

            required_qty: toNum(entry.required_qty),
            required_by_date: entry.required_by_date || undefined,
            remarks: entry.remarks || undefined,

            estimated_price: toNum(entry.rate) || undefined,

            mrp: toNum(entry.mrp) || null,
            discount_pct: toNum(entry.discount_pct) || null,
            rate: toNum(entry.rate) || null,
            tax_pct: toNum(entry.tax_pct) || null,
            cgst_pct: toNum(entry.cgst_pct) || null,
            sgst_pct: toNum(entry.sgst_pct) || null,
            igst_pct: toNum(entry.igst_pct) || null,
            tax_amount: toNum(entry.tax_amount) || null,
            amount: toNum(entry.amount) || null,
            total_amount: toNum(entry.total_amount) || null,
          })),
        })),
      });

      toastManager.add({
        title: "Purchase Intent created successfully",
        type: "success",
      });

      router.push("/dashboard/inventory/purchase-intents");
    } catch (error) {
      toastManager.add({
        title: "Failed to create purchase intent",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openSupplierPicker = (rowIndex: number, vendorIndex: number) => {
    setSupplierPicker({
      rowIndex,
      vendorIndex,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
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
                <BreadcrumbPage>Raise Intent</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold">Raise Purchase Intent</h1>
            <p className="text-sm text-muted-foreground">
              Add products and supplier quotation in a simple table.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/inventory/purchase-intents")}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Submit Intent
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl border bg-card p-4">
              <div className="mb-4 rounded-xl border bg-card p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PIPriority)}
                      className={inputClass}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Total
                    </label>
                    <div className="flex h-9 items-center rounded-lg border bg-muted/30 px-3 text-sm font-bold text-indigo-600">
                      {toMoney(grandTotal)}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Overall Remarks
                    </label>
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional remarks"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Products & Suppliers</p>
                <p className="text-xs text-muted-foreground">
                  Use one product row and add supplier rows below it.
                </p>
              </div>

              <Button type="button" size="sm" onClick={addProductRow}>
                <Plus size={14} className="mr-1" />
                Add Product Row
              </Button>
            </div>

            {rows.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center">
                <Package size={32} className="mb-2 text-muted-foreground/40" />
                <p className="text-sm font-semibold">No product added</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Click Add Product Row to start.
                </p>
                <Button type="button" size="sm" onClick={addProductRow}>
                  <Plus size={14} className="mr-1" />
                  Add Product Row
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((row, rowIndex) => (
                  <div
                    key={row.row_id}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="border-b bg-muted/30 p-3">
                      <div className="grid gap-2 md:grid-cols-[2fr_120px_1fr_40px]">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold">
                            Product *
                          </label>
                          <ProductAutocomplete
                            rowId={row.row_id}
                            value={productSearchMap[row.row_id] || ""}
                            open={openProductBox === row.row_id}
                            loading={productLoading}
                            options={productOptionsMap[row.row_id] || []}
                            onFocus={() => setOpenProductBox(row.row_id)}
                            onChange={(value) => {
                              setOpenProductBox(row.row_id);
                              searchProductsForRow(row.row_id, value);
                            }}
                            onSelect={(product) =>
  selectProductForRow(rowIndex, row.row_id, product)
}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold">
                            UOM *
                          </label>
                          <input
                            value={row.uom}
                            onChange={(e) =>
                              updateProductRow(rowIndex, "uom", e.target.value)
                            }
                            className={inputClass}
                            placeholder="UOM"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold">
                            Product Remark
                          </label>
                          <input
                            value={row.remarks}
                            onChange={(e) =>
                              updateProductRow(
                                rowIndex,
                                "remarks",
                                e.target.value
                              )
                            }
                            className={inputClass}
                            placeholder="Optional"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 text-red-600"
                            onClick={() => removeProductRow(rowIndex)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1100px] text-xs">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-2 py-2 text-left">Supplier *</th>
                            <th className="px-2 py-2 text-left">Payment Term</th>
                            <th className="px-2 py-2 text-left">Qty *</th>
                            <th className="px-2 py-2 text-left">Req. Date</th>
                            <th className="px-2 py-2 text-left">MRP</th>
                            <th className="px-2 py-2 text-left">Disc %</th>
                            <th className="px-2 py-2 text-left">Rate *</th>
                            <th className="px-2 py-2 text-left">GST %</th>
                            <th className="px-2 py-2 text-left">Tax Amt</th>
                            <th className="px-2 py-2 text-left">Total</th>
                            <th className="px-2 py-2 text-left">Remark</th>
                            <th className="px-2 py-2 text-center">Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {row.vendor_entries.length === 0 ? (
                            <tr>
                              <td
                                colSpan={12}
                                className="px-3 py-8 text-center text-muted-foreground"
                              >
                                No supplier added.
                              </td>
                            </tr>
                          ) : (
                            row.vendor_entries.map((entry, vendorIndex) => {
                              const usedVendorIds = row.vendor_entries
                                .map((e, index) =>
                                  index === vendorIndex ? null : e.vendor.id
                                )
                                .filter(Boolean);

                              const availableVendors = allVendors.filter(
                                (vendor) => !usedVendorIds.includes(vendor.id)
                              );

                              const availablePaymentTerms = paymentTerms.filter(
                                (term) =>
                                  term.company_vendor_id === null ||
                                  Number(term.company_vendor_id) ===
                                  Number(entry.vendor.id)
                              );

                              return (
                                <tr
                                  key={`${entry.vendor.id}-${vendorIndex}`}
                                  className="border-t"
                                >
                                  <td className="px-2 py-2">
                                    <button
                                      type="button"
                                      onClick={() => openSupplierPicker(rowIndex, vendorIndex)}
                                      className="flex h-8 w-[240px] items-center justify-between rounded-md border bg-background px-2 text-left text-xs outline-none hover:bg-muted/50"
                                    >
                                      <span className="truncate">
                                        {entry.vendor?.company_name
                                          ? `${entry.vendor.company_name} - ${entry.vendor.vendor_code}`
                                          : "Select supplier"}
                                      </span>

                                      <Search size={13} className="ml-2 shrink-0 text-muted-foreground" />
                                    </button>
                                  </td>

                                  <td className="px-2 py-2">
                                    <select
                                      value={entry.payment_term_id || ""}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "payment_term_id" as keyof VendorEntry,
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    >
                                      <option value="">Select</option>
                                      {availablePaymentTerms.map((term) => (
                                        <option key={term.id} value={term.id}>
                                          {term.term_name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={entry.required_qty}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "required_qty",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="date"
                                      value={entry.required_by_date}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "required_by_date",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={entry.mrp}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "mrp",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={entry.discount_pct}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "discount_pct",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={entry.rate}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "rate",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={entry.tax_pct}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "tax_pct",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                    />
                                  </td>

                                  <td className="px-2 py-2 font-semibold">
                                    {toMoney(entry.tax_amount)}
                                  </td>

                                  <td className="px-2 py-2 font-bold text-indigo-600">
                                    {toMoney(entry.total_amount)}
                                  </td>

                                  <td className="px-2 py-2">
                                    <input
                                      value={entry.remarks}
                                      onChange={(e) =>
                                        updateSupplierRow(
                                          rowIndex,
                                          vendorIndex,
                                          "remarks",
                                          e.target.value
                                        )
                                      }
                                      className={tableInputClass}
                                      placeholder="Remark"
                                    />
                                  </td>

                                  <td className="px-2 py-2 text-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600"
                                      onClick={() =>
                                        removeSupplierRow(rowIndex, vendorIndex)
                                      }
                                    >
                                      <Trash2 size={13} />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addSupplierRow(rowIndex)}
                      >
                        <Plus size={13} className="mr-1" />
                        Add Supplier
                      </Button>

                      <p className="text-sm font-bold">
                        Product Total:{" "}
                        <span className="text-indigo-600">
                          {toMoney(
                            row.vendor_entries.reduce(
                              (sum, entry) => sum + toNum(entry.total_amount),
                              0
                            )
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
              <p className="text-sm font-semibold">
                Grand Total:{" "}
                <span className="text-lg font-bold text-indigo-600">
                  {toMoney(grandTotal)}
                </span>
              </p>

              <Button
                type="button"
                disabled={submitting || rows.length === 0}
                onClick={handleSubmit}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Submit Intent
              </Button>
            </div>
          </>
        )}
      </main>
      {supplierPicker && rows[supplierPicker.rowIndex] && (
        <SupplierPickerModal
          open={!!supplierPicker}
          allVendors={allVendors}
          row={rows[supplierPicker.rowIndex]}
          rowIndex={supplierPicker.rowIndex}
          vendorIndex={supplierPicker.vendorIndex}
          onClose={() => setSupplierPicker(null)}
          onSelect={(vendor) => {
            updateSupplierVendor(
              supplierPicker.rowIndex,
              supplierPicker.vendorIndex,
              vendor.id
            );

            setSupplierPicker(null);
          }}
        />
      )}
    </div>
  );
}

function ProductAutocomplete({
  rowId,
  value,
  open,
  loading,
  options,
  onFocus,
  onChange,
  onSelect,
}: {
  rowId: string;
  value: string;
  open: boolean;
  loading: boolean;
  options: PIProduct[];
  onFocus: () => void;
  onChange: (value: string) => void;
  onSelect: (product: PIProduct) => void;
}) {
  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <input
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search product by name/code..."
          className="h-9 w-full rounded-lg border bg-background pl-7 pr-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-background shadow-xl">
          {loading ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              Type to search products
            </div>
          ) : (
            options.map((product) => (
              <button
  key={product.id}
  type="button"
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(product);
  }}
  className="w-full border-b px-3 py-2 text-left hover:bg-muted"
>
                <p className="text-xs font-semibold">
                  {product.product_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {[product.article_code, product.unit_of_measure, product.hsn_code]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SupplierPickerModal({
  open,
  allVendors,
  row,
  rowIndex,
  vendorIndex,
  onClose,
  onSelect,
}: {
  open: boolean;
  allVendors: PICompanyVendor[];
  row: ProductRow;
  rowIndex: number;
  vendorIndex: number;
  onClose: () => void;
  onSelect: (vendor: PICompanyVendor) => void;
}) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const usedVendorIds = row.vendor_entries
    .map((entry, index) => (index === vendorIndex ? null : entry.vendor.id))
    .filter(Boolean);

  const q = search.trim().toLowerCase();

  const filteredVendors = allVendors
    .filter((vendor) => {
      const notAlreadyUsed = !usedVendorIds.includes(vendor.id);

      if (!q) return notAlreadyUsed;

      return (
        String(vendor.company_name || "").toLowerCase().includes(q) ||
        String(vendor.vendor_code || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 50);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-bold">Select Supplier</p>
            <p className="text-xs text-muted-foreground">
              Search by supplier name or supplier code.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="border-b p-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier..."
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2">
          {filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm font-semibold">No supplier found</p>
              <p className="text-xs">Try searching with another name/code.</p>
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(vendor);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {vendor.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vendor.vendor_code}
                  </p>
                </div>

                <span className="rounded-full border px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                  Select
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}