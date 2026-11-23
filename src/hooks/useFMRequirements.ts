"use client";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFMLead,
  saveFMLeadDraft,
  uploadFMFile,
  type FMUpload,
  type FMResponse,
} from "@/api/fm-requirements";
import {
  acceptedTypes,
  allFields,
  fmContentFields,
  type FMAnswers,
  type FMAnswerGroup,
  type FMField,
  type FMQuestionnaire,
  type FMValue,
  validateAnswers,
} from "@/lib/fm-requirements";
import { getErrorMessage } from "@/lib/utils";
import { toastManager } from "@/components/ui/toast";
export function useFMRequirements(
  vendorId: number | undefined,
  leadId: number | undefined,
  enabled: boolean,
  savedResponse?: FMResponse,
) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["fm-requirement-lead", vendorId, leadId],
    queryFn: ({ signal }) => getFMLead(vendorId!, leadId!, signal),
    enabled: enabled && !!vendorId && !!leadId,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const [edits, setEdits] = React.useState<Record<number, FMAnswers>>({});
  const [uploaded, setUploaded] = React.useState<Record<string, FMUpload>>({});
  const [uploading, setUploading] = React.useState<Record<string, boolean>>({});
  const pending = React.useRef(new Set<string>());
  const [error, setError] = React.useState("");
  const [validationTarget, setValidationTarget] = React.useState<{
    productTypeId: number;
    fieldKey?: string;
  } | null>(null);
  const forms: FMQuestionnaire[] = !enabled
    ? []
    : savedResponse
      ? [
          {
            product_type_id: savedResponse.product_type_id,
            product_type: savedResponse.productType?.type ?? "Product type",
            revision: savedResponse.revision,
            origin: "vendor",
            fields: savedResponse.field_snapshot,
          },
        ]
      : (query.data?.forms ?? []).filter(
          (form) => fmContentFields(form.fields).length > 0,
        );
  const identity = `${vendorId}:${leadId}`;
  React.useEffect(() => {
    setEdits({});
    setUploaded({});
    setUploading({});
    pending.current.clear();
    setError("");
    setValidationTarget(null);
  }, [identity, enabled]);
  const uploads = {
    ...Object.fromEntries(
      (query.data?.uploads ?? []).map((file) => [file.id, file]),
    ),
    ...uploaded,
  };
  const getAnswers = (form: FMQuestionnaire): FMAnswers => {
    const saved =
      edits[form.product_type_id] ??
      (savedResponse?.product_type_id === form.product_type_id
        ? savedResponse.answers
        : undefined) ??
      query.data?.responses.find(
        (response) => response.product_type_id === form.product_type_id,
      )?.answers ??
      {};
    const keys = new Set(allFields(form.fields).map((field) => field.key));
    return Object.fromEntries(
      Object.entries(saved).filter(([key]) => keys.has(key)),
    );
  };
  const setAnswer = (form: FMQuestionnaire, field: FMField, value: FMValue) => {
    setEdits((previous) => ({
      ...previous,
      [form.product_type_id]: {
        ...(previous[form.product_type_id] ?? getAnswers(form)),
        [field.key]: value,
      },
    }));
    setError("");
    setValidationTarget(null);
  };
  const prepare = (draft = false): FMAnswerGroup[] | null => {
    if (query.isFetching || query.isError || !forms.length) {
      setError(
        "Load the FM Requirements for the lead’s selected product types before saving.",
      );
      return null;
    }
    if (pending.current.size) {
      setError("Wait for the files to finish uploading.");
      return null;
    }
    try {
      return forms.map((form) => {
        try {
          return {
            product_type_id: form.product_type_id,
            revision: form.revision,
            answers: validateAnswers(form.fields, getAnswers(form), draft),
          };
        } catch (error) {
          setValidationTarget({
            productTypeId: form.product_type_id,
            fieldKey: (error as { fieldKey?: string }).fieldKey,
          });
          throw error;
        }
      });
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };
  const draftMutation = useMutation({
    mutationFn: (groups: FMAnswerGroup[]) =>
      saveFMLeadDraft(vendorId!, leadId!, groups),
    onSuccess: () => {
      toastManager.add({
        title: "FM Requirements draft saved",
        type: "success",
      });
      void queryClient.invalidateQueries({
        queryKey: ["fm-requirement-lead", vendorId, leadId],
      });
    },
    onError: (err: unknown) =>
      setError(getErrorMessage(err) || "Unable to save draft."),
  });
  const generation = React.useRef<object | null>(null);
  React.useEffect(() => {
    const scope = {};
    generation.current = scope;
    return () => {
      generation.current = null;
    };
  }, [identity, enabled]);
  const uploadFiles = async (
    form: FMQuestionnaire,
    field: FMField,
    files: File[],
  ) => {
    const fieldId = `${form.product_type_id}:${field.key}`;
    if (pending.current.has(fieldId) || !files.length) return;
    const current = getAnswers(form)[field.key];
    const ids = Array.isArray(current) ? (current as string[]) : [];
    if (
      ids.length + files.length > 20 ||
      files.some(
        (file) =>
          !acceptedTypes(field).includes(file.type) ||
          file.size > 25 * 1024 * 1024,
      )
    ) {
      setError(`${field.label}: choose up to 20 supported files, 25 MB each.`);
      return;
    }
    pending.current.add(fieldId);
    setUploading((previous) => ({ ...previous, [fieldId]: true }));
    setError("");
    const startedFor = generation.current;
    try {
      const next = [...ids];
      for (const file of files) {
        const saved = await uploadFMFile(vendorId!, leadId!, file);
        if (generation.current !== startedFor) return;
        setUploaded((previous) => ({ ...previous, [saved.id]: saved }));
        next.push(saved.id);
        setAnswer(form, field, [...next]);
      }
    } catch (err) {
      if (generation.current === startedFor)
        setError(getErrorMessage(err) || "Upload failed. Please try again.");
    } finally {
      if (generation.current === startedFor) {
        pending.current.delete(fieldId);
        setUploading((previous) => ({ ...previous, [fieldId]: false }));
      }
    }
  };
  return {
    query,
    validationTarget,
    forms,
    uploads,
    error,
    uploading,
    isUploading: Object.values(uploading).some(Boolean),
    getAnswers,
    setAnswer,
    uploadFiles,
    prepare,
    reset: () => {
      setEdits(
        Object.fromEntries(forms.map((form) => [form.product_type_id, {}])),
      );
      setError("");
      setValidationTarget(null);
    },
    saveDraft: () => {
      const groups = prepare(true);
      if (groups) draftMutation.mutate(groups);
    },
    isSavingDraft: draftMutation.isPending,
  };
}
export type FMRequirementsModel = ReturnType<typeof useFMRequirements>;
