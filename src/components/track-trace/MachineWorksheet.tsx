"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { isAxiosError } from "axios";
import { Loader2, Plus, Sheet, Trash2 } from "lucide-react";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { machineCostDescriptionsKey, useMachineCostDescriptions, type MachineCostDescription, type MachineCostSheet } from "@/hooks/track-trace-hooks/useMachineCostDescriptions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toastManager } from "@/components/ui/toast";
import { evaluateSheet, referencedCells, toDisplayFormula, toStoredFormula, validateFormula, type CellValue, type WorkbookSheet } from "@/lib/sheet-formula";

// A value cell holds one of: `amount` (a number), `formula` (stored with row-code references, "=[code]*2")
// or `text` (e.g. "300x300", "NA"); the other two are "". `percent` is the cell's display format, like an
// Excel % format: the stored fraction 0.05 shows as 5%.
type CostRow = { id: number; code?: string; description: string; amount: string; formula: string; text: string; percent: boolean };

// Display-only Indian digit grouping (20,00,000.50); the raw amount is what gets saved
const formatAmountForDisplay = (amount: string) => {
  if (!amount) return "";
  const [integer, fraction] = amount.split(".");
  const grouped = Number(integer || 0).toLocaleString("en-IN");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
};
const formatComputedValue = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const formatNumber = (value: number, percent: boolean) => (percent ? `${formatComputedValue(value * 100)}%` : formatComputedValue(value));
// Amounts are kept to 6 decimals so percentages stored as fractions (12.5% = 0.125) stay exact; "2000000.00" -> "2000000".
const normalizeAmount = (value: number | string) => String(Number(Number(value).toFixed(6)));

// Every sheet behaves the same: rows of description + value, where any value can be a number, text or formula
// (totals are ordinary formula rows). Formulas can reference cells on any sheet.
const SHEETS: { sheet: MachineCostSheet; title: string }[] = [
  { sheet: "MACHINE_COST", title: "Machine Cost" },
  { sheet: "MACHINE_ELECTRICALS", title: "Machine Electricals" },
  { sheet: "MACHINE_MAINTENANCE", title: "Machine Maintenance" },
  { sheet: "MACHINE_CAPACITY", title: "Machine Capacity" },
  { sheet: "MACHINE_TOOL_GLUE", title: "Machine Tool / Glue" },
  { sheet: "MACHINE_LABOUR", title: "Machine Labour" },
  { sheet: "GENERAL_DATA", title: "General Data" },
  { sheet: "PROCESS_COST", title: "Process Cost" },
];

// Unsaved rows need ids that are unique across all sheets because the whole workbook is evaluated together.
let nextTempId = -1;

