export type BroadcastType = "circular" | "document" | "announcement";

export type BroadcastStatus = "published" | "scheduled" | "draft" | "expired";

export interface BroadcastAttachment {
  id: string;
  name: string;
  size: string;
  type: string; // e.g. 'pdf', 'xlsx', 'pptx', 'docx', 'zip'
  url?: string;
  fileObj?: File;
}

export interface BroadcastVersion {
  version: string;
  isCurrent: boolean;
  date: string;
  author: string;
}

export interface BroadcastItem {
  id: string; // e.g. "BC-00045"
  numericId?: number;
  title: string;
  type: BroadcastType;
  status: BroadcastStatus;
  audience: string; // e.g., "All Users", "Sales Executive", "Site Supervisor", "Vloq Franchise"
  audienceScope?: "ALL" | "ROLE" | "USER" | "FRANCHISE" | string;
  targetId?: number | null;
  audiences?: Array<{ audienceType: string; targetId?: number | null }>;
  department: string;
  publishDate: string;
  rawPublishAt: string; // ISO string for reliable date sorting
  updatedAt: string;
  updatedBy: {
    name: string;
    avatar?: string;
    role?: string;
  };
  version: string;
  readCount: number;
  totalSent: number;
  summary?: string;
  content: string;
  fileType?: "docx" | "pdf" | "xlsx" | "pptx" | "zip";
  fileSize?: string;
  bookmarked?: boolean;
  isRead?: boolean;
  videoLinks?: string[];
  attachments?: BroadcastAttachment[];
  versionHistory?: BroadcastVersion[];
}

export interface BroadcastFilterState {
  search: string;
  status: string;
  audience: string;
  department: string;
  version: string;
  updatedBy: string;
  sortBy: string;
}
