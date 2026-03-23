// src/types/common.ts
export interface Document {
    id: number;
    doc_og_name: string;
    doc_sys_name: string;
    doc_type_id: number;
    signedUrl: string;   // ✅ standardized camelCase
    file_type?: string;
    is_image?: boolean;
    created_at: string;
  }
  