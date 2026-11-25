"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  Paperclip,
  Reply,
  SendHorizontal,
  SmilePlus,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import {
  CLIENT_CHAT_REACTIONS,
  type ClientChatMessage,
  deleteClientChatMessage,
  fetchOlderClientChat,
  markClientChatRead,
  reactToClientChatMessage,
  sendClientChatMessage,
  sendClientChatTyping,
  useClientChat,
} from "@/api/client-chats";

// "Client Chat" tab on a lead's stage pages: the booking's conversation with
// the client in the Furnix client app, in a WhatsApp Web style. The lead's
// team and admins can reply; internal discussion stays in the lead chat.

const ROLE_COLOR: Record<string, string> = {
  "Sales Executive": "#B4430F",
  "Site Supervisor": "#0F766E",
};
const AUTO_ICON = { STAGE: Layers, VISIT: CalendarCheck, DISPATCH: Truck, PAYMENT: Check } as const;
const MAX_FILE = 25 * 1024 * 1024;

const dayLabel = (at: string) => {
  const d = parseISO(at);
  return isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEE, d MMM yyyy");
};
const time = (at: string) => format(parseISO(at), "h:mm a");
const sizeOf = (b: number | null) =>
  !b ? "" : b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const errorText = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong. Please try again.";

function preview(m: ClientChatMessage) {
  if (m.deleted) return "This message was deleted";
  if (m.kind === "PHOTO") return `📷 ${m.text || "Photo"}`;
  if (m.kind === "DOCUMENT") return `📄 ${m.file?.name ?? "Document"}`;
  if (m.kind === "VOICE") return "🎤 Voice note";
  if (m.kind === "AUTO") return m.auto?.title ?? m.text ?? "";
  return m.text ?? "";
}

