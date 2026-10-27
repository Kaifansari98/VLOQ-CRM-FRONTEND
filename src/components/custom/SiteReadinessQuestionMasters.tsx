"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { fetchReadinessQuestions, saveReadinessQuestions, resetReadinessQuestions, type ReadinessQuestion, type ReadinessQuestionMaster } from "@/api/installation/site-readiness-questions";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/utils";

export default function SiteReadinessQuestionMasters() {
  const client = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const role = useAppSelector((state) => state.auth.user?.user_type?.user_type);
  const canManage = ["admin", "super-admin"].includes(String(role ?? "").toLowerCase());
  const queryKey = ["site-readiness-question-master", vendorId];
  const query = useQuery({ queryKey, queryFn: () => fetchReadinessQuestions(vendorId!), enabled: !!vendorId, refetchOnWindowFocus: false });
  const questions = query.data?.questions ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReadinessQuestion | null>(null);
  const [label, setLabel] = useState("");
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<ReadinessQuestion | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const saved = (data: ReadinessQuestionMaster, message: string) => {
    client.setQueryData(queryKey, data);
    client.invalidateQueries({ queryKey: ["siteReadinessRecords", vendorId] });
    client.invalidateQueries({ queryKey: ["checkSiteReadinessCompletion", vendorId] });
    toastManager.add({ title: message, type: "success" });
  };
  const save = useMutation({
    mutationFn: (next: ReadinessQuestion[]) => saveReadinessQuestions(vendorId!, next.map((q, index) => ({ ...q, sort_order: index + 1 }))),
    onError: (error) => toastManager.add({ title: getErrorMessage(error) || "Failed to save questions.", type: "error" }),
  });
  const reset = useMutation({
    mutationFn: () => resetReadinessQuestions(vendorId!),
    onSuccess: (data) => { setResetOpen(false); saved(data, "Default questions restored"); },
    onError: (error) => toastManager.add({ title: getErrorMessage(error) || "Failed to restore questions.", type: "error" }),
  });
  const busy = save.isPending || reset.isPending;
  const submit = () => {
    if (!canManage || busy) return;
    const text = label.trim();
    if (!text) return setFormError("Enter the question.");
    if (questions.some((q) => q.key !== editing?.key && q.label.toLowerCase() === text.toLowerCase())) return setFormError("Questions must be different from each other.");
    const question = { key: editing?.key ?? `question_${crypto.randomUUID()}`, label: text, sort_order: questions.length + 1 };
    const next = editing ? questions.map((q) => q.key === editing.key ? question : q) : [...questions, question];
    save.mutate(next, { onSuccess: (data) => { setOpen(false); saved(data, editing ? "Question updated" : "Question added"); } });
  };
  const reorder = (next: ReadinessQuestion[]) => {
    if (!canManage || busy) return;
    client.setQueryData(queryKey, { ...query.data, questions: next });
    save.mutate(next, { onSuccess: (data) => saved(data, "Question order updated"), onError: () => client.invalidateQueries({ queryKey }) });
  };

  return <>
    <Card className="border bg-background">
      <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1"><CardTitle className="text-base font-semibold">Site Readiness List</CardTitle><p className="text-sm text-muted-foreground">Manage the questions and their order in the Site Readiness checklist.</p></div>
        {canManage && vendorId && <div className="flex flex-wrap gap-2 sm:self-start">
          {query.data?.origin === "vendor" && <Button variant="outline" onClick={() => setResetOpen(true)} disabled={busy}><RotateCcw className="mr-2 h-4 w-4" />Reset to Default</Button>}
          <Button disabled={busy || query.isLoading || query.isError} onClick={() => { setEditing(null); setLabel(""); setFormError(""); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add Question</Button>
        </div>}
      </CardHeader>
      <CardContent className="space-y-4">
        {!vendorId ? <p className="py-10 text-sm text-destructive">Vendor not found for the current user.</p> : query.isLoading ? <p className="py-10 text-sm text-muted-foreground">Loading questions...</p> : query.isError ? <div className="py-10 text-sm text-destructive">{getErrorMessage(query.error) || "Failed to load questions."}<Button variant="link" onClick={() => query.refetch()}>Retry</Button></div> : <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={query.data?.origin === "vendor" ? "default" : "secondary"}>{query.data?.origin === "vendor" ? "Custom" : "Default"}</Badge>
            <span>{questions.length} {questions.length === 1 ? "question" : "questions"}</span>
            {canManage ? questions.length > 1 && <span>· Drag the handle to reorder.</span> : <span>· Only admins can change these questions.</span>}
          </div>
          <Sortable value={questions} onValueChange={reorder} getItemValue={(question) => question.key} strategy="vertical" className="space-y-2">
            {questions.map((question, index) => <SortableItem key={question.key} value={question.key} disabled={busy || !canManage}>
              <div className="flex items-start gap-3 rounded-md border bg-background px-4 py-3">
                {canManage && <SortableItemHandle aria-label={`Drag to reorder question ${index + 1}`} className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></SortableItemHandle>}
                <span className="mt-0.5 flex h-6 min-w-8 shrink-0 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">Q{index + 1}</span>
                <div className="min-w-0 flex-1 space-y-2"><p className="break-words text-sm font-medium leading-6">{question.label}</p><div className="flex flex-wrap items-center gap-1.5"><Badge variant="outline">Yes / No</Badge><Badge variant="outline">Required</Badge><Badge variant="secondary" className="font-normal">Optional remark</Badge></div></div>
                {canManage && <div className="flex shrink-0 items-center">
                  <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit question ${index + 1}`} disabled={busy} onClick={() => { setEditing(question); setLabel(question.label); setFormError(""); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" aria-label={`Delete question ${index + 1}`} title={questions.length === 1 ? "At least one question is required" : undefined} disabled={busy || questions.length === 1} onClick={() => setDeleting(question)}><Trash2 className="h-4 w-4" /></Button>
                </div>}
              </div>
            </SortableItem>)}
          </Sortable>
        </div>}
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={(value) => !busy && setOpen(value)}><DialogContent><form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-4">
      <DialogHeader><DialogTitle>{editing ? "Edit Question" : "Add Question"}</DialogTitle><DialogDescription>Each question has a required Yes/No answer and an optional remark.</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label htmlFor="readiness-question-label">Question</Label><Textarea id="readiness-question-label" value={label} onChange={(event) => { setLabel(event.target.value); setFormError(""); }} placeholder="Enter the question" maxLength={1000} rows={2} disabled={busy} /></div>
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save Question"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={(value) => !value && !busy && setDeleting(null)}><DialogContent>
      <DialogHeader><DialogTitle>Delete Question</DialogTitle><DialogDescription>This question will no longer be asked. Answers already saved on leads are kept.</DialogDescription></DialogHeader>
      <div className="rounded-md border p-3 text-sm">{deleting?.label}</div>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => save.mutate(questions.filter((q) => q.key !== deleting?.key), { onSuccess: (data) => { setDeleting(null); saved(data, "Question deleted"); } })}>{busy ? "Deleting..." : "Delete"}</Button></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={resetOpen} onOpenChange={(value) => !busy && setResetOpen(value)}><DialogContent>
      <DialogHeader><DialogTitle>Reset to Default Questions</DialogTitle><DialogDescription>The custom questions will be replaced with the original six questions. Answers already saved on leads are kept.</DialogDescription></DialogHeader>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setResetOpen(false)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => reset.mutate()}>{busy ? "Resetting..." : "Reset to Default"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
