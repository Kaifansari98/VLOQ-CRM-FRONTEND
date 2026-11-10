"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import {
  type FMAnswers,
  type FMField,
  type FMQuestionnaire,
  type FMValue,
  acceptedTypes,
  visibleFields,
  allFields,
} from "@/lib/fm-requirements";
import type { FMRequirementsModel } from "@/hooks/useFMRequirements";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";
import { FileUploadField } from "@/components/custom/file-upload";
import { cn } from "@/lib/utils";

const MAX_FILES = 20;
const MAX_SIZE_MB = 25;

const isFilled = (value: FMValue | undefined) =>
  value !== undefined &&
  value !== "" &&
  (!Array.isArray(value) || value.length > 0);

// Required fields currently shown for the selected answers (hidden branches are skipped).
function requiredProgress(fields: FMField[], answers: FMAnswers) {
  const required = visibleFields(fields, answers).filter(
    (field) => field.required && field.type !== "group" && field.type !== "tab",
  );
  return {
    done: required.filter((field) => isFilled(answers[field.key])).length,
    total: required.length,
  };
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function FieldLabel({ field, htmlFor }: { field: FMField; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium leading-5">
      {field.label}
      {field.required && <span className="ml-0.5 text-destructive">*</span>}
    </Label>
  );
}

function YesNoField({
  value,
  disabled,
  onChange,
}: {
  value: FMValue | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup">
      {[
        { key: "yes", label: "Yes" },
        { key: "no", label: "No" },
      ].map((option) => {
        const selected = value === option.key;
        return (
          <Button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            variant={selected ? "default" : "outline"}
            disabled={disabled}
            className={cn("h-9", !selected && "bg-background")}
            onClick={() => onChange(selected ? "" : option.key)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function UploadField({
  field,
  form,
  model,
  disabled,
}: {
  field: FMField;
  form: FMQuestionnaire;
  model: FMRequirementsModel;
  disabled: boolean;
}) {
  const value = model.getAnswers(form)[field.key];
  const ids = Array.isArray(value) ? (value as string[]) : [];
  const busy = !!model.uploading[`${form.product_type_id}:${field.key}`];
  // Files picked but not yet stored on the server; cleared once the upload settles.
  const [pending, setPending] = React.useState<File[]>([]);
  const remaining = MAX_FILES - ids.length;
  return (
    <div className="space-y-3">
      <FileUploadField
        value={pending}
        onChange={(files) => {
          // FileUpload reports the same selection more than once; only upload unseen files.
          const added = files.filter((file) => !pending.includes(file));
          if (!added.length || busy) return;
          setPending(added);
          void model
            .uploadFiles(form, field, added)
            .finally(() => setPending([]));
        }}
        accept={acceptedTypes(field).join(",")}
        multiple
        maxFiles={Math.max(remaining, 1)}
        maxSizeMB={MAX_SIZE_MB}
        disabled={disabled || busy || remaining <= 0}
      />
      {busy && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={13} className="animate-spin" />
          Uploading {pending.length || ""} file{pending.length === 1 ? "" : "s"}
          …
        </p>
      )}
      {ids.length > 0 && (
        <ul className="space-y-2">
          {ids.map((fileId) => {
            const file = model.uploads[fileId];
            const isImage = file?.mime_type.startsWith("image/");
            return (
              <li
                key={fileId}
                className="flex items-center gap-2.5 rounded-md border bg-background p-2.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted/30">
                  {isImage && file?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileText size={16} className="text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {file?.original_name ?? "Saved file"}
                  </span>
                  {file && (
                    <span className="block text-xs text-muted-foreground">
                      {formatSize(file.size_bytes)}
                    </span>
                  )}
                </span>
                {file?.url && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0 text-muted-foreground"
                    aria-label={`Open ${file.original_name}`}
                    asChild
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={disabled || busy}
                  aria-label={`Remove ${file?.original_name ?? "file"}`}
                  onClick={() =>
                    model.setAnswer(
                      form,
                      field,
                      ids.filter((id) => id !== fileId),
                    )
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        {ids.length} of {MAX_FILES} files attached
      </p>
    </div>
  );
}

function ObservationsField({
  field,
  form,
  model,
  disabled,
  id,
}: {
  field: FMField;
  form: FMQuestionnaire;
  model: FMRequirementsModel;
  disabled: boolean;
  id: string;
}) {
  const value = model.getAnswers(form)[field.key];
  const rows = Array.isArray(value)
    ? (value as { title: string; remark: string }[])
    : [];
  const update = (index: number, patch: Partial<(typeof rows)[number]>) =>
    model.setAnswer(
      form,
      field,
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div
          key={index}
          className="space-y-3 rounded-lg border bg-background p-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <Input
              id={`${id}-${index}-title`}
              aria-label={`Observation ${index + 1} title`}
              maxLength={200}
              disabled={disabled}
              value={row.title}
              placeholder="Title, e.g. Plumbing clearance"
              onChange={(event) => update(index, { title: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              aria-label={`Remove observation ${index + 1}`}
              onClick={() =>
                model.setAnswer(
                  form,
                  field,
                  rows.filter((_, i) => i !== index),
                )
              }
            >
              <Trash2 size={14} />
            </Button>
          </div>
          <TextAreaInput
            value={row.remark}
            maxLength={5000}
            disabled={disabled}
            placeholder="Describe what needs attention…"
            onChange={(remark) => update(index, { remark })}
          />
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full border-dashed bg-background"
        disabled={disabled || rows.length >= 50}
        onClick={() =>
          model.setAnswer(form, field, [...rows, { title: "", remark: "" }])
        }
      >
        <Plus size={14} />
        {rows.length ? "Add another observation" : "Add observation"}
      </Button>
    </div>
  );
}

function Fields({
  fields,
  form,
  model,
  disabled,
  depth = 0,
}: {
  fields: FMField[];
  form: FMQuestionnaire;
  model: FMRequirementsModel;
  disabled: boolean;
  depth?: number;
}) {
  const answers = model.getAnswers(form);
  return (
    <div
      className={cn(
        "grid items-start gap-x-5 gap-y-5",
        depth < 2 && "md:grid-cols-2",
      )}
    >
      {fields.map((field) => {
        const value = answers[field.key];
        const id = `fm-${form.product_type_id}-${field.key}`;
        if (field.type === "group" || field.type === "tab") {
          const progress = requiredProgress(field.fields ?? [], answers);
          return (
            <section
              key={field.key}
              className="col-span-full space-y-4 rounded-lg border bg-muted/10 p-4"
            >
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <h4 className="text-sm font-semibold">{field.label}</h4>
                {progress.total > 0 && (
                  <span
                    className={cn(
                      "text-xs tabular-nums text-muted-foreground",
                      progress.done === progress.total && "text-emerald-600",
                    )}
                  >
                    {progress.done}/{progress.total} required
                  </span>
                )}
              </div>
              <Fields
                fields={field.fields ?? []}
                form={form}
                model={model}
                disabled={disabled}
                depth={depth + 1}
              />
            </section>
          );
        }
        if (field.type === "choice" || field.type === "yes_no") {
          const options =
            field.type === "yes_no"
              ? [
                  { key: "yes", label: "Yes", fields: [] },
                  { key: "no", label: "No", fields: [] },
                ]
              : (field.options ?? []);
          const selectedIndex = options.findIndex(
            (option) => option.key === value,
          );
          const selected = options[selectedIndex];
          return (
            <div
              key={field.key}
              className={cn(
                "min-w-0 space-y-2",
                selected?.fields.length && "col-span-full",
              )}
            >
              <FieldLabel field={field} />
              <div
                className={cn(
                  selected?.fields.length && "md:max-w-[calc(50%-10px)]",
                )}
              >
                {field.type === "yes_no" ? (
                  <YesNoField
                    value={value}
                    disabled={disabled}
                    onChange={(next) => model.setAnswer(form, field, next)}
                  />
                ) : (
                  <AssignToPicker
                    data={options.map((option, index) => ({
                      id: index,
                      label: option.label,
                      subLabel: option.fields.length
                        ? `${option.fields.length} follow-up field${option.fields.length === 1 ? "" : "s"}`
                        : undefined,
                    }))}
                    value={selectedIndex >= 0 ? selectedIndex : undefined}
                    onChange={(index) =>
                      model.setAnswer(
                        form,
                        field,
                        index === null ? "" : (options[index]?.key ?? ""),
                      )
                    }
                    placeholder="Search options..."
                    emptyLabel="Select an option"
                    disabled={disabled}
                  />
                )}
              </div>
              {selected?.fields.length ? (
                <div className="animate-in fade-in-0 slide-in-from-top-1 mt-3 space-y-3 border-l-2 border-primary/30 pl-4 duration-200 motion-reduce:animate-none">
                  <p className="text-xs font-medium text-muted-foreground">
                    Because you selected “{selected.label}”
                  </p>
                  <Fields
                    fields={selected.fields}
                    form={form}
                    model={model}
                    disabled={disabled}
                    depth={depth + 1}
                  />
                </div>
              ) : null}
            </div>
          );
        }
        if (field.type === "text")
          return (
            <div key={field.key} className="min-w-0 space-y-2">
              <FieldLabel field={field} />
              <TextAreaInput
                value={typeof value === "string" ? value : ""}
                maxLength={5000}
                disabled={disabled}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                onChange={(next) => model.setAnswer(form, field, next)}
              />
            </div>
          );
        if (field.type === "observations")
          return (
            <div key={field.key} className="col-span-full space-y-2">
              <div>
                <FieldLabel field={field} />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Add any additional site conditions the team should know.
                </p>
              </div>
              <ObservationsField
                field={field}
                form={form}
                model={model}
                disabled={disabled}
                id={id}
              />
            </div>
          );
        return (
          <div key={field.key} className="min-w-0 space-y-2">
            <FieldLabel field={field} />
            <UploadField
              field={field}
              form={form}
              model={model}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}

function ProgressBadge({ done, total }: { done: number; total: number }) {
  if (!total) return null;
  const complete = done === total;
  return (
    <span className="flex items-center gap-2">
      <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
        <span
          className={cn(
            "block h-full rounded-full bg-primary transition-[width]",
            complete && "bg-emerald-500",
          )}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
      <span
        className={cn(
          "flex items-center gap-1 text-xs tabular-nums text-muted-foreground",
          complete && "text-emerald-600",
        )}
      >
        {complete && <CheckCircle2 size={13} />}
        {done}/{total} required
      </span>
    </span>
  );
}

function ProductChecklist({
  form,
  model,
  disabled,
}: {
  form: FMQuestionnaire;
  model: FMRequirementsModel;
  disabled: boolean;
}) {
  const sections = form.fields.filter(
    (field) => field.type === "tab" && field.fields?.length,
  );
  const [selected, setSelected] = React.useState(sections[0]?.key ?? "");
  const active =
    sections.find((section) => section.key === selected)?.key ??
    sections[0]?.key;
  const detailsRef = React.useRef<HTMLDetailsElement>(null);
  const target = model.validationTarget;
  React.useEffect(() => {
    if (!target || target.productTypeId !== form.product_type_id) return;
    const section = form.fields.find(
      (field) =>
        field.type === "tab" &&
        allFields(field.fields ?? []).some(
          (child) => child.key === target.fieldKey,
        ),
    );
    if (section) setSelected(section.key);
    if (detailsRef.current) detailsRef.current.open = true;
    const frame = requestAnimationFrame(() => {
      const panel = detailsRef.current?.querySelector<HTMLElement>(
        '[role="tabpanel"][data-state="active"]',
      );
      const field = target.fieldKey
        ? document.getElementById(
            `fm-${form.product_type_id}-${target.fieldKey}`,
          )
        : null;
      (field ?? panel)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      (field ?? panel)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [target, form.fields, form.product_type_id]);
  const answers = model.getAnswers(form);
  const progress = requiredProgress(form.fields, answers);
  return (
    <details
      open
      ref={detailsRef}
      className="group/product overflow-clip rounded-xl border border-border/80 bg-background shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 bg-muted/15 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
          <ClipboardList size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {form.product_type}
          </span>
          {sections.length > 0 && (
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              {sections.length} {sections.length === 1 ? "section" : "sections"}
            </span>
          )}
        </span>
        <ProgressBadge {...progress} />
        <ChevronDown
          size={17}
          className="shrink-0 text-muted-foreground transition-transform group-open/product:rotate-180"
        />
      </summary>
      {sections.length ? (
        <Tabs
          value={active}
          onValueChange={setSelected}
          className="gap-0 border-t"
        >
          <div className="sticky top-0 z-10 overflow-x-auto border-b bg-background px-3 py-2.5 sm:px-4">
            <TabsList
              aria-label={`${form.product_type} checklist sections`}
              className="h-auto min-w-max justify-start gap-1 bg-transparent p-0"
            >
              {sections.map((section) => {
                const counts = requiredProgress(section.fields ?? [], answers);
                return (
                  <TabsTrigger
                    key={section.key}
                    value={section.key}
                    className="flex-none gap-2 rounded-lg border border-transparent px-3 py-2 text-xs text-muted-foreground shadow-none hover:bg-muted/40 data-[state=active]:border-primary/15 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <span>{section.label}</span>
                    {counts.total > 0 && (
                      <span
                        className={cn(
                          "rounded px-1 text-[10px] tabular-nums text-muted-foreground",
                          counts.done === counts.total && "text-emerald-600",
                        )}
                      >
                        {counts.done}/{counts.total}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          {sections.map((section) => (
            <TabsContent
              key={section.key}
              value={section.key}
              className="m-0 p-4 outline-none sm:p-5"
            >
              <Fields
                fields={section.fields ?? []}
                form={form}
                model={model}
                disabled={disabled}
              />
            </TabsContent>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-b-xl border-t bg-muted/10 px-4 py-3 text-xs sm:px-5">
            <span className="text-muted-foreground">
              Section{" "}
              {sections.findIndex((section) => section.key === active) + 1} of{" "}
              {sections.length}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sections[0]?.key === active}
                onClick={() =>
                  setSelected(
                    sections[
                      sections.findIndex((section) => section.key === active) -
                        1
                    ].key,
                  )
                }
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sections.at(-1)?.key === active}
                onClick={() =>
                  setSelected(
                    sections[
                      sections.findIndex((section) => section.key === active) +
                        1
                    ].key,
                  )
                }
              >
                Next section
              </Button>
            </div>
          </div>
        </Tabs>
      ) : (
        <div className="border-t p-4 sm:p-5">
          <Fields
            fields={form.fields}
            form={form}
            model={model}
            disabled={disabled}
          />
        </div>
      )}
    </details>
  );
}

export default function FMRequirementsForm({
  model,
  disabled = false,
  mode = "capture",
}: {
  model: FMRequirementsModel;
  disabled?: boolean;
  mode?: "capture" | "edit";
}) {
  const busy =
    disabled ||
    model.isUploading ||
    model.isSavingDraft ||
    model.query.isFetching;
  return (
    <section id="fm-requirements" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
            <ClipboardList size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Site Checklist</h3>
            <p className="mt-0.5 max-w-xl text-xs leading-5 text-muted-foreground">
              {mode === "edit"
                ? "Review and update the recorded site details."
                : "Fill in each product’s checklist. Follow-up questions appear based on your answers."}
            </p>
          </div>
        </div>
        {mode === "capture" && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => void model.query.refetch()}
            >
              <RefreshCw
                size={14}
                className={model.query.isFetching ? "animate-spin" : ""}
              />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-primary/15 bg-background text-primary hover:bg-primary/5"
              disabled={busy || !model.forms.length}
              onClick={model.saveDraft}
            >
              {model.isSavingDraft ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save draft
            </Button>
          </div>
        )}
      </div>
      {model.query.isLoading ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border bg-background p-6 text-sm text-muted-foreground"
        >
          <Loader2 size={17} className="animate-spin" />
          Loading checklist…
        </div>
      ) : model.query.isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-sm"
        >
          <p>Unable to load the site checklist.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void model.query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : !model.forms.length ? (
        <p className="rounded-xl border border-dashed bg-background p-5 text-sm text-muted-foreground">
          No checklist has been configured for this lead’s products.
        </p>
      ) : (
        model.forms.map((form) => (
          <ProductChecklist
            key={form.product_type_id}
            form={form}
            model={model}
            disabled={disabled || model.isSavingDraft}
          />
        ))
      )}
      {model.error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {model.error}
        </p>
      )}
    </section>
  );
}
