"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Check, CheckCircle2, CircleDashed, ClipboardList, FileText, Loader2, Pencil, Sofa, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { cn, getErrorMessage } from "@/lib/utils";
import { answerError } from "@/lib/walkin-lead-questions";
import { fetchWalkinLeadAnswers, updateWalkinLeadAnswer, uploadWalkinReference } from "@/api/walkin-lead-questions";
import type { WalkinAnswer, WalkinLeadResponse, WalkinQuestion, WalkinUpload } from "@/types/walkin-lead-questions";

const isAnswered = (value: WalkinAnswer | undefined) =>
  value !== undefined && value !== "" && !(Array.isArray(value) && !value.length);
const answeredCount = (response: WalkinLeadResponse) =>
  response.question_snapshot.filter(q => isAnswered(response.answers[q.key])).length;

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
      <Check className="size-3 shrink-0" strokeWidth={3} />
      <span className="truncate">{children}</span>
    </span>
  );
}

function FileTile({ file }: { file?: WalkinUpload }) {
  if (!file) {
    return (
      <div className="flex h-full min-h-24 items-center justify-center rounded-xl border border-dashed border-border px-3 text-center text-xs text-muted-foreground">
        Reference file unavailable
      </div>
    );
  }
  const isImage = file.mime_type.startsWith("image/");
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      title={file.original_name}
      className="group/file block overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/40">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt={file.original_name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover/file:scale-105" />
        ) : (
          <FileText className="size-8 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{file.original_name}</p>
          <p className="text-[11px] text-muted-foreground">
            {isImage ? "Image" : "PDF"} · {(file.size_bytes / 1048576).toFixed(file.size_bytes < 1048576 ? 2 : 1)} MB
          </p>
        </div>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition group-hover/file:text-primary" />
      </div>
    </a>
  );
}

function AnswerValue({ question, value, files }: {
  question: WalkinQuestion; value: WalkinAnswer | undefined; files: Map<string, WalkinUpload>;
}) {
  if (!isAnswered(value)) return <p className="text-sm italic text-muted-foreground">Not answered</p>;
  if (question.type === "file" && Array.isArray(value)) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map(id => <FileTile key={id} file={files.get(id)} />)}
      </div>
    );
  }
  if (Array.isArray(value)) {
    return <div className="flex flex-wrap gap-1.5">{value.map(item => <Chip key={item}>{item}</Chip>)}</div>;
  }
  if (question.type === "single_select") return <Chip>{value}</Chip>;
  if (question.type === "number") return <p className="text-sm tabular-nums leading-6 text-foreground/90">{value}</p>;
  return <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-foreground/90">{value}</p>;
}

const defaultMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

