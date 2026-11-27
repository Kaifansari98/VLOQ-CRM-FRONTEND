"use client";

import { useId, useState } from "react";
import { Check, CheckCircle2, ChevronDown, FileText, ImageIcon, Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { answerError, isOtherAnswer, OTHER_ANSWER_MAX_LENGTH, OTHER_OPTION_LABEL, walkinFieldId } from "@/lib/walkin-lead-questions";
import type { WalkinQuestion, WalkinQuestionnaire } from "@/types/walkin-lead-questions";
import type { WalkinQuestionsModel } from "@/hooks/useWalkinLeadQuestions";

const defaultMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

function QuestionField({ form, question: q, index, model, disabled }: {
  form: WalkinQuestionnaire; question: WalkinQuestion; index: number; model: WalkinQuestionsModel; disabled: boolean;
}) {
  const uniqueId = useId();
  const [dragging, setDragging] = useState(false);
  const [otherPicked, setOtherPicked] = useState(false);
  const fieldId = walkinFieldId(form, q);
  const value = model.getAnswer(form, q);
  const error = model.errors[fieldId];
  const busy = model.uploading[fieldId];
  const selected = Array.isArray(value) ? value : [];
  const errorId = `${uniqueId}-error`;
  const labelId = `${uniqueId}-label`;
  const inputId = `${uniqueId}-input`;
  const helpId = `${uniqueId}-help`;
  const isChoice = q.type === "single_select" || q.type === "multi_select";
  const allowOther = q.type === "single_select" && !!q.allow_other;
  const otherActive = allowOther && (otherPicked || isOtherAnswer(q, value));
  const choices = [...q.options.map(option => ({ option, other: false })), ...(allowOther ? [{ option: OTHER_OPTION_LABEL, other: true }] : [])];
  const maxFiles = q.max_files ?? 5;
  const maxMb = Math.floor((q.max_file_size_bytes ?? 10485760) / 1048576);
  const receiveFiles = (files: File[]) => {
    if (!disabled && !busy) void model.uploadFiles(form, q, files);
  };

  return (
    <div id={fieldId} className={cn("flex gap-3 px-4 py-4 sm:px-5", error && "bg-destructive/5")}>
      <span aria-hidden="true" className="mt-0.5 flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
        Q{index + 1}
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <label id={labelId} htmlFor={!isChoice ? inputId : undefined} className="block text-sm font-medium leading-6">
          {q.label}
          {q.required
            ? <span className="ml-1 text-destructive" aria-label="required">*</span>
            : <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>}
          {q.type === "multi_select" && <span className="ml-1.5 text-xs font-normal text-muted-foreground">· Select all that apply</span>}
        </label>

        {isChoice && (
          <div role={q.type === "single_select" ? "radiogroup" : "group"} aria-labelledby={labelId} aria-describedby={error ? errorId : undefined} aria-invalid={!!error} className="flex flex-wrap gap-2">
            {choices.map(({ option, other }) => {
              const checked = other ? otherActive : q.type === "single_select" ? !otherActive && value === option : selected.includes(option);
              return (
                <label
                  key={other ? "__other__" : option}
                  className={cn(
                    "relative inline-flex max-w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] leading-5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-1",
                    checked ? "border-primary bg-primary/5 font-medium text-primary" : "border-border bg-background text-foreground/80 hover:border-primary/40 hover:bg-muted/40",
                    disabled && "pointer-events-none opacity-60",
                  )}
                >
                  <input
                    type={q.type === "single_select" ? "radio" : "checkbox"}
                    name={`${uniqueId}-choice`}
                    value={other ? "__other__" : option}
                    checked={checked}
                    disabled={disabled}
                    className="sr-only"
                    onChange={() => {
                      setOtherPicked(other);
                      // Picking Others clears the answer until the custom text is typed.
                      model.setAnswer(form, q, other ? "" : q.type === "single_select" ? option : checked ? selected.filter(v => v !== option) : [...selected, option]);
                    }}
                  />
                  <span aria-hidden="true" className={cn("flex size-3.5 shrink-0 items-center justify-center border", q.type === "single_select" ? "rounded-full" : "rounded", checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                    {checked && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  {option}
                </label>
              );
            })}
          </div>
        )}

        {otherActive && (
          <Input
            autoFocus={otherPicked}
            aria-label={`${q.label} — ${OTHER_OPTION_LABEL}`}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={typeof value === "string" ? value : ""}
            onChange={event => model.setAnswer(form, q, event.target.value)}
            placeholder="Please specify"
            maxLength={OTHER_ANSWER_MAX_LENGTH}
            disabled={disabled}
            className="h-10 max-w-md shadow-none"
          />
        )}

        {q.type === "text" && (
          <Textarea
            id={inputId}
            aria-required={q.required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={typeof value === "string" ? value : ""}
            onChange={event => model.setAnswer(form, q, event.target.value)}
            placeholder="Type the customer's answer"
            maxLength={5000}
            rows={2}
            disabled={disabled}
            className="min-h-16 resize-y text-sm shadow-none"
          />
        )}

        {q.type === "number" && (
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            aria-required={q.required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            min={q.min}
            step={q.integer ? 1 : "any"}
            value={typeof value === "number" ? value : ""}
            onChange={event => model.setAnswer(form, q, event.target.value === "" ? "" : Number(event.target.value))}
            placeholder="Enter a number"
            disabled={disabled}
            className="h-10 max-w-xs shadow-none"
          />
        )}

        {q.type === "file" && (
          <div className="space-y-2.5">
            <div
              onDragOver={event => { event.preventDefault(); if (!disabled && !busy) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={event => { event.preventDefault(); setDragging(false); receiveFiles(Array.from(event.dataTransfer.files)); }}
              className={cn(
                "relative flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30",
                (disabled || busy) && "opacity-60",
              )}
            >
              <input
                id={inputId}
                type="file"
                multiple
                accept={(q.accepted_mime_types ?? defaultMimeTypes).join(",")}
                disabled={disabled || busy}
                aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
                aria-invalid={!!error}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                onChange={event => { receiveFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }}
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{busy ? "Uploading…" : "Drop files here or click to browse"}</p>
                <p id={helpId} className="text-xs text-muted-foreground">Images or PDF · Up to {maxFiles} files · {maxMb} MB each</p>
              </div>
            </div>
            {selected.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {selected.map(id => {
                  const file = model.uploads[id];
                  const Icon = file?.mime_type.startsWith("image/") ? ImageIcon : FileText;
                  return (
                    <li key={id} className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <a href={file?.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-medium hover:underline" title={file?.original_name}>
                        {file?.original_name ?? "Reference file"}
                      </a>
                      <button
                        type="button"
                        aria-label={`Remove ${file?.original_name ?? "reference file"}`}
                        disabled={disabled || busy}
                        onClick={() => model.setAnswer(form, q, selected.filter(v => v !== id))}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {error && <p id={errorId} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    </div>
  );
}

export default function WalkinLeadQuestions({ model, disabled = false }: { model: WalkinQuestionsModel; disabled?: boolean }) {
  if (!model.enabled) return null;
  const total = model.forms.reduce((sum, form) => sum + form.questions.length, 0);
  const completed = (form: WalkinQuestionnaire) => form.questions.filter(q => {
    const value = model.getAnswer(form, q);
    return value !== undefined && (typeof value !== "string" || !!value.trim()) && (!Array.isArray(value) || value.length > 0) && !answerError(q, value);
  }).length;
  const answered = model.forms.reduce((sum, form) => sum + completed(form), 0);
  const complete = total > 0 && answered === total;
  const showCount = !!total && !model.isLoading && !model.loadError;

  return (
    <section id="walkin-questions" aria-labelledby="walkin-questions-title" className="mb-3 overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h3 id="walkin-questions-title" className="text-sm font-semibold">Walk-in Questions</h3>
          <p className="text-xs text-muted-foreground">Ask the customer and record their answers.</p>
        </div>
        {showCount && (
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium tabular-nums", complete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {complete && <CheckCircle2 className="size-3.5" />}
            {answered} of {total} answered
          </span>
        )}
      </div>

      {model.notice && (
        <p role="alert" className="mx-4 mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 sm:mx-5 dark:text-amber-200">
          {model.notice}
        </p>
      )}

      {!model.hasFurniture ? (
        <p className="px-4 py-5 text-sm text-muted-foreground sm:px-5">Select a furniture type above to see its questions.</p>
      ) : model.isLoading ? (
        <div role="status" className="space-y-3 px-4 py-5 sm:px-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading questions…</p>
          {[1, 2, 3].map(n => <div key={n} className="h-12 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : model.loadError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-5">
          <p className="text-sm text-destructive">We couldn’t load the questions. Try again before saving.</p>
          <Button type="button" variant="outline" size="sm" onClick={model.retry}><RotateCcw className="size-3.5" />Try again</Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {model.forms.map(form => (
            <details key={`${form.product_type_id}:${form.questionnaire_key}:${form.questionnaire_version}`} open className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-muted/30 px-4 py-2.5 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13px] font-semibold">{form.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{completed(form)}/{form.questions.length}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="divide-y divide-border/70 border-t border-border">
                {form.questions.map((q, index) => <QuestionField key={q.key} form={form} question={q} index={index} model={model} disabled={disabled} />)}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
