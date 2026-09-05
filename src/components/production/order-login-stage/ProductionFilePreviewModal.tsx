"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Package, Search, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileUploadField } from "@/components/custom/file-upload";
import { cn } from "@/lib/utils";
import {
  matchProductionInventory, parseProductionFiles, REQUIRED_PRODUCTION_HEADERS,
  type ProductionPreview, type ProductionPreviewRow,
} from "./production-file-preview";

const statusLabels: Record<ProductionPreviewRow["status"], string> = {
  ready: "In stock", shortage: "Stock shortage", unmatched: "Not found", ambiguous: "Multiple matches",
  inactive: "Inactive product", unknown: "Stock unavailable", invalid: "Invalid row",
};
const quantity = (value: number | string | null | undefined) => value == null || value === "" || !Number.isFinite(Number(value))
  ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });

interface Props {
  embedded?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  vendorId?: number;
  uploading: boolean;
  canUpload: boolean;
  onUpload: () => Promise<void>;
  onDownloadTemplate: () => void;
}

export default function ProductionFilePreviewModal({ embedded = false, open, onOpenChange, files, onFilesChange, vendorId,
  uploading, canUpload, onUpload, onDownloadTemplate }: Props) {
  const [preview, setPreview] = useState<ProductionPreview | null>(null);
  const [phase, setPhase] = useState<"reading" | "matching" | "done">("reading");
  const [lookupError, setLookupError] = useState("");
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<"products" | "logs">("products");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  // Tie the result to the exact selection and vendor; an old preview can never approve new files.
  const [checkedSelection, setCheckedSelection] = useState<{ files: File[]; vendorId: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreview(null);
    setCheckedSelection(null);
    setLookupError("");
    setPhase("reading");
    setPage(1);
    setFilter("all");
    setSearch("");
    async function read() {
      try {
        const parsed = await parseProductionFiles(files);
        if (cancelled) return;
        setPreview(parsed);
        if (parsed.logs.some((log) => log.level === "error") || !parsed.rows.length) {
          setPhase("done");
          return;
        }
        if (!vendorId) throw new Error("Your vendor could not be identified. Reopen this preview after signing in.");
        setPhase("matching");
        const matched = await matchProductionInventory(parsed, vendorId, () => cancelled);
        if (cancelled) return;
        setPreview(matched);
        setCheckedSelection({ files, vendorId });
      } catch {
        if (!cancelled) setLookupError("We couldn’t verify the inventory. Check your connection and catalog access, then retry.");
      } finally {
        if (!cancelled) setPhase("done");
      }
    }
    void read();
    return () => { cancelled = true; };
  }, [files, vendorId, open, retry]);

  const rows = preview?.rows ?? [];
  const errors = preview?.logs.filter((log) => log.level === "error").length ?? 0;
  const warnings = preview?.logs.filter((log) => log.level === "warning").length ?? 0;
  const busy = phase !== "done";
  const checked = checkedSelection?.files === files && checkedSelection?.vendorId === vendorId;
  const matchedProducts = new Set(rows.flatMap((row) => row.product ? [row.product.id] : [])).size;
  const filtered = useMemo(() => (preview?.rows ?? []).filter((row) => {
    const query = search.trim().toLowerCase();
    return (filter === "all" || (filter === "attention" ? row.status !== "ready" : row.status === "ready")) &&
      (!query || [row.articleCode, row.name, row.product?.product_name, row.category, row.type, row.source].some((value) => value?.toLowerCase().includes(query)));
  }), [preview, search, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * 25, currentPage * 25);
  const canConfirm = checked && !busy && !uploading && canUpload && !errors && !lookupError && rows.length > 0;

  const content = (
    <>
        <div className="border-b bg-muted/30 px-6 py-5 pr-12 text-left">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border bg-background p-2.5 text-primary"><FileSpreadsheet className="size-6" /></div>
            <div>{embedded ? (
              <><h2 className="text-lg font-semibold">Required Production Materials</h2><p className="mt-1 text-sm text-muted-foreground">Check your Excel rows and inventory before uploading production files.</p></>
            ) : (
              <><DialogTitle className="text-lg">Required Production Materials</DialogTitle><DialogDescription className="mt-1">Check your Excel rows and inventory before uploading production files.</DialogDescription></>
            )}</div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-sm font-medium">Excel workbooks</p><p className="text-xs text-muted-foreground">.xlsx only · Required headers in the first row · Additional columns allowed</p></div>
              <Button variant="outline" size="sm" onClick={onDownloadTemplate}>Download template</Button>
            </div>
            <FileUploadField value={files} onChange={onFilesChange} accept=".xlsx" multiple disabled={uploading || !canUpload} />
            <div className="mt-3 flex flex-wrap gap-1.5">{REQUIRED_PRODUCTION_HEADERS.map((header) => <Badge key={header} variant="secondary">{header}</Badge>)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Rows in Excel", value: rows.length, hint: `${files.length} workbook${files.length === 1 ? "" : "s"}`, icon: FileSpreadsheet },
              { label: "Matched products", value: checked ? matchedProducts : "—", hint: "Unique inventory products", icon: Package },
              { label: "Rows covered by stock", value: checked ? rows.filter((row) => row.status === "ready").length : "—", hint: "Required quantity available", icon: CheckCircle2 },
              { label: "Needs attention", value: errors + warnings, hint: `${errors} errors · ${warnings} warnings`, icon: AlertTriangle },
            ].map(({ label, value, hint, icon: Icon }) => <div key={label} className="rounded-xl border bg-muted/15 p-4">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">{label}<Icon className="size-4" /></div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>)}
          </div>

          {busy && <div role="status" className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"><Loader2 className="size-5 animate-spin text-primary" />
            {phase === "reading" ? "Reading workbooks and checking required columns…" : "Matching article codes with your vendor’s inventory…"}</div>}
          {lookupError && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{lookupError}</p><Button size="sm" variant="outline" onClick={() => setRetry((value) => value + 1)}>Retry</Button></div>}
          {!!errors && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="font-medium">Fix the workbook before uploading</p><p className="mt-1 text-muted-foreground">{errors} validation issue{errors === 1 ? "" : "s"} found. Review the validation log, correct the file, then remove it and select the corrected workbook.</p></div>}

          <div className="space-y-4">
            <div className="flex gap-1 border-b" role="tablist" aria-label="Preview details">
              {(["products", "logs"] as const).map((value) => <button key={value} type="button" role="tab" id={`production-${value}-tab`} aria-controls={`production-${value}-panel`} aria-selected={tab === value} onClick={() => setTab(value)} className={cn("border-b-2 px-4 py-2.5 text-sm font-medium", tab === value ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                {value === "products" ? `Products (${rows.length})` : `Validation log (${preview?.logs.length ?? 0})`}</button>)}
            </div>
            {tab === "products" ? <div role="tabpanel" id="production-products-panel" aria-labelledby="production-products-tab" className="space-y-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div className="relative sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search preview products" placeholder="Search name, article code, category…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" /></div>
                <div className="flex gap-1">{[["all", "All rows"], ["attention", "Needs attention"], ["ready", "In stock"]].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} disabled={!checked && value !== "all"} onClick={() => { setFilter(value); setPage(1); }}>{label}</Button>)}</div>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>{["Product / Article code", "Type / Category", "Required", "Inventory stock", "Available for row", "Shortfall", "Status"].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
                  <tbody className="divide-y">{visibleRows.map((row) => <tr key={row.key} className="align-top hover:bg-muted/20">
                    <td className="max-w-72 px-4 py-3"><p className="font-medium break-words">{row.name || "Unnamed product"}</p><p className="mt-1 font-mono text-xs text-primary">{row.articleCode || "No article code"}</p>{row.product && row.product.product_name !== row.name && <p className="mt-1 text-xs text-muted-foreground">Inventory: {row.product.product_name}</p>}<p className="mt-1 break-words text-[11px] text-muted-foreground">{row.source}</p></td>
                    <td className="px-4 py-3"><p>{row.type || "—"}</p><p className="mt-1 text-xs text-muted-foreground">{row.category || "—"}</p></td>
                    <td className="px-4 py-3 font-medium tabular-nums">{quantity(row.qty)} <span className="text-xs font-normal text-muted-foreground">{row.unit}</span></td>
                    <td className="px-4 py-3 tabular-nums">{quantity(row.product?.current_stock)}<p className="text-xs text-muted-foreground">{row.stockUnit}</p></td>
                    <td className="px-4 py-3 tabular-nums">{quantity(row.available)}<p className="text-xs text-muted-foreground">{row.available !== undefined ? row.unit : ""}</p></td>
                    <td className={cn("px-4 py-3 tabular-nums", row.shortage && "font-medium text-amber-700 dark:text-amber-400")}>{quantity(row.shortage)}<p className="text-xs">{row.shortage ? row.unit : ""}</p></td>
                    <td className="px-4 py-3"><Badge variant="outline" className={cn(row.status === "invalid" ? "border-destructive/30 text-destructive" : checked && row.status === "ready" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : checked ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" : "")}>{row.status === "invalid" || checked ? statusLabels[row.status] : "Not checked"}</Badge>{row.errors.length > 0 && <p className="mt-1 max-w-48 text-xs text-destructive">{row.errors.join("; ")}</p>}</td>
                  </tr>)}</tbody>
                </table>
                {!visibleRows.length && <p className="p-10 text-center text-sm text-muted-foreground">{busy ? "Preparing your preview…" : rows.length ? "No products match these filters." : "Select a workbook with product rows to see the preview."}</p>}
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><p>{filtered.length} rows · Page {currentPage} of {pageCount}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
              <p className="text-xs leading-relaxed text-muted-foreground">Inventory stock is the current vendor-wide quantity. Available for row subtracts earlier requirements for the same product across all selected files. Quantities with different units are not compared. This preview does not reserve stock.</p>
            </div> : <div role="tabpanel" id="production-logs-panel" aria-labelledby="production-logs-tab" className="max-h-80 space-y-2 overflow-y-auto">
              {!preview?.logs.length && <p className="p-6 text-center text-sm text-muted-foreground">Validation results will appear here.</p>}
              {preview?.logs.map((log, index) => <div key={index} className={cn("flex gap-3 rounded-lg border p-3", log.level === "error" ? "border-destructive/25 bg-destructive/5" : log.level === "warning" ? "border-amber-500/25 bg-amber-500/5" : "bg-muted/20")}>
                {log.level === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", log.level === "error" ? "text-destructive" : "text-amber-600")} />}
                <div className="min-w-0"><p className="break-words text-xs font-medium text-muted-foreground">{log.level.toUpperCase()} · {log.source}</p><p className="mt-1 text-sm">{log.message}</p></div>
              </div>)}
            </div>}
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:items-center">
          <div className="text-sm"><p className="font-medium">{canConfirm ? `${rows.length} rows reviewed in ${files.length} file${files.length === 1 ? "" : "s"}` : "Review and validate your files to continue"}</p><p className="mt-1 text-xs text-muted-foreground">{warnings ? "Inventory warnings do not prevent file upload. " : ""}Uploads save production documents; material records are not added yet.</p></div>
          <div className="flex shrink-0 gap-2">{!embedded && <Button variant="outline" disabled={uploading} onClick={() => onOpenChange(false)}>Back</Button>}<Button disabled={!canConfirm} onClick={() => { if (canConfirm) void onUpload(); }}>{uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}{uploading ? "Uploading…" : "Upload files"}</Button></div>
        </div>
    </>
  );

  if (embedded) return <section className="flex min-w-0 flex-col">{content}</section>;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!uploading) onOpenChange(next); }}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl" showCloseButton={!uploading} onPointerDownOutside={(event) => event.preventDefault()}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
