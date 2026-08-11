import React from "react";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BroadcastItem, BroadcastType, BroadcastStatus } from "@/types/broadcast";

export interface BackendBroadcastAudience {
  id?: number;
  broadcast_id?: number;
  audience_type: "ALL" | "ROLE" | "USER" | "FRANCHISE";
  target_id?: number | null;
  target_name?: string;
}

export interface BackendBroadcastAttachment {
  id?: number;
  broadcast_id?: number;
  attachment_type: "FILE" | "YOUTUBE";
  title: string;
  file_url: string;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | bigint | null; // bytes stored in DB
}

export interface BackendBroadcast {
  id: number;
  title: string;
  category?: string;
  content: string;
  type: "CIRCULAR" | "DOCUMENT";
  status: "ACTIVE" | "INACTIVE";
  publish_at?: string | null;
  vendor_id?: number | null;
  created_at: string;
  updated_at: string;
  createdBy?: { id: number; user_name: string };
  updatedBy?: { id: number; user_name: string };
  audiences?: BackendBroadcastAudience[];
  attachments?: BackendBroadcastAttachment[];
  readersCount?: number;
  _count?: { readLogs?: number };
  sentCount?: number;
  isRead?: boolean;
}

export interface AttachmentItemInput {
  attachmentType: "FILE" | "YOUTUBE";
  title: string;
  fileUrl?: string;
  fileObj?: File;
}

export interface BroadcastCategoryMaster {
  id: number;
  category: string;
  type: string;
  vendor_id: number;
  is_active: boolean;
}

export interface CreateBroadcastPayload {
  title: string;
  category?: string;
  category_id?: number;
  content: string;
  type: "CIRCULAR" | "DOCUMENT";
  status: "ACTIVE" | "INACTIVE";
  publishAt?: string | null;
  vendorId?: number | null;
  userTypeId?: number | number[];
  userTypeIds?: number[];
  audiences: Array<{ audienceType: "ALL" | "ROLE" | "USER" | "FRANCHISE"; targetId?: number | null }>;
  attachments?: AttachmentItemInput[];
}

export interface BroadcastReader {
  id: number;
  user_id: number;
  broadcast_id: number;
  read_at?: string | null;
  is_read?: boolean;
  user?: {
    id: number;
    user_name: string;
    email?: string;
  };
}

