import { apiClient } from "@/lib/apiClient";

export interface LeadChatRoom {
  id: number;
  lead_id: number;
  vendor_id: number;
  created_at: string;
}

export interface CheckLeadChatRoomResponse {
  success: boolean;
  exists: boolean;
  data: LeadChatRoom | null;
}

export interface CreateLeadChatRoomResponse {
  success: boolean;
  created: boolean;
  data: LeadChatRoom;
}

export interface LeadChatMember {
  id: number;
  user_name: string;
  role: string;
  email: string;
  number: string;
}

export interface LeadChatMembersResponse {
  success: boolean;
  count: number;
  data: LeadChatMember[];
}

export interface LeadChatMessage {
  id: number;
  chat_room_id: number;
  sender_id: number;
  message_type: "text" | "attachment";
  message_text: string | null;
  created_at: string;
  attachments?: LeadChatAttachment[];
  mentions?: LeadChatMention[];
}

export interface SendLeadChatMessageResponse {
  success: boolean;
  data: LeadChatMessage;
}

export interface LeadChatAttachment {
  id: number;
  doc_id: number;
  doc_og_name: string;
  doc_sys_name: string;
  created_at: string;
  signed_url: string;
}

export interface LeadChatMention {
  id: number;
  user_name: string;
}

export interface LeadChatMessagesResponse {
  success: boolean;
  total: number;
  todayMessages: LeadChatMessage[];
  messages: LeadChatMessage[];
}

export const checkLeadChatRoom = async (
  leadId: number
): Promise<CheckLeadChatRoomResponse> => {
  const { data } = await apiClient.get(`/leads/chats/lead/${leadId}`);
  return data;
};

export const createLeadChatRoom = async (
  leadId: number,
  userId: number
): Promise<CreateLeadChatRoomResponse> => {
  const { data } = await apiClient.post(`/leads/chats/lead/${leadId}`, {
    user_id: userId,
  });
  return data;
};

export const getLeadChatMembers = async (
  leadId: number,
  vendorId: number
): Promise<LeadChatMembersResponse> => {
  const { data } = await apiClient.post("/leads/chats/members", {
    lead_id: leadId,
    vendor_id: vendorId,
  });
  return data;
};

export const sendLeadChatMessage = async (params: {
  leadId: number;
  vendorId: number;
  userId: number;
  messageText?: string;
  files?: File[];
  mentionUserIds?: number[];
}): Promise<SendLeadChatMessageResponse> => {
  const { leadId, vendorId, userId, messageText, files, mentionUserIds } =
    params;
  const formData = new FormData();
  formData.append("lead_id", String(leadId));
  formData.append("vendor_id", String(vendorId));
  formData.append("user_id", String(userId));
  if (messageText) {
    formData.append("message_text", messageText);
  }
  if (mentionUserIds?.length) {
    mentionUserIds.forEach((id) => {
      if (id && id > 0) {
        formData.append("mention_user_ids", String(id));
      }
    });
  }
  (files ?? []).forEach((file) => {
    formData.append("attachments", file);
  });
  const { data } = await apiClient.post("/leads/chats/messages", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getLeadChatMessages = async (params: {
  leadId: number;
  vendorId: number;
  page?: number;
  limit?: number;
}): Promise<LeadChatMessagesResponse> => {
  const { leadId, vendorId, page = 1, limit = 50 } = params;
  const { data } = await apiClient.get("/leads/chats/messages", {
    params: {
      lead_id: leadId,
      vendor_id: vendorId,
      page,
      limit,
    },
  });
  return data;
};
