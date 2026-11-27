import { apiClient } from "@/lib/apiClient";
export type ReadinessQuestion = { key: string; label: string; sort_order: number };
export type ReadinessQuestionMaster = { origin: "default" | "vendor"; questions: ReadinessQuestion[] };
const path = (vendorId: number) => `/leads/installation/site-readiness/vendorId/${vendorId}/questions-master`;
export const fetchReadinessQuestions = async (vendorId: number) => (await apiClient.get<{ data: ReadinessQuestionMaster }>(path(vendorId))).data.data;
export const saveReadinessQuestions = async (vendorId: number, questions: ReadinessQuestion[]) => (await apiClient.put<{ data: ReadinessQuestionMaster }>(path(vendorId), { questions })).data.data;
export const resetReadinessQuestions = async (vendorId: number) => (await apiClient.delete<{ data: ReadinessQuestionMaster }>(path(vendorId))).data.data;