/** Format bytes to human-readable size string (KB / MB / GB) */
const formatFileSize = (bytes?: number | bigint | null): string => {
  if (bytes == null) return "-";
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n === 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const stripHtmlAndEntities = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

// Map backend broadcast to frontend model
export const mapBackendBroadcastToFrontend = (item: BackendBroadcast): BroadcastItem => {
  if (!item) {
    return {
      id: "BD-00000",
      numericId: 0,
      title: "Unknown",
      type: "circular",
      status: "draft",
      audience: "All Users",
      department: "General",
      publishDate: new Date().toLocaleString(),
      rawPublishAt: new Date().toISOString(),
      updatedAt: new Date().toLocaleString(),
      updatedBy: { name: "System" },
      version: "1.0",
      readCount: 0,
      totalSent: 0,
      content: "",
    };
  }

  const isCircular = item.type === "CIRCULAR";
  const firstFile = item.attachments?.find((a) => a.attachment_type === "FILE");
  const youtubeLinks = item.attachments?.filter((a) => a.attachment_type === "YOUTUBE").map((a) => a.file_url) || [];

  const attachmentsList = (item.attachments || [])
    .filter((a) => a.attachment_type === "FILE")
    .map((a, idx) => ({
      id: String(a.id || `att-${idx}`),
      name: a.title || a.file_name || "Attachment",
      size: formatFileSize(a.file_size),
      type: a.file_type || a.file_url?.split(".").pop() || "pdf",
      url: a.file_url,
    }));

  const cleanTextContent = stripHtmlAndEntities(item.content || "");

  return {
    id: `BD-${String(item.id).padStart(5, "0")}`,
    numericId: item.id,
    title: item.title,
    type: isCircular ? "circular" : "document",
    category:
      typeof item.category === "object" && item.category !== null
        ? (item.category as any).category
        : item.category || undefined,
    status: (() => {
      if (item.status === "INACTIVE") return "draft";
      if (item.publish_at && new Date(item.publish_at) > new Date()) return "scheduled";
      return "published";
    })(),
    audience: item.audiences && item.audiences.length > 0
      ? item.audiences
          .map((a) => {
            if (a.audience_type === "ALL") return "All Users";
            if (a.audience_type === "ROLE") return a.target_name || (a.target_id ? `Role #${a.target_id}` : "All Roles");
            if (a.audience_type === "FRANCHISE") return a.target_name || (a.target_id ? `Franchise #${a.target_id}` : "All Franchises");
            if (a.audience_type === "USER") return a.target_name || (a.target_id ? `User #${a.target_id}` : "Specific Users");
            return a.audience_type;
          })
          .join(", ")
      : "All Users",
    audienceScope: item.audiences && item.audiences.length > 0 ? item.audiences[0].audience_type : "ALL",
    department: isCircular ? "Operations" : "IT",
    publishDate: item.publish_at ? new Date(item.publish_at).toLocaleString() : new Date(item.created_at).toLocaleString(),
    rawPublishAt: item.publish_at || item.created_at,
    updatedAt: new Date(item.updated_at).toLocaleString(),
    updatedBy: {
      name: item.updatedBy?.user_name || item.createdBy?.user_name || "Super Admin",
      avatar: (item.updatedBy as any)?.avatar || (item.createdBy as any)?.avatar || undefined,
      role: "Super Admin",
    },
    version: "1.0",
    readCount: item._count?.readLogs ?? item.readersCount ?? 0,
    totalSent: item.sentCount ?? 0,
    summary: cleanTextContent ? cleanTextContent.substring(0, 120) + (cleanTextContent.length > 120 ? "..." : "") : "",
    content: item.content,
    fileType: (firstFile?.file_type?.toLowerCase() as any) || (isCircular ? "pdf" : "docx"),
    fileSize: formatFileSize(firstFile?.file_size),
    bookmarked: false,
    isRead: item.isRead ?? false,
    videoLinks: youtubeLinks,
    attachments: attachmentsList,
    versionHistory: [
      {
        version: "1.0",
        isCurrent: true,
        date: new Date(item.updated_at).toLocaleString(),
        author: item.updatedBy?.user_name || item.createdBy?.user_name || "Super Admin",
      },
    ],
  };
};

// API Functions
export const fetchBroadcastsApi = async (params?: {
  vendorId?: number;
  status?: string;
  type?: "CIRCULAR" | "DOCUMENT";
  page?: number;
  limit?: number;
  forMe?: boolean;
}) => {
  const { data } = await apiClient.get("/broadcasts", { params });
  const list: BackendBroadcast[] = data?.data || data?.broadcasts || [];
  return list.map(mapBackendBroadcastToFrontend);
};

export const fetchBroadcastByIdApi = async (id: number) => {
  const { data } = await apiClient.get(`/broadcasts/${id}`);
  return mapBackendBroadcastToFrontend(data?.data);
};

export const fetchBroadcastCategoriesApi = async (vendorId: number) => {
  const { data } = await apiClient.get(`/broadcasts/categories/${vendorId}`);
  return (data?.data || []) as BroadcastCategoryMaster[];
};

export const fetchBroadcastCategoriesForMasterApi = async (vendorId: number) => {
  const { data } = await apiClient.get(`/broadcasts/categories/${vendorId}?all=true`);
  return (data?.data || []) as BroadcastCategoryMaster[];
};

export const createBroadcastCategoryApi = async (payload: { vendor_id: number; category: string; type?: string }) => {
  const { data } = await apiClient.post("/broadcasts/categories", payload);
  return data;
};

export const updateBroadcastCategoryApi = async (id: number, payload: { category: string; type?: string }) => {
  const { data } = await apiClient.patch(`/broadcasts/categories/${id}`, payload);
  return data;
};

export const toggleBroadcastCategoryStatusApi = async (id: number) => {
  const { data } = await apiClient.patch(`/broadcasts/categories/${id}/status`);
  return data;
};

export const createBroadcastApi = async (payload: CreateBroadcastPayload) => {
  const hasFileObjs = payload.attachments?.some((att) => att.fileObj);

  if (hasFileObjs) {
    const formData = new FormData();

    // Clean payload for json data string
    const cleanAttachments = (payload.attachments || []).map((att) => ({
      attachmentType: att.attachmentType,
      title: att.title,
      fileUrl: att.fileUrl,
    }));

    const cleanPayload = {
      ...payload,
      attachments: cleanAttachments,
    };

    formData.append("data", JSON.stringify(cleanPayload));

    (payload.attachments || []).forEach((att, idx) => {
      if (att.attachmentType === "FILE" && att.fileObj) {
        formData.append(`attachment_file_${idx}`, att.fileObj);
      }
    });

    const { data } = await apiClient.post("/broadcasts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } else {
    const { data } = await apiClient.post("/broadcasts", payload);
    return data;
  }
};

export const updateBroadcastApi = async (id: number, payload: Partial<CreateBroadcastPayload>) => {
  const hasFileObjs = payload.attachments?.some((att) => att.fileObj);

  if (hasFileObjs) {
    const formData = new FormData();

    const cleanAttachments = (payload.attachments || []).map((att) => ({
      attachmentType: att.attachmentType,
      title: att.title,
      fileUrl: att.fileUrl,
    }));

    const cleanPayload = {
      ...payload,
      attachments: cleanAttachments,
    };

    formData.append("data", JSON.stringify(cleanPayload));

    (payload.attachments || []).forEach((att, idx) => {
      if (att.attachmentType === "FILE" && att.fileObj) {
        formData.append(`attachment_file_${idx}`, att.fileObj);
      }
    });

    const { data } = await apiClient.patch(`/broadcasts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } else {
    const { data } = await apiClient.patch(`/broadcasts/${id}`, payload);
    return data;
  }
};

export const deleteBroadcastApi = async (id: number) => {
  const { data } = await apiClient.delete(`/broadcasts/${id}`);
  return data;
};

export const markBroadcastReadApi = async (id: number) => {
  const { data } = await apiClient.post(`/broadcasts/${id}/read`);
  return data;
};

export const fetchBroadcastReadersApi = async (id: number) => {
  const { data } = await apiClient.get(`/broadcasts/${id}/readers`);
  return (data?.data || []) as BroadcastReader[];
};

// React Query Hooks
export const useBroadcasts = (params?: {
  vendorId?: number;
  status?: string;
  type?: "CIRCULAR" | "DOCUMENT";
  forMe?: boolean;
}) => {
  return useQuery({
    queryKey: ["broadcasts", params],
    queryFn: () => fetchBroadcastsApi(params),
  });
};

export const useBroadcastDetail = (id: number | null | undefined) => {
  return useQuery({
    queryKey: ["broadcast", id],
    queryFn: () => fetchBroadcastByIdApi(id!),
    enabled: typeof id === "number" && id > 0,
  });
};

export const useBroadcastCategories = (vendorId: number | null | undefined) => {
  return useQuery({
    queryKey: ["broadcast-categories", vendorId],
    queryFn: () => fetchBroadcastCategoriesApi(vendorId!),
    enabled: typeof vendorId === "number" && vendorId > 0,
  });
};

export const useBroadcastCategoriesForMaster = (vendorId: number | null | undefined) => {
  return useQuery({
    queryKey: ["broadcast-categories-master", vendorId],
    queryFn: () => fetchBroadcastCategoriesForMasterApi(vendorId!),
    enabled: typeof vendorId === "number" && vendorId > 0,
  });
};

export const useCreateBroadcastCategory = (vendorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBroadcastCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-categories", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-categories-master", vendorId] });
    },
  });
};

export const useUpdateBroadcastCategory = (vendorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; payload: { category: string; type?: string } }) =>
      updateBroadcastCategoryApi(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-categories", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-categories-master", vendorId] });
    },
  });
};

export const useToggleBroadcastCategoryStatus = (vendorId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => toggleBroadcastCategoryStatusApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-categories", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-categories-master", vendorId] });
    },
  });
};

export const useBroadcastReaders = (id: number | null | undefined) => {
  return useQuery({
    queryKey: ["broadcast-readers", id],
    queryFn: () => fetchBroadcastReadersApi(id!),
    enabled: typeof id === "number" && id > 0,
  });
};

export const useCreateBroadcastMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBroadcastApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
    },
  });
};

export const useUpdateBroadcastMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; payload: Partial<CreateBroadcastPayload> }) =>
      updateBroadcastApi(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
    },
  });
};

export const useDeleteBroadcastMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBroadcastApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
    },
  });
};

export const useMarkBroadcastReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markBroadcastReadApi,
    onSuccess: (_, id) => {
      markBroadcastAsReadLocal(id);
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["broadcast", id] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-readers", id] });
    },
  });
};

export const getReadBroadcastIds = (userId?: number): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = `read_broadcast_ids_${userId || "default"}`;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    return [];
  }
};

export const markBroadcastAsReadLocal = (broadcastId: number | string, userId?: number) => {
  if (typeof window === "undefined" || !broadcastId) return;
  try {
    const key = `read_broadcast_ids_${userId || "default"}`;
    const current = getReadBroadcastIds(userId);
    const idStr = String(broadcastId);
    if (!current.includes(idStr)) {
      const updated = [...current, idStr];
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new Event("broadcasts-read-updated"));
    }
  } catch (e) {
    // ignore
  }
};

export const markAllBroadcastsAsReadLocal = (broadcasts: BroadcastItem[], userId?: number) => {
  if (typeof window === "undefined") return;
  try {
    const key = `read_broadcast_ids_${userId || "default"}`;
    const current = getReadBroadcastIds(userId);
    const newIds = broadcasts.map((b) => String(b.numericId || b.id));
    const merged = Array.from(new Set([...current, ...newIds]));
    localStorage.setItem(key, JSON.stringify(merged));
    window.dispatchEvent(new Event("broadcasts-read-updated"));
  } catch (e) {
    // ignore
  }
};

export const useUnreadBroadcastCount = (userId?: number, vendorId?: number, isSuperAdmin?: boolean) => {
  const { data: broadcasts = [], isLoading } = useBroadcasts({
    vendorId,
    forMe: !isSuperAdmin,
  });
  const [readIds, setReadIds] = React.useState<string[]>(() => getReadBroadcastIds(userId));

  React.useEffect(() => {
    const handleUpdate = () => {
      setReadIds(getReadBroadcastIds(userId));
    };
    handleUpdate();
    window.addEventListener("broadcasts-read-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("broadcasts-read-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [userId]);

  const unreadCount = React.useMemo(() => {
    const published = broadcasts.filter((b) => b.status === "published");
    if (published.length === 0) return 0;
    const unread = published.filter((b) => {
      const numIdStr = String(b.numericId ?? "");
      const fullIdStr = String(b.id ?? "");
      const isReadLocally = readIds.includes(numIdStr) || readIds.includes(fullIdStr);
      return !b.isRead && !isReadLocally;
    });
    return unread.length;
  }, [broadcasts, readIds]);

  return { unreadCount, isLoading };
};
