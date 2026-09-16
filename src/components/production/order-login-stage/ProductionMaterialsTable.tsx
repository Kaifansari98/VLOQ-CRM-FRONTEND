"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { type ProductionPreviewRow } from "./production-file-preview";

const stockColors = {
  ready: "text-green-500",
  low: "text-orange-500",
  unavailable: "text-red-500",
};

export function getMaterialStockState(row: ProductionPreviewRow): keyof typeof stockColors {
  if (row.status !== "ready" || row.available === undefined) return "unavailable";
  const minimum = row.product?.min_stock_qty;
  const remaining = Math.round((row.available - row.qty) * 1e8) / 1e8;
  return minimum != null && minimum !== "" && Number.isFinite(Number(minimum)) && remaining >= Number(minimum)
    ? "low" : "ready";
}

const quantity = (value: number | string | null | undefined) => value == null || value === "" || !Number.isFinite(Number(value))
  ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function ProductionMaterialsTable({ rows, checked = true, busy = false, enableRowSelection = false, isMaterialIssueView = false }: {
  rows: ProductionPreviewRow[]; checked?: boolean; busy?: boolean; enableRowSelection?: boolean; isMaterialIssueView?: boolean;
}) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(() => new Set());
  const selectedCount = rows.filter((row) => selectedRowKeys.has(row.key)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const stockCounts = useMemo(() => {
    const counts = { ready: 0, low: 0, unavailable: 0 };
    if (isMaterialIssueView && checked) {
      rows.forEach((row) => { counts[getMaterialStockState(row)] += 1; });
    }
    return counts;
  }, [rows, isMaterialIssueView, checked]);
  const filtered = useMemo(() => rows.filter((row) => {
    const query = search.trim().toLowerCase();
    return (filter === "all" || (filter === "attention" ? row.status !== "ready" : row.status === "ready")) &&
      (!query || [row.articleCode, row.name, row.product?.product_name, row.category, row.type, row.source].some((value) => value?.toLowerCase().includes(query)));
  }), [rows, search, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * 25, currentPage * 25);
  return <div className="space-y-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div className="relative sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search preview products" placeholder="Search name, article code, category…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" /></div>
                <div className="flex gap-1">{[["all", "All rows"], ["attention", "Needs attention"], ["ready", "In stock"]].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} disabled={!checked && value !== "all"} onClick={() => { setFilter(value); setPage(1); }}>{label}</Button>)}</div>
              </div>
              {isMaterialIssueView && <div aria-label="Stock color legend" className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <span className={stockColors.ready}>● In stock ({stockCounts.ready})</span>
                <span className={stockColors.unavailable}>● Unavailable / insufficient stock ({stockCounts.unavailable})</span>
                <span className={stockColors.low}>● In stock · Updated stock at or above minimum ({stockCounts.low})</span>
              </div>}
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground"><tr className="divide-x">
                    {enableRowSelection && <th className="w-12 px-4 py-3">
                      <Checkbox
                        aria-label="Select all material rows"
                        checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
                        disabled={busy || rows.length === 0}
                        onCheckedChange={(value) => setSelectedRowKeys(value === true ? new Set(rows.map((row) => row.key)) : new Set())}
                      />
                    </th>}
                    {["Product / Article code", "Type / Category", "Required", "Inventory stock", "Updated Stock"].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
                  <tbody className="divide-y">{visibleRows.map((row) => {
                    const updatedStock = row.available !== undefined
                      ? (row.available >= row.qty ? row.available - row.qty : row.qty - row.available)
                      : undefined;
                    const insufficient = row.available !== undefined && row.qty > row.available;
                    const stockColor = isMaterialIssueView && checked ? stockColors[getMaterialStockState(row)] : undefined;
                    return <tr key={row.key} data-state={enableRowSelection && selectedRowKeys.has(row.key) ? "selected" : undefined} className="align-top divide-x hover:bg-muted/20 data-[state=selected]:bg-muted/40">
                    {enableRowSelection && <td className="px-4 py-3">
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
                    <td className={cn("max-w-72 px-4 py-3", stockColor)}><p className="font-medium break-words">{row.name || "Unnamed product"}</p><p className={cn("mt-1 font-mono text-xs", !stockColor && "text-primary")}>{row.articleCode || "No article code"}</p>{row.product && row.product.product_name !== row.name && <p className={cn("mt-1 text-xs", !stockColor && "text-muted-foreground")}>Inventory: {row.product.product_name}</p>}<p className="mt-1 break-words text-[11px] text-muted-foreground">{row.source}</p>{row.errors.length > 0 && <p className="mt-1 max-w-48 text-xs text-destructive">{row.errors.join("; ")}</p>}</td>
                    <td className="px-4 py-3"><p>{row.type || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{row.category || "—"}</p></td>
                    <td className="px-4 py-3 font-medium tabular-nums">{quantity(row.qty)} <span className="text-xs font-normal text-muted-foreground">{row.unit}</span></td>
                    <td className="px-4 py-3 tabular-nums">{quantity(row.product?.current_stock)}<p className="text-xs text-muted-foreground">{row.stockUnit}</p></td>
                    <td className={cn("px-4 py-3 tabular-nums", insufficient && "font-medium text-amber-700 dark:text-amber-400")}>{quantity(updatedStock)}<p className="text-xs text-muted-foreground">{updatedStock !== undefined ? row.unit : ""}</p></td>

                  </tr>;
                  })}</tbody>
                </table>
                {!visibleRows.length && <p className="p-10 text-center text-sm text-muted-foreground">{busy ? "Preparing your preview…" : rows.length ? "No products match these filters." : "Select a workbook with product rows to see the preview."}</p>}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><p>{filtered.length} rows · Page {currentPage} of {pageCount}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
              <p className="text-xs leading-relaxed text-muted-foreground">Inventory stock is the current vendor-wide quantity. Updated Stock is Inventory stock minus Required when stock covers it, or Required minus Inventory stock (shown in amber) when it falls short. Quantities with different units are not compared. This preview does not reserve stock.</p>
  </div>;
}
