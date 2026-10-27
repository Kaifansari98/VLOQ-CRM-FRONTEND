"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudUpload, Eye, FileText, Loader2, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useMetalCutlist, useSaveMetalCutlist } from "@/api/production/production-api";
import { cn } from "@/lib/utils";
import type { MetalCutlistResult } from "@/lib/metal-cutlist-parser";
import ProjectCutlistTable from "@/components/track-trace/ProjectCutlistTable";

const COUNT_COLUMNS = [
  { key: "partsCount", label: "Parts" },
  { key: "nestCount", label: "Nested" },
  { key: "remainCount", label: "Remain" },
  { key: "processed", label: "Processed" },
] as const;

export default function MetalCutlistUpload({ canUpload, leadId, instanceId }: { canUpload: boolean; leadId: number; instanceId?: number | null }) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const { data: saved, isLoading: savedLoading } = useMetalCutlist(vendorId, leadId, instanceId);
  const { mutateAsync: saveMetalCutlist, isPending: saving } = useSaveMetalCutlist(vendorId, leadId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<MetalCutlistResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  // Indexes into result.parts, so removed rows can be restored without re-reading the PDF.
  const [removed, setRemoved] = useState<number[]>([]);
  const [query, setQuery] = useState("");

  async function readPdf(file: File) {
    setBusy(true);
    setError("");
    setProgress("Opening PDF…");
    try {
      const { extractMetalCutlist } = await import("@/lib/extract-metal-cutlist");
      const extracted = await extractMetalCutlist(file, setProgress);
      setResult(extracted);
      setFileName(file.name);
      setRemoved([]);
      setQuery("");
      setOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to extract the Part Info table from this PDF.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const kept = useMemo(() => (result?.parts ?? []).map((part, index) => ({ part, index })).filter(({ index }) => !removed.includes(index)), [result, removed]);
  // Removed rows stay listed (struck through) so they can be restored in place.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = (result?.parts ?? []).map((part, index) => ({ part, index }));
    return term ? rows.filter(({ part }) => part.partName.toLowerCase().includes(term)) : rows;
  }, [result, query]);
  const total = kept.reduce((sum, { part }) => sum + part.partsCount, 0);
  const pages = Array.from(new Set(kept.map(({ part }) => part.page)));
  const warnings = result?.warnings ?? [];
  const project = saved?.project ?? null;
  const savedCount = saved?.rows.length ?? 0;
  const canSave = canUpload && !!vendorId && kept.length > 0 && !!userId && !savedLoading;

  async function saveCutlist() {
    if (!canSave) return;
    try {
      const formData = new FormData();
      let imageCount = 0;
      const parts = [];
      for (const { part } of kept) {
        let imageIndex: number | null = null;
        if (part.thumbnail) {
          const blob = await (await fetch(part.thumbnail)).blob();
          imageIndex = imageCount++;
          formData.append("images", blob, `${imageIndex}.png`);
        }
        parts.push({ part_name: part.partName, length: part.dimension1Mm, width: part.dimension2Mm, qty: part.partsCount, image_index: imageIndex });
      }
      formData.append("parts", JSON.stringify(parts));
      formData.append("created_by", String(userId));
      if (instanceId) formData.append("instance_id", String(instanceId));

      const response = await saveMetalCutlist(formData);
      toastManager.add({ title: response?.data?.projectCreated ? "Metalwork Cutlist uploaded and Track & Trace project created!" : "Metalwork Cutlist uploaded successfully!", type: "success" });
      setConfirmOpen(false);
      setOpen(false);
      setResult(null);
      setRemoved([]);
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || error?.message || "Failed to upload Metalwork Cutlist.",
        type: "error",
      });
    }
  }

  const uploadButton = (size: "sm" | "default" = "sm") => (
    <Button type="button" size={size} disabled={!canSave || saving} onClick={() => setConfirmOpen(true)}>
      {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CloudUpload className="mr-2 size-4" />}
      Upload cutlist
    </Button>
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Metalwork Cutlist PDF</h3>
            <p className="mt-1 text-xs text-muted-foreground">Upload a nesting PDF to review its Part Info table, then upload it to the Track & Trace project.</p>
          </div>
        </div>
        {canUpload && <>
          <input ref={input} type="file" accept=".pdf,application/pdf" className="hidden" aria-label="Upload Metalwork Cutlist PDF" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void readPdf(file); }} />
          <Button type="button" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            {busy ? "Extracting…" : "Upload PDF"}
          </Button>
        </>}
      </div>
      {!savedLoading && !project && (
        <div role="status" className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>Submitting this Metalwork Cutlist will create a Track & Trace project for this lead.</p>
        </div>
      )}
      {busy && <p role="status" className="text-sm text-muted-foreground">{progress}</p>}
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {result && <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="min-w-0"><p className="truncate text-sm font-medium" title={fileName}>{fileName}</p><p className="mt-1 text-xs text-muted-foreground">{kept.length} part rows · {total} total pieces · {warnings.length ? "Needs review" : "Ready to review"}</p></div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Eye className="mr-2 size-4" />Preview</Button>
          {canUpload && uploadButton()}
        </div>
      </div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1150px]">
          {/* Header */}
          <DialogHeader className="border-b px-6 pt-6 pb-4 pr-12 text-left">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle>Metalwork Cutlist — Part Info</DialogTitle>
                  {warnings.length ? (
                    <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <AlertTriangle className="size-3" />Needs review
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" />All rows read
                    </Badge>
                  )}
                </div>
                <DialogDescription className="mt-1 truncate" title={fileName}>{fileName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Summary + toolbar */}
          <div className="space-y-4 border-b bg-muted/30 px-6 py-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Part rows" value={kept.length} />
              <Stat label="Total pieces" value={total} />
              <Stat label="Source pages" value={pages.length ? pages.join(", ") : "—"} />
              <Stat label="Removed rows" value={removed.length} muted={!removed.length} />
            </div>
            {!!warnings.length && (
              <div role="alert" className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="max-h-20 space-y-0.5 overflow-auto">{warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search part name…" aria-label="Search part name" className="h-9 bg-background pl-8" />
              </div>
              <p className="text-xs text-muted-foreground">All dimensions in millimetres</p>
            </div>
          </div>

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0] shadow-border">
                <tr className="text-xs text-muted-foreground">
                  <th scope="col" className="w-14 px-4 py-3 font-medium">#</th>
                  <th scope="col" className="px-4 py-3 font-medium">Part name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Shape</th>
                  <th scope="col" className="px-4 py-3 font-medium">Size (mm × mm)</th>
                  {COUNT_COLUMNS.map(column => <th key={column.key} scope="col" className="px-4 py-3 text-center font-medium">{column.label}</th>)}
                  <th scope="col" className="px-4 py-3 text-center font-medium">Page</th>
                  <th scope="col" className="w-14 px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map(({ part, index }) => {
                  const isRemoved = removed.includes(index);
                  return (
                  <tr key={index} aria-disabled={isRemoved} className={cn(
                    "group transition-colors",
                    isRemoved ? "bg-muted/40 text-muted-foreground [&>td]:line-through [&>td]:decoration-muted-foreground/70" : "hover:bg-muted/40",
                  )}>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{part.order}</td>
                    <td className="px-4 py-2.5 font-mono text-[13px] font-medium">{part.partName}</td>
                    <td className="px-4 py-2.5">
                      {part.thumbnail ? (
                        // PDF crops are local data URLs, not remote images.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={part.thumbnail} alt={`Shape of ${part.partName}`} className={cn("h-12 w-28 rounded-md border bg-white object-contain p-1", isRemoved && "opacity-40 grayscale")} />
                      ) : <span className="text-xs text-muted-foreground">Unavailable</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                      {part.dimension1Mm.toFixed(2)} <span className="text-muted-foreground">×</span> {part.dimension2Mm.toFixed(2)}
                    </td>
                    {COUNT_COLUMNS.map(column => (
                      <td key={column.key} className={cn(
                        "px-4 py-2.5 text-center tabular-nums",
                        column.key === "partsCount" && !isRemoved && "font-semibold",
                        column.key === "remainCount" && part.remainCount > 0 && !isRemoved && "font-semibold text-amber-600 dark:text-amber-400",
                        column.key !== "partsCount" && !part[column.key] && "text-muted-foreground",
                      )}>{part[column.key]}</td>
                    ))}
                    <td className="px-4 py-2.5 text-center"><Badge variant="secondary" className={cn("font-normal tabular-nums", isRemoved && "opacity-50")}>P{part.page}</Badge></td>
                    <td className="px-4 py-2.5 text-right">
                      {isRemoved ? (
                        <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" title="Restore row" aria-label={`Restore ${part.partName}`} onClick={() => setRemoved(current => current.filter(i => i !== index))}>
                          <RotateCcw className="size-4" />
                        </Button>
                      ) : (
                        <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100" title="Remove row" aria-label={`Remove ${part.partName}`} onClick={() => setRemoved(current => [...current, index])}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                  );
                })}
                {!visible.length && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">No parts match “{query.trim()}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Review the rows, then upload. A Track & Trace project will be created if needed.
            </p>
            <div className="flex items-center justify-end gap-2">
              {!!removed.length && <>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRemoved(current => current.slice(0, -1))}>
                  <RotateCcw className="mr-2 size-4" />Undo remove
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRemoved([])}>Restore all ({removed.length})</Button>
              </>}
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Close</Button>
              {canUpload && uploadButton()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={next => { if (!saving) setConfirmOpen(next); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Metalwork Cutlist?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {kept.length} part rows ({total} pieces) will be added to the cutlist of
                  {" "}<span className="font-medium text-foreground">{project?.project_name ?? `a new Track & Trace project for Lead #${leadId}`}</span> as metalwork, with their part images.
                </p>
                {!!removed.length && <p>{removed.length} removed {removed.length === 1 ? "row" : "rows"} will not be uploaded.</p>}
                {!!savedCount && (
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    This replaces the {savedCount} Metalwork Cutlist {savedCount === 1 ? "row" : "rows"} uploaded earlier.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={event => { event.preventDefault(); void saveCutlist(); }}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? "Uploading…" : "Upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {project && (
        <ProjectCutlistTable
          uniqueProjectId={project.unique_project_id}
          fabrication="METALWORK"
          emptyDescription="Upload a nesting PDF above and confirm the upload to add parts to this project."
        />
      )}
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", muted && "text-muted-foreground")}>{value}</p>
    </div>
  );
}
