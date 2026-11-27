import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

// Client chat (staff side): the booking's conversation with the client in the
// Furnix client app. Separate from the internal lead chat.

const base = (vendorId: number, leadId: number) => `/client-chats/vendor/${vendorId}/leads/${leadId}`;

export type ClientChatKind = "TEXT" | "PHOTO" | "DOCUMENT" | "VOICE" | "AUTO";

export interface ClientChatMember {
  id: number;
  name: string;
  role: "Sales Executive" | "Site Supervisor";
  phone: string | null;
  online: boolean;
}

export interface ClientChatMessage {
  id: number;
  at: string;
  sender:
    | { type: "client" }
    | { type: "system" }
    | { type: "staff"; id: number; name: string; role: string };
  own: boolean;
  kind: ClientChatKind;
  text: string | null;
  file: { url: string; name: string | null; size: number | null; mime: string | null } | null;
  duration_sec: number | null;
  auto: { kind: "STAGE" | "VISIT" | "DISPATCH" | "PAYMENT"; title: string | null } | null;
  reply_to_id: number | null;
  deleted: boolean;
  reactions: { emoji: string; count: number; mine: boolean }[];
  delivery: "sent" | "delivered" | "read" | null;
}

export interface ClientChatConversation {
  room_id: number;
  lead: { id: number; lead_code: string | null; client_name: string };
  members: ClientChatMember[];
  client_online: boolean;
  typing: string[];
  messages: ClientChatMessage[];
  has_more: boolean;
  your_read_id: number;
}

/** Latest page of the conversation, refreshed every few seconds while open. */
export function useClientChat(vendorId: number, leadId: number) {
  return useQuery({
    queryKey: ["client-chat", vendorId, leadId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ClientChatConversation }>(`${base(vendorId, leadId)}/messages`);
      return data.data;
    },
    enabled: vendorId > 0 && leadId > 0,
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });
}

export async function fetchOlderClientChat(vendorId: number, leadId: number, before: number) {
  const { data } = await apiClient.get<{ data: ClientChatConversation }>(`${base(vendorId, leadId)}/messages`, {
    params: { before },
  });
  return data.data;
}

export async function sendClientChatMessage(
  vendorId: number,
  leadId: number,
  input: { text?: string; replyToId?: number; file?: File },
) {
  if (input.file) {
    const form = new FormData();
    form.append("file", input.file);
    form.append("data", JSON.stringify({ text: input.text ?? "", reply_to_id: input.replyToId }));
    const { data } = await apiClient.post<{ data: ClientChatMessage }>(`${base(vendorId, leadId)}/messages`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
    });
    return data.data;
  }
  const { data } = await apiClient.post<{ data: ClientChatMessage }>(`${base(vendorId, leadId)}/messages`, {
    text: input.text,
    reply_to_id: input.replyToId,
  });
  return data.data;
}

export const deleteClientChatMessage = (vendorId: number, leadId: number, id: number) =>
  apiClient.delete(`${base(vendorId, leadId)}/messages/${id}`);

export const reactToClientChatMessage = (vendorId: number, leadId: number, id: number, emoji: string) =>
  apiClient.post(`${base(vendorId, leadId)}/messages/${id}/reactions`, { emoji });

export const markClientChatRead = (vendorId: number, leadId: number, lastId: number) =>
  apiClient.post(`${base(vendorId, leadId)}/read`, { last_id: lastId });

export const sendClientChatTyping = (vendorId: number, leadId: number) =>
  apiClient.post(`${base(vendorId, leadId)}/typing`);

export const CLIENT_CHAT_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥"] as const;
