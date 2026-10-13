"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWalkinQuestions, uploadWalkinReference } from "@/api/walkin-lead-questions";
import { answerError, buildWalkinAnswerGroups, questionnaireId, walkinFieldId } from "@/lib/walkin-lead-questions";
import type { WalkinAnswer, WalkinQuestion, WalkinQuestionnaire, WalkinUpload } from "@/types/walkin-lead-questions";
import { getErrorMessage } from "@/lib/utils";

export function useWalkinLeadQuestions({ vendorId, sourceId, productTypeIds, enabled }: {
  vendorId?: number; sourceId?: number; productTypeIds: number[]; enabled: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, Record<string, WalkinAnswer>>>({});
  const [uploads, setUploads] = useState<Record<string, WalkinUpload>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const pendingUploads = useRef(new Set<string>());
  const ids = [...new Set(productTypeIds)].sort((a, b) => a - b);
  const query = useQuery({
    queryKey: ["walkin-lead-questions", vendorId, sourceId, ids],
    queryFn: ({ signal }) => fetchWalkinQuestions(vendorId!, ids, sourceId!, signal),
    enabled: enabled && !!vendorId && !!sourceId && ids.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const forms = enabled ? query.data ?? [] : [];
  const isUploading = enabled && Object.values(uploading).some(Boolean);
  const setAnswer = (form: WalkinQuestionnaire, q: WalkinQuestion, value: WalkinAnswer) => {
    setAnswers(previous => ({ ...previous, [questionnaireId(form)]: { ...previous[questionnaireId(form)], [q.key]: value } }));
    const fieldId = walkinFieldId(form, q);
    setErrors(previous => { const next = { ...previous }; delete next[fieldId]; return next; });
    setNotice("");
  };
  const getAnswer = (form: WalkinQuestionnaire, q: WalkinQuestion) => answers[questionnaireId(form)]?.[q.key];
  const focusField = (fieldId: string) => {
    requestAnimationFrame(() => {
      const field = document.getElementById(fieldId);
      const group = field?.closest("details");
      if (group) group.open = true;
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      field?.querySelector<HTMLElement>("input, textarea, button")?.focus({ preventScroll: true });
    });
  };
  const prepare = (draft = false) => {
    if (!enabled || !ids.length) return { ok: true as const, groups: undefined };
    if (query.isFetching || query.isError || forms.length !== ids.length) {
      setNotice("Please load the walk-in questions before saving.");
      focusField("walkin-questions");
      return { ok: false as const, groups: undefined };
    }
    if (pendingUploads.current.size) {
      setNotice("Please wait for reference files to finish uploading.");
      focusField("walkin-questions");
      return { ok: false as const, groups: undefined };
    }
    const nextErrors: Record<string, string> = {};
    for (const form of forms) for (const q of form.questions) {
      const error = answerError(q, getAnswer(form, q), draft);
      if (error) nextErrors[walkinFieldId(form, q)] = error;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice("A few answers need your attention before saving.");
      focusField(Object.keys(nextErrors)[0]);
      return { ok: false as const, groups: undefined };
    }
    return { ok: true as const, groups: buildWalkinAnswerGroups(forms, answers) };
  };
  const uploadFiles = async (form: WalkinQuestionnaire, q: WalkinQuestion, files: File[]) => {
    if (!vendorId || !files.length) return;
    const fieldId = walkinFieldId(form, q);
    if (pendingUploads.current.has(fieldId)) return;
    const existing = getAnswer(form, q);
    const current = Array.isArray(existing) ? existing : [];
    const max = q.max_files ?? 5;
    const types = q.accepted_mime_types ?? ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (current.length + files.length > max) {
      setErrors(previous => ({ ...previous, [fieldId]: `Choose up to ${max} reference files.` })); return;
    }
    if (files.some(file => !types.includes(file.type) || file.size > (q.max_file_size_bytes ?? 10485760))) {
      setErrors(previous => ({ ...previous, [fieldId]: `Use an accepted image or PDF, up to ${Math.floor((q.max_file_size_bytes ?? 10485760) / 1048576)} MB per file.` })); return;
    }
    pendingUploads.current.add(fieldId);
    setUploading(previous => ({ ...previous, [fieldId]: true }));
    try {
      const added = [...current];
      for (const file of files) {
        const uploaded = await uploadWalkinReference(vendorId, file);
        setUploads(previous => ({ ...previous, [uploaded.id]: uploaded }));
        added.push(uploaded.id);
        setAnswer(form, q, [...added]);
      }
    } catch (error) {
      setErrors(previous => ({ ...previous, [fieldId]: getErrorMessage(error) || "Upload failed. Please try again." }));
    } finally {
      pendingUploads.current.delete(fieldId);
      setUploading(previous => ({ ...previous, [fieldId]: false }));
    }
  };
  const refreshAfterConflict = () => {
    setNotice("The questions have changed. Please review the updated questions and submit again.");
    void query.refetch();
    focusField("walkin-questions");
  };
  return {
    forms, uploads, errors, uploading, notice, enabled, isUploading,
    // Background refetches keep the current questions on screen instead of flashing the skeleton.
    isLoading: enabled && ids.length > 0 && query.isLoading,
    loadError: enabled && query.isError,
    hasFurniture: ids.length > 0,
    getAnswer, setAnswer, prepare, uploadFiles, refreshAfterConflict,
    retry: () => { setNotice(""); void query.refetch(); },
  };
}
export type WalkinQuestionsModel = ReturnType<typeof useWalkinLeadQuestions>;