function AnswerEditor({ question, value, onChange, files, onUploaded, vendorId, disabled, onError }: {
  question: WalkinQuestion; value: WalkinAnswer | undefined; onChange: (value: WalkinAnswer | undefined) => void;
  files: Map<string, WalkinUpload>; onUploaded: (file: WalkinUpload) => void; vendorId: number;
  disabled: boolean; onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const selected = Array.isArray(value) ? value : [];
  if (question.type === "text") {
    return <Textarea autoFocus aria-label={question.label} value={typeof value === "string" ? value : ""} onChange={event => onChange(event.target.value)} maxLength={5000} rows={3} disabled={disabled} className="min-h-24 resize-y text-sm shadow-none" />;
  }
  if (question.type === "number") {
    return <Input autoFocus type="number" inputMode="numeric" aria-label={question.label} min={question.min} step={question.integer ? 1 : "any"} value={typeof value === "number" ? value : ""} onChange={event => onChange(event.target.value === "" ? undefined : Number(event.target.value))} disabled={disabled} className="h-10 max-w-xs shadow-none" />;
  }
  if (question.type === "single_select" || question.type === "multi_select") {
    const single = question.type === "single_select";
    return (
      <div role={single ? "radiogroup" : "group"} aria-label={question.label} className="flex flex-wrap gap-2">
        {question.options.map(option => {
          const checked = single ? value === option : selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              role={single ? "radio" : "checkbox"}
              aria-checked={checked}
              disabled={disabled}
              onClick={() => onChange(single ? option : checked ? selected.filter(v => v !== option) : [...selected, option])}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                checked ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span aria-hidden="true" className={cn("flex size-3.5 shrink-0 items-center justify-center border", single ? "rounded-full" : "rounded", checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5" strokeWidth={3} />}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    );
  }
  const max = question.max_files ?? 5;
  const maxBytes = question.max_file_size_bytes ?? 10485760;
  const types = question.accepted_mime_types ?? defaultMimeTypes;
  const addFiles = async (picked: File[]) => {
    if (!picked.length) return;
    if (selected.length + picked.length > max) return onError(`Choose up to ${max} reference files.`);
    if (picked.some(file => !types.includes(file.type) || file.size > maxBytes)) {
      return onError(`Use an accepted image or PDF, up to ${Math.floor(maxBytes / 1048576)} MB per file.`);
    }
    setUploading(true);
    const next = [...selected];
    try {
      for (const file of picked) {
        const uploaded = await uploadWalkinReference(vendorId, file);
        onUploaded(uploaded);
        next.push(uploaded.id);
        onChange([...next]);
      }
    } catch (error) {
      onError(getErrorMessage(error) || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {selected.map(id => {
            const file = files.get(id);
            return (
              <li key={id} className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-2">
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium" title={file?.original_name}>{file?.original_name ?? "Reference file"}</span>
                <button type="button" aria-label={`Remove ${file?.original_name ?? "reference file"}`} disabled={disabled || uploading} onClick={() => onChange(selected.filter(v => v !== id))} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50">
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <label className={cn("relative inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/10 has-focus-visible:ring-2 has-focus-visible:ring-ring", (disabled || uploading || selected.length >= max) && "pointer-events-none opacity-60")}>
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        {uploading ? "Uploading…" : "Add reference file"}
        <input type="file" multiple accept={types.join(",")} disabled={disabled || uploading || selected.length >= max} className="sr-only" onChange={event => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      </label>
      <p className="text-[11px] text-muted-foreground">Images or PDF · Up to {max} files · {Math.floor(maxBytes / 1048576)} MB each</p>
    </div>
  );
}

function QuestionRow({ question, index, response, files, vendorId, leadId, canEdit, isDraft }: {
  question: WalkinQuestion; index: number; response: WalkinLeadResponse; files: Map<string, WalkinUpload>;
  vendorId: number; leadId: number; canEdit: boolean; isDraft: boolean;
}) {
  const queryClient = useQueryClient();
  const saved = response.answers[question.key];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WalkinAnswer | undefined>(saved);
  const [error, setError] = useState("");
  // Files uploaded during this edit are not in the fetched attachments yet.
  const [newFiles, setNewFiles] = useState<Record<string, WalkinUpload>>({});
  const mutation = useMutation({
    mutationFn: (value: WalkinAnswer | null) => updateWalkinLeadAnswer(vendorId, leadId, response.product_type_id, question.key, value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["walkin-lead-answers", leadId, vendorId] });
      setEditing(false);
      toastManager.add({ title: "Answer updated", type: "success" });
    },
    onError: (err: unknown) => setError(getErrorMessage(err) || "Could not save the answer. Please try again."),
  });
  const startEditing = () => { setDraft(saved); setError(""); setEditing(true); };
  const save = () => {
    const value = typeof draft === "string" ? draft.trim() : draft;
    const problem = answerError(question, value, isDraft);
    if (problem) return setError(problem);
    mutation.mutate(isAnswered(value) ? value! : null);
  };
  const editorFiles = new Map([...files, ...Object.entries(newFiles)]);

  return (
    <div className="space-y-3 px-5 py-4 sm:px-6">
      <dt className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          Q{index + 1}
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold leading-6 text-heading dark:text-neutral-200">{question.label}</span>
        {canEdit && !editing && (
          <Button type="button" variant="ghost" size="icon" aria-label={`Edit answer: ${question.label}`} onClick={startEditing} className="-my-1 size-8 shrink-0 text-muted-foreground hover:text-foreground">
            <Pencil className="size-3.5" />
          </Button>
        )}
      </dt>
      <dd className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
          A
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          {editing ? (
            <div className="space-y-3">
              <AnswerEditor
                question={question}
                value={draft}
                onChange={value => { setDraft(value); setError(""); }}
                files={editorFiles}
                onUploaded={file => setNewFiles(previous => ({ ...previous, [file.id]: file }))}
                vendorId={vendorId}
                disabled={mutation.isPending}
                onError={setError}
              />
              {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={save} disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                  {mutation.isPending ? "Saving…" : "Save"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={mutation.isPending}>Cancel</Button>
              </div>
            </div>
          ) : (
            <AnswerValue question={question} value={saved} files={files} />
          )}
        </div>
      </dd>
    </div>
  );
}

function StatusBadge({ complete }: { complete: boolean }) {
  const Icon = complete ? CheckCircle2 : CircleDashed;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
      complete
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    )}>
      <Icon className="size-3.5" />
      {complete ? "Complete" : "Incomplete"}
    </span>
  );
}

export default function WalkinLeadAnswers({ vendorId, leadId, enabled, canEdit = false, isDraft = false }: {
  vendorId?: number; leadId: number; enabled: boolean; canEdit?: boolean; isDraft?: boolean;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ["walkin-lead-answers", leadId, vendorId],
    queryFn: ({ signal }) => fetchWalkinLeadAnswers(vendorId!, leadId, signal),
    enabled: enabled && !!vendorId && !!leadId,
    refetchOnWindowFocus: false,
    retry: false,
  });
  // Leads without saved answers (or without access to them) show nothing.
  if (!data?.responses.length) return null;

  const files = new Map(data.attachments.map(file => [file.id, file]));
  const active = data.responses.find(r => r.id === activeId) ?? data.responses[0];
  const questions = [...active.question_snapshot].sort((a, b) => a.sort_order - b.sort_order);
  const allComplete = data.responses.every(r => r.is_complete);

  return (
    <section aria-labelledby="walkin-answers-title" className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft dark:bg-[#0a0a0a]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 id="walkin-answers-title" className="text-lg font-semibold tracking-tight">Walk-in Questions</h1>
            <p className="text-xs text-gray-500">Customer preferences captured when this walk-in lead was created.</p>
          </div>
        </div>
        <StatusBadge complete={allComplete} />
      </div>

      {data.responses.length > 1 && (
      <div role="tablist" aria-label="Furniture types" className="flex gap-2 overflow-x-auto border-b border-border bg-muted/20 px-5 py-3">
          {data.responses.map(response => {
            const selected = response.id === active.id;
            return (
              <button
                key={response.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(response.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Sofa className="size-3.5" />
                {response.productType?.type ?? "Furniture"}
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tabular-nums", selected ? "bg-primary-foreground/20" : "bg-muted")}>
                  {answeredCount(response)}/{response.question_snapshot.length}
                </span>
              </button>
            );
          })}
      </div>
      )}

      <dl role={data.responses.length > 1 ? "tabpanel" : undefined} className="divide-y divide-border">
        {questions.map((question, index) => (
          <QuestionRow
            key={`${active.id}:${question.key}`}
            question={question}
            index={index}
            response={active}
            files={files}
            vendorId={vendorId!}
            leadId={leadId}
            canEdit={canEdit}
            isDraft={isDraft}
          />
        ))}
      </dl>
    </section>
  );
}
