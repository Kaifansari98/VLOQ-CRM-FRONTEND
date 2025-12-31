"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, Download } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import DocumentCard from "../utils/documentCard";
import {
  useLeadChatMembers,
  useLeadChatMessages,
} from "@/hooks/useLeadChatRoom";
import { useSearchParams } from "next/navigation";

interface ChatMessagesComponentProps {
  leadId: number;
  vendorId: number;
  userId: number;
}

export default function ChatMessagesComponent({
  leadId,
  vendorId,
  userId,
}: ChatMessagesComponentProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useLeadChatMessages(leadId, vendorId, 20); // Load 20 messages at a time
  const { data: membersData } = useLeadChatMembers(leadId, vendorId);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const previousScrollHeight = useRef(0);
  const previousScrollTop = useRef(0);
  const isInitialMount = useRef(true);
  const hasScrolledToMessage = useRef(false);
  const searchParams = useSearchParams();
  const messageIdParam = Number(searchParams.get("messageId"));

  // Intersection observer with better configuration for reverse scroll
  const { ref: topSentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px 0px 0px 0px",
    root: scrollContainerRef.current,
  });

  const memberMap = useMemo(() => {
    const map = new Map<number, { name: string; role: string }>();
    for (const member of membersData?.data ?? []) {
      map.set(member.id, { name: member.user_name, role: member.role });
    }
    return map;
  }, [membersData]);

  const allMessages = useMemo(() => {
    const messages = data?.pages.flatMap((page) => [
      ...page.messages,
      ...page.todayMessages,
    ]) ?? [];
    
    return messages.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [data]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: typeof allMessages }[] = [];
    let currentDate = "";
    let currentGroup: typeof allMessages = [];

    allMessages.forEach((message) => {
      const messageDate = format(new Date(message.created_at), "yyyy-MM-dd");
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [allMessages]);

  // Initial scroll to bottom - immediate, no animation
  useEffect(() => {
    if (isInitialMount.current && !isLoading && allMessages.length > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
          setHasScrolledToBottom(true);
          isInitialMount.current = false;
        });
      }
    }
  }, [isLoading, allMessages.length]);

  // Load more messages when scrolling to top
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && hasScrolledToBottom) {
      const container = scrollContainerRef.current;
      if (container) {
        // Store current scroll position and height before loading
        previousScrollHeight.current = container.scrollHeight;
        previousScrollTop.current = container.scrollTop;
      }
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, hasScrolledToBottom]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (!isFetchingNextPage && previousScrollHeight.current > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        // Use requestAnimationFrame for smooth scroll restoration
        requestAnimationFrame(() => {
          const heightDifference = container.scrollHeight - previousScrollHeight.current;
          // Maintain relative position by adding the height difference
          container.scrollTop = previousScrollTop.current + heightDifference;
          // Reset refs
          previousScrollHeight.current = 0;
          previousScrollTop.current = 0;
        });
      }
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (!messageIdParam || hasScrolledToMessage.current || isLoading) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const selector = `[data-message-id="${messageIdParam}"]`;
    const target = container.querySelector(selector) as HTMLElement | null;

    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolledToMessage.current = true;
      });
      return;
    }

    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, messageIdParam]);

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    }
    
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    }
    
    return format(date, "MMM d, yyyy");
  };

  const isImageFile = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const renderMessageText = (
    text: string,
    mentions: { id: number; user_name: string }[] | undefined,
    isMine: boolean
  ) => {
    if (!mentions?.length) {
      return (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {text}
        </p>
      );
    }

    const names = mentions.map((m) => escapeRegex(m.user_name));
    const regex = new RegExp(`@(${names.join("|")})\\b`, "gi");
    const parts: Array<{ type: "text" | "mention"; value: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      if (start > lastIndex) {
        parts.push({ type: "text", value: text.slice(lastIndex, start) });
      }
      parts.push({ type: "mention", value: match[0] });
      lastIndex = end;
    }

    if (lastIndex < text.length) {
      parts.push({ type: "text", value: text.slice(lastIndex) });
    }

    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {parts.map((part, idx) =>
          part.type === "mention" ? (
            <span
              key={`${part.value}-${idx}`}
              className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                isMine
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {part.value}
            </span>
          ) : (
            <span key={`${part.value}-${idx}`}>{part.value}</span>
          )
        )}
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading messages...
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Start the conversation below</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef} 
      className="flex h-full flex-col overflow-y-auto py-4"
      style={{ scrollBehavior: "auto" }}
    >
      {/* Top sentinel for infinite scroll */}
      <div ref={topSentinelRef} className="flex justify-center py-2">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading earlier messages...
          </div>
        )}
        {!hasNextPage && !isFetchingNextPage && (
          <div className="rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            Beginning of conversation
          </div>
        )}
      </div>

      <div className="space-y-6">
        {groupedMessages.map((group) => (
          <div key={group.date} className="space-y-3">
            <div className="sticky top-2 z-10 flex items-center justify-center">
              <div className="rounded-full border bg-background/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                {getDateLabel(group.date)}
              </div>
            </div>

            {group.messages.map((message, idx) => {
              const isMine = message.sender_id === userId;
              const meta = memberMap.get(message.sender_id);
              const showAvatar = idx === 0 || group.messages[idx - 1]?.sender_id !== message.sender_id;

              const images = message.attachments?.filter((a) => isImageFile(a.doc_og_name)) || [];
              const documents = message.attachments?.filter((a) => !isImageFile(a.doc_og_name)) || [];

              return (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[75%] gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(meta?.name || "User")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </div>

                    <div className={`group relative flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && showAvatar && (
                        <div className="mb-0.5 flex items-center gap-2 px-3 text-xs">
                          <span className="font-semibold text-foreground">{meta?.name || "Unknown"}</span>
                          {meta?.role && <span className="text-muted-foreground">{meta.role}</span>}
                        </div>
                      )}

                      {/* Images Grid */}
                      {images.length > 0 && (
                        <div className={`grid gap-1 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : images.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                          {images.map((img) => (
                            <a key={img.id} href={img.signed_url} target="_blank" rel="noreferrer" className="group/img relative block overflow-hidden rounded-lg">
                              <img src={img.signed_url} alt={img.doc_og_name} className={`object-cover transition-transform group-hover/img:scale-105 ${images.length === 1 ? "h-64 w-full max-w-xs" : "h-32 w-32"}`} />
                              <div className="absolute inset-0 bg-black/0 transition-colors group-hover/img:bg-black/10" />
                              <div className="absolute bottom-1 right-1 rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover/img:opacity-100">
                                <Download className="h-3 w-3 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Documents - Use DocumentCard */}
                      {documents.length > 0 && (
                        <div className={`flex flex-col gap-2 ${images.length > 0 ? "mt-2" : ""} max-w-sm`}>
                          {documents.map((doc) => (
                            <div key={doc.id} className="w-full">
                              <DocumentCard
                                doc={{
                                  id: doc.id,
                                  originalName: doc.doc_og_name,
                                  signedUrl: doc.signed_url,
                                  created_at: doc.created_at,
                                }}
                                canDelete={false}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text Message */}
                      {message.message_text && (
                        <div className={`rounded-2xl px-3 py-2 ${isMine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted"} ${images.length > 0 || documents.length > 0 ? "mt-1" : ""}`}>
                          {renderMessageText(
                            message.message_text,
                            message.mentions,
                            isMine
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="px-1 text-[10px] text-muted-foreground">
                        {format(new Date(message.created_at), "h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
