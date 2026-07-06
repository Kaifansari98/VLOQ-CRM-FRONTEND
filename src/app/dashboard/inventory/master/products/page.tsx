"use client";

import {
  createProductApi,
  deleteProductApi,
  fetchProductMasters,
  fetchProducts,
  ProductMastersResponse,
  ProductPayload,
  updateProductApi,
} from "@/api/inventory/product";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  Edit,
  Loader2,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const toNumOrNull = (v: any) => {
  if (v === "" || v === undefined || v === null) return null;
  return Number(v);
};

function ProductFormModal({
  open,
  onClose,
  masters,
  initial,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  masters: ProductMastersResponse;
  initial?: any;
  onSubmit: (payload: ProductPayload) => void;
  loading: boolean;
}) {
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const [form, setForm] = useState<ProductPayload>(emptyForm);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        user_id: userId,

        category_id: initial.category_id || 0,
        product_name: initial.product_name || "",
        article_code: initial.article_code || "",

        item_group_id: initial.item_group_id || null,

        primary_unit_id: initial.primary_unit_id || null,
        stock_unit_id: initial.stock_unit_id || null,
        consumption_unit_id: initial.consumption_unit_id || null,

        shelf_life_days: initial.shelf_life_days || null,
        costing_method: initial.costing_method || "FIFO",

        level1_price:
          initial.level1_price != null
            ? Number(initial.level1_price)
            : initial.mrp != null
              ? Number(initial.mrp)
              : null,

        min_stock_qty: initial.min_stock_qty ? Number(initial.min_stock_qty) : null,
        min_stock_unit_id: initial.min_stock_unit_id || initial.stock_unit_id || null,

        max_stock_qty: initial.max_stock_qty ? Number(initial.max_stock_qty) : null,
        max_stock_unit_id: initial.max_stock_unit_id || initial.stock_unit_id || null,

        reorder_level_qty: initial.reorder_level_qty
          ? Number(initial.reorder_level_qty)
          : null,
        reorder_level_unit_id:
          initial.reorder_level_unit_id || initial.primary_unit_id || null,

        reorder_batch_qty: initial.reorder_batch_qty
          ? Number(initial.reorder_batch_qty)
          : null,
        reorder_batch_unit_id:
          initial.reorder_batch_unit_id || initial.primary_unit_id || null,

        hsn_id: initial.hsn_id || null,
        item_type: initial.item_type || "Goods",
      });
    } else {
      setForm({
        ...emptyForm,
        user_id: userId,
      });
    }
  }, [open, initial, userId]);

  if (!open) return null;

  const set = (key: keyof ProductPayload, value: any) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === "stock_unit_id") {
        next.min_stock_unit_id = value || null;
        next.max_stock_unit_id = value || null;
      }

      if (key === "primary_unit_id") {
        next.reorder_level_unit_id = value || null;
        next.reorder_batch_unit_id = value || null;
      }

      return next;
    });
  };

  const submit = () => {
    if (!form.category_id) {
      toastManager.add({ title: "Item category is required", type: "error" });
      return;
    }

    if (!form.product_name.trim()) {
      toastManager.add({ title: "Item name is required", type: "error" });
      return;
    }

    if (!form.article_code.trim()) {
      toastManager.add({ title: "Item code is required", type: "error" });
      return;
    }

    onSubmit({
      ...form,

      category_id: Number(form.category_id),
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
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-lg font-black">
              {initial ? "Edit Product" : "Add Product"}
            </p>
            <p className="text-sm text-muted-foreground">
              Create inventory item with stock, reorder and tax details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
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
                onChange={(e) => set("article_code", e.target.value)}
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

            <Field label="Primary Unit">
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
                value={form.shelf_life_days ?? ""}
                onChange={(e) => set("shelf_life_days", e.target.value)}
                className="input"
                placeholder="Days"
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

            <Field label="MRP">
              <input
                type="number"
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
                    {h.hsn_code} {h.description ? `- ${h.description}` : ""}
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
        </div>

        <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button type="button" disabled={loading} onClick={submit}>
            {loading ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
            {initial ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

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
    </div>
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
  onQty: (v: string) => void;
  onUnit: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="grid grid-cols-[1fr_150px] gap-3">
        <input
          type="number"
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

export default function InventoryProductsPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));

  const [masters, setMasters] = useState<ProductMastersResponse | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    if (!vendorId) return;

    setLoading(true);

    try {
      const [mastersData, productData] = await Promise.all([
        fetchProductMasters(vendorId),
        fetchProducts(vendorId, {
          page,
          search,
          page_size: 20,
        }),
      ]);

      setMasters(mastersData);
      setProducts(productData.products);
      setTotalPages(productData.total_pages);
    } catch (error) {
      toastManager.add({
        title: "Failed to load products",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [vendorId, page]);

  const filteredTotal = useMemo(() => products.length, [products]);

  const submitProduct = async (payload: ProductPayload) => {
    if (!vendorId) return;

    setSaving(true);

    try {
      if (editing) {
        await updateProductApi(vendorId, editing.id, {
          ...payload,
          user_id: userId,
        });

        toastManager.add({
          title: "Product updated successfully",
          type: "success",
        });
      } else {
        await createProductApi(vendorId, {
          ...payload,
          user_id: userId,
        });

        toastManager.add({
          title: "Product created successfully",
          type: "success",
        });
      }

      setModalOpen(false);
      setEditing(null);
      load();
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

  const removeProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    try {
      await deleteProductApi(vendorId, id, userId);

      toastManager.add({
        title: "Product deleted successfully",
        type: "success",
      });

      load();
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete product",
        type: "error",
      });
    }
  };

  const handleSearch = () => {
    setPage(1);
    load();
  };

  return (
    <div className="p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600">
            Inventory
          </p>
          <h1 className="text-2xl font-black tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage item master, units, stock limits, reorder levels and HSN.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      <div className="mb-4 flex gap-2 rounded-2xl border bg-card p-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search by item name, code or HSN..."
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <Button type="button" variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PackagePlus size={36} className="mb-2 opacity-30" />
            <p className="font-semibold">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <Th>Item</Th>
                  <Th>Code</Th>
                  <Th>Category</Th>
                  <Th>Group</Th>
                  <Th>Units</Th>
                  <Th>MRP</Th>
                  <Th>Reorder</Th>
                  <Th>HSN</Th>
                  <Th>Type</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <Td>
                      <div>
                        <p className="font-semibold">{p.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Shelf: {p.shelf_life_days || "—"} days ·{" "}
                          {p.costing_method || "FIFO"}
                        </p>
                      </div>
                    </Td>

                    <Td>{p.article_code}</Td>
                    <Td>{p.category?.category_name || "—"}</Td>
                    <Td>{p.itemGroup?.group_name || "—"}</Td>

                    <Td>
                      <div className="text-xs">
                        <p>Purchase: {p.primaryUnit?.unit_name || "—"}</p>
                        <p>Stock: {p.stockUnit?.unit_name || "—"}</p>
                        <p>Consumption: {p.consumptionUnit?.unit_name || "—"}</p>
                      </div>
                    </Td>

                    <Td>
                      {(p.level1_price ?? p.mrp)
                        ? `₹${Number(p.level1_price ?? p.mrp).toLocaleString("en-IN")}`
                        : "—"}
                    </Td>

                    <Td>
                      <div className="text-xs">
                        <p>
                          Min: {p.min_stock_qty || "—"}{" "}
                          {p.minStockUnit?.unit_name || ""}
                        </p>
                        <p>
                          Max: {p.max_stock_qty || "—"}{" "}
                          {p.maxStockUnit?.unit_name || ""}
                        </p>
                        <p>
                          Level: {p.reorder_level_qty || "—"}{" "}
                          {p.reorderLevelUnit?.unit_name || ""}
                        </p>
                        <p>
                          Batch: {p.reorder_batch_qty || "—"}{" "}
                          {p.reorderBatchUnit?.unit_name || ""}
                        </p>
                      </div>
                    </Td>

                    <Td>{p.hsn?.hsn_code || "—"}</Td>
                    <Td>{p.item_type || "Goods"}</Td>

                    <Td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(p);
                            setModalOpen(true);
                          }}
                        >
                          <Edit size={13} />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeProduct(p.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filteredTotal} product(s)
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>

          <span className="flex items-center rounded-lg border px-3 text-sm">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {masters && (
        <ProductFormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          masters={masters}
          initial={editing}
          loading={saving}
          onSubmit={submitProduct}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 align-top">{children}</td>;
}
