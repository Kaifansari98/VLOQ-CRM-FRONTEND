"use client";

import {
  createProductMasterApi,
  fetchProductById,
  fetchProductMasters,
  ProductMastersResponse,
  ProductPayload,
  updateProductMasterApi,
  createHSNApi
} from "@/api/inventory/product-master";
import { apiClient } from "@/lib/apiClient";
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
import AssignToPicker from "@/components/assign-to-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  PackagePlus,
  Save,
  Plus,
  Trash2,
  Building2,
  PlusCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PRODUCT_MASTER_BASE = "/dashboard/inventory/master/products/list";

const emptyForm: ProductPayload = {
  category_id: 0,
  sub_category_id: null,
  product_name: "",
  article_code: "",
  item_code: "",
  barcode: "",

  brand_id: null,
  item_group_id: null,

  primary_unit_id: null,
  purchase_unit_id: null,
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
  item_type_master_id: null,

  core_product_id: null,
  grade_id: null,
  type_id: null,
  finish_id: null,

  length: null,
  height: null,
  thickness: null,
  size: "",
};


type ProductSupplierRow = {
  company_vendor_id: number | "";
  supplier_item_code: string;
  amount: string;

  procurement_expense_amount: string;
  procurement_expense_pct: string;
  procurement_expense_total: string;
  final_amount: string;


  same_as_product_code: boolean;

};

const toNumOrNull = (value: any) => {
  if (value === "" || value === undefined || value === null) return null;
  return Number(value);
};

const toNum = (value: any) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (value: number) => Number(value.toFixed(2));

