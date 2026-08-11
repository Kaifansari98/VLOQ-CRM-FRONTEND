"use client";

import {
  getProducts, getProductFilters, syncCadBidProducts,
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
  ChevronLeft, ChevronRight, Search, X,
  Package, RefreshCw, Plus, CheckCircle2,
  ShoppingCart, AlertTriangle, ClipboardList,
  History, TrendingUp, Download, Upload,
  ArrowUp, ArrowDown, Clock, Loader2, Pencil
} from "lucide-react";
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

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, pageSize, onChange }: {
  page: number; totalPages: number; total: number; pageSize: number;
  onChange: (p: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t flex-wrap gap-3">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> products
      </p>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" className="h-8 w-8 p-0"
          disabled={page === 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} />
        </Button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`dot-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
          ) : (
            <Button key={p} size="sm"
              variant={p === page ? "default" : "outline"}
              className="h-8 w-8 p-0 text-xs"
              onClick={() => onChange(p as number)}>
              {p}
            </Button>
          )
        )}
        <Button size="sm" variant="outline" className="h-8 w-8 p-0"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onChange(page + 1)}>
          <ChevronRight size={14} />
        </Button>
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
            <Badge className={product.active === "Yes"
              ? "bg-emerald-100 text-emerald-700 border-0"
              : "bg-red-100 text-red-700 border-0"}>
              {product.active === "Yes" ? "Active" : "Inactive"}
            </Badge>
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
          "h-9 min-w-40 max-w-52 px-3 rounded-lg border bg-background text-sm text-left flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          selected ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span onClick={(e) => { e.stopPropagation(); onChange(undefined); setQ(""); }}
              className="hover:text-foreground text-muted-foreground">
              <X size={11} />
            </span>
          )}
          <ChevronLeft size={12} className={cn("transition-transform text-muted-foreground", open && "-rotate-90")} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 rounded-lg border bg-popover shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
                className="w-full pl-6 pr-2 py-1 text-sm bg-muted rounded focus:outline-none" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            <button onClick={() => { onChange(undefined); setOpen(false); }}
              className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                !value && "font-semibold text-primary")}>
              {placeholder}
            </button>
            {filtered.length === 0
              ? <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
              : filtered.map(o => (
                <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }}
                  className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors",
                    value === o.id && "font-semibold text-primary bg-primary/5")}>
                  {o.label}
                </button>
              ))
            }
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
        <div className="bg-emerald-500 px-6 py-5 flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <CheckCircle2 size={22} className="text-white" />
          </div>
          <div>
            <DialogTitle className="text-white text-base">Sync Complete</DialogTitle>
            <p className="text-emerald-100 text-xs mt-0.5">CadBid products synced successfully</p>
          </div>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {[
            { label: "Total", value: result.totalCount, color: "text-slate-700" },
            { label: "Fetched", value: result.fetched, color: "text-blue-600" },
            { label: "Created", value: result.created, color: "text-emerald-600" },
            { label: "Updated", value: result.updated, color: "text-indigo-600" },
            { label: "Skipped", value: result.skipped, color: "text-amber-600" },
            { label: "Brands Created", value: result.brandsCreated, color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/40 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
              <p className={cn("text-2xl font-black tabular-nums", color)}>{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5">
          <Button className="w-full" onClick={onClose}>Done</Button>
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
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={localSearch} onChange={e => setLocalSearch(e.target.value)}
          placeholder="Search products…"
          className="pl-8 pr-8 h-9 w-56 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        {localSearch && (
          <button onClick={() => setLocalSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={12} />
          </button>
        )}
      </div>

      <SearchableSelect options={categoryOptions} value={filters.category_id}
        onChange={id => setFilters({ ...filters, category_id: id })} placeholder="All Categories" />

      <SearchableSelect options={brandOptions} value={filters.brand_id}
        onChange={id => setFilters({ ...filters, brand_id: id })} placeholder="All Brands" />

      <select value={filters.active} onChange={e => setFilters({ ...filters, active: e.target.value })}
        className="h-9 rounded-lg border bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
        <option value="">All Status</option>
        <option value="Yes">Active</option>
        <option value="No">Inactive</option>
      </select>

      <select value={filters.procurement} onChange={e => setFilters({ ...filters, procurement: e.target.value })}
        className="h-9 rounded-lg border bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
        <option value="">All Procurement</option>
        {(filtersData?.procurements ?? []).map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {hasFilters && (
        <Button size="sm" variant="ghost" className="h-9 gap-1.5 text-muted-foreground" onClick={clear}>
          <X size={13} /> Clear
        </Button>
      )}

      {loading && <RefreshCw size={14} className="animate-spin text-muted-foreground" />}
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
        <div className="px-5 py-4 border-b">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Upload size={15} className="text-emerald-600" /> Upload Stock Sheet
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
                dragOver ? "border-emerald-400 bg-emerald-50" : "",
                uploading ? "pointer-events-none opacity-60 border-muted" : "border-muted hover:border-emerald-300 hover:bg-muted/30"
              )}>
              {uploading
                ? <Loader2 size={28} className="animate-spin text-emerald-600" />
                : <Upload size={28} className="text-muted-foreground/40" />}
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {uploading ? "Processing…" : "Drop .xlsx here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Only .xlsx · Max 10 MB</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => handleFile(e.target.files?.[0])} />

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-800 mb-1">How it works</p>
              {[
                'Click "Download Stock" to get the current stock sheet',
                'Fill the amber "New Stock" column for products to update',
                "Leave blank to skip a row — only filled rows are updated",
                "Upload the file — old stock is saved to history automatically",
              ].map((t, i) => (
                <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="font-black shrink-0">{i + 1}.</span>{t}
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
                { label: "Total Rows", value: result.total, cls: "text-foreground", bg: "bg-muted/40" },
                { label: "Updated", value: result.updated, cls: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "Skipped", value: result.skipped, cls: "text-amber-700", bg: "bg-amber-50" },
              ].map(({ label, value, cls, bg }) => (
                <div key={label} className={cn("rounded-xl px-3 py-3 text-center", bg)}>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
                  <p className={cn("text-2xl font-black tabular-nums", cls)}>{value}</p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 overflow-hidden">
                <p className="px-3 py-2 text-xs font-black text-red-700 border-b border-red-200">
                  {result.errors.length} row error{result.errors.length > 1 ? "s" : ""}
                </p>
                <div className="max-h-36 overflow-y-auto divide-y divide-red-100">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs flex gap-3">
                      <span className="text-red-400 font-mono shrink-0">Row {e.row}</span>
                      <span className="text-red-700">{e.reason}</span>
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
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>Done</Button>
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
    GRNConfirmation: { label: "GRN", cls: "bg-emerald-100 text-emerald-700" },
    ExcelUpload: { label: "Upload", cls: "bg-indigo-100  text-indigo-700" },
    ManualAdjustment: { label: "Manual", cls: "bg-amber-100   text-amber-700" },
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-40 w-full max-w-lg bg-background shadow-2xl flex flex-col border-l">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <Clock size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-sm">{product.product_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {product.article_code && <span className="font-mono mr-1">{product.article_code} ·</span>}
                Stock History
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground font-medium">Current Stock</p>
          <div className="flex items-baseline gap-1.5">
            <p className={cn("text-2xl font-black tabular-nums",
              parseFloat(String(product.current_stock ?? 0)) > 0
                ? "text-emerald-600" : "text-muted-foreground")}>
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
              <p className="text-sm">No stock changes recorded yet</p>
              <p className="text-xs opacity-70">Changes via GRN confirmation or Excel upload appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.history.map((row, idx) => {
                const change = parseFloat(row.change);
                const isUp = change >= 0;
                const src = SOURCE[row.source] ?? { label: row.source, cls: "bg-muted text-muted-foreground" };
                return (
                  <div key={row.id}
                    className={cn("px-5 py-3 flex items-start justify-between gap-3",
                      idx % 2 === 1 && "bg-muted/10")}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn("mt-0.5 p-1.5 rounded-lg shrink-0",
                        isUp ? "bg-emerald-50" : "bg-red-50")}>
                        {isUp
                          ? <ArrowUp size={13} className="text-emerald-600" />
                          : <ArrowDown size={13} className="text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums">
                          <span className="text-muted-foreground">{fmtN(row.old_stock)}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className={isUp ? "text-emerald-600" : "text-red-600"}>
                            {fmtN(row.new_stock)}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", src.cls)}>
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
                      <p className={cn("text-sm font-black tabular-nums",
                        isUp ? "text-emerald-600" : "text-red-600")}>
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
    Draft: "bg-slate-100 text-slate-600", PendingApproval: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700", Rejected: "bg-red-100 text-red-600",
    ConvertedToPO: "bg-blue-100 text-blue-700", Cancelled: "bg-gray-100 text-gray-500",
  };
  const PO_STATUS_COLOR: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-600", Approved: "bg-indigo-100 text-indigo-700",
    PartiallyReceived: "bg-amber-100 text-amber-700", Received: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-600",
  };
  const GRN_COLOR: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-600", Confirmed: "bg-emerald-100 text-emerald-700",
    Closed: "bg-blue-100 text-blue-700",
  };

  const TABS = [
    { id: "po" as const, label: "Purchase Orders", Icon: ShoppingCart, count: data?.stats.total_po },
    { id: "pi" as const, label: "Purchase Intents", Icon: AlertTriangle, count: data?.stats.total_pi },
    { id: "grn" as const, label: "GRN Receipts", Icon: ClipboardList, count: data?.stats.total_grn },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-40 w-full max-w-2xl bg-background shadow-2xl flex flex-col border-l">

        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50">
              <History size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-black text-sm">{product.product_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {product.article_code && <span className="font-mono mr-2">{product.article_code}</span>}
                Purchase History
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
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
                { label: "In Stock", value: fmtN(data.stats.current_stock), cls: (data.stats.current_stock ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground" },
                { label: "Accepted", value: fmtN(data.stats.total_accepted), cls: "text-emerald-600" },
                { label: "Rejected", value: fmtN(data.stats.total_rejected), cls: data.stats.total_rejected > 0 ? "text-red-600" : "text-muted-foreground" },
                { label: "Pending", value: fmtN(data.stats.total_pending), cls: data.stats.total_pending > 0 ? "text-amber-600" : "text-muted-foreground" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="px-4 py-3 text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
                  <p className={cn("text-lg font-black tabular-nums", cls)}>{value}</p>
                </div>
              ))}
            </div>

            {data.product.stock_updated_at && (
              <div className="px-5 py-2 bg-emerald-50/50 border-b text-[10px] text-emerald-700 flex items-center gap-1 shrink-0">
                <TrendingUp size={10} />
                Stock last updated: {fmtD(data.product.stock_updated_at)} via GRN confirmation
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b shrink-0">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all -mb-px",
                    tab === t.id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
                  <t.Icon size={12} />{t.label}
                  {t.count !== undefined && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-black",
                      tab === t.id ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">

              {/* ── Purchase Orders ── */}
              {tab === "po" && (
                !data.purchase_orders.length ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                    <ShoppingCart size={24} className="opacity-20" />
                    <p className="text-sm">No purchase orders yet</p>
                  </div>
                ) : data.purchase_orders.map((po, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-indigo-600">{po.po_no}</span>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                          PO_STATUS_COLOR[po.status] ?? "bg-muted text-muted-foreground")}>
                          {po.status}
                        </span>
                        {po.intent_no && (
                          <span className="text-[9px] text-muted-foreground">← {po.intent_no}</span>
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
                                <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                <p className="text-xs font-semibold">{value}</p>
                              </div>
                            ))}
                          </div>
                          {/* Row 2: MRP / Disc% / Rate */}
                          <div className="grid grid-cols-3 divide-x bg-muted/20 border-b">
                            {[
                              { label: "MRP", value: fmtM(po_.mrp) },
                              { label: "Disc%", value: po_.discount_pct ? `${parseFloat(String(po_.discount_pct))}%` : "—" },
                              { label: "Rate", value: fmtM(po_.rate ?? po_.unit_price) },
                            ].map(({ label, value }) => (
                              <div key={label} className="px-3 py-2">
                                <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                <p className="text-xs font-semibold">{value}</p>
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
                                <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                <p className="text-xs font-semibold">{value}</p>
                              </div>
                            ))}
                          </div>
                          {/* Row 4: Amount / GST Amt / Total */}
                          <div className="grid grid-cols-3 divide-x bg-indigo-50/50">
                            {[
                              { label: "Amount", value: fmtM(po_.amount), cls: "" },
                              { label: "GST Amt", value: fmtM(po_.tax_amount), cls: "text-amber-600" },
                              { label: "Total", value: fmtM(po_.total_amount), cls: "text-indigo-700 font-black" },
                            ].map(({ label, value, cls }) => (
                              <div key={label} className="px-3 py-2">
                                <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                <p className={cn("text-sm font-semibold", cls)}>{value}</p>
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
                    <p className="text-sm">No purchase intents yet</p>
                  </div>
                ) : data.purchase_intents.map((pi, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-indigo-600">{pi.intent_no}</span>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                          PI_STATUS_COLOR[pi.status] ?? "bg-muted text-muted-foreground")}>
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
                            <div key={vi} className={cn("px-3 py-2.5", vi % 2 === 1 && "bg-muted/10")}>
                              {/* Supplier + date */}
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-xs font-semibold">{v.vendor_name}</p>
                                  <p className="text-[9px] text-muted-foreground">{v.vendor_code}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Req. By</p>
                                  <p className="text-xs font-semibold">{fmtD(v.required_by)}</p>
                                </div>
                              </div>
                              {/* Row 1: Qty / MRP / Disc% / Rate */}
                              <div className="grid grid-cols-4 gap-2 mb-1.5">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Qty</p>
                                  <p className="text-xs font-semibold">{fmtN(v.required_qty)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">MRP</p>
                                  <p className="text-xs">{fmtM(v.mrp)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Disc%</p>
                                  <p className="text-xs">{v.discount_pct ? `${parseFloat(String(v.discount_pct))}%` : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Rate</p>
                                  <p className="text-xs font-semibold">{fmtM(v.rate || v.estimated_price)}</p>
                                </div>
                              </div>
                              {/* Row 2: GST% / CGST% / SGST% */}
                              <div className="grid grid-cols-3 gap-2 mb-1.5">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">GST%</p>
                                  <p className="text-xs font-semibold">{v.tax_pct ? `${parseFloat(String(v.tax_pct))}%` : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">CGST%</p>
                                  <p className="text-xs">{v.cgst_pct ? `${parseFloat(String(v.cgst_pct))}%` : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">SGST%</p>
                                  <p className="text-xs">{v.sgst_pct ? `${parseFloat(String(v.sgst_pct))}%` : "—"}</p>
                                </div>
                              </div>
                              {/* Row 3: Amount / GST Amt / Total */}
                              <div className="rounded-lg bg-indigo-50/70 px-2.5 py-1.5 grid grid-cols-3 gap-2">
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Amount</p>
                                  <p className="text-xs font-semibold">{fmtM(v.amount)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">GST Amt</p>
                                  <p className="text-xs font-semibold text-amber-600">{fmtM(v.tax_amount)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Total</p>
                                  <p className="text-sm font-black text-indigo-700">{fmtM(v.total_amount)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {itemTotal > 0 && (
                            <div className="px-3 py-2 bg-indigo-50 flex items-center justify-between">
                              <p className="text-[9px] font-black uppercase text-indigo-700">
                                Total {pi.vendors.length > 1 ? `(${pi.vendors.length} suppliers)` : ""}
                              </p>
                              <p className="text-sm font-black text-indigo-700">
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
                    <div key={i}
                      className={cn("rounded-xl border overflow-hidden", rejected > 0 && "border-red-200")}>
                      <div className={cn(
                        "flex items-center justify-between px-4 py-2.5 border-b",
                        rejected > 0 ? "bg-red-50/40" : "bg-muted/20"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs font-mono text-indigo-600">{grn.grn_no}</span>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            GRN_COLOR[grn.status] ?? "bg-muted")}>
                            {grn.status}
                          </span>
                          {rejected > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
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
                                { label: "Received", value: fmtN(grn.received_qty), cls: "" },
                                { label: "Accepted", value: fmtN(grn.accepted_qty), cls: "text-emerald-600" },
                                { label: "Rejected", value: fmtN(grn.rejected_qty), cls: rejected > 0 ? "text-red-600 font-bold" : "text-muted-foreground" },
                                { label: "Rate", value: fmtM(g.rate ?? grn.unit_price), cls: "" },
                              ].map(({ label, value, cls }) => (
                                <div key={label} className="px-3 py-2 text-center">
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                  <p className={cn("text-sm font-bold tabular-nums", cls)}>{value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Row 2: MRP / Disc% / Rate */}
                            <div className="grid grid-cols-3 divide-x bg-muted/20 border-b">
                              {[
                                { label: "MRP", value: fmtM(g.mrp) },
                                { label: "Disc%", value: g.discount_pct ? `${parseFloat(String(g.discount_pct))}%` : "—" },
                                { label: "Rate", value: fmtM(g.rate ?? grn.unit_price) },
                              ].map(({ label, value }) => (
                                <div key={label} className="px-3 py-1.5 text-center">
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                  <p className="text-xs font-semibold">{value}</p>
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
                                <div key={label} className="px-3 py-1.5 text-center">
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                  <p className="text-xs font-semibold">{value}</p>
                                </div>
                              ))}
                            </div>
                            {/* Row 4: Amount / GST Amt / Total */}
                            <div className="grid grid-cols-3 divide-x bg-indigo-50/50">
                              {[
                                { label: "Amount", value: fmtM(g.amount), cls: "" },
                                { label: "GST Amt", value: fmtM(g.tax_amount), cls: "text-amber-600" },
                                { label: "Total", value: fmtM(g.total_amount), cls: "text-indigo-700 font-black" },
                              ].map(({ label, value, cls }) => (
                                <div key={label} className="px-3 py-2 text-center">
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
                                  <p className={cn("text-sm font-semibold", cls)}>{value}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                      {grn.rejection_reason && (
                        <p className="px-4 py-1.5 text-[10px] text-red-600 italic bg-red-50 border-t">
                          ↳ {grn.rejection_reason}
                        </p>
                      )}
                      {grn.confirmed_by && (
                        <p className="px-4 py-1.5 text-[9px] text-muted-foreground border-t bg-muted/10 flex items-center gap-1">
                          <CheckCircle2 size={9} className="text-emerald-500" />
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
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
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
    getProducts(Number(vendorId), { page, ...filters })
      .then((res) => {
        console.log("Fetched Products data in frontend:", res);
        setData(res);
      }).catch(console.error).finally(() => setLoading(false));
  }, [vendorId, page, filters]);

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

  const handleFilters = (f: Filters) => { setFilters(f); setPage(1); };
  const handlePage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem><BreadcrumbPage>Product Master</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-0 p-6">

        {/* ── Title + buttons ── */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Package size={18} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-black">Product Master</h1>
              {data && (
                <p className="text-xs text-muted-foreground">{data.total.toLocaleString()} products</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-9"
              onClick={handleDownload} disabled={downloading}>
              <Download size={14} className={downloading ? "animate-bounce" : ""} />
              {downloading ? "Downloading…" : "Download Stock"}
              {(filters.search || filters.category_id || filters.brand_id || filters.active || filters.procurement) && (
                <span className="ml-0.5 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  Filtered
                </span>
              )}
            </Button>
            <Button size="sm" variant="outline"
              className="gap-1.5 h-9 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => { setUploadResult(null); setShowUpload(true); }}
              disabled={uploading}>
              <Upload size={14} />
              Upload Stock
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-9"
              onClick={handleSync} disabled={syncing}>
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Products"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-9"
              onClick={handleAddProduct}
            >
              <Plus size={14} />
              Add New Product
            </Button>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="mb-4">
          <FilterBar filters={filters} setFilters={handleFilters}
            filtersData={filtersData} loading={loading} />
        </div>

        {/* ── Table ── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-black uppercase w-10">#</TableHead>
                  <TableHead className="text-xs font-black uppercase min-w-52">Product Name</TableHead>
                  <TableHead className="text-xs font-black uppercase">Category</TableHead>
                  <TableHead className="text-xs font-black uppercase">Brand</TableHead>
                  <TableHead className="text-xs font-black uppercase">Article Code</TableHead>
                  <TableHead className="text-xs font-black uppercase">Vendor Code</TableHead>
                  <TableHead className="text-xs font-black uppercase">Group</TableHead>
                  <TableHead className="text-xs font-black uppercase">Finish</TableHead>
                  <TableHead className="text-xs font-black uppercase">Core Material</TableHead>
                  <TableHead className="text-xs font-black uppercase">UOM</TableHead>
                  <TableHead className="text-xs font-black uppercase text-center">Dimensions</TableHead>
                  <TableHead className="text-xs font-black uppercase text-center">Size</TableHead>
                  <TableHead className="text-xs font-black uppercase text-right">Stock</TableHead>
                  <TableHead className="text-xs font-black uppercase text-center">Status</TableHead>
                  <TableHead className="text-xs font-black uppercase text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 15 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Package size={32} className="text-muted-foreground/40" />
                        <p className="text-sm">No products found</p>
                        {(filters.search || filters.category_id || filters.brand_id) && (
                          <p className="text-xs">Try adjusting your filters</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.products.map((product, idx) => (
                    <TableRow key={product.id}
                      className={cn("cursor-pointer hover:bg-primary/5 transition-colors",
                        idx % 2 === 1 && "bg-muted/20")}
                      onClick={() => setSelected(product)}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {(page - 1) * 20 + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm leading-tight">{product.product_name}</p>
                          {(product.hsn?.hsn_code || product.hsn_code) && (
                            <p className="text-[10px] text-muted-foreground font-mono">HSN {product.hsn?.hsn_code || product.hsn_code}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{product.category.category_name}</TableCell>
                      <TableCell className="text-xs">{product.brand?.brand_name ?? "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{fmt(product.article_code)}</TableCell>
                      <TableCell className="text-xs font-mono">{fmt(product.vendor_code)}</TableCell>
                      <TableCell className="text-xs">{fmt((product as any).itemGroup?.group_name ?? product.group)}</TableCell>
                      <TableCell className="text-xs">
                        {fmt(
                          product.finish === null || product.finish === undefined || product.finish === ""
                            ? (product.finishMaster?.finish_name ?? product.finish_id ?? null)
                            : product.finish
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {fmt(
                          product.core_material === null || product.core_material === undefined || product.core_material === ""
                            ? (product.coreProduct?.core_product_name ?? product.core_product_id ?? null)
                            : product.core_material
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{fmt(product.primaryUnit?.unit_name ?? product.unit_of_measure)}</TableCell>
                      <TableCell className="text-xs text-center font-mono text-muted-foreground">
                        {(() => {
                          const { d1, d2, d3, hasDim } = getEffectiveDimensions(product);
                          if (hasDim) {
                            return d3 ? `${d1}×${d2}×${d3}` : `${d1}×${d2}`;
                          }
                          return product.board_length || product.board_width
                            ? `${product.board_length}×${product.board_width}`
                            : "—";
                        })()}
                      </TableCell>
                      <TableCell className="text-xs text-center font-mono text-muted-foreground">
                        {fmt(product.size ?? null)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        <span className={cn("font-semibold",
                          (product.current_stock ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                          {product.current_stock != null
                            ? parseFloat(String(product.current_stock)).toLocaleString("en-IN")
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Badge className={cn("text-[10px] border-0",
                            product.active === "Yes"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700")}>
                            {product.active === "Yes" ? "Active" : "Inactive"}
                          </Badge>

                          <button
                            title="View purchase history"
                            onClick={e => {
                              e.stopPropagation();
                              setHistoryProduct(product);
                            }}
                            className="p-1 rounded-lg hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 transition-colors"
                          >
                            <History size={13} />
                          </button>

                          <button
                            title="View stock history"
                            onClick={e => {
                              e.stopPropagation();
                              setStockHistoryProduct(product);
                            }}
                            className="p-1 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors"
                          >
                            <Clock size={13} />
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          title="Edit Product"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                        >
                          <Pencil size={13} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.total_pages > 0 && (
            <Pagination page={page} totalPages={data.total_pages}
              total={data.total} pageSize={data.page_size} onChange={handlePage} />
          )}
        </div>
      </div>

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
    </>
  );
}
