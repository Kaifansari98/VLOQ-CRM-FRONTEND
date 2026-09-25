"use client";

import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { CUTLIST_HEADER_FIELDS } from "@/lib/cutlist-header-fields";
import { normalizeCutlistHeader, useCutlistHeaderMappings, useSaveCutlistHeaderMappings } from "@/api/cutlist-headers";

type HeaderDraft = { source_header: string; field_key: string | null };

export function CutlistHeaderMappingCard({ vendorId }: { vendorId: number }) {
  const query = useCutlistHeaderMappings(vendorId);
  const save = useSaveCutlistHeaderMappings(vendorId);
  const [draft, setDraft] = useState<HeaderDraft[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const serverFields = query.data?.fields ?? [];
  const fields = CUTLIST_HEADER_FIELDS.map((field) => ({
    ...field,
    field_key: field.field,
  }));
  const mappings: HeaderDraft[] = draft ?? (query.data?.mappings ?? []).map((row) => ({
    source_header: row.source_header,
    field_key: serverFields.find((field) => field.id === row.rule_field_id)?.field_key ?? null,
  }));
  const missing = fields.filter((field) => field.required && !mappings.some((row) => row.field_key === field.field_key));
  const mappedCount = mappings.filter((row) => row.field_key != null).length;
  const busy = reading || save.isPending;

  async function readFile(file?: File) {
    if (!file) return;
    setError("");
    if (!file.name.toLowerCase().endsWith(".xlsx")) { setError("Choose an .xlsx workbook. Save older .xls files as .xlsx first."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Choose a sample workbook smaller than 10 MB. Only its first-row headers are needed."); return; }
    setReading(true);
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("The workbook has no worksheets.");
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell) => { if (cell.text.trim()) headers.push(cell.text.trim()); });
      if (!headers.length) throw new Error("No headers found. Put column names in the first row of the first worksheet.");
      if (headers.length > 200) throw new Error("Use a workbook with no more than 200 columns.");
      if (headers.some((header) => header.length > 255)) throw new Error("Column names must be no longer than 255 characters.");
      const normalized = headers.map(normalizeCutlistHeader);
      if (new Set(normalized).size !== headers.length) throw new Error("Duplicate column names found. Give each column a unique header before uploading.");
      const used = new Set<string>();
      const next = headers.map((header): HeaderDraft => {
        const key = normalizeCutlistHeader(header);
        const previous = mappings.find((row) => normalizeCutlistHeader(row.source_header) === key);
        const matched = fields.find((field) => [field.label, field.field_key, ...field.aliases].some((alias) => normalizeCutlistHeader(alias) === key));
        const target = previous ? previous.field_key : matched?.field_key ?? null;
        const field = target != null && !used.has(target) ? target : null;
        if (field != null) used.add(field);
        return { source_header: header, field_key: field };
      });
      setDraft(next);
      setFileName(file.name);
      setConfirmReset(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read the workbook.");
    } finally { setReading(false); if (input.current) input.current.value = ""; }
  }

  async function persist(rows: HeaderDraft[]) {
    if (rows.length && missing.length) {
      setError(`Map all required fields: ${missing.map((field) => field.label).join(", ")}.`);
      return;
    }
    setError("");
    try {
      await save.mutateAsync(rows);
      setDraft(null);
      setFileName("");
      setConfirmReset(false);
      toastManager.add({ title: rows.length ? "Cutlist header mapping saved" : "Default cutlist headers restored", type: "success" });
    } catch (err: any) { setError(err?.response?.data?.message || err?.message || "Unable to save the mapping. Try again."); }
  }

  return (
    <section className="rounded-xl border bg-card overflow-hidden" aria-labelledby="cutlist-mapping-title">
      <div className="p-5 sm:p-6 border-b flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><FileSpreadsheet className="h-5 w-5" /></div>
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="cutlist-mapping-title" className="font-semibold">Cutlist file header mapping</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{draft ? "Unsaved changes" : query.data?.mappings?.length ? "Custom mapping saved" : "Default headers"}</span>
          </div>
          <p className="text-sm text-muted-foreground">Connect this vendor’s Excel column names to the cutlist fields used in project imports.</p>
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        {query.isLoading && <p className="text-sm text-muted-foreground flex gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading configuration… You can choose an Excel file now.</p>}
        {query.isError && (
          <div role="alert" className="text-sm text-destructive space-y-2">
            <p>Unable to load this vendor’s mapping. You can still upload a workbook and save a new mapping. Saving replaces any previous mapping.</p>
            <Button type="button" variant="outline" size="sm" disabled={query.isFetching} onClick={() => query.refetch()}>{query.isFetching ? "Retrying…" : "Retry"}</Button>
          </div>
        )}
        {query.isSuccess && !serverFields.length && <p role="status" className="text-sm text-muted-foreground">No active cutlist fields are configured yet. You can configure the columns below. Field availability will be checked when saving.</p>}
        <>
          <div className="rounded-lg border border-dashed bg-muted/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <Upload className="h-6 w-6 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName || "Upload a sample cutlist workbook"}</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx · Up to 10 MB · First worksheet, first row. Only header names are saved; row data is not uploaded.</p>
            </div>
            <input ref={input} type="file" accept=".xlsx" className="hidden" aria-label="Sample cutlist workbook" onChange={(event) => void readFile(event.target.files?.[0])} disabled={busy} />
            <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>{reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{reading ? "Reading headers…" : mappings.length ? "Choose another file" : "Choose Excel file"}</Button>
          </div>
          {mappings.length > 0 && <>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <p><span className="font-medium">{mappedCount}</span> mapped <span className="text-muted-foreground">/ {mappings.length} columns · {mappings.length - mappedCount} ignored</span></p>
              {!missing.length && <span className="text-emerald-600 flex items-center gap-1.5 text-xs"><CheckCircle2 className="h-4 w-4" />All required fields mapped</span>}
            </div>
            {(
              <div className="overflow-x-auto rounded-lg border max-h-[480px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Cutlist field</th>
                      <th scope="col" className="w-10"><span className="sr-only">Uses column</span></th>
                      <th scope="col" className="px-4 py-3 font-medium">Your Excel column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fields.map((field) => {
                      const selectedHeader = mappings.find((row) => row.field_key === field.field_key)?.source_header ?? "";
                      return (
                        <tr key={field.field_key} className={selectedHeader ? "" : "bg-muted/20"}>
                          <td className="px-4 py-3 break-words min-w-[160px] font-medium">
                            {field.label}{field.required ? " *" : ""}
                          </td>
                          <td><ArrowRight className="h-4 w-4 text-muted-foreground" /></td>
                          <td className="px-4 py-2 min-w-[230px]">
                            <select
                              aria-label={`Excel column for ${field.label}`}
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              disabled={busy}
                              value={selectedHeader}
                              onChange={(event) => {
                                const header = event.target.value;
                                setDraft(mappings.map((entry) => ({
                                  ...entry,
                                  field_key: entry.source_header === header
                                    ? field.field_key
                                    : entry.field_key === field.field_key ? null : entry.field_key,
                                })));
                                setConfirmReset(false);
                              }}
                            >
                              <option value="">Select Excel column</option>
                              {mappings.map((row) => (
                                <option
                                  key={row.source_header}
                                  value={row.source_header}
                                  disabled={row.field_key != null && row.field_key !== field.field_key}
                                >
                                  {row.source_header}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {missing.length > 0 && <p className="text-sm text-amber-700 dark:text-amber-400">Required fields still to map: {missing.map((field) => field.label).join(", ")}.</p>}
            <p className="text-xs text-muted-foreground">* Required for project imports. Item Name also fills Description. Custom Packing Group is required when that packing type is selected. Each Excel column can be selected once. Unselected columns are ignored.</p>
          </>}
          {!mappings.length && <p className="text-sm text-muted-foreground">No saved mapping is needed to upload a sample workbook. Choose an Excel file to configure its column names.</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {!!query.data?.mappings?.length && <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmReset(true)}>Restore default headers</Button>}
              {draft && <Button type="button" variant="ghost" disabled={busy} onClick={() => { setDraft(null); setFileName(""); setError(""); }}>Discard changes</Button>}
            </div>
            <Button type="button" disabled={busy || !draft || !mappings.length || missing.length > 0} onClick={() => void persist(mappings)}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save header mapping</Button>
          </div>
          {confirmReset && <div className="rounded-lg border bg-muted/30 p-4 space-y-3"><p className="text-sm">Restore standard headers for future imports? Existing project data will stay unchanged.</p><div className="flex gap-2"><Button type="button" size="sm" disabled={busy} onClick={() => void persist([])}>Restore defaults</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirmReset(false)}>Keep mapping</Button></div></div>}
          <p className="text-xs text-muted-foreground">Header mappings are saved separately from vendor details and apply to future project uploads.</p>
        </>
      </div>
    </section>
  );
}