const recalcSupplierRow = (row: ProductSupplierRow): ProductSupplierRow => {
  const amount = toNum(row.amount);
  const procurementExpenseAmount = toNum(row.procurement_expense_amount);
  const procurementExpensePct = toNum(row.procurement_expense_pct);

  const procurementExpenseByPct = round2(
    (amount * procurementExpensePct) / 100
  );

  const procurementExpenseTotal = round2(
    procurementExpenseAmount + procurementExpenseByPct
  );

  const finalAmount = round2(amount + procurementExpenseTotal);

  return {
    ...row,
    procurement_expense_total: String(procurementExpenseTotal),
    final_amount: String(finalAmount),
  };
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


  const [hsnModalOpen, setHsnModalOpen] = useState(false);
  const [hsnSaving, setHsnSaving] = useState(false);

  const [hsnForm, setHsnForm] = useState({
    hsn_code: "",
    description: "",
    igst_rate: "",
  });

  // ── Quick Add Master States ──
  const [quickAddModal, setQuickAddModal] = useState<{
    open: boolean;
    title: string;
    fieldKey: "grade_id" | "type_id" | "finish_id" | "core_product_id" | "primary_unit_id";
    nameKey: "grades" | "types" | "finishes" | "coreProducts" | "units";
    items: { id: number; name: string }[];
    placeholder: string;
    endpoint: string;
    payloadKey: string;
  } | null>(null);

  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState("");

  const handleQuickAddSave = async () => {
    if (!quickAddModal) return;
    if (!quickAddName.trim()) {
      toastManager.add({
        title: `${quickAddModal.title} name is required`,
        type: "error",
      });
      return;
    }

    setQuickAddSaving(true);
    try {
      const payload = {
        vendor_id: vendorId,
        [quickAddModal.payloadKey]: quickAddName.trim(),
        created_by: userId,
      };
      const { data: responseData } = await apiClient.post(
        quickAddModal.endpoint,
        payload
      );

      const newItem = responseData.data;

      setMasters((prev) => {
        if (!prev) return prev;
        const currentList = prev[quickAddModal.nameKey] || [];
        const updatedList = [...currentList, newItem].sort((a: any, b: any) =>
          String(a[quickAddModal.payloadKey]).localeCompare(
            String(b[quickAddModal.payloadKey])
          )
        );
        return {
          ...prev,
          [quickAddModal.nameKey]: updatedList,
        };
      });

      set(quickAddModal.fieldKey, newItem.id);

      toastManager.add({
        title: `${quickAddModal.title} added successfully`,
        type: "success",
      });

      setQuickAddName("");
      setQuickAddModal(null);
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || err?.message || `Failed to add ${quickAddModal.title}`,
        type: "error",
      });
    } finally {
      setQuickAddSaving(false);
    }
  };

  const saveHSN = async () => {
    if (!vendorId) {
      toastManager.add({
        title: "Vendor not found",
        type: "error",
      });
      return;
    }

    if (!hsnForm.hsn_code.trim()) {
      toastManager.add({
        title: "HSN code is required",
        type: "error",
      });
      return;
    }

    if (!hsnForm.igst_rate) {
      toastManager.add({
        title: "IGST rate is required",
        type: "error",
      });
      return;
    }

    const igstRate = Number(hsnForm.igst_rate);

    if (!Number.isFinite(igstRate)) {
      toastManager.add({
        title: "IGST rate must be a valid number",
        type: "error",
      });
      return;
    }

    if (igstRate < 0 || igstRate > 100) {
      toastManager.add({
        title: "IGST rate must be greater than 0 and less than or equal to 100",
        type: "error",
      });
      return;
    }

    setHsnSaving(true);

    try {
      const createdHSN = await createHSNApi(vendorId, {
        hsn_code: hsnForm.hsn_code.trim(),
        description: hsnForm.description.trim() || undefined,
        igst_rate: igstRate,
      });

      setMasters((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          hsns: [...prev.hsns, createdHSN].sort((a: any, b: any) =>
            String(a.hsn_code).localeCompare(String(b.hsn_code))
          ),
        };
      });

      set("hsn_id", createdHSN.id);

      toastManager.add({
        title: "HSN added successfully",
        type: "success",
      });

      setHsnForm({
        hsn_code: "",
        description: "",
        igst_rate: "",
      });

      setHsnModalOpen(false);
    } catch (error: any) {
      toastManager.add({
        title: error?.message || "Failed to add HSN",
        type: "error",
      });
    } finally {
      setHsnSaving(false);
    }
  };
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
            brand_id: product.brand_id || null,
            sub_category_id: product.sub_category_id || null,
            core_product_id: product.core_product_id || null,
            grade_id: product.grade_id || null,
            type_id: product.type_id || null,
            finish_id: product.finish_id || null,
            length: product.length || null,
            height: product.height || null,
            thickness: product.thickness || null,
            size: product.size || "",
            item_type_master_id: product.item_type_master_id || null,
          });
          setSupplierRows(
            (product.supplierMappings ?? []).map((row: any) =>
              recalcSupplierRow({
                company_vendor_id: row.company_vendor_id,
                supplier_item_code: row.supplier_item_code || "",
                amount: row.amount ? String(row.amount) : "",

                procurement_expense_amount: row.procurement_expense_amount
                  ? String(row.procurement_expense_amount)
                  : "",

                procurement_expense_pct: row.procurement_expense_pct
                  ? String(row.procurement_expense_pct)
                  : "",

                procurement_expense_total: row.procurement_expense_total
                  ? String(row.procurement_expense_total)
                  : "0",

                final_amount: row.final_amount ? String(row.final_amount) : "0",

                same_as_product_code:
                  row.supplier_item_code &&
                  product.article_code &&
                  String(row.supplier_item_code) === String(product.article_code),
              })
            )
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
        next.purchase_unit_id = value ? Number(value) : null;
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

        procurement_expense_amount: "",
        procurement_expense_pct: "",
        procurement_expense_total: "0",
        final_amount: "0",

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

      let row = {
        ...next[index],
        [field]: value,
      };

      if (field === "same_as_product_code") {
        row.same_as_product_code = Boolean(value);
        row.supplier_item_code = value ? form.article_code : "";
      }

      row = recalcSupplierRow(row);

      next[index] = row;
      return next;
    });
  };


  const buildPayload = (): ProductPayload => ({
    ...form,
    user_id: userId,

    category_id: Number(form.category_id),
    sub_category_id: toNumOrNull(form.sub_category_id),
    product_name: form.product_name.trim(),
    article_code: form.article_code.trim(),
    item_code: form.article_code.trim(),
    barcode: form.barcode?.trim() || null,

    brand_id: toNumOrNull(form.brand_id),
    item_group_id: toNumOrNull(form.item_group_id),

    primary_unit_id: toNumOrNull(form.primary_unit_id),
    purchase_unit_id: toNumOrNull(form.purchase_unit_id),
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
    item_type_master_id: toNumOrNull(form.item_type_master_id),

    core_product_id: toNumOrNull(form.core_product_id),
    grade_id: toNumOrNull(form.grade_id),
    type_id: toNumOrNull(form.type_id),
    finish_id: toNumOrNull(form.finish_id),

    length: toNumOrNull(form.length),
    height: toNumOrNull(form.height),
    thickness: toNumOrNull(form.thickness),
    size: form.size?.trim() || null,
    suppliers: supplierRows
      .filter((row) => row.company_vendor_id)
      .map((row) => ({
        company_vendor_id: Number(row.company_vendor_id),
        supplier_item_code: row.supplier_item_code?.trim() || null,

        amount: toNumOrNull(row.amount),

        procurement_expense_amount: toNumOrNull(
          row.procurement_expense_amount
        ),

        procurement_expense_pct: toNumOrNull(
          row.procurement_expense_pct
        ),

        procurement_expense_total: toNumOrNull(
          row.procurement_expense_total
        ),

        final_amount: toNumOrNull(row.final_amount),
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
          <div className="grid gap-6 lg:grid-cols-2">
            {/* COLUMN 1: Basic Information & Taxation */}
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border bg-card shadow-sm p-6 space-y-4">
                <p className="font-black text-sm text-foreground flex items-center gap-2 border-b pb-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  Basic Information
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Item Category *">
                    <AssignToPicker
                      data={masters.categories
                        .filter((c) => !c.parent_id)
                        .map((c) => ({ id: c.id, label: c.category_name }))}
                      value={form.category_id || undefined}
                      onChange={(val) => {
                        set("category_id", val || 0);
                        set("sub_category_id", null);
                      }}
                      placeholder="Search category..."
                      emptyLabel="Select category"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Sub Category">
                    <AssignToPicker
                      data={masters.categories
                        .filter((c) => c.parent_id === Number(form.category_id))
                        .map((c) => ({ id: c.id, label: c.category_name }))}
                      value={form.sub_category_id || undefined}
                      onChange={(val) => set("sub_category_id", val)}
                      disabled={!form.category_id}
                      placeholder="Search sub category..."
                      emptyLabel="Select sub category"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
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

                  <Field label="Barcode (Auto / Manual)">
                    <input
                      value={form.barcode || ""}
                      onChange={(e) => set("barcode", e.target.value)}
                      className="input"
                      placeholder="Leave empty to auto-generate"
                    />
                  </Field>

                  <Field label="Brand">
                    <AssignToPicker
                      data={masters.brands?.map((b) => ({
                        id: b.id,
                        label: `${b.brand_name}${b.brand_short_name ? ` (${b.brand_short_name})` : ""}`
                      })) || []}
                      value={form.brand_id || undefined}
                      onChange={(val) => set("brand_id", val)}
                      placeholder="Search brand..."
                      emptyLabel="Select brand"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Item Group">
                    <AssignToPicker
                      data={masters.itemGroups.map((g) => ({ id: g.id, label: g.group_name }))}
                      value={form.item_group_id || undefined}
                      onChange={(val) => set("item_group_id", val)}
                      placeholder="Search group..."
                      emptyLabel="Select group"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Item Type">
                    <Select
                      value={form.item_type || "Goods"}
                      onValueChange={(val) => set("item_type", val)}
                    >
                      <SelectTrigger className="input flex items-center justify-between text-left cursor-pointer w-full">
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CapitalGoods">Capital Goods</SelectItem>
                        <SelectItem value="Goods">Goods</SelectItem>
                        <SelectItem value="Services">Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* Pricing, Taxation, and Units */}
              <div className="rounded-3xl border bg-card shadow-sm p-6 space-y-4">
                <p className="font-black text-sm text-foreground flex items-center gap-2 border-b pb-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Inventory & Taxation
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>Primary / Purchase Unit *</span>
                        <button
                          type="button"
                          onClick={() => setQuickAddModal({
                            open: true,
                            title: "Unit",
                            fieldKey: "primary_unit_id",
                            nameKey: "units",
                            items: (masters.units || []).map(u => ({ id: u.id, name: `${u.unit_name}${u.short_name ? ` (${u.short_name})` : ""}` })),
                            placeholder: "e.g. Kilogram",
                            endpoint: "/track-trace/units",
                            payloadKey: "unit_name",
                          })}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    }
                  >
                    <AssignToPicker
                      data={masters.units.map((u) => ({
                        id: u.id,
                        label: `${u.unit_name}${u.short_name ? ` (${u.short_name})` : ""}`
                      }))}
                      value={form.primary_unit_id || undefined}
                      onChange={(val) => set("primary_unit_id", val)}
                      placeholder="Search unit..."
                      emptyLabel="Select unit"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Stock Unit">
                    <AssignToPicker
                      data={masters.units.map((u) => ({
                        id: u.id,
                        label: `${u.unit_name}${u.short_name ? ` (${u.short_name})` : ""}`
                      }))}
                      value={form.stock_unit_id || undefined}
                      onChange={(val) => set("stock_unit_id", val)}
                      placeholder="Search unit..."
                      emptyLabel="Select unit"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Consumption Unit">
                    <AssignToPicker
                      data={masters.units.map((u) => ({
                        id: u.id,
                        label: `${u.unit_name}${u.short_name ? ` (${u.short_name})` : ""}`
                      }))}
                      value={form.consumption_unit_id || undefined}
                      onChange={(val) => set("consumption_unit_id", val)}
                      placeholder="Search unit..."
                      emptyLabel="Select unit"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Costing Method">
                    <Select
                      value={form.costing_method || "FIFO"}
                      onValueChange={(val) => set("costing_method", val)}
                    >
                      <SelectTrigger className="input flex items-center justify-between text-left cursor-pointer w-full">
                        <SelectValue placeholder="Select costing method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIFO">FIFO</SelectItem>
                        <SelectItem value="MANUAL">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Purchase Rate">
                    <input
                      type="number"
                      min="0"
                      value={form.level1_price ?? ""}
                      onChange={(e) => set("level1_price", e.target.value)}
                      className="input"
                      placeholder="0.00"
                    />
                  </Field>

                  <Field
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>HSN</span>
                        <button
                          type="button"
                          onClick={() => setHsnModalOpen(true)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    }
                  >
                    <AssignToPicker
                      data={masters.hsns.map((h: any) => ({
                        id: h.id,
                        label: `${h.hsn_code}${h.description ? ` - ${h.description}` : ""}`
                      }))}
                      value={form.hsn_id || undefined}
                      onChange={(val) => set("hsn_id", val)}
                      placeholder="Search HSN..."
                      emptyLabel="Select HSN"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
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
                </div>
              </div>
            </div>

            {/* COLUMN 2: Physical Specs, Stock levels, and Suppliers */}
            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border bg-card shadow-sm p-6 space-y-4">
                <p className="font-black text-sm text-foreground flex items-center gap-2 border-b pb-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-violet-600" />
                  Physical Specifications
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>Core Product</span>
                        <button
                          type="button"
                          onClick={() => setQuickAddModal({
                            open: true,
                            title: "Core Product",
                            fieldKey: "core_product_id",
                            nameKey: "coreProducts",
                            items: (masters.coreProducts || []).map(cp => ({
                              id: cp.id,
                              name: cp.core_product_name ?? cp.name ?? "",
                            })),
                            placeholder: "e.g. Carcass",
                            endpoint: "/track-trace/core-products",
                            payloadKey: "core_product_name",
                          })}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    }
                  >
                    <AssignToPicker
                      data={masters.coreProducts?.map((cp) => ({
                        id: cp.id,
                        label: cp.core_product_name ?? cp.name ?? "",
                      })) || []}
                      value={form.core_product_id || undefined}
                      onChange={(val) => set("core_product_id", val)}
                      placeholder="Search core product..."
                      emptyLabel="Select core product"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>Grade Type</span>
                        <button
                          type="button"
                          onClick={() => setQuickAddModal({
                            open: true,
                            title: "Grade",
                            fieldKey: "grade_id",
                            nameKey: "grades",
                            items: (masters.grades || []).map(g => ({
                              id: g.id,
                              name: g.grade_name ?? g.name ?? "",
                            })),
                            placeholder: "e.g. MDF 18mm",
                            endpoint: "/track-trace/grades",
                            payloadKey: "grade_name",
                          })}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    }
                  >
                    <AssignToPicker
                      data={masters.grades?.map((g) => ({
                        id: g.id,
                        label: g.grade_name ?? g.name ?? "",
                      })) || []}
                      value={form.grade_id || undefined}
                      onChange={(val) => set("grade_id", val)}
                      placeholder="Search grade..."
                      emptyLabel="Select grade"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>Type</span>
                        <button
                          type="button"
                          onClick={() => setQuickAddModal({
                            open: true,
                            title: "Type",
                            fieldKey: "type_id",
                            nameKey: "types",
                            items: (masters.types || []).map(t => ({ id: t.id, name: t.type_name })),
                            placeholder: "e.g. Modular",
                            endpoint: "/track-trace/types",
                            payloadKey: "type_name",
                          })}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    }
                  >
                    <AssignToPicker
                      data={masters.types?.map((t) => ({ id: t.id, label: t.type_name })) || []}
                      value={form.type_id || undefined}
                      onChange={(val) => set("type_id", val)}
                      placeholder="Search type..."
                      emptyLabel="Select type"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>Finish</span>
                        <button
                          type="button"
                          onClick={() => setQuickAddModal({
                            open: true,
                            title: "Finish",
                            fieldKey: "finish_id",
                            nameKey: "finishes",
                            items: (masters.finishes || []).map(f => ({
                              id: f.id,
                              name: f.finish_name ?? f.name ?? "",
                            })),
                            placeholder: "e.g. Matte Finish",
                            endpoint: "/track-trace/finishes",
                            payloadKey: "finish_name",
                          })}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                        >
                          <Plus size={10} /> Add
                        </button>
                      </div>
                    }
                  >
                    <AssignToPicker
                      data={masters.finishes?.map((f) => ({
                        id: f.id,
                        label: f.finish_name ?? f.name ?? "",
                      })) || []}
                      value={form.finish_id || undefined}
                      onChange={(val) => set("finish_id", val)}
                      placeholder="Search finish..."
                      emptyLabel="Select finish"
                      className="input flex items-center justify-between text-left cursor-pointer w-full"
                    />
                  </Field>

                  <Field label="Length (mm)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.length ?? ""}
                      onChange={(e) => set("length", e.target.value)}
                      className="input"
                      placeholder="Length"
                    />
                  </Field>

                  <Field label="Height (mm)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.height ?? ""}
                      onChange={(e) => set("height", e.target.value)}
                      className="input"
                      placeholder="Height"
                    />
                  </Field>

                  <Field label="Thickness (mm)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.thickness ?? ""}
                      onChange={(e) => set("thickness", e.target.value)}
                      className="input"
                      placeholder="Thickness"
                    />
                  </Field>

                  <Field label={`Size${form.primary_unit_id && masters.units.find(u => u.id === form.primary_unit_id) ? ` (${masters.units.find(u => u.id === form.primary_unit_id)?.short_name || masters.units.find(u => u.id === form.primary_unit_id)?.unit_name})` : ""}`}>
                    {(() => {
                      const filledCount = [form.length, form.height, form.thickness].filter(
                        (val) => val !== null && val !== undefined && String(val).trim() !== ""
                      ).length;
                      const isSizeDisabled = filledCount >= 2;
                      return (
                        <input
                          type="text"
                          value={isSizeDisabled ? "" : (form.size || "")}
                          onChange={(e) => set("size", e.target.value)}
                          disabled={isSizeDisabled}
                          className={`input ${isSizeDisabled ? "opacity-50 cursor-not-allowed bg-muted/30" : ""}`}
                          placeholder={isSizeDisabled ? "Disabled (Dimensions entered)" : "e.g. 5kg, 25MM, 6\", 16X8"}
                        />
                      );
                    })()}
                  </Field>
                </div>
              </div>

              {/* Stock Levels Section */}
              <div className="rounded-3xl border bg-card p-6 space-y-4 shadow-sm">
                <p className="font-black text-sm text-foreground flex items-center gap-2 border-b pb-2 mb-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Stock Thresholds
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </div>
        )
      }

      {/* Supplier Section (Full-width below Columns) */}
      {!loading && masters && (
        <div className="mt-6 rounded-3xl border bg-card shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                <Building2 size={18} />
              </div>
              <div>
                <p className="font-black text-sm">Suppliers Mapping</p>
                <p className="text-xs text-muted-foreground">Map multiple suppliers with codes and final calculations.</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addSupplierRow}
              className="gap-2"
            >
              <Plus size={14} /> Add Supplier
            </Button>
          </div>

          <div>
            {supplierRows.length === 0 ? (
              <button
                type="button"
                onClick={addSupplierRow}
                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed py-8 text-muted-foreground transition-all hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600"
              >
                <Building2 size={24} className="mb-2 opacity-50" />
                <p className="text-sm font-semibold">No suppliers mapped yet</p>
                <p className="text-xs">Click "Add Supplier" to map a vendor.</p>
              </button>
            ) : (
              <div className="space-y-4">
                {supplierRows.map((row, index) => {
                  const selectedIds = supplierRows
                    .map((r, i) => (i === index ? null : Number(r.company_vendor_id)))
                    .filter(Boolean);

                  const availableSuppliers = masters.suppliers.filter(
                    (s) => !selectedIds.includes(s.id)
                  );

                  return (
                    <div key={index} className="rounded-2xl border p-5 space-y-4 hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-indigo-700 uppercase">Supplier #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeSupplierRow(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Supplier">
                          <AssignToPicker
                            data={availableSuppliers.map((supplier) => ({
                              id: supplier.id,
                              label: `${supplier.company_name} · ${supplier.vendor_code}`
                            }))}
                            value={row.company_vendor_id ? Number(row.company_vendor_id) : undefined}
                            onChange={(val) =>
                              updateSupplierRow(index, "company_vendor_id", val || "")
                            }
                            placeholder="Search supplier..."
                            emptyLabel="Select supplier"
                            className="input flex items-center justify-between text-left w-full"
                          />
                        </Field>

                        <div>
                          <Field label="Supplier Item Code">
                            <input
                              value={row.supplier_item_code}
                              disabled={row.same_as_product_code}
                              onChange={(e) => updateSupplierRow(index, "supplier_item_code", e.target.value)}
                              className="input"
                              placeholder="Supplier code"
                            />
                          </Field>
                          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.same_as_product_code}
                              onChange={(e) => updateSupplierRow(index, "same_as_product_code", e.target.checked)}
                            />
                            Same as main item code
                          </label>
                        </div>

                        <Field label="Base Amount">
                          <input
                            type="number"
                            min="0"
                            value={row.amount}
                            onChange={(e) => updateSupplierRow(index, "amount", e.target.value)}
                            className="input"
                            placeholder="0.00"
                          />
                        </Field>

                        <Field label="Proc. Exp %">
                          <input
                            type="number"
                            min="0"
                            value={row.procurement_expense_pct}
                            onChange={(e) => updateSupplierRow(index, "procurement_expense_pct", e.target.value)}
                            className="input"
                            placeholder="0"
                          />
                        </Field>

                        <Field label="Proc. Exp Total">
                          <input
                            value={row.procurement_expense_total}
                            disabled
                            className="input bg-muted/30 font-bold"
                          />
                        </Field>

                        <Field label="Final Amount">
                          <input
                            value={row.final_amount}
                            disabled
                            className="input bg-emerald-50/50 font-bold text-emerald-700"
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Submission Actions Container */}
      {!loading && masters && (
        <div className="mt-6 flex justify-end gap-3 rounded-3xl border bg-card p-6 shadow-sm">
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
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
        </div>
      )}

        {hsnModalOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={() => setHsnModalOpen(false)}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-3xl border bg-background shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <p className="text-base font-black">Add HSN</p>
                  <p className="text-xs text-muted-foreground">
                    Enter IGST percentage. CGST and SGST will be divided equally.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setHsnModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 p-6">
                <Field label="HSN Code *">
                  <input
                    value={hsnForm.hsn_code}
                    onChange={(e) =>
                      setHsnForm((prev) => ({
                        ...prev,
                        hsn_code: e.target.value,
                      }))
                    }
                    className="input"
                    placeholder="Example: 94036000"
                  />
                </Field>

                <Field label="Description">
                  <input
                    value={hsnForm.description}
                    onChange={(e) =>
                      setHsnForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="input"
                    placeholder="Example: Wooden furniture"
                  />
                </Field>

              <Field label="IGST % *">
  <input
    type="number"
    min="0.01"
    max="100"
    step="0.01"
    required
    value={hsnForm.igst_rate}
    onChange={(e) =>
      setHsnForm((prev) => ({
        ...prev,
        igst_rate: e.target.value,
      }))
    }
    className="input"
    placeholder="Example: 18"
  />
</Field>

                <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground">
                      IGST
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {Number(hsnForm.igst_rate || 0).toFixed(2)}%
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground">
                      CGST
                    </p>
                    <p className="mt-1 text-sm font-bold text-indigo-600">
                      {(Number(hsnForm.igst_rate || 0) / 2).toFixed(2)}%
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground">
                      SGST
                    </p>
                    <p className="mt-1 text-sm font-bold text-indigo-600">
                      {(Number(hsnForm.igst_rate || 0) / 2).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t bg-muted/20 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHsnModalOpen(false)}
                  disabled={hsnSaving}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={saveHSN}
                  disabled={hsnSaving}
                  className="gap-2"
                >
                  {hsnSaving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  Save HSN
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Add Modal ── */}
        {quickAddModal?.open && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={() => {
              setQuickAddModal(null);
              setQuickAddName("");
              setQuickAddSearch("");
            }}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-2xl flex flex-col max-h-[85vh]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <p className="text-base font-black">Manage {quickAddModal.title}s</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    View saved items or add a new one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddModal(null);
                    setQuickAddName("");
                    setQuickAddSearch("");
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form to Add New */}
              <div className="p-6 border-b bg-muted/10 space-y-4">
                <Field label={`New ${quickAddModal.title} Name *`}>
                  <div className="flex gap-2">
                    <input
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      className="input flex-1"
                      placeholder={quickAddModal.placeholder}
                      onKeyDown={(e) => e.key === "Enter" && handleQuickAddSave()}
                    />
                    <Button
                      type="button"
                      onClick={handleQuickAddSave}
                      disabled={quickAddSaving}
                      className="gap-1.5 shrink-0"
                    >
                      {quickAddSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Add
                    </Button>
                  </div>
                </Field>
              </div>

              {/* List of Saved Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[200px]">
                <div className="flex items-center gap-1.5 border-b pb-2 mb-2">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex-1">
                    Saved {quickAddModal.title}s
                  </p>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={quickAddSearch}
                    onChange={(e) => setQuickAddSearch(e.target.value)}
                    className="text-xs border rounded px-2 py-0.5 max-w-[120px] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {quickAddModal.items
                    .filter(item => item.name.toLowerCase().includes(quickAddSearch.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          set(quickAddModal.fieldKey, item.id);
                          setQuickAddModal(null);
                          setQuickAddName("");
                          setQuickAddSearch("");
                          toastManager.add({
                            title: `Selected ${item.name}`,
                            type: "success",
                          });
                        }}
                        className="flex items-center justify-between rounded-xl border p-2.5 text-sm hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-all group"
                      >
                        <span className="font-semibold truncate">{item.name}</span>
                        <span className="text-[10px] bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary px-2 py-0.5 rounded-full font-bold transition-all">
                          Select
                        </span>
                      </div>
                    ))}
                  {quickAddModal.items.filter(item => item.name.toLowerCase().includes(quickAddSearch.toLowerCase())).length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No saved {quickAddModal.title.toLowerCase()}s found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        <style jsx>{`
        .add-hsn-btn {
  display: inline-flex;
  height: 46px;
  min-width: 82px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 14px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  padding: 0 14px;
  color: #4f46e5;
  font-size: 13px;
  font-weight: 800;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.12s ease;
}

.add-hsn-btn:hover {
  border-color: #818cf8;
  background: #e0e7ff;
  color: #3730a3;
  transform: translateY(-1px);
}

.add-hsn-btn:active {
  transform: translateY(0);
}
  .input {
    height: 46px;
    width: 100%;
    border-radius: 14px;
    border: 1px solid #d9dee8;
    background-color: #ffffff;
    padding: 0 14px;
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    outline: none;
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.65);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background-color 0.18s ease,
      transform 0.12s ease;
  }

  .input::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }

  .input:hover:not(:disabled) {
    border-color: #a5b4fc;
    background-color: #ffffff;
  }

  .input:focus {
    border-color: #6366f1;
    background-color: #ffffff;
    box-shadow:
      0 0 0 3px rgba(99, 102, 241, 0.14),
      0 1px 2px rgba(15, 23, 42, 0.06);
  }

  .input:disabled {
    cursor: not-allowed;
    border-color: #e5e7eb;
    background-color: #f8fafc;
    color: #6b7280;
    opacity: 1;
  }

  select.input {
    cursor: pointer;
    appearance: none;
    background-image:
      linear-gradient(45deg, transparent 50%, #6b7280 50%),
      linear-gradient(135deg, #6b7280 50%, transparent 50%);
    background-position:
      calc(100% - 18px) 19px,
      calc(100% - 13px) 19px;
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;
    padding-right: 38px;
  }

  select.input:hover {
    background-image:
      linear-gradient(45deg, transparent 50%, #4f46e5 50%),
      linear-gradient(135deg, #4f46e5 50%, transparent 50%);
  }

  input[type='number'].input {
    text-align: left;
  }

  input[type='number'].input::-webkit-inner-spin-button,
  input[type='number'].input::-webkit-outer-spin-button {
    opacity: 0.35;
  }

  .stock-card {
    border-radius: 20px;
    border: 1px solid #e1e5ee;
    background: #ffffff;
    padding: 16px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .stock-card:hover {
    border-color: #c7d2fe;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  }

  .stock-title {
    margin-bottom: 12px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7280;
  }

  .supplier-table-wrap {
    width: 100%;
    overflow-x: auto;
    border-radius: 18px;
    border: 1px solid #e1e5ee;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .supplier-table-wrap::-webkit-scrollbar {
    height: 8px;
  }

  .supplier-table-wrap::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 999px;
  }

  .supplier-table-wrap::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.38);
    border-radius: 999px;
  }

  .supplier-table-wrap::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.6);
  }

  .supplier-table {
    width: 100%;
    min-width: 1260px;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;
  }

  .supplier-table thead {
    background: #f8fafc;
  }

  .supplier-table th {
    height: 44px;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 12px;
    color: #6b7280;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .supplier-table td {
    border-bottom: 1px solid #eef2f7;
    padding: 12px;
    vertical-align: top;
    background: #ffffff;
  }

  .supplier-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .supplier-table tbody tr:hover td {
    background: #fafbff;
  }

  .supplier-input {
    height: 40px;
    width: 100%;
    border-radius: 12px;
    border: 1px solid #d9dee8;
    background: #ffffff;
    padding: 0 11px;
    color: #111827;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.035);
    transition:
      border-color 0.16s ease,
      box-shadow 0.16s ease,
      background-color 0.16s ease;
  }

  .supplier-input::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }

  .supplier-input:hover:not(:disabled) {
    border-color: #a5b4fc;
  }

  .supplier-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.13);
  }

  select.supplier-input {
    cursor: pointer;
    appearance: none;
    background-image:
      linear-gradient(45deg, transparent 50%, #6b7280 50%),
      linear-gradient(135deg, #6b7280 50%, transparent 50%);
    background-position:
      calc(100% - 17px) 17px,
      calc(100% - 12px) 17px;
    background-size:
      5px 5px,
      5px 5px;
    background-repeat: no-repeat;
    padding-right: 36px;
  }

  .readonly-input {
    border-color: transparent;
    font-weight: 800;
    cursor: default;
    opacity: 1;
  }

  .expense-total-input {
    background: #eef2ff;
    color: #4338ca;
  }

  .final-input {
    background: #ecfdf5;
    color: #047857;
    font-weight: 900;
  }

  .same-code-check {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #6b7280;
    font-size: 11px;
    line-height: 1;
    user-select: none;
  }

  .same-code-check input {
    height: 14px;
    width: 14px;
    cursor: pointer;
    accent-color: #4f46e5;
  }

  .percent-symbol {
    pointer-events: none;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 12px;
    font-weight: 800;
  }

  .delete-supplier-btn {
    display: inline-flex;
    height: 38px;
    width: 38px;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #dc2626;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }

  .delete-supplier-btn:hover {
    border-color: #fecaca;
    background: #fef2f2;
    color: #b91c1c;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    .input {
      height: 44px;
      border-radius: 12px;
    }

    .supplier-table {
      min-width: 1180px;
    }
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
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
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
    <div className="rounded-2xl border bg-muted/20 p-3.5 min-w-0">
      <p className="mb-2.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="grid grid-cols-[1fr_110px] gap-2 min-w-0">
        <input
          type="number"
          min="0"
          value={qty ?? ""}
          onChange={(e) => onQty(e.target.value)}
          className="input min-w-0 w-full"
          placeholder="Qty"
        />

        <AssignToPicker
          data={units.map((u) => ({ id: u.id, label: u.unit_name }))}
          value={unitId ? Number(unitId) : undefined}
          onChange={(val) => onUnit(val ? String(val) : "")}
          placeholder="Search unit..."
          emptyLabel="Unit"
          className="input flex items-center justify-between text-left cursor-pointer w-full min-w-0 text-xs px-2.5"
        />
      </div>
    </div>
  );
}
