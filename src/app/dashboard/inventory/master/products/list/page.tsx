"use client";

import {
  getProducts, getProductFilters, syncCadBidProducts,
  downloadProductBulkTemplate, uploadProductBulkSheet, BulkUploadProductResult,
  Product, ProductListResponse, ProductFilters, SyncResult,
} from "@/api/inventory/inventory";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/redux/store";
import { getProductPurchaseHistory, ProductHistory } from "@/api/inventory/product";
import {
  downloadStockSheet, uploadStockSheet, getProductStockHistory,
  StockHistoryResponse, UploadResult,
} from "@/api/inventory/stock";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Search, X,
  Package, RefreshCw, Plus, CheckCircle2,
  ShoppingCart, AlertTriangle, ClipboardList,
  History, TrendingUp, Download, Upload,
  ArrowUp, ArrowDown, Clock, Loader2, Pencil,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: string | number | null, prefix = "") =>
  v !== null && v !== undefined && v !== "" ? `${prefix}${v}` : "—";

const fmtPrice = (v: string | null) =>
  v ? `₹${parseFloat(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";

const fmtDim = (l: number, w: number, t: number) => {
  if (!l && !w && !t) return "—";
  return t ? `${l}×${w}×${t}` : `${l}×${w}`;
};

const getEffectiveDimensions = (product: Product) => {
  const d1 = Number(product.dimension_1 ?? 0);
  const d2 = Number(product.dimension_2 ?? 0);
  const d3 = Number(product.dimension_3 ?? 0);

  if (d1 === 0 && d2 === 0 && d3 === 0) {
    const len = Number(product.length ?? 0);
    const hgt = Number(product.height ?? 0);
    const thk = Number(product.thickness ?? 0);
    return {
      d1: len,
      d2: hgt,
      d3: thk,
      hasDim: len !== 0 || hgt !== 0 || thk !== 0,
    };
  }
  return {
    d1,
    d2,
    d3,
    hasDim: d1 !== 0 || d2 !== 0 || d3 !== 0,
  };
};

// ─── KPI Card (Monochrome) ───────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50, 100],
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto border-t px-4 py-3 sm:flex-row sm:gap-8">
      <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> products
      </div>
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center space-x-2">
          <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(val) => {
              onPageSizeChange(Number(val));
            }}
          >
            <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={`${pageSize}`} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={`${opt}`}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {page} of {Math.max(1, totalPages)}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            aria-label="Go to first page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onChange(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages || totalPages === 0}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onChange(totalPages)}
            disabled={page >= totalPages || totalPages === 0}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Detail Dialog ────────────────────────────────────────────────────

function ProductDetailDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-[9px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-lg">{product.product_name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.category.category_name}
                {product.brand && <> · {product.brand.brand_name}</>}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                product.active === "Yes"
                  ? "border-border/80 bg-muted/40 text-foreground"
                  : "border-border/50 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  product.active === "Yes" ? "bg-foreground" : "bg-muted-foreground/50"
                )}
              />
              {product.active === "Yes" ? "Active" : "Inactive"}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <Section title="Identity">
            <Field label="Item ID" value={fmt(product.item_id)} />
            <Field label="Article Code" value={fmt(product.article_code)} />
            <Field label="Vendor Code" value={fmt(product.vendor_code)} />
            <Field label="Barcode" value={fmt(product.barcode ?? null)} />
            <Field label="HSN Code" value={fmt(product.hsn?.hsn_code ?? product.hsn_code)} />
            <Field label="Group" value={fmt((product as any).itemGroup?.group_name ?? product.group)} />
            <Field label="Procurement" value={fmt(product.procurement)} />
          </Section>

          <Separator />

          <Section title="Material & Finish">
            <Field label="Core Material" value={fmt(
              product.core_material === null || product.core_material === undefined || product.core_material === ""
                ? (
                    product.coreProduct?.core_product_name ??
                    product.coreProduct?.name ??
                    product.core_product_id ??
                    null
                  )
                : product.core_material
            )} />
            <Field label="Sub Category" value={fmt(
              product.subCategory?.category_name ??
              product.subCategory?.name ??
              null
            )} />
            <Field label="Finish" value={fmt(
              product.finish === null || product.finish === undefined || product.finish === ""
                ? (
                    product.finishMaster?.finish_name ??
                    product.finishMaster?.name ??
                    product.finish_id ??
                    null
                  )
                : product.finish
            )} />
            <Field label="Edge Banding Color" value={fmt(product.edge_banding_color)} />
            <Field label="Grade" value={fmt(
              product.grade?.grade_name ??
              product.grade?.name ??
              null
            )} />
            <Field label="Color Name" value={fmt(product.color_name ?? null)} />
            <Field
              label="Thickness"
              value={product.thickness_mm ? `${product.thickness_mm} mm` : "—"}
            />
            <Field label="P. Code" value={fmt(product.p_code ?? null)} />
          </Section>

          <Separator />

          <Section title="Dimensions & Units">
            {product.size ? (
              <Field label="Size" value={product.size} />
            ) : (
              <>
                <Field label="Board (L×W)" value={`${product.board_length} × ${product.board_width}`} />
                <Field label="Dim 1×2×3" value={(() => { const { d1, d2, d3 } = getEffectiveDimensions(product); return fmtDim(d1, d2, d3); })()} />
              </>
            )}
            <Field label="Size Master" value={fmt(product.sizeMaster?.name ?? null)} />
            <Field label="Pre-Mill Width" value={fmt(product.pre_mill_width)} />
            <Field label="Drill Holes" value={fmt(product.no_of_drill_holes)} />
            <Field label="Rotation" value={fmt(product.rotation)} />
            <Field label="Unit of Measure" value={fmt(product.primaryUnit?.unit_name ?? product.unit_of_measure)} />
            <Field label="Alt UOM" value={fmt(product.alt_uom_text)} />
            <Field label="Alt Conv Factor" value={fmt(product.alt_conv_factor)} />
            <Field label="Weight" value={product.item1_weight ? `${product.item1_weight} kg` : "—"} />
          </Section>

          <Separator />

          <Section title="Pricing">
            <Field label="Purchase Rate" value={fmtPrice(product.level1_price)} />
            <Field label="Cost Price" value={fmtPrice(product.cost_price ? String(product.cost_price) : null)} />
            <Field label="B2C Selling" value={fmtPrice(product.b2c_selling_price ? String(product.b2c_selling_price) : null)} />
            <Field label="B2B Selling" value={fmtPrice(product.b2b_selling_price ? String(product.b2b_selling_price) : null)} />
            <Field label="MRP" value={fmtPrice(product.mrp ? String(product.mrp) : null)} />
            <Field label="Vendor Invoice Name" value={fmt(product.product_as_per_vendor_invoice ?? null)} />
            <Field label="Level 2 Price" value={fmtPrice(product.level2_price)} />
            <Field label="Level 3 Price" value={fmtPrice(product.level3_price)} />
            <Field label="Installation" value={fmtPrice(product.installation_charges)} />
            <Field label="MOQ" value={fmt(product.moq)} />
          </Section>

          {(product.custom_field_1 || product.custom_field_2 || product.custom_field_3) && (<>
            <Separator />
            <Section title="Custom Fields">
              {product.custom_field_1 && <Field label="Custom 1" value={product.custom_field_1} />}
              {product.custom_field_2 && <Field label="Custom 2" value={product.custom_field_2} />}
              {product.custom_field_3 && <Field label="Custom 3" value={product.custom_field_3} />}
            </Section>
          </>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Searchable Dropdown ──────────────────────────────────────────────────────

function SearchableSelect<T extends { id: number; label: string }>({
  options, value, onChange, placeholder,
}: {
  options: T[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = [...options]
    .sort((a, b) => a.label.localeCompare(b.label))
    .filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQ(""); }}
        className={cn(
          "h-9 min-w-36 max-w-56 px-3 rounded-lg border bg-background text-xs font-medium text-left flex items-center justify-between gap-2 shadow-xs transition-colors hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring",
          selected ? "text-foreground font-semibold" : "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(undefined); setQ(""); }}
              className="hover:text-foreground text-muted-foreground p-0.5 rounded-sm hover:bg-muted"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={13} className={cn("transition-transform text-muted-foreground opacity-60", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-60 rounded-xl border bg-popover text-xs shadow-lg backdrop-blur-sm p-1 animate-in fade-in-0 zoom-in-95">
          <div className="p-1.5 border-b mb-1">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full pl-7 pr-2 py-1 text-xs bg-muted/50 rounded-md outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-0.5 space-y-0.5">
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false); }}
              className={cn(
                "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors flex items-center justify-between",
                !value ? "font-semibold text-foreground bg-muted/60" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{placeholder}</span>
              {!value && <CheckCircle2 size={12} className="text-foreground shrink-0" />}
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
            ) : (
              filtered.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2",
                    value === o.id ? "font-semibold text-foreground bg-muted/60" : "text-foreground"
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {value === o.id && <CheckCircle2 size={12} className="text-foreground shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sync Result Dialog ───────────────────────────────────────────────────────

function SyncResultDialog({ result, onClose }: { result: SyncResult; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="border-b bg-muted/20 px-6 py-5 flex items-center gap-3">
          <div className="border bg-background rounded-xl p-2 text-foreground">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">Sync Complete</DialogTitle>
            <p className="text-muted-foreground text-xs mt-0.5">CadBid products synced successfully</p>
          </div>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-3">
          {[
            { label: "Total", value: result.totalCount },
            { label: "Fetched", value: result.fetched },
            { label: "Created", value: result.created },
            { label: "Updated", value: result.updated },
            { label: "Skipped", value: result.skipped },
            { label: "Brands Created", value: result.brandsCreated },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="text-xl font-bold tracking-tight text-foreground tabular-nums mt-0.5">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5">
          <Button className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  category_id: number | undefined;
  brand_id: number | undefined;
  active: string;
  procurement: string;
}

function FilterBar({ filters, setFilters, filtersData, loading }: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  filtersData: (ProductFilters & { procurements: string[] }) | null;
  loading: boolean;
}) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  useEffect(() => {
    const t = setTimeout(() => setFilters({ ...filters, search: localSearch }), 400);
    return () => clearTimeout(t);
  }, [localSearch]);

  const hasFilters = filters.search || filters.category_id || filters.brand_id || filters.active || filters.procurement;

  const clear = () => {
    setLocalSearch("");
    setFilters({ search: "", category_id: undefined, brand_id: undefined, active: "", procurement: "" });
  };

  const categoryOptions = (filtersData?.categories ?? []).map(c => ({ id: c.id, label: c.category_name }));
  const brandOptions = (filtersData?.brands ?? []).map(b => ({ id: b.id, label: b.brand_name }));

  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      <div className="relative w-64 md:w-72">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          placeholder="Search products, article codes…"
          className="pl-9 pr-8 h-9 w-full rounded-lg border bg-background text-xs outline-none transition-colors hover:bg-muted/20 focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 text-foreground"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => setLocalSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <SearchableSelect options={categoryOptions} value={filters.category_id}
        onChange={id => setFilters({ ...filters, category_id: id })} placeholder="All Categories" />

      <SearchableSelect options={brandOptions} value={filters.brand_id}
        onChange={id => setFilters({ ...filters, brand_id: id })} placeholder="All Brands" />

      <Select
        value={filters.active || "ALL"}
        onValueChange={(val) => setFilters({ ...filters, active: val === "ALL" ? "" : val })}
      >
        <SelectTrigger className="h-9 min-w-32 rounded-lg border bg-background text-xs font-medium text-foreground shadow-xs">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="Yes">Active</SelectItem>
          <SelectItem value="No">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.procurement || "ALL"}
        onValueChange={(val) => setFilters({ ...filters, procurement: val === "ALL" ? "" : val })}
      >
        <SelectTrigger className="h-9 min-w-36 max-w-52 rounded-lg border bg-background text-xs font-medium text-foreground shadow-xs">
          <SelectValue placeholder="All Procurement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Procurement</SelectItem>
          {(filtersData?.procurements ?? []).map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button size="sm" variant="ghost" className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={clear}>
          <X size={13} /> Clear
        </Button>
      )}

      {loading && <RefreshCw size={14} className="animate-spin text-muted-foreground ml-1" />}
    </div>
  );
}

// ─── Stock Upload Modal ───────────────────────────────────────────────────────

function StockUploadModal({ uploading, result, onUpload, onClose }: {
  uploading: boolean;
  result: UploadResult | null;
  onUpload: (file: File) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) return;
    onUpload(file);
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Upload size={15} /> Upload Stock Sheet
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fill the "New Stock" column in the downloaded sheet and upload it back.
          </p>
        </div>

        {!result ? (
          <div className="p-5 space-y-4">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => !uploading && fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                dragOver ? "border-foreground/50 bg-muted/30" : "border-muted hover:border-foreground/30 hover:bg-muted/20",
                uploading ? "pointer-events-none opacity-60" : ""
              )}>
              {uploading
                ? <Loader2 size={28} className="animate-spin text-foreground" />
                : <Upload size={28} className="text-muted-foreground/40" />}
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {uploading ? "Processing…" : "Drop .xlsx here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Only .xlsx · Max 10 MB</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => handleFile(e.target.files?.[0])} />

            <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 space-y-1.5">
              <p className="text-xs font-bold text-foreground mb-1">How it works</p>
              {[
                'Click "Download Stock" to get the current stock sheet',
                'Fill the "New Stock" column for products to update',
                "Leave blank to skip a row — only filled rows are updated",
                "Upload the file — old stock is saved to history automatically",
              ].map((t, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="font-bold text-foreground shrink-0">{i + 1}.</span>{t}
                </p>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Rows", value: result.total },
                { label: "Updated", value: result.updated },
                { label: "Skipped", value: result.skipped },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl px-3 py-3 text-center bg-muted/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border bg-muted/20 overflow-hidden">
                <p className="px-3 py-2 text-xs font-bold text-foreground border-b">
                  {result.errors.length} row error{result.errors.length > 1 ? "s" : ""}
                </p>
                <div className="max-h-36 overflow-y-auto divide-y">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs flex gap-3">
                      <span className="text-muted-foreground font-mono shrink-0">Row {e.row}</span>
                      <span className="text-foreground">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.updated > 0 && (
              <p className="text-[10px] text-muted-foreground text-center">
                Batch: <span className="font-mono">{result.batch_id}</span>
              </p>
            )}

            <div className="flex justify-end">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-medium" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Stock History Panel ──────────────────────────────────────────────────────

function StockHistoryPanel({ product, vendorId, onClose }: {
  product: Product; vendorId: number; onClose: () => void;
}) {
  const [data, setData] = useState<StockHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback((p: number) => {
    setLoading(true);
    getProductStockHistory(vendorId, product.id, p)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [vendorId, product.id]);

  useEffect(() => { load(page); }, [load, page]);

  const fmtN = (v: string | number) =>
    parseFloat(String(v)).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const fmtD = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const SOURCE: Record<string, { label: string; cls: string }> = {
    GRNConfirmation: { label: "GRN", cls: "bg-muted text-foreground border border-border" },
    ExcelUpload: { label: "Upload", cls: "bg-muted text-foreground border border-border" },
    ManualAdjustment: { label: "Manual", cls: "bg-muted text-foreground border border-border" },
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-40 w-full max-w-lg bg-background shadow-2xl flex flex-col border-l">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted text-foreground border">
              <Clock size={16} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{product.product_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {product.article_code && <span className="font-mono mr-1">{product.article_code} ·</span>}
                Stock History
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground font-medium">Current Stock</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {fmtN(product.current_stock ?? 0)}
            </p>
            {product.unit_of_measure && (
              <span className="text-xs text-muted-foreground">{product.unit_of_measure}</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !data?.history.length ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Clock size={28} className="opacity-20" />
              <p className="text-sm font-medium">No stock changes recorded yet</p>
              <p className="text-xs opacity-70">Changes via GRN confirmation or Excel upload appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.history.map((row) => {
                const change = parseFloat(row.change);
                const isUp = change >= 0;
                const src = SOURCE[row.source] ?? { label: row.source, cls: "bg-muted text-muted-foreground border border-border" };
                return (
                  <div key={row.id} className="px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 p-1.5 rounded-lg shrink-0 bg-muted text-foreground border">
                        {isUp
                          ? <ArrowUp size={13} />
                          : <ArrowDown size={13} className="text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums">
                          <span className="text-muted-foreground">{fmtN(row.old_stock)}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="font-bold text-foreground">
                            {fmtN(row.new_stock)}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full", src.cls)}>
                            {src.label}
                          </span>
                          {row.changedBy && (
                            <span className="text-[10px] text-muted-foreground">{row.changedBy.user_name}</span>
                          )}
                          {row.remarks && (
                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[160px]">
                              {row.remarks}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-foreground">
                        {isUp ? "+" : ""}{fmtN(change)}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{fmtD(row.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {data && data.total_pages > 1 && (
          <div className="border-t px-5 py-3 flex items-center justify-between shrink-0 bg-background">
            <p className="text-xs text-muted-foreground">{data.total} records</p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={13} />
              </Button>
              <span className="text-xs px-2">{page} / {data.total_pages}</span>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Product History Panel ────────────────────────────────────────────────────

function ProductHistoryPanel({ product, vendorId, onClose }: {
  product: Product; vendorId: number; onClose: () => void;
}) {
  const [data, setData] = useState<ProductHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pi" | "po" | "grn">("po");

  useEffect(() => {
    getProductPurchaseHistory(vendorId, product.id)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [vendorId, product.id]);

  const fmtN = (n: string | number | null) =>
    n != null ? parseFloat(String(n)).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—";
  const fmtD = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const PI_STATUS_COLOR: Record<string, string> = {
    Draft: "border border-border/60 bg-muted/30 text-foreground",
    PendingApproval: "border border-border/60 bg-muted/30 text-foreground",
    Approved: "border border-border/80 bg-muted/60 text-foreground font-medium",
    Rejected: "border border-border/60 text-muted-foreground",
    ConvertedToPO: "border border-border/80 bg-muted/40 text-foreground",
    Cancelled: "border border-border/50 text-muted-foreground",
  };
  const PO_STATUS_COLOR: Record<string, string> = {
    Draft: "border border-border/60 bg-muted/30 text-foreground",
    Approved: "border border-border/80 bg-muted/60 text-foreground font-medium",
    PartiallyReceived: "border border-border/60 bg-muted/30 text-foreground",
    Received: "border border-border/80 bg-muted/60 text-foreground font-medium",
    Cancelled: "border border-border/50 text-muted-foreground",
  };
  const GRN_COLOR: Record<string, string> = {
    Draft: "border border-border/60 bg-muted/30 text-foreground",
    Confirmed: "border border-border/80 bg-muted/60 text-foreground font-medium",
    Closed: "border border-border/50 text-muted-foreground",
  };

  const TABS = [
    { id: "po" as const, label: "Purchase Orders", Icon: ShoppingCart, count: data?.stats.total_po },
    { id: "pi" as const, label: "Purchase Enquiries", Icon: AlertTriangle, count: data?.stats.total_pi },
    { id: "grn" as const, label: "GRN Receipts", Icon: ClipboardList, count: data?.stats.total_grn },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-40 w-full max-w-2xl bg-background shadow-2xl flex flex-col border-l">

        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted text-foreground border">
              <History size={16} />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{product.product_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {product.article_code && <span className="font-mono mr-2">{product.article_code} ·</span>}
                Purchase History
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Failed to load
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-4 divide-x border-b shrink-0">
              {[
                { label: "In Stock", value: fmtN(data.stats.current_stock) },
                { label: "Accepted", value: fmtN(data.stats.total_accepted) },
                { label: "Rejected", value: fmtN(data.stats.total_rejected) },
                { label: "Pending", value: fmtN(data.stats.total_pending) },
              ].map(({ label, value }) => (
                <div key={label} className="px-4 py-3 text-center bg-muted/10">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {data.product.stock_updated_at && (
              <div className="px-5 py-2 bg-muted/30 border-b text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
                <TrendingUp size={11} className="text-foreground" />
                <span>Stock last updated: {fmtD(data.product.stock_updated_at)} via GRN confirmation</span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b shrink-0 bg-muted/10">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px",
                    tab === t.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
                  <t.Icon size={13} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.2 rounded-full font-bold",
                      tab === t.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    )}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* ── Purchase Orders ── */}
              {tab === "po" && (
                !data.purchase_orders.length ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                    <ShoppingCart size={24} className="opacity-20" />
                    <p className="text-sm">No purchase orders yet</p>
                  </div>
                ) : data.purchase_orders.map((po, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden bg-background">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-foreground">{po.po_no}</span>
                        <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full",
                          PO_STATUS_COLOR[po.status] ?? "border border-border text-muted-foreground")}>
                          {po.status}
                        </span>
                        {po.intent_no && (
                          <span className="text-[10px] text-muted-foreground">← {po.intent_no}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{fmtD(po.created_at)}</span>
                    </div>
                    {(() => {
                      const po_ = po as any;
                      const fmtM = (v: any) => v && parseFloat(String(v)) > 0
                        ? `₹${parseFloat(String(v)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";
                      return (
                        <>
                          {/* Row 1: Supplier / Ordered / Received / Delivery */}
                          <div className="grid grid-cols-4 divide-x border-b">
                            {[
                              { label: "Supplier", value: po.supplier },
                              { label: "Ordered", value: fmtN(po.ordered_qty) + (po.uom ? ` ${po.uom}` : "") },
                              { label: "Received", value: fmtN(po.received_qty) },
                              { label: "Delivery", value: fmtD(po_.expected_delivery_date_item ?? po_.expected_delivery_date) },
                            ].map(({ label, value }) => (
                              <div key={label} className="px-3 py-2">
                                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                <p className="text-xs font-semibold text-foreground truncate">{value}</p>
                              </div>
                            ))}
                          </div>
                          {/* Row 2: MRP / Disc% / Rate */}
                          <div className="grid grid-cols-3 divide-x bg-muted/15 border-b">
                            {[
                              { label: "MRP", value: fmtM(po_.mrp) },
                              { label: "Disc%", value: po_.discount_pct ? `${parseFloat(String(po_.discount_pct))}%` : "—" },
                              { label: "Rate", value: fmtM(po_.rate ?? po_.unit_price) },
                            ].map(({ label, value }) => (
                              <div key={label} className="px-3 py-2">
                                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                <p className="text-xs font-semibold text-foreground">{value}</p>
                              </div>
                            ))}
                          </div>
                          {/* Row 3: GST% / CGST% / SGST% */}
                          <div className="grid grid-cols-3 divide-x bg-muted/10 border-b">
                            {[
                              { label: "GST%", value: po_.tax_pct ? `${parseFloat(String(po_.tax_pct))}%` : "—" },
                              { label: "CGST%", value: po_.cgst_pct ? `${parseFloat(String(po_.cgst_pct))}%` : "—" },
                              { label: "SGST%", value: po_.sgst_pct ? `${parseFloat(String(po_.sgst_pct))}%` : "—" },
                            ].map(({ label, value }) => (
                              <div key={label} className="px-3 py-2">
                                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                <p className="text-xs font-semibold text-foreground">{value}</p>
                              </div>
                            ))}
                          </div>
                          {/* Row 4: Amount / GST Amt / Total */}
                          <div className="grid grid-cols-3 divide-x bg-muted/30">
                            {[
                              { label: "Amount", value: fmtM(po_.amount), cls: "text-foreground" },
                              { label: "GST Amt", value: fmtM(po_.tax_amount), cls: "text-foreground" },
                              { label: "Total", value: fmtM(po_.total_amount), cls: "text-foreground font-bold" },
                            ].map(({ label, value, cls }) => (
                              <div key={label} className="px-3 py-2">
                                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                <p className={cn("text-xs font-semibold", cls)}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ))
              )}

              {/* ── Purchase Intents ── */}
              {tab === "pi" && (
                !data.purchase_intents.length ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                    <AlertTriangle size={24} className="opacity-20" />
                    <p className="text-sm">No purchase enquiries yet</p>
                  </div>
                ) : data.purchase_intents.map((pi, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden bg-background">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-foreground">{pi.intent_no}</span>
                        <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full",
                          PI_STATUS_COLOR[pi.status] ?? "border border-border text-muted-foreground")}>
                          {pi.status}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{pi.priority}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{fmtD(pi.created_at)}</span>
                    </div>
                    {pi.vendors.length > 0 && (() => {
                      const fmtM = (v: any) => v && parseFloat(String(v)) > 0
                        ? `₹${parseFloat(String(v)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";
                      const itemTotal = pi.vendors.reduce((s: number, v: any) =>
                        s + (v.total_amount ? parseFloat(String(v.total_amount)) : 0), 0);
                      return (
                        <div className="divide-y">
                          {pi.vendors.map((v: any, vi: number) => (
                            <div key={vi} className="px-3 py-2.5">
                              {/* Supplier + date */}
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-xs font-semibold text-foreground">{v.vendor_name}</p>
                                  <p className="text-[9px] text-muted-foreground">{v.vendor_code}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Req. By</p>
                                  <p className="text-xs font-semibold text-foreground">{fmtD(v.required_by)}</p>
                                </div>
                              </div>
                              {/* Row 1: Qty / MRP / Disc% / Rate */}
                              <div className="grid grid-cols-4 gap-2 mb-1.5">
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</p>
                                  <p className="text-xs font-semibold text-foreground">{fmtN(v.required_qty)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">MRP</p>
                                  <p className="text-xs text-foreground">{fmtM(v.mrp)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Disc%</p>
                                  <p className="text-xs text-foreground">{v.discount_pct ? `${parseFloat(String(v.discount_pct))}%` : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Rate</p>
                                  <p className="text-xs font-semibold text-foreground">{fmtM(v.rate || v.estimated_price)}</p>
                                </div>
                              </div>
                              {/* Row 2: GST% / CGST% / SGST% */}
                              <div className="grid grid-cols-3 gap-2 mb-1.5">
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">GST%</p>
                                  <p className="text-xs font-semibold text-foreground">{v.tax_pct ? `${parseFloat(String(v.tax_pct))}%` : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">CGST%</p>
                                  <p className="text-xs text-foreground">{v.cgst_pct ? `${parseFloat(String(v.cgst_pct))}%` : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">SGST%</p>
                                  <p className="text-xs text-foreground">{v.sgst_pct ? `${parseFloat(String(v.sgst_pct))}%` : "—"}</p>
                                </div>
                              </div>
                              {/* Row 3: Amount / GST Amt / Total */}
                              <div className="rounded-lg bg-muted/40 px-2.5 py-1.5 grid grid-cols-3 gap-2 border">
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
                                  <p className="text-xs font-semibold text-foreground">{fmtM(v.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">GST Amt</p>
                                  <p className="text-xs font-semibold text-foreground">{fmtM(v.tax_amount)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
                                  <p className="text-sm font-bold text-foreground">{fmtM(v.total_amount)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {itemTotal > 0 && (
                            <div className="px-3 py-2 bg-muted/30 flex items-center justify-between border-t">
                              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Total {pi.vendors.length > 1 ? `(${pi.vendors.length} suppliers)` : ""}
                              </p>
                              <p className="text-sm font-bold text-foreground">
                                ₹{itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))
              )}

              {/* ── GRN Receipts ── */}
              {tab === "grn" && (
                !data.grn_receipts.length ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                    <ClipboardList size={24} className="opacity-20" />
                    <p className="text-sm">No GRN receipts yet</p>
                  </div>
                ) : data.grn_receipts.map((grn, i) => {
                  const rejected = parseFloat(grn.rejected_qty);
                  return (
                    <div key={i} className="rounded-xl border overflow-hidden bg-background">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono text-foreground">{grn.grn_no}</span>
                          <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full",
                            GRN_COLOR[grn.status] ?? "border border-border text-muted-foreground")}>
                            {grn.status}
                          </span>
                          {rejected > 0 && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                              ⚠ Damaged
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground">← {grn.po_no}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{fmtD(grn.received_date)}</span>
                      </div>
                      {(() => {
                        const g = grn as any;
                        const fmtM = (v: any) => v && parseFloat(String(v)) > 0
                          ? `₹${parseFloat(String(v)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—";
                        return (
                          <>
                            {/* Row 1: Received / Accepted / Rejected / Rate */}
                            <div className="grid grid-cols-4 divide-x border-b">
                              {[
                                { label: "Received", value: fmtN(grn.received_qty), cls: "text-foreground" },
                                { label: "Accepted", value: fmtN(grn.accepted_qty), cls: "text-foreground font-semibold" },
                                { label: "Rejected", value: fmtN(grn.rejected_qty), cls: "text-foreground" },
                                { label: "Rate", value: fmtM(g.rate ?? grn.unit_price), cls: "text-foreground" },
                              ].map(({ label, value, cls }) => (
                                <div key={label} className="px-3 py-2 text-center">
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                  <p className={cn("text-xs font-semibold tabular-nums", cls)}>{value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Row 2: MRP / Disc% / Rate */}
                            <div className="grid grid-cols-3 divide-x bg-muted/15 border-b">
                              {[
                                { label: "MRP", value: fmtM(g.mrp) },
                                { label: "Disc%", value: g.discount_pct ? `${parseFloat(String(g.discount_pct))}%` : "—" },
                                { label: "Rate", value: fmtM(g.rate ?? grn.unit_price) },
                              ].map(({ label, value }) => (
                                <div key={label} className="px-3 py-2 text-center">
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                  <p className="text-xs font-semibold text-foreground">{value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Row 3: GST% / CGST% / SGST% */}
                            <div className="grid grid-cols-3 divide-x bg-muted/10 border-b">
                              {[
                                { label: "GST%", value: g.tax_pct ? `${parseFloat(String(g.tax_pct))}%` : "—" },
                                { label: "CGST%", value: g.cgst_pct ? `${parseFloat(String(g.cgst_pct))}%` : "—" },
                                { label: "SGST%", value: g.sgst_pct ? `${parseFloat(String(g.sgst_pct))}%` : "—" },
                              ].map(({ label, value }) => (
                                <div key={label} className="px-3 py-2 text-center">
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                  <p className="text-xs font-semibold text-foreground">{value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Row 4: Amount / GST Amt / Total */}
                            <div className="grid grid-cols-3 divide-x bg-muted/30">
                              {[
                                { label: "Amount", value: fmtM(g.amount), cls: "text-foreground" },
                                { label: "GST Amt", value: fmtM(g.tax_amount), cls: "text-foreground" },
                                { label: "Total", value: fmtM(g.total_amount), cls: "text-foreground font-bold" },
                              ].map(({ label, value, cls }) => (
                                <div key={label} className="px-3 py-2 text-center">
                                  <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                                  <p className={cn("text-xs font-semibold", cls)}>{value}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                      {grn.rejection_reason && (
                        <p className="px-4 py-1.5 text-[10px] text-muted-foreground italic bg-muted/20 border-t">
                          ↳ {grn.rejection_reason}
                        </p>
                      )}
                      {grn.confirmed_by && (
                        <p className="px-4 py-1.5 text-[9px] text-muted-foreground border-t bg-muted/10 flex items-center gap-1">
                          <CheckCircle2 size={9} />
                          Confirmed by {grn.confirmed_by} · {fmtD(grn.confirmed_at)}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductMasterPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const router = useRouter();

  const PRODUCT_MASTER_BASE = "/dashboard/inventory/product-master";

  const handleAddProduct = () => {
    router.push(`${PRODUCT_MASTER_BASE}/add`);
  };

  const handleEditProduct = (product: Product) => {
    router.push(`${PRODUCT_MASTER_BASE}/${product.id}/edit`);
  };

  const [data, setData] = useState<ProductListResponse | null>(null);
  const [filtersData, setFiltersData] = useState<(ProductFilters & { procurements: string[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUploadProductResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "", category_id: undefined, brand_id: undefined, active: "", procurement: "",
  });

  useEffect(() => {
    if (!vendorId) return;
    getProductFilters(Number(vendorId)).then(setFiltersData).catch(console.error);
  }, [vendorId]);

  const fetchProducts = useCallback(() => {
    if (!vendorId) return;
    setLoading(true);
    getProducts(Number(vendorId), { page, pageSize, ...filters })
      .then((res) => {
        console.log("Fetched Products data in frontend:", res);
        setData(res);
      }).catch(console.error).finally(() => setLoading(false));
  }, [vendorId, page, pageSize, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (data?.products) {
      console.log("Current page products in UI state:", data.products);
    }
  }, [data]);

  const handleSync = async () => {
    if (!vendorId || syncing) return;
    setSyncing(true);
    try {
      const res = await syncCadBidProducts(Number(vendorId));
      setSyncResult(res.data);
      fetchProducts();
    } catch (err) { console.error("Sync failed", err); }
    finally { setSyncing(false); }
  };

  const handleDownload = async () => {
    if (!vendorId) return;
    setDownloading(true);
    try {
      await downloadStockSheet(Number(vendorId), {
        search: filters.search || undefined,
        category_id: filters.category_id || undefined,
        brand_id: filters.brand_id || undefined,
        active: filters.active || undefined,
        procurement: filters.procurement || undefined,
      });
    } catch { console.error("Download failed"); }
    finally { setDownloading(false); }
  };

  const handleUpload = async (file: File) => {
    if (!vendorId || !userId) return;
    setUploading(true);
    try {
      const result = await uploadStockSheet(Number(vendorId), Number(userId), file);
      setUploadResult(result);
      fetchProducts();
    } catch (e: any) { console.error("Upload failed", e); }
    finally { setUploading(false); }
  };

  const handleDownloadProductTemplate = async () => {
    if (!vendorId) return;
    try {
      await downloadProductBulkTemplate(Number(vendorId));
    } catch (err) {
      console.error("Failed to download template", err);
    }
  };

  const handleUploadProductBulk = async (file: File) => {
    if (!vendorId || !userId) return;
    setBulkUploading(true);
    try {
      const result = await uploadProductBulkSheet(Number(vendorId), Number(userId), file);
      setBulkUploadResult(result);
      fetchProducts();
    } catch (e: any) {
      console.error("Bulk upload failed", e);
    } finally {
      setBulkUploading(false);
    }
  };

  const handleFilters = (f: Filters) => { setFilters(f); setPage(1); };
  const handlePage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handlePageSize = (s: number) => { setPageSize(s); setPage(1); };

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/inventory/master/products/list">Inventory</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Product Master</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium h-8 text-xs"
            onClick={handleAddProduct}
          >
            <Plus size={14} />
            Add New Product
          </Button>

          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="flex w-full flex-col gap-5">

          {/* ── Title ── */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Product Master
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Review product specifications, stock levels, categories and procurement details.
            </p>
          </div>

          {/* ── 4 KPI Stat Cards (Matching Reference) ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={Package} label="TOTAL PRODUCTS" value={data ? data.total.toLocaleString() : "—"} />
            <KpiCard
              icon={CheckCircle2}
              label="ACTIVE ON PAGE"
              value={data?.products ? data.products.filter((p) => p.active === "Yes").length : 0}
            />
            <KpiCard
              icon={ClipboardList}
              label="CATEGORIES"
              value={
                filtersData?.categories?.length ??
                (data?.products ? new Set(data.products.map((p) => p.category?.category_name).filter(Boolean)).size : 0)
              }
            />
            <KpiCard
              icon={TrendingUp}
              label="TOTAL STOCK ON PAGE"
              value={
                data?.products
                  ? data.products.reduce((acc, p) => acc + (Number(p.current_stock) || 0), 0).toLocaleString("en-IN")
                  : "0"
              }
            />
          </div>

          {/* ── Action & Filter Row ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterBar
              filters={filters}
              setFilters={handleFilters}
              filtersData={filtersData}
              loading={loading}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-9 rounded-lg border bg-background text-xs font-medium text-foreground hover:bg-muted"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download size={14} className={downloading ? "animate-bounce" : ""} />
                {downloading ? "Downloading…" : "Download Stock"}
                {(filters.search || filters.category_id || filters.brand_id || filters.active || filters.procurement) && (
                  <span className="ml-0.5 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    Filtered
                  </span>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-9 rounded-lg border bg-background text-xs font-medium text-foreground hover:bg-muted"
                onClick={() => { setUploadResult(null); setShowUpload(true); }}
                disabled={uploading}
              >
                <Upload size={14} />
                Upload Stock
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-9 rounded-lg border bg-background text-xs font-medium text-foreground hover:bg-muted"
                onClick={() => { setBulkUploadResult(null); setShowBulkUpload(true); }}
                disabled={bulkUploading}
              >
                <Upload size={14} />
                Bulk Upload Products
              </Button>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                title="Sync Products from CadBid"
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* ── Table (Matching Reference) ── */}
          <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground">
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">#</th>
                    <th className="px-4 py-3.5 text-left font-semibold min-w-56 whitespace-nowrap">Product Name</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Category</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Brand</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Article Code</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Vendor Code</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Group</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Finish</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">Core Material</th>
                    <th className="px-4 py-3.5 text-left font-semibold whitespace-nowrap">UOM</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Dimensions</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Size</th>
                    <th className="px-4 py-3.5 text-right font-semibold whitespace-nowrap">Stock</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-right font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 15 }).map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <Skeleton className="h-6 w-full rounded-md" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !data || data.products.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-20 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            <Package size={24} className="opacity-40" />
                          </div>
                          <p className="text-sm font-semibold">No products found</p>
                          {(filters.search || filters.category_id || filters.brand_id) && (
                            <p className="text-xs">Try clearing or adjusting filters.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.products.map((product, idx) => (
                      <tr
                        key={product.id}
                        className="group cursor-pointer border-b transition-colors hover:bg-muted/30"
                        onClick={() => setSelected(product)}
                      >
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-xs text-foreground leading-tight">
                            {product.product_name}
                          </p>
                          {(product.hsn?.hsn_code || product.hsn_code) && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                              HSN {product.hsn?.hsn_code || product.hsn_code}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {product.category.category_name}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {product.brand?.brand_name ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">
                          {fmt(product.article_code)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">
                          {fmt(product.vendor_code)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {fmt((product as any).itemGroup?.group_name ?? product.group)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {fmt(
                            product.finish === null || product.finish === undefined || product.finish === ""
                              ? (product.finishMaster?.finish_name ?? product.finish_id ?? null)
                              : product.finish
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {fmt(
                            product.core_material === null || product.core_material === undefined || product.core_material === ""
                              ? (product.coreProduct?.core_product_name ?? product.core_product_id ?? null)
                              : product.core_material
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {fmt(product.primaryUnit?.unit_name ?? product.unit_of_measure)}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-muted-foreground">
                          {(() => {
                            const { d1, d2, d3, hasDim } = getEffectiveDimensions(product);
                            if (hasDim) {
                              return d3 ? `${d1}×${d2}×${d3}` : `${d1}×${d2}`;
                            }
                            return product.board_length || product.board_width
                              ? `${product.board_length}×${product.board_width}`
                              : "—";
                          })()}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-muted-foreground">
                          {fmt(product.size ?? null)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">
                          <p className="font-bold text-xs text-foreground">
                            {product.current_stock != null
                              ? parseFloat(String(product.current_stock)).toLocaleString("en-IN")
                              : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              product.active === "Yes"
                                ? "border-border/80 bg-muted/40 text-foreground"
                                : "border-border/50 text-muted-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                product.active === "Yes" ? "bg-foreground" : "bg-muted-foreground/50"
                              )}
                            />
                            {product.active === "Yes" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="View details"
                              onClick={() => setSelected(product)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              type="button"
                              title="Stock history"
                              onClick={() => setStockHistoryProduct(product)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Clock size={15} />
                            </button>

                            <button
                              type="button"
                              title="Purchase history"
                              onClick={() => setHistoryProduct(product)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <History size={15} />
                            </button>

                            <button
                              type="button"
                              title="Edit product"
                              onClick={() => handleEditProduct(product)}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {data && data.total_pages > 0 && (
              <Pagination
                page={page}
                totalPages={data.total_pages}
                total={data.total}
                pageSize={pageSize}
                onChange={handlePage}
                onPageSizeChange={handlePageSize}
              />
            )}
          </div>
        </div>
      </main>

      {selected && <ProductDetailDialog product={selected} onClose={() => setSelected(null)} />}

      {syncResult && <SyncResultDialog result={syncResult} onClose={() => setSyncResult(null)} />}

      {historyProduct && (
        <ProductHistoryPanel product={historyProduct}
          vendorId={Number(vendorId)} onClose={() => setHistoryProduct(null)} />
      )}

      {stockHistoryProduct && (
        <StockHistoryPanel product={stockHistoryProduct}
          vendorId={Number(vendorId)} onClose={() => setStockHistoryProduct(null)} />
      )}

      {showUpload && (
        <StockUploadModal uploading={uploading} result={uploadResult}
          onUpload={handleUpload} onClose={() => setShowUpload(false)} />
      )}

      {showBulkUpload && (
        <ProductBulkUploadModal
          uploading={bulkUploading}
          result={bulkUploadResult}
          onDownloadTemplate={handleDownloadProductTemplate}
          onUpload={handleUploadProductBulk}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </>
  );
}

// ─── Product Bulk Upload Modal ───────────────────────────────────────────────

function ProductBulkUploadModal({
  uploading,
  result,
  onDownloadTemplate,
  onUpload,
  onClose,
}: {
  uploading: boolean;
  result: BulkUploadProductResult | null;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) return;
    onUpload(file);
  };

  const handleDownloadErrorFile = () => {
    if (!result?.errorFileBase64) return;
    const byteCharacters = atob(result.errorFileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `product_upload_errors.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Upload size={16} /> Bulk Upload Products
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download template Excel, fill product details, and upload back.
          </p>
        </div>

        {!result ? (
          <div className="p-5 space-y-4">
            {/* Step 1: Download Template */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-foreground border">
                  <Download size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">1. Download Template Excel</p>
                  <p className="text-[11px] text-muted-foreground">Pre-formatted sheet with all product columns</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-foreground border-border hover:bg-muted"
                onClick={async () => {
                  setDownloadingTemplate(true);
                  try {
                    await onDownloadTemplate();
                  } finally {
                    setDownloadingTemplate(false);
                  }
                }}
                disabled={downloadingTemplate || uploading}
              >
                <Download size={13} className={downloadingTemplate ? "animate-bounce" : ""} />
                {downloadingTemplate ? "Downloading…" : "Download Template"}
              </Button>
            </div>

            {/* Step 2: Upload Template */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => !uploading && fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                dragOver ? "border-foreground/50 bg-muted/30" : "border-muted hover:border-foreground/30 hover:bg-muted/20",
                uploading ? "pointer-events-none opacity-60 border-muted" : ""
              )}
            >
              {uploading ? (
                <Loader2 size={28} className="animate-spin text-foreground" />
              ) : (
                <Upload size={28} className="text-muted-foreground/40" />
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {uploading ? "Processing Bulk Products..." : "2. Drop .xlsx here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Only .xlsx files · Max 10 MB</p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 space-y-1.5">
              <p className="text-xs font-bold text-foreground mb-1">Important Upload Guidelines</p>
              {[
                "Mandatory fields: Product Name, Category, Item Code (Must be unique), Primary Unit.",
                "Non-mandatory fields can be left blank, but if filled, values must match system Master tables.",
                "If Barcode is left empty, system auto-generates a unique barcode.",
                "If errors occur in any rows, valid rows will be saved and an Error Report will be provided.",
              ].map((t, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="font-bold text-foreground shrink-0">•</span>
                  {t}
                </p>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Rows", value: result.total },
                { label: "Created / Saved", value: result.created },
                { label: "Failed Rows", value: result.failed },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl px-3 py-3 text-center bg-muted/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {result.failed > 0 && (
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                    <AlertTriangle size={15} />
                    <span>{result.failed} rows failed validation</span>
                  </div>
                  {result.errorFileBase64 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs text-foreground hover:bg-muted"
                      onClick={handleDownloadErrorFile}
                    >
                      <Download size={13} />
                      Download Error Excel
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Review the downloaded error file to fix misspelled master names or missing compulsory values, then re-upload.
                </p>
                {result.errors?.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 border-t pt-2">
                    {result.errors.slice(0, 10).map((err, idx) => (
                      <p key={idx} className="text-[11px] text-muted-foreground">
                        <span className="font-bold text-foreground">Row {err.row}:</span> {err.reason}
                      </p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-[10px] text-muted-foreground font-semibold italic">
                        ...and {result.errors.length - 10} more error(s) in downloaded report.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {result.failed === 0 && (
              <div className="rounded-xl border bg-muted/20 p-4 text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-foreground mb-1" />
                <p className="text-xs font-bold text-foreground">All products uploaded successfully!</p>
                <p className="text-[11px] text-muted-foreground">All {result.created} products were created and saved.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-medium" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

