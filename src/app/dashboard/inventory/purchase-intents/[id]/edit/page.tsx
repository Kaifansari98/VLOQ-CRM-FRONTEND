"use client";

import {
  fetchPICategories,
  fetchPIProducts,
  fetchPICompanyVendors,
  fetchCompanyStateId,
  updatePurchaseIntent,
  getPurchaseIntentById,
  PIPriority,
  PIDetail,
  fetchPIPaymentTerms,
  PaymentTermOption,
} from "@/api/inventory/purchaseIntent";
import {
  PICategory,
  PIProduct,
  PICompanyVendor,
  SelectedItem,
  VendorEntry,
  VendorEntryErrors,
  ItemErrors,
  recalcVendorEntry,
  emptyVendorEntry,
  toNum,
} from "@/types/inventory/inventory.types";
import { PricingRow, fmtMoney } from "@/components/inventory/PricingRow";
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
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  Search,
  X,
  Plus,
  Building2,
  ShoppingCart,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CalendarDays,
  IndianRupee,
  Layers3,
  Trash2,
  ClipboardList,
  ShieldCheck,
  ArrowLeft,
  FilePenLine,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const PRIORITIES: PIPriority[] = ["Low", "Medium", "High", "Urgent"];

const PRIORITY_META: Record<
  PIPriority,
  { label: string; icon: string; active: string; idle: string }
> = {
  Low: {
    label: "Low",
    icon: "○",
    active:
      "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900",
    idle: "text-slate-500 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900",
  },
  Medium: {
    label: "Medium",
    icon: "◐",
    active: "bg-indigo-600 text-white border-indigo-600",
    idle: "text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/70 dark:hover:bg-indigo-950",
  },
  High: {
    label: "High",
    icon: "▲",
    active: "bg-amber-500 text-white border-amber-500",
    idle: "text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900/70 dark:hover:bg-amber-950",
  },
  Urgent: {
    label: "Urgent",
    icon: "⚡",
    active: "bg-red-600 text-white border-red-600",
    idle: "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/70 dark:hover:bg-red-950",
  },
};

