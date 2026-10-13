"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";

import { useAppSelector } from "@/redux/store";
import { useProductTypes } from "@/hooks/useTypesMaster";
import {
  fetchWalkinQuestions,
  resetWalkinQuestionMaster,
  saveWalkinQuestionMaster,
} from "@/api/walkin-lead-questions";
import type { WalkinQuestion } from "@/types/walkin-lead-questions";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { cn, getErrorMessage } from "@/lib/utils";

const typeLabels: Record<WalkinQuestion["type"], string> = {
  text: "Text",
  number: "Number",
  single_select: "Single choice",
  multi_select: "Multiple choice",
  file: "Image / PDF upload",
};

type QuestionDraft = {
  key?: string;
  label: string;
  type: WalkinQuestion["type"];
  required: boolean;
  options: string[];
  min: string;
  integer: boolean;
};

const emptyDraft: QuestionDraft = {
  label: "",
  type: "text",
  required: true,
  options: ["", ""],
  min: "",
  integer: false,
};

const isChoice = (type: WalkinQuestion["type"]) =>
  type === "single_select" || type === "multi_select";

// Keys must stay stable once saved, so they are only generated for new questions.
function newQuestionKey(label: string, taken: Set<string>) {
  const base =
    label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "question";
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}_${n}`;
  return key;
}

function draftProblem(draft: QuestionDraft) {
  if (!draft.label.trim()) return "Enter the question.";
  if (isChoice(draft.type)) {
    const options = draft.options.map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) return "Add at least two options.";
    if (new Set(options).size !== options.length) return "Options must be different from each other.";
  }
  if (draft.type === "number" && draft.min !== "" && !Number.isFinite(Number(draft.min))) {
    return "Minimum value must be a number.";
  }
  return "";
}

// Only the fields each answer type supports are sent; the API rejects the rest.
function toQuestion(draft: QuestionDraft, existing: WalkinQuestion | undefined, key: string): WalkinQuestion {
  const question: WalkinQuestion = {
    key,
    label: draft.label.trim(),
    type: draft.type,
    required: draft.required,
    options: isChoice(draft.type) ? draft.options.map((option) => option.trim()).filter(Boolean) : [],
    sort_order: existing?.sort_order ?? 0,
  };
  if (draft.type === "number") {
    if (draft.min !== "") question.min = Number(draft.min);
    if (draft.integer) question.integer = true;
  }
  if (draft.type === "file" && existing?.type === "file") {
    if (existing.accepted_mime_types) question.accepted_mime_types = existing.accepted_mime_types;
    if (existing.max_files) question.max_files = existing.max_files;
    if (existing.max_file_size_bytes) question.max_file_size_bytes = existing.max_file_size_bytes;
  }
  return question;
}

export default function WalkinQuestionMasters() {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userType = useAppSelector((state) => state.auth.user?.user_type?.user_type);
  const canManage = ["admin", "super-admin"].includes(String(userType ?? "").toLowerCase());

  const { data: productTypes, isLoading: isTypesLoading, isError: isTypesError } = useProductTypes();
  const furnitureTypes = React.useMemo<{ id: number; type: string }[]>(
    () =>
      (productTypes?.data ?? []).filter(
        (item: { status?: string }) => !item.status || item.status.toLowerCase() === "active",
      ),
    [productTypes],
  );

  const [selectedTypeId, setSelectedTypeId] = React.useState<number | null>(null);
  const activeType = furnitureTypes.find((item) => item.id === selectedTypeId) ?? furnitureTypes[0];
  const activeTypeId = activeType?.id;

  const queryKey = ["walkin-question-master", vendorId, activeTypeId];
  const { data: questionnaire, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => (await fetchWalkinQuestions(vendorId!, [activeTypeId!], undefined, signal))[0],
    enabled: !!vendorId && !!activeTypeId,
    refetchOnWindowFocus: false,
  });
  const questions = questionnaire?.questions ?? [];

  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [openForm, setOpenForm] = React.useState(false);
  const [draft, setDraft] = React.useState<QuestionDraft>(emptyDraft);
  const [formError, setFormError] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<WalkinQuestion | null>(null);
  const [openReset, setOpenReset] = React.useState(false);

  const onSaved = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["walkin-question-master", vendorId] });
    // The create-lead form caches questionnaires under this key.
    queryClient.invalidateQueries({ queryKey: ["walkin-lead-questions"] });
    toastManager.add({ title: message, type: "success" });
  };
  const saveMutation = useMutation({
    mutationFn: (next: WalkinQuestion[]) =>
      saveWalkinQuestionMaster(
        vendorId!,
        activeTypeId!,
        next.map((question, index) => ({ ...question, sort_order: index + 1 })),
      ),
    onError: (err: unknown) =>
      toastManager.add({ title: getErrorMessage(err) || "Failed to save questions.", type: "error" }),
  });
  const resetMutation = useMutation({
    mutationFn: () => resetWalkinQuestionMaster(vendorId!, activeTypeId!),
    onSuccess: () => {
      setOpenReset(false);
      onSaved("Default questions restored");
    },
    onError: (err: unknown) =>
      toastManager.add({ title: getErrorMessage(err) || "Failed to restore default questions.", type: "error" }),
  });
  const busy = saveMutation.isPending || resetMutation.isPending;

  const openCreate = () => {
    setEditingKey(null);
    setDraft(emptyDraft);
    setFormError("");
    setOpenForm(true);
  };
  const openEdit = (question: WalkinQuestion) => {
    setEditingKey(question.key);
    setDraft({
      key: question.key,
      label: question.label,
      type: question.type,
      required: question.required,
      options: question.options.length ? question.options : ["", ""],
      min: question.min === undefined ? "" : String(question.min),
      integer: !!question.integer,
    });
    setFormError("");
    setOpenForm(true);
  };
  const submitForm = () => {
    const problem = draftProblem(draft);
    if (problem) return setFormError(problem);
    const existing = questions.find((question) => question.key === editingKey);
    const key = existing?.key ?? newQuestionKey(draft.label, new Set(questions.map((question) => question.key)));
    const saved = toQuestion(draft, existing, key);
    const next = existing
      ? questions.map((question) => (question.key === existing.key ? saved : question))
      : [...questions, saved];
    saveMutation.mutate(next, {
      onSuccess: () => {
        setOpenForm(false);
        onSaved(existing ? "Question updated" : "Question added");
      },
    });
  };
  const reorder = (next: WalkinQuestion[]) => {
    // Show the dropped order straight away; a failed save reloads the saved order.
    queryClient.setQueryData(queryKey, { ...questionnaire, questions: next });
    saveMutation.mutate(next, {
      onSuccess: () => onSaved("Question order updated"),
      onError: () => queryClient.invalidateQueries({ queryKey }),
    });
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    saveMutation.mutate(
      questions.filter((question) => question.key !== deleteTarget.key),
      {
        onSuccess: () => {
          setDeleteTarget(null);
          onSaved("Question deleted");
        },
      },
    );
  };

  return (
    <>
      <Card className="border bg-background">
        <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">Walk In Questions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage the questions asked for each furniture type when a walk-in lead is created.
            </p>
          </div>

          {canManage && activeTypeId && (
            <div className="flex flex-wrap gap-2 sm:self-start">
              {questionnaire?.origin === "vendor" && (
                <Button variant="outline" onClick={() => setOpenReset(true)} disabled={busy}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
              )}
              <Button onClick={openCreate} disabled={busy || isLoading || isError}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {!vendorId ? (
            <div className="py-10 text-sm text-red-500">Vendor not found for the current user.</div>
          ) : isTypesLoading ? (
            <div className="py-10 text-sm text-muted-foreground">Loading furniture types...</div>
          ) : isTypesError ? (
            <div className="py-10 text-sm text-red-500">Failed to load furniture types.</div>
          ) : !furnitureTypes.length ? (
            <div className="py-10 text-sm text-muted-foreground">
              No furniture types found. Add a furniture type first to manage its questions.
            </div>
          ) : (
            <>
              <div role="tablist" aria-label="Furniture Type" className="flex gap-2 overflow-x-auto pb-1">
                {furnitureTypes.map((item) => {
                  const selected = item.id === activeTypeId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setSelectedTypeId(item.id)}
                      className={cn(
                        "shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.type}
                    </button>
                  );
                })}
              </div>

              {isLoading ? (
                <div className="py-10 text-sm text-muted-foreground">Loading questions...</div>
              ) : isError ? (
                <div className="py-10 text-sm text-red-500">
                  {getErrorMessage(error) || "Failed to load walk-in questions."}
                </div>
              ) : (
                <div role="tabpanel" className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={questionnaire?.origin === "vendor" ? "default" : "secondary"}>
                      {questionnaire?.origin === "vendor" ? "Custom" : "Default"}
                    </Badge>
                    <span>
                      {questions.length} {questions.length === 1 ? "question" : "questions"} for {activeType?.type}
                    </span>
                    {canManage
                      ? questions.length > 1 && <span>· Drag the handle to reorder.</span>
                      : <span>· Only admins can change these questions.</span>}
                  </div>

                  <Sortable
                    value={questions}
                    onValueChange={reorder}
                    getItemValue={(question) => question.key}
                    strategy="vertical"
                    className="space-y-2"
                  >
                    {questions.map((question, index) => (
                      <SortableItem key={question.key} value={question.key}>
                        <div className="flex items-start gap-3 rounded-md border bg-background px-4 py-3">
                          {canManage && (
                            <SortableItemHandle
                              aria-label={`Drag to reorder question ${index + 1}`}
                              className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="h-4 w-4" />
                            </SortableItemHandle>
                          )}
                          <span className="mt-0.5 flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                            Q{index + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-sm font-medium leading-6">{question.label}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline">{typeLabels[question.type]}</Badge>
                              <Badge variant="outline">{question.required ? "Required" : "Optional"}</Badge>
                              {question.options.map((option) => (
                                <Badge key={option} variant="secondary" className="font-normal">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {canManage && (
                            <div className="flex shrink-0 items-center">
                              <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit question ${index + 1}`} disabled={busy} onClick={() => openEdit(question)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={`Delete question ${index + 1}`}
                                title={questions.length === 1 ? "At least one question is required" : undefined}
                                disabled={busy || questions.length === 1}
                                onClick={() => setDeleteTarget(question)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </SortableItem>
                    ))}
                  </Sortable>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={(open) => !saveMutation.isPending && setOpenForm(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKey ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>
              {editingKey ? "Update this question" : "Add a new question"} for {activeType?.type}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walkin-question-label">Question</Label>
              <Textarea
                id="walkin-question-label"
                value={draft.label}
                onChange={(e) => { setDraft({ ...draft, label: e.target.value }); setFormError(""); }}
                placeholder="Enter the question"
                maxLength={1000}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walkin-question-type">Answer Type</Label>
              <Select
                value={draft.type}
                onValueChange={(value) => { setDraft({ ...draft, type: value as WalkinQuestion["type"] }); setFormError(""); }}
              >
                <SelectTrigger id="walkin-question-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isChoice(draft.type) && (
              <div className="space-y-2">
                <Label>Options</Label>
                {draft.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      aria-label={`Option ${index + 1}`}
                      onChange={(e) => {
                        setDraft({ ...draft, options: draft.options.map((item, i) => (i === index ? e.target.value : item)) });
                        setFormError("");
                      }}
                      placeholder={`Option ${index + 1}`}
                      maxLength={300}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove option ${index + 1}`}
                      disabled={draft.options.length <= 2}
                      onClick={() => setDraft({ ...draft, options: draft.options.filter((_, i) => i !== index) })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
            )}

            {draft.type === "number" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="walkin-question-min">Minimum Value (optional)</Label>
                  <Input
                    id="walkin-question-min"
                    type="number"
                    value={draft.min}
                    onChange={(e) => { setDraft({ ...draft, min: e.target.value }); setFormError(""); }}
                    placeholder="No minimum"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border p-3 sm:self-end">
                  <Label>Whole numbers only</Label>
                  <Switch checked={draft.integer} onCheckedChange={(checked) => setDraft({ ...draft, integer: checked })} />
                </div>
              </div>
            )}

            {draft.type === "file" && (
              <p className="text-sm text-muted-foreground">
                Accepts images or PDF, up to 5 files of 10 MB each.
              </p>
            )}

            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div>
                <Label>Required</Label>
                <p className="text-xs text-muted-foreground">The lead cannot be created until this is answered.</p>
              </div>
              <Switch checked={draft.required} onCheckedChange={(checked) => setDraft({ ...draft, required: checked })} />
            </div>

            {formError && <p role="alert" className="text-sm text-red-500">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingKey ? "Save" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !saveMutation.isPending && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              This question will no longer be asked for {activeType?.type}. Answers already saved on leads are kept.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Question:</span>{" "}
            <span className="font-medium">{deleteTarget?.label}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openReset} onOpenChange={(open) => !resetMutation.isPending && setOpenReset(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to Default Questions</DialogTitle>
            <DialogDescription>
              The custom questions for {activeType?.type} will be replaced with the default set. Answers already
              saved on leads are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReset(false)} disabled={resetMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Resetting..." : "Reset to Default"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