export function ClientChatTab({ leadId, vendorId }: { leadId: number; vendorId: number }) {
  const queryClient = useQueryClient();
  const chat = useClientChat(vendorId, leadId);
  const [older, setOlder] = useState<ClientChatMessage[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<ClientChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastTyping = useRef(0);
  const lastRead = useRef(0);
  const lastCount = useRef(0);

  const data = chat.data;
  const messages = useMemo(() => {
    const latest = data?.messages ?? [];
    const firstLatest = latest[0]?.id ?? Infinity;
    return [...older.filter((m) => m.id < firstLatest), ...latest];
  }, [data, older]);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const hasMore = hasMoreOlder ?? data?.has_more ?? false;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["client-chat", vendorId, leadId] });

  // Keep the newest message in view, and mark the conversation read.
  useEffect(() => {
    if (!data) return;
    const latestId = data.messages.at(-1)?.id ?? 0;
    if (messages.length !== lastCount.current) {
      const el = scroller.current;
      const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 160 : true;
      if (nearBottom || lastCount.current === 0) requestAnimationFrame(() => el?.scrollTo({ top: el.scrollHeight }));
      lastCount.current = messages.length;
    }
    if (latestId > lastRead.current && document.visibilityState === "visible") {
      lastRead.current = latestId;
      void markClientChatRead(vendorId, leadId, latestId).catch(() => undefined);
    }
  }, [data, messages.length, vendorId, leadId]);

  const loadOlder = async () => {
    if (!messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await fetchOlderClientChat(vendorId, leadId, messages[0].id);
      setOlder((prev) => [...page.messages, ...prev]);
      setHasMoreOlder(page.has_more);
    } catch (e) {
      toastManager.add({ title: errorText(e), type: "error" });
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async () => {
    const body = text.trim();
    if ((!body && !file) || sending) return;
    setSending(true);
    try {
      await sendClientChatMessage(vendorId, leadId, { text: body, replyToId: replyTo?.id, file: file ?? undefined });
      setText("");
      setFile(null);
      setReplyTo(null);
      await refresh();
      requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }));
    } catch (e) {
      toastManager.add({ title: errorText(e), type: "error" });
    } finally {
      setSending(false);
    }
  };

  const onType = (value: string) => {
    setText(value);
    const now = Date.now();
    if (value.trim() && now - lastTyping.current > 3000) {
      lastTyping.current = now;
      void sendClientChatTyping(vendorId, leadId).catch(() => undefined);
    }
  };

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    const ok = f.type.startsWith("image/") || f.type === "application/pdf";
    if (!ok) return toastManager.add({ title: "Send a photo or a PDF.", type: "error" });
    if (f.size > MAX_FILE) return toastManager.add({ title: "That file is too large (max 25 MB).", type: "error" });
    setFile(f);
  };

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      toastManager.add({ title: errorText(e), type: "error" });
    }
  };

  if (chat.isPending)
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (chat.isError || !data)
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <p>{errorText(chat.error)}</p>
        <Button variant="outline" size="sm" onClick={() => chat.refetch()}>
          Try again
        </Button>
      </div>
    );

  const typing = data.typing[0];
  let lastDay = "";

  return (
    <div className="mx-auto flex h-[calc(100vh-220px)] min-h-[520px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#493630] text-sm font-semibold text-white">
          {data.lead.client_name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
          {data.client_online ? (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {data.lead.client_name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">{data.lead.lead_code}</span>
          </p>
          <p className={`truncate text-xs ${typing ? "text-[#E25827]" : "text-muted-foreground"}`}>
            {typing
              ? `${typing.split(" ")[0]} is typing…`
              : data.client_online
                ? "Client is online in the app"
                : `With ${data.members.map((m) => `${m.name} (${m.role})`).join(", ") || "the lead's team"}`}
          </p>
        </div>
        <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 sm:inline">
          Visible to the client
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scroller}
        className="flex-1 space-y-1 overflow-y-auto bg-[#EFE7DE] px-3 py-4 dark:bg-neutral-900 sm:px-6"
      >
        {hasMore ? (
          <div className="mb-2 flex justify-center">
            <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Load older messages
            </Button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to {data.lead.client_name.split(" ")[0]} 👋
          </p>
        ) : null}

        {messages.map((m) => {
          const day = dayLabel(m.at);
          const showDay = day !== lastDay;
          lastDay = day;
          const replied = m.reply_to_id ? byId.get(m.reply_to_id) : undefined;
          return (
            <div key={m.id}>
              {showDay ? (
                <div className="my-3 flex justify-center">
                  <span className="rounded-md bg-white px-3 py-1 text-[11px] text-muted-foreground shadow-sm dark:bg-neutral-800">
                    {day}
                  </span>
                </div>
              ) : null}
              {m.kind === "AUTO" ? (
                <AutoCard message={m} />
              ) : (
                <Bubble
                  message={m}
                  replied={replied}
                  pickerOpen={pickerFor === m.id}
                  onPicker={() => setPickerFor((p) => (p === m.id ? null : m.id))}
                  onReact={(emoji) => {
                    setPickerFor(null);
                    void act(() => reactToClientChatMessage(vendorId, leadId, m.id, emoji));
                  }}
                  onReply={() => setReplyTo(m)}
                  onDelete={() => void act(() => deleteClientChatMessage(vendorId, leadId, m.id))}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t bg-muted/30 p-3">
        {replyTo ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg border-l-4 border-[#E25827] bg-background px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#E25827]">
                Replying to {replyTo.sender.type === "client" ? data.lead.client_name : replyTo.sender.type === "staff" ? replyTo.sender.name : "update"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{preview(replyTo)}</p>
            </div>
            <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : null}
        {file ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs">
            {file.type.startsWith("image/") ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span className="text-muted-foreground">{sizeOf(file.size)}</span>
            <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            aria-label="Attach a photo or PDF"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            aria-label="Attach a photo or PDF"
            onClick={() => fileInput.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <textarea
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder={file ? "Add a caption" : "Type a message to the client"}
            aria-label="Message to the client"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E25827]/30"
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-[#E25827] text-white hover:bg-[#E25827]/90"
            disabled={sending || (!text.trim() && !file)}
            onClick={() => void send()}
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for a new line · Messages here are seen by the client.
        </p>
      </div>
    </div>
  );
}

function AutoCard({ message }: { message: ClientChatMessage }) {
  const Icon = AUTO_ICON[message.auto?.kind ?? "STAGE"];
  return (
    <div className="my-2 flex justify-center">
      <div className="w-full max-w-md rounded-xl border bg-white px-4 py-3 shadow-sm dark:bg-neutral-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7DC] text-[#E25827]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Automatic update to client</p>
            <p className="truncate text-sm font-semibold">{message.auto?.title}</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{time(message.at)}</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{message.text}</p>
      </div>
    </div>
  );
}

function Bubble({
  message: m,
  replied,
  pickerOpen,
  onPicker,
  onReact,
  onReply,
  onDelete,
}: {
  message: ClientChatMessage;
  replied?: ClientChatMessage;
  pickerOpen: boolean;
  onPicker: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  const fromClient = m.sender.type === "client";
  const right = m.own;
  const author = m.sender.type === "staff" ? m.sender : null;
  const canDelete = m.own && !m.deleted && Date.now() - parseISO(m.at).getTime() < 48 * 3600 * 1000;

  return (
    <div className={`group flex ${right ? "justify-end" : "justify-start"} ${m.reactions.length ? "mb-4" : ""}`}>
      <div className={`relative flex max-w-[75%] items-center gap-1 ${right ? "flex-row-reverse" : ""}`}>
        <div
          className={`relative rounded-xl px-3 py-2 text-sm shadow-sm ${
            right ? "bg-[#FFE2D1] dark:bg-[#5a3626]" : "bg-white dark:bg-neutral-800"
          }`}
        >
          {!right ? (
            <p className="mb-0.5 text-xs font-semibold" style={{ color: author ? (ROLE_COLOR[author.role] ?? "#6D28D9") : "#493630" }}>
              {fromClient ? "Client" : `${author?.name} · ${author?.role}`}
            </p>
          ) : null}
          {replied && !m.deleted ? (
            <div className="mb-1.5 rounded-md border-l-4 border-[#E25827] bg-black/5 px-2 py-1 text-xs">
              <p className="font-semibold text-[#E25827]">
                {replied.sender.type === "client" ? "Client" : replied.sender.type === "staff" ? replied.sender.name : "Update"}
              </p>
              <p className="line-clamp-2 text-muted-foreground">{preview(replied)}</p>
            </div>
          ) : null}

          {m.deleted ? (
            <p className="italic text-muted-foreground">🚫 This message was deleted</p>
          ) : m.kind === "PHOTO" && m.file ? (
            <a href={m.file.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.file.url} alt={m.text || "Photo"} className="max-h-72 rounded-lg object-cover" />
            </a>
          ) : m.kind === "DOCUMENT" && m.file ? (
            <a
              href={m.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-black/5 px-3 py-2 hover:bg-black/10"
            >
              <span className="flex h-9 w-8 items-center justify-center rounded bg-red-500 text-[9px] font-bold text-white">PDF</span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{m.file.name}</span>
                <span className="text-xs text-muted-foreground">{sizeOf(m.file.size)}</span>
              </span>
            </a>
          ) : m.kind === "VOICE" && m.file ? (
            <audio controls src={m.file.url} className="h-10 max-w-[260px]" preload="none">
              <track kind="captions" />
            </audio>
          ) : null}
          {!m.deleted && m.text && m.kind !== "VOICE" ? (
            <p className={`whitespace-pre-wrap break-words ${m.kind === "PHOTO" ? "mt-1.5" : ""}`}>{m.text}</p>
          ) : null}

          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            {time(m.at)}
            {m.own && m.delivery ? (
              m.delivery === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Read by client" />
              ) : m.delivery === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5" aria-label="Delivered" />
              ) : (
                <Check className="h-3.5 w-3.5" aria-label="Sent" />
              )
            ) : null}
          </div>

          {m.reactions.length ? (
            <div className={`absolute -bottom-3.5 flex gap-0.5 rounded-full border bg-white px-1.5 py-0.5 text-xs shadow-sm dark:bg-neutral-800 ${right ? "right-2" : "left-2"}`}>
              {m.reactions.map((r) => (
                <span key={r.emoji} title={r.mine ? "Your reaction" : undefined}>
                  {r.emoji}
                  {r.count > 1 ? <span className="ml-0.5 text-muted-foreground">{r.count}</span> : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Hover actions */}
        {!m.deleted ? (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <IconButton label="React" onClick={onPicker}>
              <SmilePlus className="h-4 w-4" />
            </IconButton>
            <IconButton label="Reply" onClick={onReply}>
              <Reply className="h-4 w-4" />
            </IconButton>
            {canDelete ? (
              <IconButton label="Delete for everyone" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </IconButton>
            ) : null}
          </div>
        ) : null}

        {pickerOpen ? (
          <div className={`absolute -top-11 z-10 flex gap-1 rounded-full border bg-white px-2 py-1 shadow-md dark:bg-neutral-800 ${right ? "right-0" : "left-0"}`}>
            {CLIENT_CHAT_REACTIONS.map((e) => (
              <button
                key={e}
                type="button"
                aria-label={`React with ${e}`}
                className={`rounded-full p-1 text-lg hover:bg-muted ${m.reactions.some((r) => r.mine && r.emoji === e) ? "bg-muted" : ""}`}
                onClick={() => onReact(e)}
              >
                {e}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-full p-1.5 text-muted-foreground hover:bg-black/5"
    >
      {children}
    </button>
  );
}

