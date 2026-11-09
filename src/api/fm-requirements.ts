import { apiClient } from "@/lib/apiClient";
import type {
  FMAnswers,
  FMAnswerGroup,
  FMField,
  FMQuestionnaire,
} from "@/lib/fm-requirements";
export interface FMUpload {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  created_at?: string;
}
export interface FMResponse {
  id: number;
  updated_at: string;
  product_type_id: number;
  revision: string;
  field_snapshot: FMField[];
  answers: FMAnswers;
  is_complete: boolean;
  productType?: { type: string };
}
export interface FMLeadData {
  forms: FMQuestionnaire[];
  responses: FMResponse[];
  uploads: FMUpload[];
}
const path = (vendorId: number) => `/leads/fm-requirements/vendor/${vendorId}`;
export async function getFMMaster(
  vendorId: number,
  productTypeId: number,
  signal?: AbortSignal,
) {
  const { data } = await apiClient.get<{ data: FMQuestionnaire[] }>(
    `${path(vendorId)}/questions`,
    { params: { product_type_ids: productTypeId }, signal },
  );
  return data.data[0];
}
export async function saveFMMaster(
  vendorId: number,
  productTypeId: number,
  fields: FMField[],
  revision: string,
) {
  const { data } = await apiClient.put<{ data: FMQuestionnaire }>(
    `${path(vendorId)}/product-type/${productTypeId}/questions`,
    { fields, revision },
  );
  return data.data;
}
export async function clearFMMaster(vendorId: number, productTypeId: number) {
  const { data } = await apiClient.delete<{ data: FMQuestionnaire }>(
    `${path(vendorId)}/product-type/${productTypeId}/questions`,
  );
  return data.data;
}
export async function getFMLead(
  vendorId: number,
  leadId: number,
  signal?: AbortSignal,
) {
  const { data } = await apiClient.get<{ data: FMLeadData }>(
    `${path(vendorId)}/lead/${leadId}`,
    { signal },
  );
  return data.data;
}
export async function uploadFMFile(
  vendorId: number,
  leadId: number,
  file: File,
) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await apiClient.post<{ data: FMUpload }>(
    `${path(vendorId)}/lead/${leadId}/uploads`,
    body,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.data;
}
export async function saveFMLeadDraft(
  vendorId: number,
  leadId: number,
  groups: FMAnswerGroup[],
) {
  await apiClient.put(`${path(vendorId)}/lead/${leadId}/draft`, { groups });
}

export async function updateSavedFMValues(
  vendorId: number,
  leadId: number,
  productTypeId: number,
  answers: FMAnswers,
  expectedUpdatedAt: string,
) {
  const { data } = await apiClient.patch(
    `${path(vendorId)}/lead/${leadId}/product-type/${productTypeId}/answers`,
    { answers, expected_updated_at: expectedUpdatedAt },
  );
  return data.data;
}
