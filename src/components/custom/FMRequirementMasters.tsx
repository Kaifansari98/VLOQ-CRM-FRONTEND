"use client";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { useProductTypes } from "@/hooks/useTypesMaster";
import { getFMMaster, saveFMMaster } from "@/api/fm-requirements";
import {
  allFields,
  type FMField,
  type FMFieldType,
  type FMQuestionnaire,
  validateFields,
} from "@/lib/fm-requirements";
import FMRequirementTabsEditor from "./FMRequirementTabsEditor";
import { fmTabs, moveFMTabField } from "@/lib/fm-requirement-tabs";
import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableItem,
  SortableItemHandle,
} from "@/components/reui/sortable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/utils";

const typeLabels: Record<FMFieldType, string> = {
  tab: "Tab section",
  text: "Text Box",
  yes_no: "Yes / No",
  choice: "Choice with follow-up fields",
  group: "Section / Group",
  upload: "Upload Files",
  observations: "Multiple Title & Remark",
};
let nextKey = 0;
const key = () => `field_${Date.now().toString(36)}_${++nextKey}`;
function newField(type: FMFieldType = "text"): FMField {
  return {
    key: key(),
    label: "New field",
    type,
    required: false,
    ...(type === "group" ? { fields: [] } : {}),
    ...(type === "upload" ? { upload_kind: "media" as const } : {}),
    ...(type === "choice"
      ? {
          options: [
            { key: "yes", label: "Yes", fields: [] },
            { key: "no", label: "No", fields: [] },
          ],
        }
      : {}),
  };
}
function FieldEditor({
  fields,
  onChange,
  depth = 0,
  disabled = false,
  managedSorting = false,
  tabChoices = [],
  tabKey,
  onMoveTab,
}: {
  fields: FMField[];
  onChange: (fields: FMField[]) => void;
  depth?: number;
  disabled?: boolean;
  managedSorting?: boolean;
  tabChoices?: { key: string; label: string }[];
  tabKey?: string;
  onMoveTab?: (fieldKey: string, targetKey: string) => void;
}) {
  const update = (index: number, field: FMField) =>
    onChange(fields.map((current, i) => (i === index ? field : current)));
  const items = fields.map((field, index) => (
    <SortableItem
      key={field.key}
      value={field.key}
      disabled={disabled}
      dragOnCard
      className="relative"
    >
      <SortableItemHandle
        render={<button type="button" disabled={disabled} />}
        aria-label={`Drag to reorder ${field.label || "field"}`}
        className="absolute left-2 top-3 z-10 flex size-5 touch-none items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
      >
        <GripVertical className="h-4 w-4" />
      </SortableItemHandle>
      <details className="rounded-lg border bg-background">
        <summary className="cursor-grab py-3 pl-10 pr-4 text-sm font-medium active:cursor-grabbing">
          {field.label || "Untitled field"}
          <span className="ml-3 text-xs font-normal text-muted-foreground">
            {typeLabels[field.type]}
            {field.required ? " · Required" : ""}
          </span>
        </summary>
        <div className="space-y-4 border-t p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1 space-y-1">
              <Label htmlFor={`label-${field.key}`}>Field title</Label>
              <Input
                id={`label-${field.key}`}
                value={field.label}
                maxLength={200}
                disabled={disabled}
                onChange={(event) =>
                  update(index, { ...field, label: event.target.value })
                }
              />
            </div>
            <div className="w-[220px] space-y-1">
              <Label>Field type</Label>
              <Select
                value={field.type}
                disabled={disabled || !!field.purpose}
                onValueChange={(type) => {
                  if (
                    (field.fields?.length ||
                      field.options?.some((o) => o.fields.length)) &&
                    !window.confirm(
                      "Changing this type removes its follow-up fields. Continue?",
                    )
                  )
                    return;
                  update(index, {
                    ...newField(type as FMFieldType),
                    key: field.key,
                    label: field.label,
                    required: field.required,
                  });
                }}
              >
                <SelectTrigger aria-label={`${field.label} field type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels)
                    .filter(([value]) => value !== "tab")
                    .map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={
                          depth >= 5 &&
                          (value === "group" || value === "choice")
                        }
                      >
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {field.type !== "group" && (
              <Label className="flex min-h-9 items-center gap-2">
                <Switch
                  checked={field.required}
                  disabled={disabled || !!field.purpose}
                  onCheckedChange={(required) =>
                    update(index, { ...field, required })
                  }
                />
                Required
              </Label>
            )}
            {onMoveTab && tabKey && tabChoices.length > 1 && (
              <div className="w-[200px] space-y-1">
                <Label>Tab section</Label>
                <Select
                  value={tabKey}
                  disabled={disabled}
                  onValueChange={(target) => onMoveTab(field.key, target)}
                >
                  <SelectTrigger aria-label={`Move ${field.label} to section`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tabChoices.map((tab) => (
                      <SelectItem key={tab.key} value={tab.key}>
                        {tab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Remove ${field.label}`}
                disabled={disabled || !!field.purpose}
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove ${field.label} and its follow-up fields?`,
                    )
                  )
                    onChange(fields.filter((_, i) => i !== index));
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          {field.purpose && (
            <p className="text-xs text-muted-foreground">
              Standard FM upload: the type and required setting are retained for
              the existing stage workflow.
            </p>
          )}
          {field.type === "upload" && (
            <div className="max-w-xs space-y-1">
              <Label>Accepted files</Label>
              <Select
                value={field.upload_kind}
                disabled={disabled || !!field.purpose}
                onValueChange={(kind) =>
                  update(index, {
                    ...field,
                    upload_kind: kind as FMField["upload_kind"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Photos</SelectItem>
                  <SelectItem value="media">Photos / Videos</SelectItem>
                  <SelectItem value="document">
                    Photos / Videos / Documents
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Up to 20 files, 25 MB each.
              </p>
            </div>
          )}
          {field.type === "observations" && (
            <p className="text-sm text-muted-foreground">
              The supervisor can add multiple entries, each with a Title and
              Remark.
            </p>
          )}
          {field.type === "group" && (
            <div className="border-l-2 pl-4">
              <FieldEditor
                fields={field.fields ?? []}
                depth={depth + 1}
                disabled={disabled}
                onChange={(children) =>
                  update(index, { ...field, fields: children })
                }
              />
            </div>
          )}
          {field.type === "choice" && (
            <div className="space-y-4">
              {field.options?.map((option, optionIndex) => (
                <div
                  key={option.key}
                  className="space-y-3 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`${field.key}-${option.key}`}>
                        Option
                      </Label>
                      <Input
                        id={`${field.key}-${option.key}`}
                        value={option.label}
                        disabled={disabled}
                        maxLength={200}
                        onChange={(event) =>
                          update(index, {
                            ...field,
                            options: field.options!.map((o, i) =>
                              i === optionIndex
                                ? { ...o, label: event.target.value }
                                : o,
                            ),
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Remove ${option.label} option`}
                      disabled={disabled || field.options!.length <= 2}
                      onClick={() => {
                        if (
                          window.confirm("Remove this option and its fields?")
                        )
                          update(index, {
                            ...field,
                            options: field.options!.filter(
                              (_, i) => i !== optionIndex,
                            ),
                          });
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Show these fields when “{option.label}” is selected:
                  </p>
                  <FieldEditor
                    fields={option.fields}
                    depth={depth + 1}
                    disabled={disabled}
                    onChange={(children) =>
                      update(index, {
                        ...field,
                        options: field.options!.map((o, i) =>
                          i === optionIndex ? { ...o, fields: children } : o,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || (field.options?.length ?? 0) >= 30}
                onClick={() =>
                  update(index, {
                    ...field,
                    options: [
                      ...(field.options ?? []),
                      { key: key(), label: "New option", fields: [] },
                    ],
                  })
                }
              >
                <Plus size={14} />
                Add option
              </Button>
            </div>
          )}
        </div>
      </details>
    </SortableItem>
  ));
  return (
    <div className="space-y-3">
      {managedSorting ? (
        items
      ) : (
        <Sortable
          value={fields}
          onValueChange={(next) => {
            if (!disabled) onChange(next);
          }}
          getItemValue={(field) => field.key}
          strategy="vertical"
          className="space-y-3"
        >
          {items}
        </Sortable>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || depth > 5}
        onClick={() => onChange([...fields, newField()])}
      >
        <Plus size={14} />
        Add {depth ? "follow-up field" : "field"}
      </Button>
    </div>
  );
}
function MasterEditor({
  vendorId,
  productTypeId,
  onDirty,
}: {
  vendorId: number;
  productTypeId: number;
  onDirty: (dirty: boolean) => void;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["fm-requirement-master", vendorId, productTypeId],
    queryFn: ({ signal }) => getFMMaster(vendorId, productTypeId, signal),
    refetchOnWindowFocus: false,
  });
  const [draft, setDraft] = React.useState<{
    fields: FMField[];
    revision: string;
  } | null>(null);
  const [error, setError] = React.useState("");
  const fields = draft?.fields ?? query.data?.fields ?? [];
  const onSaved = (form: FMQuestionnaire) => {
    client.setQueryData(
      ["fm-requirement-master", vendorId, productTypeId],
      form,
    );
    void client.invalidateQueries({ queryKey: ["fm-requirement-lead"] });
    setDraft(null);
    onDirty(false);
    setError("");
    toastManager.add({ title: "FM Requirements saved", type: "success" });
  };
  const save = useMutation({
    mutationFn: () =>
      saveFMMaster(
        vendorId,
        productTypeId,
        validateFields(fields),
        draft?.revision ?? query.data!.revision,
      ),
    onSuccess: onSaved,
    onError: (err: unknown) =>
      setError(getErrorMessage(err) || "Unable to save FM Requirements."),
  });
  const busy = save.isPending;
  if (query.isLoading)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Loading FM Requirements…
      </p>
    );
  if (query.isError)
    return (
      <div className="space-y-3 p-6">
        <p role="alert">
          {getErrorMessage(query.error) || "Could not load FM Requirements."}
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </div>
    );
  return (
    <div className="space-y-5 rounded-lg border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{query.data?.product_type}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.data?.origin === "empty"
              ? "Not configured"
              : "Vendor checklist"}{" "}
            · {allFields(fields).filter((field) => field.type !== "tab").length}{" "}
            fields. Drag a card to reorder. Expand a field to configure it and
            its follow-up questions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={busy || !draft}
            onClick={() => {
              try {
                validateFields(fields);
                setError("");
                save.mutate();
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}Save
            requirements
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}{" "}
          <button
            className="underline"
            onClick={() => {
              if (window.confirm("Discard unsaved edits and reload?")) {
                setDraft(null);
                onDirty(false);
                void query.refetch();
                setError("");
              }
            }}
          >
            Reload
          </button>
        </p>
      )}
      <FMRequirementTabsEditor
        fields={fields}
        disabled={busy}
        onChange={(next) => {
          setDraft({
            fields: next,
            revision: draft?.revision ?? query.data!.revision,
          });
          onDirty(true);
          setError("");
        }}
        renderFields={(items, change, tabKey) => (
          <FieldEditor
            fields={items}
            disabled={busy}
            onChange={change}
            managedSorting={!!tabKey}
            tabKey={tabKey}
            tabChoices={fmTabs(fields)}
            onMoveTab={
              tabKey
                ? (fieldKey, targetKey) => {
                    setDraft({
                      fields: moveFMTabField(fields, fieldKey, targetKey),
                      revision: draft?.revision ?? query.data!.revision,
                    });
                    onDirty(true);
                    setError("");
                  }
                : undefined
            }
          />
        )}
      />
      {draft && (
        <p className="text-xs text-muted-foreground">
          Unsaved changes ·{" "}
          <button
            className="underline"
            onClick={() => {
              setDraft(null);
              onDirty(false);
              setError("");
            }}
          >
            Discard changes
          </button>
        </p>
      )}
    </div>
  );
}
export default function FMRequirementMasters() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const largeScale = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects,
  );
  const { data: types, isLoading, isError, refetch } = useProductTypes();
  const products = (types?.data ?? []).filter(
    (item: { status?: string }) =>
      !item.status || item.status.toLowerCase() === "active",
  ) as { id: number; type: string }[];
  const [selected, setSelected] = React.useState<number | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const active = products.find((p) => p.id === selected) ?? products[0];
  if (!vendorId || largeScale !== false) return null;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">FM Requirements</h2>
        <p className="text-sm text-muted-foreground">
          Configure the final measurement checklist for each product type.
          Choice options can reveal their own questions, uploads and sections.
        </p>
      </div>
      {isLoading ? (
        <p>Loading product types…</p>
      ) : isError ? (
        <Button variant="outline" onClick={() => void refetch()}>
          Retry product types
        </Button>
      ) : !active ? (
        <p className="text-sm text-muted-foreground">
          Create an active product type to configure its FM Requirements.
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="FM product types"
            className="flex flex-wrap gap-2"
          >
            {products.map((product) => (
              <Button
                role="tab"
                aria-selected={active.id === product.id}
                variant={active.id === product.id ? "default" : "outline"}
                key={product.id}
                onClick={() => {
                  if (active.id === product.id) return;
                  if (
                    dirty &&
                    !window.confirm(
                      "Discard unsaved changes for this product type?",
                    )
                  )
                    return;
                  setDirty(false);
                  setSelected(product.id);
                }}
              >
                {product.type}
              </Button>
            ))}
          </div>
          <div role="tabpanel">
            <MasterEditor
              key={active.id}
              vendorId={vendorId}
              productTypeId={active.id}
              onDirty={setDirty}
            />
          </div>
        </>
      )}
    </div>
  );
}
