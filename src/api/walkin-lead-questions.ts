import { apiClient } from "@/lib/apiClient";
import type { WalkinAnswer, WalkinLeadAnswers, WalkinQuestion, WalkinQuestionnaire, WalkinUpload } from "@/types/walkin-lead-questions";

export async function fetchWalkinQuestions(vendorId: number, productTypeIds: number[], sourceId?: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ success: boolean; data: WalkinQuestionnaire[] }>(
    `/leads/walkin-questions/vendor/${vendorId}/questions`,
    { params: { product_type_ids: productTypeIds.join(","), source_id: sourceId }, signal },
  );
  return data.data;
}
export async function uploadWalkinReference(vendorId: number, file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await apiClient.post<{ success: boolean; data: WalkinUpload }>(
    `/leads/walkin-questions/vendor/${vendorId}/uploads`, body,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}
export async function fetchWalkinLeadAnswers(vendorId: number, leadId: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ success: boolean; data: WalkinLeadAnswers }>(
    `/leads/walkin-questions/vendor/${vendorId}/lead/${leadId}/answers`, { signal },
  );
  return data.data;
}
// A null value clears the answer.
export async function updateWalkinLeadAnswer(vendorId: number, leadId: number, productTypeId: number, questionKey: string, value: WalkinAnswer | null) {
  const { data } = await apiClient.patch<{ success: boolean; data: unknown }>(
    `/leads/walkin-questions/vendor/${vendorId}/lead/${leadId}/product-type/${productTypeId}/answers/${encodeURIComponent(questionKey)}`,
    { value },
  );
  return data.data;
}
// Replaces the vendor's whole question set for one furniture type.
export async function saveWalkinQuestionMaster(vendorId: number, productTypeId: number, questions: WalkinQuestion[]) {
  const { data } = await apiClient.put<{ success: boolean; data: WalkinQuestionnaire }>(
    `/leads/walkin-questions/vendor/${vendorId}/product-type/${productTypeId}/questions`, { questions },
  );
  return data.data;
}
export async function resetWalkinQuestionMaster(vendorId: number, productTypeId: number) {
  const { data } = await apiClient.delete<{ success: boolean; data: WalkinQuestionnaire }>(
    `/leads/walkin-questions/vendor/${vendorId}/product-type/${productTypeId}/questions`,
  );
  return data.data;
}