const isFormulaText = (text: string) => text.trimStart().startsWith("=");
// A reference can be inserted right after "=", an operator, "(", "," or ":" - the same places Excel allows.
const canInsertReference = (text: string) => /[=+\-*/^(,:]\s*$/.test(text);

const toRow = ({ id, code, description, amount, formula, text_value, value_format }: MachineCostDescription): CostRow => ({
  id,
  code,
  description,
  amount: amount === null ? "" : normalizeAmount(amount),
  formula: formula ?? "",
  text: text_value ?? "",
  percent: value_format === "percent",
});
const savedKeyOf = (amount: string | null, formula: string | null, text: string | null, format: string | null, description: string) => JSON.stringify([amount, formula, text, format, description.trim()]);

// What the cell shows when not being edited: the value, a formula's result, or an Excel-style error.
const displayValue = (row: CostRow, computed: CellValue | undefined) =>
  row.formula
    ? computed?.error ?? formatNumber(computed?.value ?? 0, row.percent)
    : row.text || (row.amount ? (row.percent ? formatNumber(Number(row.amount), true) : formatAmountForDisplay(row.amount)) : "");

// What the user edits: the formula (with positional references), the text, or the number (percent cells as "5%").
const editableText = (row: CostRow, workbook: WorkbookSheet[], sheetIndex: number) =>
  row.formula
    ? toDisplayFormula(row.formula, workbook, sheetIndex)
    : row.text || (row.amount && row.percent ? `${normalizeAmount(Number(row.amount) * 100)}%` : row.amount);

// "=..." is a formula; a number (commas allowed) is an amount; anything else is text. A trailing "%", or a
// number typed into a percent-formatted cell, means hundredths like Excel ("5%" -> 0.05) and keeps the % format.
const classifyValue = (row: CostRow, text: string, workbook: WorkbookSheet[], sheetIndex: number): CostRow => {
  if (text.startsWith("=")) return { ...row, formula: toStoredFormula(text, workbook, sheetIndex), amount: "", text: "" };
  const typedPercent = /%\s*$/.test(text);
  const numeric = text.replace(/,/g, "").replace(/\s*%\s*$/, "");
  if (numeric === "") return { ...row, formula: "", amount: "", text: "", percent: false };
  if (/^(\d{1,14}(\.\d*)?|\.\d+)$/.test(numeric)) {
    const percent = typedPercent || row.percent;
    return { ...row, formula: "", text: "", percent, amount: normalizeAmount(percent ? Number(numeric) / 100 : Number(numeric)) };
  }
  return { ...row, formula: "", amount: "", text: text.slice(0, 255), percent: false };
};

type EditState = { sheet: MachineCostSheet; rowId: number; text: string };
// Excel "point mode": while typing a formula, arrows/clicks insert a reference (on this or another sheet) that the
// next arrow/click moves. `start` is where that reference begins in the draft; it always runs to the end of the text.
type PointState = { sheet: MachineCostSheet; index: number; start: number };
// Each sheet owns its rows and saving; the workbook calls into it to commit or cancel an edit made from anywhere.
type SheetApi = { commit: (rowId: number, text: string) => void; cancel: (rowId: number) => void; markDirty: (rowId: number) => void };

type WorkbookController = {
  sheetIndexOf: (sheet: MachineCostSheet) => number;
  readOnly: boolean;
  workbook: WorkbookSheet[];
  cellValues: Map<number, CellValue>;
  editing: EditState | null;
  pointing: PointState | null;
  references: Map<MachineCostSheet, Set<number>>;
  reportRows: (sheet: MachineCostSheet, rows: CostRow[]) => void;
  registerApi: (sheet: MachineCostSheet, api: SheetApi | null) => void;
  startEditing: (sheet: MachineCostSheet, row: CostRow) => void;
  changeEditing: (text: string) => void;
  pointAt: (sheet: MachineCostSheet, index: number) => boolean;
  handleCellBlur: (event: FocusEvent<HTMLInputElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  cellInputRefs: RefObject<Map<number, HTMLInputElement>>;
  cellRefs: RefObject<Map<number, HTMLDivElement>>;
};
const WorkbookContext = createContext<WorkbookController | null>(null);
const useWorkbook = () => {
  const controller = useContext(WorkbookContext);
  if (!controller) throw new Error("useWorkbook must be used inside MachineWorksheet");
  return controller;
};

function SheetTabs({ active, onChange, onTabMouseDown, sheets, onRename, onCreate }: { onCreate?: () => void; sheets: typeof SHEETS; onRename?: (sheet: MachineCostSheet) => void; active: MachineCostSheet; onChange: (sheet: MachineCostSheet) => void; onTabMouseDown: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <div role="tablist" aria-label="Sheets" className="flex overflow-x-auto">
      {sheets.map(({ sheet, title }) => {
        const isActive = sheet === active;
        return (
          // Excel-style sheet tabs: the active one is attached to the grid above (overlaps the border) with a green label
          <ContextMenu key={sheet}>
          <ContextMenuTrigger asChild disabled={!onRename}>
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onMouseDown={onTabMouseDown}
            onClick={() => onChange(sheet)}
            className={`shrink-0 border-r px-4 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${isActive ? "-mt-px bg-background font-semibold text-[#217346] dark:text-[#4fbf7f]" : "font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground"}`}
          >
            {title}
          </button>
          </ContextMenuTrigger>
          {onRename && <ContextMenuContent><ContextMenuItem onSelect={() => onRename(sheet)}>Rename</ContextMenuItem></ContextMenuContent>}
          </ContextMenu>
        );
      })}
      {onCreate && <button type="button" aria-label="Add sheet" title="Add sheet" onClick={onCreate} className="flex shrink-0 items-center justify-center border-r px-3 py-1.5 text-muted-foreground hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"><Plus className="size-4" /></button>}
    </div>
  );
}

function SheetFrame({ title, action, tabs, children }: { title: string; action?: ReactNode; tabs: ReactNode; children: ReactNode }) {
  return (
    <section className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border bg-background" aria-label={`${title} worksheet`}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Sheet className="size-4 text-primary" /> {title}</div>
        {action}
      </div>
      {children}
      <div className="mt-auto flex shrink-0 flex-wrap items-start justify-between gap-2 border-t bg-muted/40 pr-4 text-xs text-muted-foreground">
        {tabs}
      </div>
    </section>
  );
}

const cellClass = "h-full min-h-8 w-full min-w-0 border-0 bg-transparent px-3 py-1.5 text-sm leading-5 outline-none focus:bg-primary/5 focus:ring-2 focus:ring-inset focus:ring-primary";
const noReferences = new Set<number>();

function CostSheet({ sheet, title, descriptions, vendorId, machineId, tabs }: { sheet: MachineCostSheet; title: string; descriptions: MachineCostDescription[]; vendorId: number; machineId: string; tabs: ReactNode }) {
  const wb = useWorkbook();
  const { reportRows, registerApi } = wb;
  const sheetIndex = wb.sheetIndexOf(sheet);
  const queryKey = machineCostDescriptionsKey(vendorId, machineId, sheet);
  const queryClient = useQueryClient();
  const [saveStates, setSaveStates] = useState<Record<number, { status: "saving" | "saved" | "error" | "dirty"; message?: string }>>({});
  // What the server last stored per row, so unchanged cells aren't re-saved.
  const savedValues = useRef(new Map(descriptions.map((row) => [row.id, savedKeyOf(row.amount === null ? null : normalizeAmount(row.amount), row.formula ?? null, row.text_value ?? null, row.value_format ?? null, row.description)])));
  const persistedIds = useRef(new Map(descriptions.map((row) => [row.id, row.id])));
  const draftKeys = useRef(new Map<number, string>());
  const queues = useRef(new Map<number, Promise<void>>());
  const versions = useRef(new Map<number, number>());
  const [rows, setRows] = useState<CostRow[]>(() => descriptions.map(toRow));
  // The workbook evaluates and references every sheet's rows, so keep it in sync with this sheet's latest rows.
  useEffect(() => {
    reportRows(sheet, rows);
  }, [reportRows, sheet, rows]);
  // This sheet's rows as they are right now (the workbook's copy can lag a render behind).
  const workbook = useMemo(() => wb.workbook.map((item, index) => (index === sheetIndex ? { ...item, rows } : item)), [wb.workbook, sheetIndex, rows]);
  const references = wb.references.get(sheet) ?? noReferences;

  const updateDescription = (id: number, description: string) => {
    if (wb.readOnly) return;
    markDirty(id);
    setRows((current) => current.map((row) => row.id === id ? { ...row, description } : row));
  };
  const markDirty = (rowId: number) => {
    if (wb.readOnly) return;
    versions.current.set(rowId, (versions.current.get(rowId) ?? 0) + 1);
    setSaveStates((current) => ({ ...current, [rowId]: { status: "dirty" } }));
  };
  const commitValue = (rowId: number, text: string) => {
    if (wb.readOnly) return;
    const row = rows.find((item) => item.id === rowId);
    if (!row) return;
    const updated = classifyValue(row, text, workbook, sheetIndex);
    setRows((current) => current.map((item) => item.id === rowId ? updated : item));
    saveValue(updated);
  };
  const cancelValue = (rowId: number) => {
    // Escape: drop the draft and keep the cell as it was, like Excel.
    versions.current.set(rowId, (versions.current.get(rowId) ?? 0) + 1);
    setSaveStates((current) => {
      const { [rowId]: _discarded, ...rest } = current;
      return rest;
    });
  };
  const apiRef = useRef<SheetApi | null>(null);
  apiRef.current = { commit: commitValue, cancel: cancelValue, markDirty };
  useEffect(() => {
    registerApi(sheet, {
      commit: (rowId, text) => apiRef.current?.commit(rowId, text),
      cancel: (rowId) => apiRef.current?.cancel(rowId),
      markDirty: (rowId) => apiRef.current?.markDirty(rowId),
    });
    return () => registerApi(sheet, null);
  }, [registerApi, sheet]);

  const saveValue = (row: CostRow) => {
    if (wb.readOnly) return;
    const formula = row.formula || null;
    const textValue = formula ? null : row.text || null;
    const amount = formula || textValue || row.amount === "" ? null : normalizeAmount(row.amount);
    const valueFormat: MachineCostDescription["value_format"] = row.percent ? "percent" : null;
    const savedKey = savedKeyOf(amount, formula, textValue, valueFormat, row.description);
    const version = versions.current.get(row.id) ?? 0;
    const report = (status: "saving" | "saved" | "error", message?: string) => {
      if ((versions.current.get(row.id) ?? 0) === version) {
        setSaveStates((current) => ({ ...current, [row.id]: { status, message } }));
      }
    };
    // Don't store a formula that can't be parsed; the cell shows #ERROR! until it is fixed.
    if (formula && validateFormula(formula)) {
      report("error", "This formula isn't valid. Check it and try again.");
      return;
    }
    // Serialize saves per row so a slower earlier request cannot overwrite a later blur.
    const pending = (queues.current.get(row.id) ?? Promise.resolve()).then(async () => {
      if (savedValues.current.has(row.id) && savedValues.current.get(row.id) === savedKey) {
        report("saved");
        return;
      }
      report("saving");
      try {
        const id = persistedIds.current.get(row.id);
        const url = `/track-trace-master/machines/${encodeURIComponent(machineId)}/cost-descriptions`;
        if (!id && !draftKeys.current.has(row.id)) draftKeys.current.set(row.id, crypto.randomUUID());
        const body = { amount, formula, text_value: textValue, value_format: valueFormat, description: row.description.trim() };
        const response = id
          ? await apiClient.patch<{ data: { id: number; amount: string | null } }>(`${url}/${id}/amount`, body)
          : await apiClient.post<{ data: MachineCostDescription }>(url, { ...body, draft_key: draftKeys.current.get(row.id), sheet });
        persistedIds.current.set(row.id, response.data.data.id);
        savedValues.current.set(row.id, savedKey);
        queryClient.setQueryData<MachineCostDescription[]>(queryKey, (current) => {
          if (!current) return current;
          return id
            ? current.map((item) => item.id === id ? { ...item, ...body } : item)
            : [...current.filter((item) => item.id !== response.data.data.id), response.data.data as MachineCostDescription];
        });
        report("saved");
      } catch (error) {
        report("error", isAxiosError(error) ? error.response?.data?.message || "Could not save. Please retry." : "Could not save. Please retry.");
      }
    });
    queues.current.set(row.id, pending);
  };
  const [pendingDelete, setPendingDelete] = useState<CostRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const removeRowLocally = (rowId: number, persistedId?: number) => {
    setRows((current) => current.filter((item) => item.id !== rowId));
    [savedValues, persistedIds, draftKeys, queues, versions].forEach((ref) => ref.current.delete(rowId));
    if (persistedId) {
      queryClient.setQueryData<MachineCostDescription[]>(queryKey, (current) =>
        current?.filter((item) => item.id !== persistedId));
    }
  };
  const requestDelete = (row: CostRow) => {
    if (wb.readOnly) return;
    // Rows never saved to the server (and with no save in flight) only exist on screen.
    if (!persistedIds.current.has(row.id) && !queues.current.has(row.id)) {
      removeRowLocally(row.id);
      return;
    }
    setPendingDelete(row);
  };
  const confirmDelete = async () => {
    if (wb.readOnly) return;
    if (!pendingDelete) return;
    const row = pendingDelete;
    setIsDeleting(true);
    try {
      // Let any in-flight save finish first so a just-created row is known and gets deleted too.
      await queues.current.get(row.id);
      const persistedId = persistedIds.current.get(row.id);
      if (persistedId) {
        try {
          await apiClient.delete(`/track-trace-master/machines/${encodeURIComponent(machineId)}/cost-descriptions/${persistedId}`);
        } catch (error) {
          // Already gone on the server is the outcome we wanted.
          if (!(isAxiosError(error) && error.response?.status === 404)) throw error;
        }
      }
      removeRowLocally(row.id, persistedId);
      toastManager.add({ title: "Row deleted", description: `"${row.description || "Untitled row"}" was removed from this machine's ${title} sheet.`, type: "success" });
      setPendingDelete(null);
    } catch (error) {
      toastManager.add({
        title: "Row not deleted",
        description: isAxiosError(error) ? error.response?.data?.message || "Could not delete this row. Please try again." : "Could not delete this row. Please try again.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SheetFrame
      title={title}
      tabs={tabs}
      action={!wb.readOnly && <Button size="sm" variant="outline" onClick={() => {
        const id = nextTempId--;
        // The server names custom rows "custom_<draft key>", so the code is known before the first save.
        const draftKey = crypto.randomUUID();
        draftKeys.current.set(id, draftKey);
        setRows((current) => [...current, { id, code: `custom_${draftKey}`, description: "", amount: "", formula: "", text: "", percent: false }]);
      }}><Plus className="size-4" /> Add row</Button>}
    >
      {/* Rows scroll inside the sheet; column headers stick to the top. */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-h-full min-w-[540px] flex-col" role="table" aria-label={`${wb.readOnly ? "Read-only" : "Editable"} ${title}`}>
          <div className="sticky top-0 z-30 bg-background">
            <div role="row" className="grid grid-cols-[48px_minmax(260px,1fr)_180px_44px] divide-x border-b bg-muted/60 text-center font-mono text-xs text-muted-foreground">
              {["", "A", "B", ""].map((label, index) => <div role="columnheader" key={index} className="py-1.5">{label}</div>)}
            </div>
            <div role="row" className="grid grid-cols-[48px_minmax(260px,1fr)_180px_44px] divide-x border-b bg-muted/30 text-xs font-semibold">
              {["#", "Description", "Value", ""].map((label, index) => <div role="columnheader" key={index} className="px-3 py-2">{label}</div>)}
            </div>
          </div>
          <div>
          {rows.map((row, index) => {
            const isEditing = wb.editing?.sheet === sheet && wb.editing.rowId === row.id;
            const draft = isEditing ? wb.editing!.text : "";
            const isFormulaDraft = isEditing && isFormulaText(draft);
            const computed = wb.cellValues.get(row.id);
            const formulaDisplay = row.formula ? toDisplayFormula(row.formula, workbook, sheetIndex) : "";
            const isPointed = wb.pointing?.sheet === sheet && wb.pointing.index === index;
            return (
            <div role="row" key={row.id} className="grid grid-cols-[48px_minmax(260px,1fr)_180px_44px] divide-x border-b last:border-b-0">
              <div role="rowheader" className="flex items-center justify-center bg-muted/30 font-mono text-xs text-muted-foreground">{index + 1}</div>
              <div role="cell" className="relative min-w-0">
                {/* Mirror the text so the row grows and shrinks with wrapping, edits, and viewport width. */}
                <div aria-hidden="true" className="invisible min-h-8 whitespace-pre-wrap px-3 py-1.5 text-sm leading-5 [overflow-wrap:anywhere]">{`${row.description || (index === 0 ? "Enter a description" : "")} `}</div>
                <textarea readOnly={wb.readOnly} rows={1} aria-label={`Description, row ${index + 1}`} className={`${cellClass} absolute inset-0 block resize-none overflow-hidden whitespace-pre-wrap [overflow-wrap:anywhere]`} value={row.description} onChange={(event) => updateDescription(row.id, event.target.value)} onBlur={(event) => saveValue({ ...row, description: event.currentTarget.value })} maxLength={2000} placeholder={index === 0 ? "Enter a description" : ""} />
              </div>
              <div
                role="cell"
                ref={(element) => {
                  if (element) wb.cellRefs.current.set(row.id, element);
                  else wb.cellRefs.current.delete(row.id);
                }}
                // Cells referenced by the formula being typed (on any sheet) get a dashed outline, like Excel's reference boxes.
                className={`flex flex-col ${references.has(index) ? `outline-2 -outline-offset-2 outline-dashed outline-blue-500 ${isPointed ? "bg-blue-500/15" : "bg-blue-500/5"}` : ""}`}
                onMouseDown={(event) => {
                  // Clicking another cell while typing a formula inserts its reference instead of moving focus.
                  if (wb.editing && !isEditing && wb.pointAt(sheet, index)) event.preventDefault();
                }}
              >
                <div className="relative">
                  {/* Formula cells are marked fx; focusing shows the formula, otherwise its result (or an Excel-style error) */}
                  {row.formula && !isEditing && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2 flex items-center font-mono text-[10px] italic text-muted-foreground">fx</span>}
                  <input
                    aria-label={`Value, row ${index + 1}${row.percent ? " (%)" : ""}${formulaDisplay && !isEditing ? `, formula ${formulaDisplay}` : ""}`}
                    aria-invalid={saveStates[row.id]?.status === "error" || !!computed?.error}
                    aria-describedby={`amount-status-${row.id}`}
                    readOnly={wb.readOnly}
                    inputMode="text"
                    spellCheck={false}
                    title={formulaDisplay && !isEditing ? formulaDisplay : undefined}
                    // Values (numbers and text) are right-aligned; only a formula being typed is left-aligned for readability.
                    className={`${cellClass} tabular-nums ${isFormulaDraft ? "text-left font-mono" : "text-right"} ${!isEditing && computed?.error ? "font-bold text-destructive" : ""}`}
                    value={isEditing ? draft : displayValue(row, computed)}
                    onChange={(event) => wb.changeEditing(event.target.value)}
                    onFocus={() => wb.startEditing(sheet, row)}
                    onBlur={wb.handleCellBlur}
                    onKeyDown={wb.handleKeyDown}
                    ref={(element) => {
                      if (element) wb.cellInputRefs.current.set(row.id, element);
                      else wb.cellInputRefs.current.delete(row.id);
                    }}
                    placeholder={row.percent ? "0%" : "0.00"}
                  />
                </div>
                <div id={`amount-status-${row.id}`} role="status" className="px-3 text-right text-[10px] text-muted-foreground">
                  {saveStates[row.id]?.status === "saving" && "Saving…"}
                  {saveStates[row.id]?.status === "saved" && "Saved"}
                  {saveStates[row.id]?.status === "dirty" && "Unsaved"}
                  {saveStates[row.id]?.status === "error" && <span className="text-destructive">{saveStates[row.id].message} <button type="button" className="underline" onClick={() => saveValue(row)}>Retry</button></span>}
                </div>
              </div>
              <div role="cell" className="flex items-center justify-center">{!wb.readOnly && <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" aria-label={`Delete row ${index + 1}`} onClick={() => requestDelete(row)}><Trash2 className="size-3.5" /></Button>}</div>
            </div>
            );
          })}
          </div>
          {/* Fills the space below the rows with blank Excel-style gridlines (one line per 32px row height) */}
          <div aria-hidden="true" className="grid flex-1 grid-cols-[48px_minmax(260px,1fr)_180px_44px] divide-x border-t bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_32px,var(--border)_32px,var(--border)_33px)]">
            <div className="bg-muted/30" />
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !isDeleting) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this row?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.description || "Untitled row"}&quot; will be permanently removed from this machine&apos;s {title} sheet. Other machines are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={(event) => { event.preventDefault(); confirmDelete(); }}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SheetFrame>
  );
}

function SheetPanel({ sheet, title, vendorId, machineId, tabs }: { sheet: MachineCostSheet; title: string; vendorId: number; machineId: string; tabs: ReactNode }) {
  const descriptions = useMachineCostDescriptions(vendorId, machineId, true, sheet);
  if (descriptions.isPending) {
    return (
      <SheetFrame title={title} tabs={tabs}>
        <div role="status" className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading {title.toLowerCase()}…</div>
      </SheetFrame>
    );
  }
  if (descriptions.isError) {
    return (
      <SheetFrame title={title} tabs={tabs}>
        <div role="alert" className="space-y-3 p-6"><p>Unable to load {title.toLowerCase()}.</p><Button variant="outline" onClick={() => descriptions.refetch()}>Try again</Button></div>
      </SheetFrame>
    );
  }
  return <CostSheet key={`${vendorId}-${machineId}-${sheet}`} sheet={sheet} title={title} descriptions={descriptions.data} vendorId={vendorId} machineId={machineId} tabs={tabs} />;
}

export function MachineWorksheet({ vendorId, machineId, readOnly = false }: { vendorId: number; machineId: string; readOnly?: boolean }) {
  const [activeSheet, setActiveSheet] = useState<MachineCostSheet>("MACHINE_COST");
  const queryClient = useQueryClient();
  const namesKey = ["machine-cost-sheet-names", vendorId, machineId];
  const namesQuery = useQuery({
    queryKey: namesKey,
    queryFn: async () => (await apiClient.get<{ data: Partial<Record<MachineCostSheet, string>> }>(`/track-trace-master/machines/${encodeURIComponent(machineId)}/cost-sheet-names`)).data.data,
  });
  const sheets = useMemo(() => [
    ...SHEETS.map((item) => ({ ...item, title: namesQuery.data?.[item.sheet] ?? item.title })),
    ...Object.entries(namesQuery.data ?? {}).filter(([key]) => key.startsWith("CUSTOM_")).sort(([a], [b]) => a.localeCompare(b)).map(([sheet, title]) => ({ sheet: sheet as MachineCostSheet, title: title! })),
  ], [namesQuery.data]);
  const sheetIndexOf = useCallback((sheet: MachineCostSheet) => sheets.findIndex((item) => item.sheet === sheet), [sheets]);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [renaming, setRenaming] = useState<MachineCostSheet | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [renameError, setRenameError] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const saveSheetName = async () => {
    if (readOnly || (!renaming && !creatingSheet) || isRenaming) return;
    const name = sheetName.trim();
    if (!name || name.length > 60 || /[\[\]\r\n\t]/.test(name)) {
      setRenameError("Enter a name of 1–60 characters without brackets or line breaks.");
      return;
    }
    if (sheets.some((item) => item.sheet !== renaming && item.title.toLowerCase() === name.toLowerCase())) {
      setRenameError("Another sheet already uses this name.");
      return;
    }
    setIsRenaming(true);
    setRenameError("");
    try {
      const sheet: MachineCostSheet = creatingSheet ? `CUSTOM_${Date.now()}_${crypto.randomUUID()}` : renaming!;
      const response = await apiClient.request<{ data: Partial<Record<MachineCostSheet, string>> }>({
        method: creatingSheet ? "POST" : "PATCH",
        url: `/track-trace-master/machines/${encodeURIComponent(machineId)}/cost-sheet-names`,
        data: { sheet, name },
      });
      queryClient.setQueryData(namesKey, response.data.data);
      if (creatingSheet) setActiveSheet(sheet);
      setCreatingSheet(false);
      setRenaming(null);
    } catch (error) {
      setRenameError(isAxiosError(error) ? error.response?.data?.message || "Could not save this sheet name. Please retry." : "Could not save this sheet name. Please retry.");
    } finally {
      setIsRenaming(false);
    }
  };

  const [rowsBySheet, setRowsBySheet] = useState<Partial<Record<MachineCostSheet, CostRow[]>>>({});
  // The edit in progress lives here (not in a sheet) so a formula started on one sheet can pick cells on another.
  const [editing, setEditingState] = useState<EditState | null>(null);
  const [pointing, setPointingState] = useState<PointState | null>(null);
  // Refs mirror that state so handlers fired back-to-back (e.g. Enter then blur) see the latest values.
  const editingRef = useRef<EditState | null>(null);
  const pointingRef = useRef<PointState | null>(null);
  const setEditing = (value: EditState | null) => {
    editingRef.current = value;
    setEditingState(value);
  };
  const setPointing = (value: PointState | null) => {
    pointingRef.current = value;
    setPointingState(value);
  };
  // The cell shown in the name box / formula bar when nothing is being edited.
  const [selected, setSelected] = useState<{ sheet: MachineCostSheet; rowId: number } | null>(null);
  const apis = useRef(new Map<MachineCostSheet, SheetApi>());
  const cellInputRefs = useRef(new Map<number, HTMLInputElement>());
  const cellRefs = useRef(new Map<number, HTMLDivElement>());
  const formulaBarRef = useRef<HTMLInputElement>(null);

  const reportRows = useCallback((sheet: MachineCostSheet, rows: CostRow[]) => {
    setRowsBySheet((current) => (current[sheet] === rows ? current : { ...current, [sheet]: rows }));
  }, []);
  const registerApi = useCallback((sheet: MachineCostSheet, api: SheetApi | null) => {
    if (api) apis.current.set(sheet, api);
    else apis.current.delete(sheet);
  }, []);

  const workbook = useMemo<WorkbookSheet[]>(() => sheets.map(({ sheet, title }) => ({ title, rows: rowsBySheet[sheet] ?? [] })), [rowsBySheet, sheets]);
  // One evaluation across all sheets so cross-sheet references (e.g. "Machine Cost.B11") stay live.
  const cellValues = useMemo(
    () => evaluateSheet(sheets.flatMap(({ sheet }) => (rowsBySheet[sheet] ?? []).map((row) => ({ ...row, group: sheet })))),
    [rowsBySheet, sheets],
  );
  const references = useMemo(() => {
    const bySheet = new Map<MachineCostSheet, Set<number>>();
    if (!editing || !isFormulaText(editing.text)) return bySheet;
    for (const { sheetIndex, rowIndex } of referencedCells(editing.text, workbook, sheetIndexOf(editing.sheet))) {
      const key = sheets[sheetIndex].sheet;
      if (!bySheet.has(key)) bySheet.set(key, new Set());
      bySheet.get(key)!.add(rowIndex);
    }
    return bySheet;
  }, [editing, workbook, sheets, sheetIndexOf]);

  const startEditing = (sheet: MachineCostSheet, row: CostRow) => {
    setSelected({ sheet, rowId: row.id });
    if (readOnly) return;
    if (editingRef.current?.sheet === sheet && editingRef.current.rowId === row.id) return;
    setEditing({ sheet, rowId: row.id, text: editableText(row, workbook, sheetIndexOf(sheet)) });
    setPointing(null);
  };
  const changeEditing = (text: string) => {
    if (readOnly) return;
    const current = editingRef.current;
    if (!current || text.length > 500) return;
    apis.current.get(current.sheet)?.markDirty(current.rowId);
    setEditing({ ...current, text });
    setPointing(null);
  };
  const finishEditing = (commit: boolean) => {
    if (readOnly) return;
    const current = editingRef.current;
    if (!current) return;
    setEditing(null);
    setPointing(null);
    const api = apis.current.get(current.sheet);
    if (commit) api?.commit(current.rowId, current.text.trim());
    else api?.cancel(current.rowId);
    // Like Excel, finishing a formula while looking at another sheet returns to the sheet being edited.
    setActiveSheet(current.sheet);
  };
  const pointAt = (sheet: MachineCostSheet, targetIndex: number) => {
    if (readOnly) return false;
    const current = editingRef.current;
    const point = pointingRef.current;
    if (!current || !isFormulaText(current.text) || (!point && !canInsertReference(current.text))) return false;
    const rows = rowsBySheet[sheet] ?? [];
    if (!rows.length) return false;
    const index = Math.min(Math.max(targetIndex, 0), rows.length - 1);
    // Replace the reference inserted by the previous arrow/click, otherwise append a new one.
    const base = point ? current.text.slice(0, point.start) : current.text;
    const reference = sheet === current.sheet ? `B${index + 1}` : `${sheets[sheetIndexOf(sheet)].title}.B${index + 1}`;
    apis.current.get(current.sheet)?.markDirty(current.rowId);
    setEditing({ ...current, text: `${base}${reference}` });
    setPointing({ sheet, index, start: base.length });
    // Keep the picked cell visible when arrowing past the edge of the scroll area.
    const rowId = rows[index].id;
    requestAnimationFrame(() => cellRefs.current.get(rowId)?.scrollIntoView({ block: "nearest" }));
    return true;
  };
  const inPointMode = () => {
    const current = editingRef.current;
    return !!current && isFormulaText(current.text) && (!!pointingRef.current || canInsertReference(current.text));
  };
  const switchSheet = (sheet: MachineCostSheet) => {
    // Mid-formula, switching sheets is for picking a cell there (the formula bar keeps the draft); otherwise commit first.
    if (editingRef.current && !inPointMode()) finishEditing(true);
    setActiveSheet(sheet);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const current = editingRef.current;
    if (!current) return;
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      finishEditing(event.key === "Enter");
      event.currentTarget.blur();
    } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && isFormulaText(current.text)) {
      // Point mode only when the caret is at the end, so arrows still work normally mid-text.
      const input = event.currentTarget;
      if (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length) return;
      const step = event.key === "ArrowUp" ? -1 : 1;
      const rows = rowsBySheet[activeSheet] ?? [];
      const point = pointingRef.current;
      // Start from the last picked cell, else the cell being edited, else the edge of the other sheet.
      const from = point && point.sheet === activeSheet
        ? point.index
        : activeSheet === current.sheet ? rows.findIndex((row) => row.id === current.rowId) : step > 0 ? -1 : rows.length;
      if (pointAt(activeSheet, from + step)) event.preventDefault();
    }
  };
  const handleCellBlur = (event: FocusEvent<HTMLInputElement>) => {
    // Moving into the formula bar keeps editing the same cell; anything else commits, like Excel.
    if (!editingRef.current || event.relatedTarget === formulaBarRef.current) return;
    finishEditing(true);
  };
  const handleBarBlur = (event: FocusEvent<HTMLInputElement>) => {
    const current = editingRef.current;
    if (!current || event.relatedTarget === cellInputRefs.current.get(current.rowId)) return;
    finishEditing(true);
  };

  // Keep typing focus where the edit is: the cell on its own sheet, or the formula bar while on another sheet.
  useEffect(() => {
    if (!editing) return;
    const bar = formulaBarRef.current;
    const cell = cellInputRefs.current.get(editing.rowId);
    const target = activeSheet !== editing.sheet || document.activeElement === bar ? bar : cell;
    if (!target) return;
    if (document.activeElement !== target) target.focus();
    if (pointing) target.setSelectionRange(editing.text.length, editing.text.length);
  }, [editing, pointing, activeSheet]);

  const nameBoxCell = editing ?? selected;
  const nameBoxRows = nameBoxCell ? rowsBySheet[nameBoxCell.sheet] ?? [] : [];
  const nameBoxIndex = nameBoxCell ? nameBoxRows.findIndex((row) => row.id === nameBoxCell.rowId) : -1;
  const selectedRow = !editing && nameBoxIndex >= 0 ? nameBoxRows[nameBoxIndex] : undefined;
  const barValue = editing ? editing.text : selectedRow && nameBoxCell ? editableText(selectedRow, workbook, sheetIndexOf(nameBoxCell.sheet)) : "";

  const controller: WorkbookController = {
    sheetIndexOf,
    readOnly,
    workbook,
    cellValues,
    editing,
    pointing,
    references,
    reportRows,
    registerApi,
    startEditing,
    changeEditing,
    pointAt,
    handleCellBlur,
    handleKeyDown,
    cellInputRefs,
    cellRefs,
  };
  const tabs = <SheetTabs sheets={sheets} onCreate={readOnly ? undefined : () => {
    finishEditing(true);
    setRenaming(null);
    setCreatingSheet(true);
    setSheetName("");
    setRenameError("");
  }} onRename={readOnly ? undefined : (sheet) => {
    finishEditing(true);
    setCreatingSheet(false);
    setRenaming(sheet);
    setSheetName(sheets[sheetIndexOf(sheet)].title);
    setRenameError("");
  }} active={activeSheet} onChange={switchSheet} onTabMouseDown={(event) => { if (inPointMode()) event.preventDefault(); }} />;

  if (namesQuery.isPending) return <div role="status" className="p-6 text-sm text-muted-foreground">Loading worksheet names…</div>;
  if (namesQuery.isError) return <div role="alert" className="space-y-3 rounded-xl border p-6"><p>Unable to load worksheet names.</p><Button variant="outline" onClick={() => namesQuery.refetch()}>Try again</Button></div>;

  return (
    <WorkbookContext.Provider value={controller}>
      {/* Excel-style name box + formula bar: shows the selected cell's formula, and holds the draft while picking cells on another sheet */}
      <div className="flex shrink-0 items-stretch overflow-hidden rounded-xl border bg-background text-sm">
        <div aria-label="Selected cell" className="flex w-48 shrink-0 items-center truncate border-r bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
          {nameBoxCell && nameBoxIndex >= 0 ? `${sheets[sheetIndexOf(nameBoxCell.sheet)].title}.B${nameBoxIndex + 1}` : "—"}
        </div>
        <span aria-hidden="true" className="flex items-center border-r px-3 font-mono text-xs italic text-muted-foreground">fx</span>
        <input
          ref={formulaBarRef}
          aria-label="Formula bar"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:bg-primary/5"
          value={barValue}
          readOnly={readOnly || (!editing && !selectedRow)}
          placeholder="Select a cell to see its value or formula"
          onFocus={() => {
            if (!editingRef.current && selectedRow && nameBoxCell) startEditing(nameBoxCell.sheet, selectedRow);
          }}
          onChange={(event) => changeEditing(event.target.value)}
          onBlur={handleBarBlur}
          onKeyDown={handleKeyDown}
        />
      </div>
      {/* Keep every sheet mounted so switching tabs never drops in-progress edits or saves. */}
      {sheets.map(({ sheet, title }) => (
        <div key={sheet} className={sheet === activeSheet ? "min-h-0 flex-1" : "hidden"}>
          <SheetPanel sheet={sheet} title={title} vendorId={vendorId} machineId={machineId} tabs={tabs} />
        </div>
      ))}
      <Dialog open={renaming !== null || creatingSheet} onOpenChange={(open) => { if (!open && !isRenaming) { setRenaming(null); setCreatingSheet(false); } }}>
        <DialogContent>
          <form onSubmit={(event) => { event.preventDefault(); void saveSheetName(); }} className="space-y-4">
            <DialogHeader><DialogTitle>{creatingSheet ? "Create sheet" : "Rename sheet"}</DialogTitle><DialogDescription>Choose a name for this workstation’s sheet.</DialogDescription></DialogHeader>
            <div className="space-y-2">
              <label htmlFor="mcp-sheet-name" className="text-sm font-medium">Sheet name</label>
              <Input id="mcp-sheet-name" value={sheetName} onChange={(event) => setSheetName(event.target.value)} maxLength={60} disabled={isRenaming} autoFocus aria-invalid={!!renameError} aria-describedby={renameError ? "mcp-rename-error" : undefined} />
              {renameError && <p id="mcp-rename-error" role="alert" className="text-sm text-destructive">{renameError}</p>}
            </div>
            <DialogFooter><Button type="button" variant="outline" disabled={isRenaming} onClick={() => { setRenaming(null); setCreatingSheet(false); }}>Cancel</Button><Button type="submit" disabled={isRenaming}>{isRenaming ? "Saving…" : creatingSheet ? "Create sheet" : "Rename"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkbookContext.Provider>
  );
}

