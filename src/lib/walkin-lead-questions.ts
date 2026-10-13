import type { WalkinAnswer, WalkinAnswerGroup, WalkinQuestion, WalkinQuestionnaire } from "@/types/walkin-lead-questions";

export const OTHER_OPTION_LABEL = "Others";
export const OTHER_ANSWER_MAX_LENGTH = 500;
// A single choice answer that is not one of the options is the text typed under "Others".
export const isOtherAnswer = (question: WalkinQuestion, value: WalkinAnswer | undefined) =>
  question.type === "single_select" && !!question.allow_other && typeof value === "string" && value !== "" && !question.options.includes(value);
export const isWalkinSource = (name: string) => name.toLowerCase().replace(/[\s_-]/g, "") === "walkin";
export const questionnaireId = (form: WalkinQuestionnaire) => `${form.product_type_id}:${form.questionnaire_key}:${form.questionnaire_version}`;
export const walkinFieldId = (form: WalkinQuestionnaire, question: WalkinQuestion) => `walkin-${form.product_type_id}-${question.key}`;
export function answerError(question: WalkinQuestion, value: WalkinAnswer | undefined, draft = false): string | undefined {
  const empty = value === undefined || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
  if (empty) return question.required && !draft ? "Please answer this question." : undefined;
  switch (question.type) {
    case "text": return typeof value !== "string" || value.trim().length > 5000 ? "Enter a description up to 5,000 characters." : undefined;
    case "number": return typeof value !== "number" || !Number.isFinite(value) || (question.integer && !Number.isInteger(value)) || (question.min !== undefined && value < question.min)
      ? `Enter ${question.integer ? "a whole number" : "a number"}${question.min !== undefined ? ` of ${question.min} or more` : ""}.` : undefined;
    case "single_select":
      if (typeof value === "string" && question.options.includes(value)) return undefined;
      if (question.allow_other && typeof value === "string") return value.trim().length > OTHER_ANSWER_MAX_LENGTH ? `Keep the answer within ${OTHER_ANSWER_MAX_LENGTH} characters.` : undefined;
      return "Select one of the available options.";
    case "multi_select": return !Array.isArray(value) || value.some(v => !question.options.includes(v)) || new Set(value).size !== value.length ? "Select from the available options." : undefined;
    case "file": return !Array.isArray(value) || value.length > (question.max_files ?? 5) || value.some(v => !/^[0-9a-f-]{36}$/i.test(v)) ? "Upload a valid reference file." : undefined;
  }
}
export function buildWalkinAnswerGroups(forms: WalkinQuestionnaire[], answers: Record<string, Record<string, WalkinAnswer>>): WalkinAnswerGroup[] {
  return forms.map(form => ({
    product_type_id: form.product_type_id,
    questionnaire_key: form.questionnaire_key,
    questionnaire_version: form.questionnaire_version,
    answers: Object.fromEntries(form.questions.flatMap(q => {
      const value = answers[questionnaireId(form)]?.[q.key];
      if (value === undefined || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length)) return [];
      return [[q.key, typeof value === "string" ? value.trim() : value]];
    })),
  }));
}
