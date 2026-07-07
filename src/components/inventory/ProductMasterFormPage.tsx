"use client";

import {
  createProductMasterApi,
  fetchProductById,
  fetchProductMasters,
  ProductMastersResponse,
  ProductPayload,
  updateProductMasterApi,
} from "@/api/inventory/product-master";
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
  Loader2,
  PackagePlus,
  Save,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PRODUCT_MASTER_BASE = "/dashboard/inventory/product-master";

const emptyForm: ProductPayload = {
  category_id: 0,
  product_name: "",
  article_code: "",

  item_group_id: null,

  primary_unit_id: null,
  stock_unit_id: null,
  consumption_unit_id: null,

  shelf_life_days: null,
  costing_method: "FIFO",

  level1_price: null,

  min_stock_qty: null,
  min_stock_unit_id: null,

  max_stock_qty: null,
  max_stock_unit_id: null,

  reorder_level_qty: null,
  reorder_level_unit_id: null,

  reorder_batch_qty: null,
  reorder_batch_unit_id: null,

  hsn_id: null,
  item_type: "Goods",
};


type ProductSupplierRow = {
  company_vendor_id: number | "";
  supplier_item_code: string;
  amount: string;
  same_as_product_code: boolean;
};

const toNumOrNull = (value: any) => {
  if (value === "" || value === undefined || value === null) return null;
  return Number(value);
};