function ProductPickerModal({
  open,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  productSearch,
  setProductSearch,
  products,
  prodLoading,
  selectedIds,
  onToggleProduct,
}: {
  open: boolean;
  onClose: () => void;
  categories: PICategory[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  productSearch: string;
  setProductSearch: (v: string) => void;
  products: PIProduct[];
  prodLoading: boolean;
  selectedIds: Set<number>;
  onToggleProduct: (p: PIProduct) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold">Add Products</p>
              <p className="text-xs text-muted-foreground">
                Search and select products for this purchase intent.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-[220px_1fr]">
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => {
                setSelectedCategory(Number(e.target.value));
                setProductSearch("");
              }}
              className="h-11 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="" disabled>
                Select Category *
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={inputRef}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product name, article code, HSN..."
                className="h-11 w-full rounded-xl border bg-muted/40 pl-10 pr-10 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-3">
          {!selectedCategory ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package size={36} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a category first</p>
              <p className="text-xs">Products will appear here.</p>
            </div>
          ) : prodLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <AlertCircle size={32} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {products.map((prod) => {
                const isSelected = selectedIds.has(prod.id);

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => onToggleProduct(prod)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-indigo-300 bg-indigo-50 shadow-sm dark:bg-indigo-950/40"
                        : "border-transparent bg-muted/30 hover:border-border hover:bg-background hover:shadow-sm"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Package size={16} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {prod.product_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[prod.article_code, prod.unit_of_measure, prod.procurement]
                          .filter(Boolean)
                          .join(" · ")}
                        {prod.hsn_code && ` · HSN ${prod.hsn_code}`}
                        {prod.tax_pct && ` · GST ${prod.tax_pct}%`}
                      </p>
                    </div>

                    {/* {prod.level1_price && (
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">
                          MRP
                        </p>
                        <p className="text-sm font-bold">
                          ₹{parseFloat(prod.level1_price).toLocaleString("en-IN")}
                        </p>
                      </div>
                    )} */}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {selectedIds.size} product{selectedIds.size !== 1 ? "s" : ""} selected
          </p>

          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function VendorPickerModal({
  allVendors,
  alreadyAdded,
  onAdd,
  onClose,
  loading,
}: {
  allVendors: PICompanyVendor[];
  alreadyAdded: number[];
  onAdd: (v: PICompanyVendor) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = allVendors.filter(
    (v) =>
      (v.company_name.toLowerCase().includes(q.toLowerCase()) ||
        v.vendor_code.toLowerCase().includes(q.toLowerCase())) &&
      !alreadyAdded.includes(v.id)
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[78vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Add Supplier</p>
            <p className="text-xs text-muted-foreground">
              Select supplier for this product.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b p-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search supplier..."
              className="h-10 w-full rounded-xl border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="m-1 h-14 rounded-2xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Building2 size={28} className="mb-2 opacity-20" />
              <p className="text-sm">
                {q ? "No supplier found" : "All suppliers already added"}
              </p>
            </div>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onAdd(v);
                  onClose();
                }}
                className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950">
                  <Building2 size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {v.company_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{v.vendor_code}</p>
                </div>

                <Plus
                  size={16}
                  className="text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProductIntentCard({
  item,
  idx,
  allVendors,
  vendorsLoading,
  paymentTerms,
  onItemChange,
  onRemoveItem,
  onAddVendor,
  onUpdateVendor,
  onRemoveVendor,
  onToggleExpand,

}: {
  item: SelectedItem;
  idx: number;
  allVendors: PICompanyVendor[];
  vendorsLoading: boolean;
  paymentTerms: PaymentTermOption[];
  onItemChange: (i: number, f: keyof SelectedItem, v: any) => void;
  onRemoveItem: (i: number) => void;
  onAddVendor: (i: number, v: PICompanyVendor) => void;
  onUpdateVendor: (i: number, vi: number, f: keyof VendorEntry, v: string) => void;
  onRemoveVendor: (i: number, vi: number) => void;
  onToggleExpand: (i: number) => void;
}) {
  const [modal, setModal] = useState(false);
  const alreadyAdded = item.vendor_entries.map((e) => e.vendor.id);
  const hasErrors = !!item.errors && Object.keys(item.errors).length > 0;

  const productTotal = item.vendor_entries.reduce(
    (s, e) => s + toNum(e.total_amount),
    0
  );

  const totalQty = item.vendor_entries.reduce(
    (s, e) => s + toNum(e.required_qty),
    0
  );

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-3xl border bg-background shadow-sm transition-all",
          hasErrors
            ? "border-red-300 shadow-red-100 dark:shadow-none"
            : "border-border/70 hover:shadow-md"
        )}
      >
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                hasErrors
                  ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                  : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50"
              )}
            >
              <Package size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {item.product.product_name}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {item.product.article_code && <span>{item.product.article_code}</span>}

                    {item.product.hsn_code && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        HSN {item.product.hsn_code}
                      </span>
                    )}

                    {item.product.tax_pct && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        GST {item.product.tax_pct}%
                      </span>
                    )}

                    {item.product.unit_of_measure && (
                      <span>{item.product.unit_of_measure}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasErrors && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-950/50">
                      Needs fixing
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleExpand(idx)}
                    className="rounded-full border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {item.expanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="rounded-full border p-2 text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Suppliers
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {item.vendor_entries.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Total Qty
                  </p>
                  <p className="mt-1 text-sm font-bold">{totalQty || "—"}</p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Product Total
                  </p>
                  <p className="mt-1 text-sm font-bold text-indigo-600">
                    {productTotal > 0 ? fmtMoney(productTotal) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {item.expanded && (
          <div className="border-t bg-muted/20 p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-[180px_1fr]">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                  UOM *
                </label>

                <input
                  value={item.uom}
                  onChange={(e) => onItemChange(idx, "uom", e.target.value)}
                  placeholder="Nos, Kg, Box"
                  className={cn(
                    "mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2",
                    item.errors?.uom
                      ? "border-red-400 bg-red-50 focus:ring-red-300 dark:bg-red-950/30"
                      : "focus:ring-indigo-300"
                  )}
                />

                {item.errors?.uom && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {item.errors.uom}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                  Product Remarks
                </label>

                <input
                  value={item.remarks}
                  onChange={(e) => onItemChange(idx, "remarks", e.target.value)}
                  placeholder="Optional product-specific remarks"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {(item.product.hsn_code || item.product.tax_pct) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                <ShieldCheck size={14} />
                <span className="font-semibold">Tax info detected</span>

                {item.product.hsn_code && <span>HSN {item.product.hsn_code}</span>}
                {item.product.cgst_rate && <span>CGST {item.product.cgst_rate}%</span>}
                {item.product.sgst_rate && <span>SGST {item.product.sgst_rate}%</span>}
                {item.product.tax_pct && <span>Total GST {item.product.tax_pct}%</span>}

                {/* {item.product.level1_price && (
                  <span className="ml-auto font-bold">
                    MRP ₹{parseFloat(item.product.level1_price).toLocaleString("en-IN")}
                  </span>
                )} */}
              </div>
            )}

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      "text-xs font-black uppercase tracking-wider",
                      item.errors?.no_vendors
                        ? "text-red-500"
                        : "text-muted-foreground"
                    )}
                  >
                    Suppliers *
                  </p>

                  {item.errors?.no_vendors && (
                    <p className="text-xs font-medium text-red-500">
                      {item.errors.no_vendors}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setModal(true)}
                  className="rounded-xl"
                >
                  <Plus size={14} className="mr-1.5" />
                  Add Supplier
                </Button>
              </div>

              {item.vendor_entries.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setModal(true)}
                  className={cn(
                    "flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed py-10 text-center transition-colors",
                    item.errors?.no_vendors
                      ? "border-red-300 bg-red-50/40 text-red-500 dark:bg-red-950/20"
                      : "border-border bg-background text-muted-foreground hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 dark:hover:bg-indigo-950/20"
                  )}
                >
                  <Building2 size={26} className="mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Add supplier quotation</p>
                  <p className="text-xs">
                    Quantity, rate, GST and delivery date will be added here.
                  </p>
                </button>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-background">
                  {item.vendor_entries.map((entry, vi) => (
                    <PricingRow
                      key={`${entry.vendor.id}-${vi}`}
                      entry={entry}
                      itemIdx={idx}
                      vi={vi}
                      errors={item.errors?.vendors?.[vi]}
                      canEdit={true}
                      paymentTerms={paymentTerms}
                      onUpdate={onUpdateVendor}
                      onRemove={onRemoveVendor}
                    />
                  ))}

                  <div className="flex items-center justify-between border-t bg-indigo-50/60 px-4 py-3 dark:bg-indigo-950/30">
                    <p className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300">
                      Combined total
                    </p>

                    <p className="text-base font-black text-indigo-700 dark:text-indigo-300">
                      {fmtMoney(productTotal)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <VendorPickerModal
          allVendors={allVendors}
          alreadyAdded={alreadyAdded}
          onAdd={(v) => onAddVendor(idx, v)}
          onClose={() => setModal(false)}
          loading={vendorsLoading}
        />
      )}
    </>
  );
}

export default function EditPurchaseIntentPage() {
  const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
  const userId = Number(useAppSelector((s) => s.auth.user?.id));
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const intentId = Number(id);

  const [intent, setIntent] = useState<PIDetail | null>(null);
  const [categories, setCategories] = useState<PICategory[]>([]);
  const [allVendors, setAllVendors] = useState<PICompanyVendor[]>([]);
  const [products, setProducts] = useState<PIProduct[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [prodLoading, setProdLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [priority, setPriority] = useState<PIPriority>("Medium");
  const [remarks, setRemarks] = useState("");
  const [state_id, setStateId] = useState<number>(0);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTermOption[]>([]);

  useEffect(() => {
    if (!vendorId || !intentId) return;

    setPageLoading(true);
    setVendorLoading(true);

    Promise.all([
      getPurchaseIntentById(vendorId, intentId),
      fetchPICategories(vendorId),
      fetchCompanyStateId(vendorId),
      fetchPICompanyVendors(vendorId, ""),
      fetchPIPaymentTerms(vendorId),

    ])
      .then(([intentData, cats, stateId, vendors, terms]) => {
        if (intentData.status !== "Draft") {
          setNotFound(true);
          return;
        }

        setIntent(intentData);
        setCategories(cats);
        setStateId(stateId);
        setAllVendors(vendors);
        setPaymentTerms(terms ?? []);

        setSelectedCategory(intentData.category.id);
        setPriority(intentData.priority);
        setRemarks(intentData.remarks ?? "");

        const ids = new Set<number>();

        const items: SelectedItem[] = intentData.items.map((item) => {
          ids.add(item.product_id);

          const vendorEntries: VendorEntry[] = item.vendorMappings.map((vm) => {
            const entry: VendorEntry = {
              vendor: vm.companyVendor as PICompanyVendor,
              required_qty: vm.required_qty
                ? String(parseFloat(vm.required_qty))
                : "",
              required_by_date: vm.required_by_date
                ? new Date(vm.required_by_date).toISOString().split("T")[0]
                : "",
              remarks: vm.remarks ?? "",

              mrp: vm.mrp ? String(parseFloat(vm.mrp)) : "",
              discount_pct: vm.discount_pct
                ? String(parseFloat(vm.discount_pct))
                : "0",
              rate: vm.rate
                ? String(parseFloat(vm.rate))
                : vm.estimated_price
                  ? String(parseFloat(vm.estimated_price))
                  : "",

              tax_pct: vm.tax_pct ? String(parseFloat(vm.tax_pct)) : "",
              cgst_pct: vm.cgst_pct ? String(parseFloat(vm.cgst_pct)) : "",
              sgst_pct: vm.sgst_pct ? String(parseFloat(vm.sgst_pct)) : "",
              igst_pct: vm.igst_pct ? String(parseFloat(vm.igst_pct)) : "",

              amount: vm.amount ? String(parseFloat(vm.amount)) : "",
              tax_amount: vm.tax_amount
                ? String(parseFloat(vm.tax_amount))
                : "",
              total_amount: vm.total_amount
                ? String(parseFloat(vm.total_amount))
                : "",
              payment_term_id: vm.payment_term_id
                ? String(vm.payment_term_id)
                : "",
            };

            return recalcVendorEntry(entry);
          });

          const firstEntry = vendorEntries[0];

          const product: PIProduct = {
            id: item.product.id,
            product_name: item.product.product_name,
            article_code: item.product.article_code,
            vendor_code: item.product.vendor_code,
            unit_of_measure: item.product.unit_of_measure,
            moq: item.product.moq,
            // level1_price: item.product.level1_price,
            procurement: item.product.procurement,
            hsn_id: item.product.hsn_id,

            hsn_code: (item.product as any).hsn_code ?? null,
            cgst_rate:
              (item.product as any).cgst_rate ??
              (firstEntry?.cgst_pct ? Number(firstEntry.cgst_pct) : null),
            sgst_rate:
              (item.product as any).sgst_rate ??
              (firstEntry?.sgst_pct ? Number(firstEntry.sgst_pct) : null),
            igst_rate:
              (item.product as any).igst_rate ??
              (firstEntry?.igst_pct ? Number(firstEntry.igst_pct) : null),
            tax_pct:
              (item.product as any).tax_pct ??
              (firstEntry?.tax_pct ? Number(firstEntry.tax_pct) : null),
          } as PIProduct;

          return {
            product,
            uom: item.uom ?? "",
            remarks: item.remarks ?? "",
            expanded: false,
            vendor_entries: vendorEntries,
          };
        });

        setSelectedIds(ids);
        setSelectedItems(items);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setPageLoading(false);
        setVendorLoading(false);
      });
  }, [vendorId, intentId]);

  useEffect(() => {
    if (!selectedCategory || !vendorId) {
      setProducts([]);
      return;
    }

    setProdLoading(true);

    const timer = setTimeout(() => {
      fetchPIProducts(vendorId, selectedCategory, productSearch)
        .then(setProducts)
        .catch(console.error)
        .finally(() => setProdLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [vendorId, selectedCategory, productSearch]);

  const toggleProduct = useCallback((product: PIProduct) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(product.id) ? next.delete(product.id) : next.add(product.id);
      return next;
    });

    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.product.id === product.id);

      if (exists) {
        return prev.filter((i) => i.product.id !== product.id);
      }

      return [
        ...prev,
        {
          product,
          uom: product.unit_of_measure ?? "",
          remarks: "",
          vendor_entries: [],
          expanded: true,
        },
      ];
    });
  }, []);

  const updateItem = useCallback((i: number, f: keyof SelectedItem, v: any) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      const item = { ...next[i], [f]: v };

      if (item.errors && f === "uom") {
        const errors = { ...item.errors };
        delete errors.uom;
        item.errors = Object.keys(errors).length ? errors : undefined;
      }

      next[i] = item;
      return next;
    });
  }, []);

  const removeItem = useCallback((i: number) => {
    setSelectedItems((prev) => {
      const removed = prev[i];

      if (removed) {
        setSelectedIds((ids) => {
          const next = new Set(ids);
          next.delete(removed.product.id);
          return next;
        });
      }

      return prev.filter((_, index) => index !== i);
    });
  }, []);

  const toggleExpand = useCallback((i: number) => {
    setSelectedItems((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        expanded: !next[i].expanded,
      };
      return next;
    });
  }, []);

  const addVendorToItem = useCallback(
    (itemIdx: number, vendor: PICompanyVendor) => {
      setSelectedItems((prev) => {
        const next = [...prev];
        const item = { ...next[itemIdx] };

        const entry = emptyVendorEntry(vendor, item.product);

        const totalTax =
          toNum(item.product.tax_pct as any) ||
          toNum(item.vendor_entries?.[0]?.tax_pct);

        const cgst =
          toNum(item.product.cgst_rate as any) ||
          toNum(item.vendor_entries?.[0]?.cgst_pct) ||
          totalTax / 2;

        const sgst =
          toNum(item.product.sgst_rate as any) ||
          toNum(item.vendor_entries?.[0]?.sgst_pct) ||
          totalTax / 2;

        const isSameState = Number((vendor as any).state_id) === Number(state_id);

        if (isSameState) {
          entry.cgst_pct = String(cgst || 0);
          entry.sgst_pct = String(sgst || 0);
          entry.igst_pct = "0";
          entry.tax_pct = String((cgst || 0) + (sgst || 0));
        } else {
          entry.cgst_pct = "0";
          entry.sgst_pct = "0";
          entry.igst_pct = String(totalTax || 0);
          entry.tax_pct = String(totalTax || 0);
        }

        item.vendor_entries = [...item.vendor_entries, recalcVendorEntry(entry)];

        if (item.errors?.no_vendors) {
          const errors = { ...item.errors };
          delete errors.no_vendors;
          item.errors = Object.keys(errors).length ? errors : undefined;
        }

        next[itemIdx] = item;
        return next;
      });
    },
    [state_id]
  );

  const updateVendorEntry = useCallback(
    (itemIdx: number, vi: number, f: keyof VendorEntry, v: string) => {
      setSelectedItems((prev) => {
        const next = [...prev];
        const entries = [...next[itemIdx].vendor_entries];

        entries[vi] = recalcVendorEntry({
          ...entries[vi],
          [f]: v,
        });

        const item = {
          ...next[itemIdx],
          vendor_entries: entries,
        };

        if (item.errors?.vendors?.[vi]) {
          const vendorErrors = [...(item.errors.vendors ?? [])];
          vendorErrors[vi] = { ...vendorErrors[vi] };

          delete (vendorErrors[vi] as any)[f];

          item.errors = {
            ...item.errors,
            vendors: vendorErrors,
          };

          const hasAnyError = Object.values(item.errors).some((errorValue) => {
            if (!errorValue) return false;
            if (typeof errorValue !== "object") return true;
            return Object.keys(errorValue).length > 0;
          });

          if (!hasAnyError) item.errors = undefined;
        }

        next[itemIdx] = item;
        return next;
      });
    },
    []
  );

  const removeVendorFromItem = useCallback((itemIdx: number, vi: number) => {
    setSelectedItems((prev) => {
      const next = [...prev];

      next[itemIdx] = {
        ...next[itemIdx],
        vendor_entries: next[itemIdx].vendor_entries.filter(
          (_, index) => index !== vi
        ),
      };

      return next;
    });
  }, []);

  const validate = (): boolean => {
    let valid = true;

    const itemsWithErrors = selectedItems.map((item) => {
      const err: ItemErrors = {};

      if (!item.uom.trim()) {
        err.uom = "UOM is required";
        valid = false;
      }

      if (item.vendor_entries.length === 0) {
        err.no_vendors = "Add at least one supplier";
        valid = false;
      }

      const vendorErrors: VendorEntryErrors[] = item.vendor_entries.map((entry) => {
        const ve: VendorEntryErrors = {};

        if (!entry.required_qty || toNum(entry.required_qty) <= 0) {
          ve.required_qty = "Required";
          valid = false;
        }

        if (!entry.rate || toNum(entry.rate) <= 0) {
          ve.rate = "Required";
          valid = false;
        }

        return ve;
      });

      if (vendorErrors.some((ve) => Object.keys(ve).length > 0)) {
        err.vendors = vendorErrors;
      }

      return {
        ...item,
        errors: Object.keys(err).length ? err : undefined,
        expanded: Object.keys(err).length > 0 ? true : item.expanded,
      };
    });

    setSelectedItems(itemsWithErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toastManager.add({ title: "Select a category", type: "error" });
      setProductPickerOpen(true);
      return;
    }

    if (!selectedItems.length) {
      toastManager.add({ title: "Add at least one product", type: "error" });
      setProductPickerOpen(true);
      return;
    }

    if (!validate()) {
      toastManager.add({ title: "Fix errors before saving", type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      await updatePurchaseIntent(vendorId, intentId, {
        category_id: selectedCategory,
        user_id: userId,
        priority,
        remarks: remarks || undefined,
        items: selectedItems.map((item) => ({
          product_id: item.product.id,
          uom: item.uom || undefined,
          remarks: item.remarks || undefined,
          vendors: item.vendor_entries.map((entry) => ({
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
        title: "Purchase Intent updated!",
        type: "success",
      });

      router.push("/dashboard/inventory/purchase-intents");
    } catch {
      toastManager.add({
        title: "Failed to update Purchase Intent",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const productCount = selectedItems.length;

    const supplierCount = selectedItems.reduce(
      (s, item) => s + item.vendor_entries.length,
      0
    );

    const grandTotal = selectedItems.reduce(
      (s, item) =>
        s +
        item.vendor_entries.reduce(
          (ss, entry) => ss + toNum(entry.total_amount),
          0
        ),
      0
    );

    const errorCount = selectedItems.filter((item) => item.errors).length;

    return {
      productCount,
      supplierCount,
      grandTotal,
      errorCount,
    };
  }, [selectedItems]);

  if (!pageLoading && notFound) {
    return (
      <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
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
                  <BreadcrumbPage>Edit Intent</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <AnimatedThemeToggler />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-3xl border bg-background p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 dark:bg-red-950/30">
              <AlertCircle size={30} />
            </div>

            <h1 className="text-lg font-semibold">Cannot edit this intent</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Only Draft purchase intents can be modified.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5 rounded-xl"
              onClick={() => router.back()}
            >
              <ArrowLeft size={15} className="mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <Skeleton className="h-5 w-64 rounded" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <Skeleton className="mb-6 h-56 rounded-[28px]" />

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Skeleton className="h-20 rounded-3xl" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-3xl" />
                ))}
              </div>

              <Skeleton className="h-[420px] rounded-[28px]" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
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
                <BreadcrumbPage>
                  Edit {intent?.intent_no ? intent.intent_no : "Intent"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden h-8 gap-1.5 rounded-xl sm:flex"
            onClick={() => router.back()}
          >
            <ArrowLeft size={13} />
            Cancel
          </Button>

          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
          <div className="mb-6 overflow-hidden rounded-[28px] border bg-background shadow-sm">
            <div className="relative p-5 md:p-6">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-500/10" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <FilePenLine size={13} className="text-indigo-500" />
                    Edit Purchase Intent
                    {intent?.intent_no && (
                      <span className="font-bold text-foreground">
                        • {intent.intent_no}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight">
                    Edit Purchase Intent
                  </h1>

                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Update products, supplier quotations, tax split and requirement
                    details before saving this draft.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                        priority === p
                          ? PRIORITY_META[p].active
                          : PRIORITY_META[p].idle
                      )}
                    >
                      <span className="mr-1">{PRIORITY_META[p].icon}</span>
                      {PRIORITY_META[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <Package size={17} className="mb-3 text-indigo-500" />
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Products
                  </p>
                  <p className="mt-1 text-xl font-black">{stats.productCount}</p>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-4">
                  <Building2 size={17} className="mb-3 text-indigo-500" />
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Suppliers
                  </p>
                  <p className="mt-1 text-xl font-black">
                    {stats.supplierCount}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-4">
                  <IndianRupee size={17} className="mb-3 text-indigo-500" />
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Grand Total
                  </p>
                  <p className="mt-1 text-xl font-black text-indigo-600">
                    {stats.grandTotal > 0 ? fmtMoney(stats.grandTotal) : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-4">
                  <ClipboardList size={17} className="mb-3 text-indigo-500" />
                  <p className="text-[10px] font-black uppercase text-muted-foreground">
                    Status
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-black",
                      stats.errorCount > 0 ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {stats.errorCount > 0
                      ? `${stats.errorCount} item${stats.errorCount > 1 ? "s" : ""
                      } need fixing`
                      : selectedItems.length
                        ? "Ready to save"
                        : "Add products"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 rounded-3xl border bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Selected Products</p>
                  <p className="text-xs text-muted-foreground">
                    Modify products and configure supplier-wise requirement.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setProductPickerOpen(true)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus size={16} className="mr-1.5" />
                  Add Product
                </Button>
              </div>

              {selectedItems.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed bg-background p-8 text-center shadow-sm">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                    <ShoppingCart size={28} />
                  </div>

                  <h2 className="text-lg font-semibold">No products selected</h2>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Add products to continue editing this purchase intent.
                  </p>

                  <Button
                    type="button"
                    onClick={() => setProductPickerOpen(true)}
                    className="mt-5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedItems.map((item, idx) => (
                    <ProductIntentCard
                      key={item.product.id}
                      item={item}
                      idx={idx}
                      allVendors={allVendors}
                      vendorsLoading={vendorLoading}
                      paymentTerms={paymentTerms}
                      onItemChange={updateItem}
                      onRemoveItem={removeItem}
                      onAddVendor={addVendorToItem}
                      onUpdateVendor={updateVendorEntry}
                      onRemoveVendor={removeVendorFromItem}
                      onToggleExpand={toggleExpand}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="lg:sticky lg:top-6 lg:h-fit">
              <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
                <div className="border-b p-5">
                  <p className="text-base font-semibold">Intent Summary</p>
                  <p className="text-xs text-muted-foreground">
                    Review changes before saving this draft.
                  </p>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package size={15} />
                      Products
                    </span>
                    <span className="font-bold">{stats.productCount}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 size={15} />
                      Suppliers
                    </span>
                    <span className="font-bold">{stats.supplierCount}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers3 size={15} />
                      Priority
                    </span>
                    <span className="font-bold">{priority}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays size={15} />
                      Validation
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        stats.errorCount > 0 ? "text-red-600" : "text-emerald-600"
                      )}
                    >
                      {stats.errorCount > 0 ? `${stats.errorCount} issues` : "Clear"}
                    </span>
                  </div>

                  <div className="rounded-3xl border bg-indigo-50/60 p-4 dark:bg-indigo-950/30">
                    <p className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
                      Grand Total
                    </p>

                    <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
                      {stats.grandTotal > 0 ? fmtMoney(stats.grandTotal) : "—"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                      Overall Remarks
                    </label>

                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional remarks for this purchase intent..."
                      rows={4}
                      className="mt-1 w-full resize-none rounded-2xl border bg-muted/30 p-3 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>

                <div className="border-t p-5">
                  {stats.errorCount > 0 && (
                    <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600 dark:border-red-900 dark:bg-red-950/30">
                      Please fix highlighted items before saving.
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedItems.length}
                    className="h-11 w-full rounded-2xl bg-indigo-600 font-bold hover:bg-indigo-700"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    {submitting ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <ProductPickerModal
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        products={products}
        prodLoading={prodLoading}
        selectedIds={selectedIds}
        onToggleProduct={toggleProduct}
      />
    </div>
  );
}