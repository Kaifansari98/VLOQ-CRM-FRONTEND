"use client";
import { useState } from "react";
import { Check, ChevronDown, ClipboardList, Minus, Pencil } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import EditFMRequirementsModal from "./EditFMRequirementsModal";
import { useQuery } from "@tanstack/react-query";
import {
  getFMLead,
  type FMUpload,
  type FMResponse,
} from "@/api/fm-requirements";
import {
  allFields,
  canEditFMValues,
  type FMAnswers,
  type FMField,
  type FMValue,
} from "@/lib/fm-requirements";
import { Button } from "@/components/ui/button";
import { ImageComponent } from "@/components/utils/ImageCard";
import DocumentCard from "@/components/utils/documentCard";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const isFilled = (value: FMValue | undefined) =>
  value !== undefined &&
  value !== "" &&
  (!Array.isArray(value) || value.length > 0);

const hasAnswers = (fields: FMField[], answers: FMAnswers) =>
  allFields(fields).some(
    // Standard-role uploads are already listed in the tab's photo/document sections.
    (field) =>
      field.type !== "group" && !field.purpose && isFilled(answers[field.key]),
  );

const isImage = (file: FMUpload) => file.mime_type.startsWith("image/");

function Files({
  ids,
  uploads,
}: {
  ids: string[];
  uploads: Record<string, FMUpload>;
}) {
  const files = ids.map((id) => uploads[id]).filter(Boolean);
  if (!files.length)
    return <p className="text-sm text-muted-foreground">File unavailable</p>;
  return (
    <div className="grid gap-3 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
      {files.map((file, index) =>
        isImage(file) ? (
          <ImageComponent
            key={file.id}
            doc={{
              id: file.id,
              doc_og_name: file.original_name,
              signedUrl: file.url,
              created_at: file.created_at,
            }}
            index={index}
          />
        ) : (
          <DocumentCard
            key={file.id}
            doc={{
              // Only used for deletion, which is not offered here.
              id: index,
              originalName: file.original_name,
              signedUrl: file.url,
              created_at: file.created_at,
            }}
            alwaysShowText
          />
        ),
      )}
    </div>
  );
}

function YesNo({ value }: { value: FMValue }) {
  const yes = value === "yes";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        yes
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-muted/40 text-muted-foreground",
      )}
    >
      {yes ? <Check size={12} /> : <Minus size={12} />}
      {yes ? "Yes" : "No"}
    </span>
  );
}

function Answers({
  fields,
  answers,
  uploads,
}: {
  fields: FMField[];
  answers: FMAnswers;
  uploads: Record<string, FMUpload>;
}) {
  return (
    <dl className="grid items-start gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((field) => {
        const value = answers[field.key];
        if (field.purpose) return null;
        if (field.type === "group" || field.type === "tab") {
          if (!hasAnswers(field.fields ?? [], answers)) return null;
          return (
            <section
              key={field.key}
              className="col-span-full space-y-4 rounded-lg border bg-muted/10 p-4"
            >
              <h4 className="border-b pb-3 text-sm font-semibold">
                {field.label}
              </h4>
              <Answers
                fields={field.fields ?? []}
                answers={answers}
                uploads={uploads}
              />
            </section>
          );
        }
        if (!isFilled(value)) return null;
        const option = field.options?.find((option) => option.key === value);
        const followUps =
          option && hasAnswers(option.fields, answers) ? option.fields : null;
        const wide =
          field.type === "upload" ||
          field.type === "observations" ||
          !!followUps;
        return (
          <div
            key={field.key}
            className={cn("min-w-0 space-y-1.5", wide && "col-span-full")}
          >
            <dt className="text-xs font-medium text-muted-foreground">
              {field.label}
            </dt>
            <dd className="text-sm">
              {field.type === "observations" ? (
                <ol className="space-y-2">
                  {(value as { title: string; remark: string }[]).map(
                    (row, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-lg border bg-background p-3"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-medium">{row.title}</p>
                          <p className="whitespace-pre-wrap text-muted-foreground">
                            {row.remark}
                          </p>
                        </div>
                      </li>
                    ),
                  )}
                </ol>
              ) : field.type === "upload" ? (
                <Files ids={value as string[]} uploads={uploads} />
              ) : field.type === "yes_no" ? (
                <YesNo value={value} />
              ) : (
                <p className="whitespace-pre-wrap break-words font-medium">
                  {option?.label ?? String(value)}
                </p>
              )}
            </dd>
            {followUps && (
              <div className="mt-3 border-l-2 border-primary/30 pl-4">
                <Answers
                  fields={followUps}
                  answers={answers}
                  uploads={uploads}
                />
              </div>
            )}
          </div>
        );
      })}
    </dl>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center gap-3 border-b px-5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/20 text-muted-foreground">
        <ClipboardList size={17} />
      </span>
      <div>
        <h3 className="text-sm font-semibold">FM Requirements</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Recorded site details and observations
        </p>
      </div>
    </div>
  );
}

