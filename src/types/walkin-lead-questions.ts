export type WalkinAnswer = string | number | string[];
export interface WalkinQuestion {
  key: string;
  label: string;
  type: "text" | "number" | "single_select" | "multi_select" | "file";
  required: boolean;
  options: string[];
  sort_order: number;
  allow_other?: boolean;
  min?: number;
  integer?: boolean;
  accepted_mime_types?: string[];
  max_files?: number;
  max_file_size_bytes?: number;
}
export interface WalkinQuestionnaire {
  product_type_id: number;
  product_type: string;
  title: string;
  origin: "default" | "vendor";
  questionnaire_key: string;
  questionnaire_version: number;
  questions: WalkinQuestion[];
}
export interface WalkinAnswerGroup {
  product_type_id: number;
  questionnaire_key: string;
  questionnaire_version: number;
  answers: Record<string, WalkinAnswer>;
}
export interface WalkinUpload {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
}
export interface WalkinLeadResponse {
  id: number;
  product_type_id: number;
  question_snapshot: WalkinQuestion[];
  answers: Record<string, WalkinAnswer>;
  is_complete: boolean;
  updated_at: string;
  productType?: { id: number; type: string };
}
export interface WalkinLeadAnswers {
  responses: WalkinLeadResponse[];
  attachments: WalkinUpload[];
}
