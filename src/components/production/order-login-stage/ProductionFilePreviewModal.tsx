"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Package, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUploadField } from "@/components/custom/file-upload";
import { cn } from "@/lib/utils";
import {
  applyInventoryMatches, canSaveProductionRow, matchProductionInventory, parseProductionFiles, REQUIRED_PRODUCTION_HEADERS,
  type InventoryProduct, type ProductionPreview, type ProductionPreviewRow,
} from "./production-file-preview";

import { type RequiredProductionMaterial } from "@/api/production/order-login";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import ProductionMaterialsTable from "./ProductionMaterialsTable";

interface Props {
  savedMaterials?: RequiredProductionMaterial[];
  materialsLoading?: boolean;
  materialsError?: boolean;
  embedded?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  vendorId?: number;
  uploading: boolean;
  canUpload: boolean;
  onUpload: (rows: ProductionPreviewRow[], replace: boolean) => Promise<void>;
  onDownloadTemplate: () => void;
}

export default function ProductionFilePreviewModal({ savedMaterials = [], materialsLoading = false, materialsError = false, embedded = false, open, onOpenChange, files, onFilesChange, vendorId,
  uploading, canUpload, onUpload, onDownloadTemplate }: Props) {
  const searchParams = useSearchParams();
  const isMaterialIssueView = searchParams.get("source") === "material-issue";
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [preview, setPreview] = useState<ProductionPreview | null>(null);
  const [phase, setPhase] = useState<"reading" | "matching" | "done">("reading");
  const [lookupError, setLookupError] = useState("");
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<"products" | "logs">("products");
  // Tie the result to the exact selection and vendor; an old preview can never approve new files.
  const [checkedSelection, setCheckedSelection] = useState<{ files: File[]; vendorId: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreview(null);
    setCheckedSelection(null);
    setLookupError("");
    setPhase("reading");
    async function read() {
      try {
        const parsed = await parseProductionFiles(files);
        if (cancelled) return;
        setPreview(parsed);
        if (!parsed.rows.length) {
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

  const savedRows = useMemo(() => {
    const matches = new Map<string, InventoryProduct[]>();
    const savedPreview: ProductionPreview = { fileCount: 0, logs: [], rows: savedMaterials.map((material) => {
      matches.set(material.article_code, [material.product]);
      return { key: String(material.id), source: "", type: material.type, category: material.category,
        qty: Number(material.qty), unit: material.unit, name: material.name, articleCode: material.article_code,
        errors: [], status: "unmatched" };
    }) };
    return applyInventoryMatches(savedPreview, matches).rows;
  }, [savedMaterials]);
  const rows = preview?.rows ?? [];
  const errors = preview?.logs.filter((log) => log.level === "error").length ?? 0;
  const warnings = preview?.logs.filter((log) => log.level === "warning").length ?? 0;
  const busy = phase !== "done";
  const checked = checkedSelection?.files === files && checkedSelection?.vendorId === vendorId;
  const matchedProducts = new Set(rows.flatMap((row) => row.product ? [row.product.id] : [])).size;
  const saveableRows = rows.filter(canSaveProductionRow);
  const canConfirm = checked && !busy && !uploading && canUpload && !materialsLoading && !materialsError && !lookupError && saveableRows.length > 0;
  const submit = () => { if (!canConfirm) return; if (savedMaterials.length) setConfirmReplace(true); else void onUpload(saveableRows, false); };

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
          {materialsLoading && <p role="status">Loading saved materials…</p>}
          {materialsError && <p role="alert" className="text-destructive">Could not load saved materials. Reload this page to retry.</p>}
          {!!savedMaterials.length && <div className="space-y-3">
            <ProductionMaterialsTable rows={savedRows} enableRowSelection={isMaterialIssueView} isMaterialIssueView={isMaterialIssueView} />
          </div>}
          <div className="rounded-xl border p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-sm font-medium">Excel workbooks</p><p className="text-xs text-muted-foreground">.xlsx or .csv · Required headers in the first row · Additional columns allowed</p></div>
              <Button variant="outline" size="sm" onClick={onDownloadTemplate}>Download template</Button>
            </div>
            <FileUploadField value={files} onChange={onFilesChange} accept=".xlsx,.csv" multiple disabled={uploading || !canUpload} />
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
          {!!errors && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="font-medium">Some rows or sheets could not be read</p><p className="mt-1 text-muted-foreground">{errors} validation issue{errors === 1 ? "" : "s"} found. Valid matched rows can still be saved. Review the log for skipped rows or sheets.</p></div>}

          <div className="space-y-4">
            <div className="flex gap-1 border-b" role="tablist" aria-label="Preview details">
              {(["products", "logs"] as const).map((value) => <button key={value} type="button" role="tab" id={`production-${value}-tab`} aria-controls={`production-${value}-panel`} aria-selected={tab === value} onClick={() => setTab(value)} className={cn("border-b-2 px-4 py-2.5 text-sm font-medium", tab === value ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                {value === "products" ? `Products (${rows.length})` : `Validation log (${preview?.logs.length ?? 0})`}</button>)}
            </div>
            {tab === "products" ? <div role="tabpanel" id="production-products-panel" aria-labelledby="production-products-tab" className="space-y-3">
              <ProductionMaterialsTable rows={rows} checked={checked} busy={busy} isMaterialIssueView={isMaterialIssueView} />
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
          <div className="text-sm"><p className="font-medium">{canConfirm ? `${rows.length} rows reviewed in ${files.length} file${files.length === 1 ? "" : "s"}` : "Review and validate your files to continue"}</p><p className="mt-1 text-xs text-muted-foreground">{warnings ? "Inventory warnings do not prevent file upload. " : ""}{saveableRows.length} rows can be saved; {rows.length - saveableRows.length} rows will be skipped. Stock shortages do not prevent saving materials.</p></div>
          <div className="flex shrink-0 gap-2">{!embedded && <Button variant="outline" disabled={uploading} onClick={() => onOpenChange(false)}>Back</Button>}<Button disabled={!canConfirm} onClick={submit}>{uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}{uploading ? "Uploading…" : "Upload files"}</Button></div>
        </div>
        <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Replace saved materials?</AlertDialogTitle>
            <AlertDialogDescription>Submitting this upload will delete the previous {savedMaterials.length} material rows and replace them with {saveableRows.length} valid rows from the selected files. The previous material data will be lost.</AlertDialogDescription>
          </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={!canConfirm} onClick={() => { if (canConfirm) void onUpload(saveableRows, true); }}>Replace and upload</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
        </AlertDialog>
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