export default function FMRequirementsSummary({
  vendorId,
  leadId,
}: {
  vendorId: number;
  leadId: number;
}) {
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const canEdit = canEditFMValues(userType);
  const [editing, setEditing] = useState<
    (FMResponse & { reloadKey?: number }) | null
  >(null);
  const query = useQuery({
    queryKey: ["fm-requirement-lead", vendorId, leadId],
    queryFn: ({ signal }) => getFMLead(vendorId, leadId, signal),
    enabled: !!vendorId && !!leadId,
    refetchOnWindowFocus: false,
  });
  if (query.isLoading)
    return (
      <section className="overflow-hidden rounded-xl border bg-background">
        <SectionHeader />
        <div className="space-y-3 p-5" role="status" aria-label="Loading">
          <div className="h-12 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-24 animate-pulse rounded-lg bg-muted/30" />
        </div>
      </section>
    );
  if (query.isError && !query.data)
    return (
      <section className="overflow-hidden rounded-xl border bg-background">
        <SectionHeader />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
          <p className="text-muted-foreground">
            Could not load saved FM Requirements.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      </section>
    );
  if (!query.data?.responses.length)
    return (
      <section className="overflow-hidden rounded-xl border bg-background">
        <SectionHeader />
        <p className="p-5 text-sm text-muted-foreground">
          No checklist values have been saved for this lead yet.
        </p>
      </section>
    );
  const uploads = Object.fromEntries(
    query.data.uploads.map((file) => [file.id, file]),
  );
  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-background">
        <SectionHeader />
        <div className="space-y-3 p-4 sm:p-5">
          {query.data.responses.map((response) => (
            <details
              open
              key={response.product_type_id}
              className="group/product overflow-hidden rounded-xl border"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {response.productType?.type ?? "Product type"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        response.is_complete
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                      )}
                    >
                      {response.is_complete ? "Submitted" : "Draft"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Last updated {formatDate(response.updated_at)}
                  </span>
                </span>
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={query.isFetching}
                    aria-label={`Edit ${response.productType?.type ?? "product"} FM values`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setEditing(response);
                    }}
                  >
                    <Pencil size={13} />
                    Edit
                  </Button>
                )}
                <ChevronDown
                  size={17}
                  className="shrink-0 text-muted-foreground transition-transform group-open/product:rotate-180"
                />
              </summary>
              <div className="border-t p-4 sm:p-5">
                {hasAnswers(response.field_snapshot, response.answers) ? (
                  <Answers
                    fields={response.field_snapshot}
                    answers={response.answers}
                    uploads={uploads}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No values recorded for this product yet.
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
      {canEdit && editing && (
        <EditFMRequirementsModal
          key={`${leadId}:${editing.product_type_id}:${editing.updated_at}:${editing.reloadKey ?? 0}`}
          vendorId={vendorId}
          leadId={leadId}
          response={editing}
          onClose={() => setEditing(null)}
          onReload={async () => {
            const result = await query.refetch();
            const latest = result.data?.responses.find(
              (response) =>
                response.product_type_id === editing.product_type_id,
            );
            if (result.isSuccess && latest)
              setEditing({
                ...latest,
                reloadKey: (editing.reloadKey ?? 0) + 1,
              });
          }}
        />
      )}
    </>
  );
}
