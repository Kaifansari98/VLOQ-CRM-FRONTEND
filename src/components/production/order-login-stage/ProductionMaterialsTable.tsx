"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, Filter, PackageSearch, Search, Snowflake, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type ProductionPreviewRow } from "./production-file-preview";

const stockColors = {
  ready: "text-green-600 dark:text-green-500",
  low: "text-orange-600 dark:text-orange-500",
  unavailable: "text-red-600 dark:text-red-500",
};

const stockChipColors = {
  ready: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  low: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  unavailable: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

const stockDotColors = {
  ready: "bg-green-500",
  low: "bg-orange-500",
  unavailable: "bg-red-500",
};

const stockLabels = {
  ready: "In stock",
  low: "Low stock",
  unavailable: "Unavailable",
};

// Whichever of frozen/issued is further along already deducted stock (freezing deducts
// immediately; issuing deducts only the portion beyond what was frozen), so only what's
// left past that should be weighed against what's still available.
const neededQty = (row: ProductionPreviewRow) => Math.max(0, Math.round((row.qty - Math.max(row.frozenQty ?? 0, row.issuedQty ?? 0)) * 1e8) / 1e8);

export function getMaterialStockState(row: ProductionPreviewRow): keyof typeof stockColors {
  if (row.status !== "ready" || row.available === undefined) return "unavailable";
  const minimum = row.product?.min_stock_qty;
  const leftover = Math.round((row.available - neededQty(row)) * 1e8) / 1e8;
  return minimum != null && minimum !== "" && Number.isFinite(Number(minimum)) && leftover >= Number(minimum)
    ? "low" : "ready";
}

const quantity = (value: number | string | null | undefined) => value == null || value === "" || !Number.isFinite(Number(value))
  ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function ProductionMaterialsTable({ rows, checked = true, busy = false, enableRowSelection = false, isMaterialIssueView = false, onFreezeSelected, onIssueSelected, hideSelectionBar = false }: {
  rows: ProductionPreviewRow[]; checked?: boolean; busy?: boolean; enableRowSelection?: boolean; isMaterialIssueView?: boolean;
  onFreezeSelected?: (rows: ProductionPreviewRow[]) => void; onIssueSelected?: (rows: ProductionPreviewRow[]) => void; hideSelectionBar?: boolean;
}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(() => new Set());
  const selectedRows = useMemo(() => rows.filter((row) => selectedRowKeys.has(row.key)), [rows, selectedRowKeys]);
  const selectedCount = selectedRows.length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const clearSelection = () => setSelectedRowKeys(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const categories = useMemo(() => Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).sort(), [rows]);
  const stockCounts = useMemo(() => {
    const counts = { ready: 0, low: 0, unavailable: 0 };
    if (isMaterialIssueView && checked) {
      rows.forEach((row) => { counts[getMaterialStockState(row)] += 1; });
    }
    return counts;
  }, [rows, isMaterialIssueView, checked]);
  const filterCounts = useMemo(() => ({
    all: rows.length,
    attention: rows.filter((row) => row.status !== "ready").length,
    ready: rows.filter((row) => row.status === "ready").length,
  }), [rows]);
  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLowerCase();
    return (filter === "all" || (filter === "attention" ? row.status !== "ready" : row.status === "ready")) &&
      (!categoryFilter || row.category === categoryFilter) &&
      (!query || [row.articleCode, row.name, row.product?.product_name, row.category, row.type, row.source].some((value) => value?.toLowerCase().includes(query)));
  }), [rows, search, filter, categoryFilter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * 25, currentPage * 25);
  return <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="relative sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search preview products" placeholder="Search name, article code, category…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" /></div>
                <div className="inline-flex items-center gap-0.5 self-start rounded-lg bg-muted/60 p-1">
                  {([["all", "All"], ["attention", "Needs attention"], ["ready", "In stock"]] as const).map(([value, label]) => <button
                    key={value}
                    type="button"
                    disabled={!checked && value !== "all"}
                    onClick={() => { setFilter(value); setPage(1); }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
                      filter === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >{label} <span className="ml-1 tabular-nums text-[10px] text-muted-foreground">{filterCounts[value]}</span></button>)}
                </div>
              </div>
              {isMaterialIssueView && <div aria-label="Stock color legend" className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs">
                <span className="mr-1 font-medium text-muted-foreground">Stock status:</span>
                {(Object.keys(stockLabels) as Array<keyof typeof stockLabels>).map((state) => <span key={state} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium", stockChipColors[state])}>
                  <span className={cn("size-1.5 rounded-full", stockDotColors[state])} />{stockLabels[state]} ({stockCounts[state]})
                </span>)}
              </div>}
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/60 text-xs text-muted-foreground backdrop-blur-sm"><tr className="border-b">
                    {enableRowSelection && <th className="w-12 border-r px-4 py-3">
                      <Checkbox
                        aria-label="Select all material rows"
                        checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
                        disabled={busy || rows.length === 0}
                        onCheckedChange={(value) => setSelectedRowKeys(value === true ? new Set(rows.map((row) => row.key)) : new Set())}
                      />
                    </th>}
                    <th className="border-r px-4 py-3 font-semibold uppercase tracking-wide">Product / Article code</th>
                    <th className="border-r px-4 py-3 font-semibold uppercase tracking-wide">
                      <div className="flex items-center justify-between gap-1.5">
                        <span>Type / Category</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Filter by category"
                              className={cn("rounded p-1 normal-case text-muted-foreground hover:bg-muted hover:text-foreground", categoryFilter && "text-primary")}
                            >
                              <Filter className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuRadioGroup value={categoryFilter ?? "__all__"} onValueChange={(value) => { setCategoryFilter(value === "__all__" ? null : value); setPage(1); }}>
                              <DropdownMenuRadioItem value="__all__">All categories</DropdownMenuRadioItem>
                              {!!categories.length && <DropdownMenuSeparator />}
                              {categories.map((category) => <DropdownMenuRadioItem key={category} value={category}>{category}</DropdownMenuRadioItem>)}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </th>
                    {["Required", "Inventory stock", "Updated Stock"].map((label) => <th key={label} className="border-r px-4 py-3 font-semibold uppercase tracking-wide last:border-r-0">{label}</th>)}</tr></thead>
                  <tbody className="divide-y">{visibleRows.map((row) => {
                    const need = neededQty(row);
                    const updatedStock = row.available !== undefined
                      ? (row.available >= need ? row.available - need : need - row.available)
                      : undefined;
                    const insufficient = row.available !== undefined && need > row.available;
                    const stockState = isMaterialIssueView && checked ? getMaterialStockState(row) : undefined;
                    return <tr key={row.key} data-state={enableRowSelection && selectedRowKeys.has(row.key) ? "selected" : undefined} className="align-top transition-colors hover:bg-muted/30 data-[state=selected]:bg-primary/5">
                    {enableRowSelection && <td className="border-r px-4 py-3">
                      <Checkbox
                        aria-label={`Select ${row.name || "product"} (${row.articleCode || "no article code"})`}
                        checked={selectedRowKeys.has(row.key)}
                        disabled={busy}
                        onCheckedChange={(value) => setSelectedRowKeys((previous) => {
                          const next = new Set(previous);
                          if (value === true) next.add(row.key);
                          else next.delete(row.key);
                          return next;
                        })}
                      />
                    </td>}
                    <td className="max-w-72 border-r px-4 py-3">
                      {stockState && <span className={cn("mb-1.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium", stockChipColors[stockState])}>
                        <span className={cn("size-1.5 rounded-full", stockDotColors[stockState])} />{stockLabels[stockState]}
                      </span>}
                      <p className="font-medium break-words">{row.name || "Unnamed product"}</p>
                      <p className="mt-1 font-mono text-xs text-primary">{row.articleCode || "No article code"}</p>
                      {row.product && row.product.product_name !== row.name && <p className="mt-1 text-xs text-muted-foreground">Inventory: {row.product.product_name}</p>}
                      <p className="mt-1 break-words text-[11px] text-muted-foreground">{row.source}</p>
                      {row.errors.length > 0 && <p className="mt-1 flex items-start gap-1 max-w-48 text-xs text-destructive"><AlertTriangle className="mt-0.5 size-3 shrink-0" />{row.errors.join("; ")}</p>}
                    </td>
                    <td className="border-r px-4 py-3"><p>{row.type || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{row.category || "—"}</p></td>
                    <td className="border-r px-4 py-3 font-medium tabular-nums">
                      {quantity(row.qty)} <span className="text-xs font-normal text-muted-foreground">{row.unit}</span>
                      {!!row.frozenQty && <p className="mt-1 text-xs font-normal text-blue-600 dark:text-blue-400">{quantity(row.frozenQty)} {row.unit} frozen</p>}
                      {!!row.issuedQty && <p className="mt-1 text-xs font-normal text-green-600 dark:text-green-400">{quantity(row.issuedQty)} {row.unit} issued</p>}
                    </td>
                    <td className="border-r px-4 py-3 tabular-nums">{quantity(row.product?.current_stock)}<p className="text-xs text-muted-foreground">{row.stockUnit}</p></td>
                    <td className={cn("px-4 py-3 tabular-nums", insufficient && "font-medium text-amber-700 dark:text-amber-400")}>
                      <span className="inline-flex items-center gap-1">{insufficient && <AlertTriangle className="size-3.5 shrink-0" />}{quantity(updatedStock)}</span>
                      <p className="text-xs text-muted-foreground">{updatedStock !== undefined ? row.unit : ""}</p>
                    </td>
                  </tr>;
                  })}</tbody>
                </table>
                </div>
                {!visibleRows.length && <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
                  <PackageSearch className="size-8 text-muted-foreground/50" />
                  <p>{busy ? "Preparing your preview…" : rows.length ? "No products match these filters." : "Select a workbook with product rows to see the preview."}</p>
                </div>}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                <p>{filtered.length} rows · Page {currentPage} of {pageCount}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-3.5" />Previous</Button>
                  <Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next<ChevronRight className="size-3.5" /></Button>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">Inventory stock is the current vendor-wide quantity. Updated Stock is Inventory stock minus Required when stock covers it, or Required minus Inventory stock (shown in amber) when it falls short. Quantities with different units are not compared. This preview does not reserve stock.</p>
              {enableRowSelection && selectedCount > 0 && !hideSelectionBar && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-x-0 bottom-14 z-100 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <div className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-black bg-background/95 py-2 pl-4 pr-2 shadow-lg shadow-black/10 backdrop-blur supports-backdrop-filter:bg-background/80 sm:gap-3">
                    <span className="whitespace-nowrap text-sm font-medium tabular-nums">{selectedCount} item{selectedCount === 1 ? "" : "s"} selected</span>
                    <div className="h-5 w-px bg-border" />
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" className="gap-1.5 rounded-full border-0 bg-blue-500 text-white hover:bg-blue-600" onClick={() => onFreezeSelected?.(selectedRows)}>
                        <Snowflake className="size-3.5" />Freeze Item
                      </Button>
                      <Button size="sm" className="gap-1.5 rounded-full border-0 bg-green-500 text-white hover:bg-green-600" onClick={() => onIssueSelected?.(selectedRows)}>
                        <Truck className="size-3.5" />Issue Item
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Clear selection"
                        className="size-8 shrink-0 rounded-full border border-slate-200 text-muted-foreground hover:bg-muted hover:text-foreground dark:border-slate-700"
                        onClick={clearSelection}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
  </div>;
}