export function ProductMasterFormPage({
  mode,
  productId,
}: {
  mode: "add" | "edit";
  productId?: number;
}) {
  const router = useRouter();

  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const [supplierRows, setSupplierRows] = useState<ProductSupplierRow[]>([]);

  const [masters, setMasters] = useState<ProductMastersResponse | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!vendorId) return;

    const load = async () => {
      setLoading(true);

      try {
        const mastersData = await fetchProductMasters(vendorId);
        setMasters(mastersData);

        if (isEdit && productId) {
          const product = await fetchProductById(vendorId, productId);

          setForm({
            user_id: userId,

            category_id: product.category_id || 0,
            product_name: product.product_name || "",
            article_code: product.article_code || "",

            item_group_id: product.item_group_id || null,

            primary_unit_id: product.primary_unit_id || null,
            stock_unit_id: product.stock_unit_id || null,
            consumption_unit_id: product.consumption_unit_id || null,

            shelf_life_days: product.shelf_life_days || null,
            costing_method: product.costing_method || "FIFO",

            level1_price: product.level1_price ? Number(product.level1_price) : null,

            min_stock_qty: product.min_stock_qty
              ? Number(product.min_stock_qty)
              : null,
            min_stock_unit_id:
              product.min_stock_unit_id || product.stock_unit_id || null,

            max_stock_qty: product.max_stock_qty
              ? Number(product.max_stock_qty)
              : null,
            max_stock_unit_id:
              product.max_stock_unit_id || product.stock_unit_id || null,

            reorder_level_qty: product.reorder_level_qty
              ? Number(product.reorder_level_qty)
              : null,
            reorder_level_unit_id:
              product.reorder_level_unit_id || product.primary_unit_id || null,

            reorder_batch_qty: product.reorder_batch_qty
              ? Number(product.reorder_batch_qty)
              : null,
            reorder_batch_unit_id:
              product.reorder_batch_unit_id || product.primary_unit_id || null,

            hsn_id: product.hsn_id || null,
            item_type: product.item_type || "Goods",

          });
          setSupplierRows(
            (product.supplierMappings ?? []).map((row: any) => ({
              company_vendor_id: row.company_vendor_id,
              supplier_item_code: row.supplier_item_code || "",
              amount: row.amount ? String(row.amount) : "",
              same_as_product_code:
                row.supplier_item_code &&
                product.article_code &&
                String(row.supplier_item_code) === String(product.article_code),
            }))
          );
        } else {
          setForm({
            ...emptyForm,
            user_id: userId,
          });
          setSupplierRows([]);
        }
      } catch (error) {
        toastManager.add({
          title: "Failed to load product form",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [vendorId, userId, isEdit, productId]);

  const set = (key: keyof ProductPayload, value: any) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "stock_unit_id") {
        next.min_stock_unit_id = value ? Number(value) : null;
        next.max_stock_unit_id = value ? Number(value) : null;
      }

      if (key === "primary_unit_id") {
        next.reorder_level_unit_id = value ? Number(value) : null;
        next.reorder_batch_unit_id = value ? Number(value) : null;
      }

      return next;
    });
  };


  const addSupplierRow = () => {
    setSupplierRows((prev) => [
      ...prev,
      {
        company_vendor_id: "",
        supplier_item_code: "",
        amount: "",
        same_as_product_code: false,
      },
    ]);
  };

  const removeSupplierRow = (index: number) => {
    setSupplierRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSupplierRow = (
    index: number,
    field: keyof ProductSupplierRow,
    value: any
  ) => {
    setSupplierRows((prev) => {
      const next = [...prev];
      const row = {
        ...next[index],
        [field]: value,
      };

      if (field === "same_as_product_code") {
        row.same_as_product_code = Boolean(value);
        row.supplier_item_code = value ? form.article_code : "";
      }

      next[index] = row;
      return next;
    });
  };


  const buildPayload = (): ProductPayload => ({
    ...form,
    user_id: userId,

    category_id: Number(form.category_id),
    product_name: form.product_name.trim(),
    article_code: form.article_code.trim(),

    item_group_id: toNumOrNull(form.item_group_id),

    primary_unit_id: toNumOrNull(form.primary_unit_id),
    stock_unit_id: toNumOrNull(form.stock_unit_id),
    consumption_unit_id: toNumOrNull(form.consumption_unit_id),

    shelf_life_days: toNumOrNull(form.shelf_life_days),

    level1_price: toNumOrNull(form.level1_price),

    min_stock_qty: toNumOrNull(form.min_stock_qty),
    min_stock_unit_id: toNumOrNull(form.min_stock_unit_id),

    max_stock_qty: toNumOrNull(form.max_stock_qty),
    max_stock_unit_id: toNumOrNull(form.max_stock_unit_id),

    reorder_level_qty: toNumOrNull(form.reorder_level_qty),
    reorder_level_unit_id: toNumOrNull(form.reorder_level_unit_id),

    reorder_batch_qty: toNumOrNull(form.reorder_batch_qty),
    reorder_batch_unit_id: toNumOrNull(form.reorder_batch_unit_id),

    hsn_id: toNumOrNull(form.hsn_id),
    suppliers: supplierRows
      .filter((row) => row.company_vendor_id)
      .map((row) => ({
        company_vendor_id: Number(row.company_vendor_id),
        supplier_item_code: row.supplier_item_code?.trim() || null,
        amount: toNumOrNull(row.amount),
      })),
  });

  const submit = async () => {
    if (!vendorId) {
      toastManager.add({
        title: "Vendor not found",
        type: "error",
      });
      return;
    }

    if (!form.category_id) {
      toastManager.add({
        title: "Item category is required",
        type: "error",
      });
      return;
    }

    if (!form.product_name.trim()) {
      toastManager.add({
        title: "Item name is required",
        type: "error",
      });
      return;
    }

    if (!form.article_code.trim()) {
      toastManager.add({
        title: "Item code is required",
        type: "error",
      });
      return;
    }

    const selectedSupplierIds = supplierRows
      .filter((row) => row.company_vendor_id)
      .map((row) => Number(row.company_vendor_id));

    const duplicateSupplier = selectedSupplierIds.find(
      (id, index) => selectedSupplierIds.indexOf(id) !== index
    );

    if (duplicateSupplier) {
      toastManager.add({
        title: "Same supplier cannot be selected multiple times",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isEdit && productId) {
        await updateProductMasterApi(vendorId, productId, payload);

        toastManager.add({
          title: "Product updated successfully",
          type: "success",
        });
      } else {
        await createProductMasterApi(vendorId, payload);

        toastManager.add({
          title: "Product created successfully",
          type: "success",
        });
      }

      router.push(PRODUCT_MASTER_BASE);
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save product",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={PRODUCT_MASTER_BASE}>
                  Product Master
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isEdit ? "Edit Product" : "Add Product"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <PackagePlus size={20} />
            </div>

            <div>
              <h1 className="text-xl font-black">
                {isEdit ? "Edit Product" : "Add New Product"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage item category, units, stock levels, HSN and reorder settings.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(PRODUCT_MASTER_BASE)}
            className="gap-2"
          >
            <ArrowLeft size={15} />
            Back
          </Button>
        </div>

        {loading || !masters ? (
          <div className="rounded-3xl border bg-card p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <p className="font-black">Product Details</p>
              <p className="text-xs text-muted-foreground">
                Fields marked with * are required.
              </p>
            </div>

            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Item Category *">
                  <select
                    value={form.category_id || ""}
                    onChange={(e) => set("category_id", Number(e.target.value))}
                    className="input"
                  >
                    <option value="">Select category</option>
                    {masters.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Item Name *">
                  <input
                    value={form.product_name}
                    onChange={(e) => set("product_name", e.target.value)}
                    className="input"
                    placeholder="Enter item name"
                  />
                </Field>

                <Field label="Item Code *">
                  <input
                    value={form.article_code}
                    onChange={(e) => {
                      const value = e.target.value;
                      set("article_code", value);

                      setSupplierRows((prev) =>
                        prev.map((row) =>
                          row.same_as_product_code
                            ? {
                              ...row,
                              supplier_item_code: value,
                            }
                            : row
                        )
                      );
                    }}
                    className="input"
                    placeholder="Unique item code"
                  />
                </Field>

                <Field label="Item Group">
                  <select
                    value={form.item_group_id || ""}
                    onChange={(e) => set("item_group_id", e.target.value)}
                    className="input"
                  >
                    <option value="">Select group</option>
                    {masters.itemGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.group_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Primary Unit / Purchase Unit">
                  <select
                    value={form.primary_unit_id || ""}
                    onChange={(e) => set("primary_unit_id", e.target.value)}
                    className="input"
                  >
                    <option value="">Select unit</option>
                    {masters.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Stock Unit">
                  <select
                    value={form.stock_unit_id || ""}
                    onChange={(e) => set("stock_unit_id", e.target.value)}
                    className="input"
                  >
                    <option value="">Select unit</option>
                    {masters.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Consumption Unit">
                  <select
                    value={form.consumption_unit_id || ""}
                    onChange={(e) => set("consumption_unit_id", e.target.value)}
                    className="input"
                  >
                    <option value="">Select unit</option>
                    {masters.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Shelf Life Days">
                  <input
                    type="number"
                    min="0"
                    value={form.shelf_life_days ?? ""}
                    onChange={(e) => set("shelf_life_days", e.target.value)}
                    className="input"
                    placeholder="Number in days"
                  />
                </Field>
                <Field label="Costing Method">
                  <select
                    value={form.costing_method}
                    onChange={(e) => set("costing_method", e.target.value)}
                    className="input"
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="MANUAL">Manual Value Entry</option>
                  </select>
                </Field>
                <Field label="Process Cost(Men+Material+Machine)">
                  <input
                    type="number"
                    min="0"
                    value={form.level1_price ?? ""}
                    onChange={(e) => set("level1_price", e.target.value)}
                    className="input"
                    placeholder="0.00"
                  />
                </Field>

                <Field label="HSN">
                  <select
                    value={form.hsn_id || ""}
                    onChange={(e) => set("hsn_id", e.target.value)}
                    className="input"
                  >
                    <option value="">Select HSN</option>
                    {masters.hsns.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hsn_code}
                        {h.description ? ` - ${h.description}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Item Type">
                  <select
                    value={form.item_type}
                    onChange={(e) => set("item_type", e.target.value)}
                    className="input"
                  >
                    <option value="CapitalGoods">Capital Goods</option>
                    <option value="Goods">Goods</option>
                    <option value="Services">Services</option>
                  </select>
                </Field>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <StockPair
                  title="Minimum Stock"
                  qty={form.min_stock_qty}
                  unitId={form.min_stock_unit_id}
                  units={masters.units}
                  onQty={(v) => set("min_stock_qty", v)}
                  onUnit={(v) => set("min_stock_unit_id", v)}
                />

                <StockPair
                  title="Maximum Stock"
                  qty={form.max_stock_qty}
                  unitId={form.max_stock_unit_id}
                  units={masters.units}
                  onQty={(v) => set("max_stock_qty", v)}
                  onUnit={(v) => set("max_stock_unit_id", v)}
                />

                <StockPair
                  title="Reorder Level"
                  qty={form.reorder_level_qty}
                  unitId={form.reorder_level_unit_id}
                  units={masters.units}
                  onQty={(v) => set("reorder_level_qty", v)}
                  onUnit={(v) => set("reorder_level_unit_id", v)}
                />

                <StockPair
                  title="Reorder Batch"
                  qty={form.reorder_batch_qty}
                  unitId={form.reorder_batch_unit_id}
                  units={masters.units}
                  onQty={(v) => set("reorder_batch_qty", v)}
                  onUnit={(v) => set("reorder_batch_unit_id", v)}
                />
              </div>
              <div className="mt-6 rounded-3xl border bg-background">
                <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <Building2 size={18} />
                    </div>

                    <div>
                      <p className="font-black">Suppliers</p>
                      <p className="text-xs text-muted-foreground">
                        Map multiple suppliers with their supplier item code and amount.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addSupplierRow}
                    className="gap-2"
                  >
                    <Plus size={14} />
                    Add Supplier
                  </Button>
                </div>

                <div className="p-5">
                  {supplierRows.length === 0 ? (
                    <button
                      type="button"
                      onClick={addSupplierRow}
                      className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-10 text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600"
                    >
                      <Building2 size={28} className="mb-2 opacity-50" />
                      <p className="text-sm font-semibold">Add supplier mapping</p>
                      <p className="text-xs">
                        One product can have multiple supplier item codes.
                      </p>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {supplierRows.map((row, index) => {
                        const selectedIds = supplierRows
                          .map((r, i) => (i === index ? null : Number(r.company_vendor_id)))
                          .filter(Boolean);

                        const availableSuppliers = masters.suppliers.filter(
                          (s) => !selectedIds.includes(s.id)
                        );

                        return (
                          <div
                            key={index}
                            className="grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-[1.2fr_1fr_160px_42px]"
                          >
                            <Field label="Supplier">
                              <select
                                value={row.company_vendor_id}
                                onChange={(e) =>
                                  updateSupplierRow(
                                    index,
                                    "company_vendor_id",
                                    e.target.value ? Number(e.target.value) : ""
                                  )
                                }
                                className="input"
                              >
                                <option value="">Select supplier</option>

                                {availableSuppliers.map((supplier) => (
                                  <option key={supplier.id} value={supplier.id}>
                                    {supplier.company_name} · {supplier.vendor_code}
                                  </option>
                                ))}
                              </select>
                            </Field>

                            <div>
                              <Field label="Supplier Item Code">
                                <input
                                  value={row.supplier_item_code}
                                  disabled={row.same_as_product_code}
                                  onChange={(e) =>
                                    updateSupplierRow(
                                      index,
                                      "supplier_item_code",
                                      e.target.value
                                    )
                                  }
                                  className="input"
                                  placeholder="Supplier item code"
                                />
                              </Field>

                              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={row.same_as_product_code}
                                  onChange={(e) =>
                                    updateSupplierRow(
                                      index,
                                      "same_as_product_code",
                                      e.target.checked
                                    )
                                  }
                                />
                                Seller code same as main product code
                              </label>
                            </div>

                            <Field label="Amount">
                              <input
                                type="number"
                                min="0"
                                value={row.amount}
                                onChange={(e) =>
                                  updateSupplierRow(index, "amount", e.target.value)
                                }
                                className="input"
                                placeholder="0.00"
                              />
                            </Field>

                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-[42px] w-[42px] p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => removeSupplierRow(index)}
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(PRODUCT_MASTER_BASE)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={submit}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {isEdit ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </div>
        )}

        <style jsx>{`
          .input {
            height: 42px;
            width: 100%;
            border-radius: 12px;
            border: 1px solid hsl(var(--border));
            background: hsl(var(--background));
            padding: 0 12px;
            font-size: 14px;
            outline: none;
          }

          .input:focus {
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.35);
          }
        `}</style>
      </main>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function StockPair({
  title,
  qty,
  unitId,
  units,
  onQty,
  onUnit,
}: {
  title: string;
  qty?: number | null;
  unitId?: number | null;
  units: { id: number; unit_name: string }[];
  onQty: (value: string) => void;
  onUnit: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="grid grid-cols-[1fr_150px] gap-3">
        <input
          type="number"
          min="0"
          value={qty ?? ""}
          onChange={(e) => onQty(e.target.value)}
          className="input"
          placeholder="Qty"
        />

        <select
          value={unitId || ""}
          onChange={(e) => onUnit(e.target.value)}
          className="input"
        >
          <option value="">Unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.unit_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}