"use client";

import { JSX, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { useSendLeadChatMessage } from "@/hooks/useLeadChatRoom";
import { useAppSelector } from "@/redux/store";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadChatMembers } from "@/hooks/useLeadChatRoom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface ChatInputComponentProps {
  disabled?: boolean;
  leadId: number;
}

interface MentionTag {
  id: number;
  name: string;
  start: number;
  end: number;
}

export default function ChatInputComponent({
  disabled = false,
  leadId,
}: ChatInputComponentProps) {
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<MentionTag[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mentionListRef = useRef<HTMLDivElement | null>(null);
  
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const sendMessageMutation = useSendLeadChatMessage();
  const { data: membersData } = useLeadChatMembers(leadId, vendorId ?? undefined);
  const queryClient = useQueryClient();
  
  const isSending = sendMessageMutation.isPending;
  const isDisabled =
    disabled ||
    isSending ||
    (!messageText.trim() && attachments.length === 0) ||
    !userId ||
    !vendorId;

  const members = membersData?.data ?? [];
  const filteredMembers = members.filter((member) =>
    member.user_name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${nextHeight}px`;
  }, [messageText]);

  // Reset selected index when filtered members change
  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [mentionQuery]);

  // Scroll selected mention into view
  useEffect(() => {
    if (mentionListRef.current && mentionOpen) {
      const selectedElement = mentionListRef.current.children[selectedMentionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedMentionIndex, mentionOpen]);

  const handleSend = () => {
    const trimmed = messageText.trim();
    if ((!trimmed && attachments.length === 0) || !userId || !vendorId) return;

    const mentionUserIds = mentionedUsers.map((m) => m.id);

    sendMessageMutation.mutate(
      {
        leadId,
        vendorId,
        userId,
        messageText: trimmed || undefined,
        files: attachments,
        mentionUserIds,
      },
      {
        onSuccess: () => {
          setMessageText("");
          setAttachments([]);
          setMentionedUsers([]);
          setMentionQuery("");
          setMentionStart(null);
          setMentionOpen(false);
          setSelectedMentionIndex(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          queryClient.invalidateQueries({
            queryKey: ["leadChatMessages", leadId, vendorId],
          });
        },
      }
    );
  };

  const insertMention = (memberId: number, memberName: string) => {
    if (mentionStart === null) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const before = messageText.slice(0, mentionStart);
    const after = messageText.slice(cursorPos);
    
    // Create the mention text with a special marker
    const mentionText = `@${memberName}`;
    const newText = `${before}${mentionText} ${after}`;
    
    // Calculate new mention positions
    const newMentionStart = mentionStart;
    const newMentionEnd = mentionStart + mentionText.length;

    // Update mentioned users list
    setMentionedUsers((prev) => {
      // Remove any overlapping mentions
      const filtered = prev.filter(
        (m) => m.end <= mentionStart || m.start >= cursorPos
      );
      
      // Adjust positions of mentions after this one
      const adjusted = filtered.map((m) => {
        if (m.start > cursorPos) {
          const diff = newText.length - messageText.length;
          return {
            ...m,
            start: m.start + diff,
            end: m.end + diff,
          };
        }
        return m;
      });

      // Add new mention
      return [
        ...adjusted,
        { id: memberId, name: memberName, start: newMentionStart, end: newMentionEnd },
      ];
    });

    setMessageText(newText);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(null);
    setSelectedMentionIndex(0);

    // Set cursor after the mention + space
    requestAnimationFrame(() => {
      const newCursorPos = newMentionEnd + 1; // +1 for the space
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleTextChange = (value: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    
    // Update mentioned users positions if text changed
    if (value.length !== messageText.length) {
      const diff = value.length - messageText.length;
      
      setMentionedUsers((prev) => {
        return prev
          .map((mention) => {
            // If cursor is before this mention, adjust its position
            if (cursorPos <= mention.start) {
              return {
                ...mention,
                start: mention.start + diff,
                end: mention.end + diff,
              };
            }
            // If cursor is inside this mention, remove it
            if (cursorPos > mention.start && cursorPos <= mention.end) {
              return null;
            }
            return mention;
          })
          .filter((m): m is MentionTag => m !== null);
      });
    }

    setMessageText(value);

    // Check for @ symbol to trigger mention dropdown
    const beforeCursor = value.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(null);
      return;
    }

    // Check if @ is at start or after a space
    const charBeforeAt = atIndex > 0 ? beforeCursor[atIndex - 1] : " ";
    if (atIndex > 0 && charBeforeAt !== " " && charBeforeAt !== "\n") {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(null);
      return;
    }

    // Get text after @
    const query = beforeCursor.slice(atIndex + 1);

    // Close if query contains space (user is typing after mention)
    if (query.includes(" ") || query.includes("\n")) {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(null);
      return;
    }

    // Check if we're inside an existing mention - don't open dropdown
    const isInsideMention = mentionedUsers.some(
      (m) => cursorPos > m.start && cursorPos <= m.end
    );
    if (isInsideMention) {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(null);
      return;
    }

    // Open mention dropdown
    setMentionQuery(query);
    setMentionStart(atIndex);
    setMentionOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention dropdown navigation
    if (mentionOpen && filteredMembers.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selectedMember = filteredMembers[selectedMentionIndex];
        if (selectedMember) {
          insertMention(selectedMember.id, selectedMember.user_name);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionOpen(false);
        setMentionQuery("");
        setMentionStart(null);
        return;
      }
    }

    // Send message on Enter (without Shift)
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isDisabled) {
        handleSend();
      }
    }
  };

  // Render message with highlighted mentions
  const renderMessagePreview = () => {
    if (!messageText || mentionedUsers.length === 0) return messageText;

    let lastIndex = 0;
    const parts: JSX.Element[] = [];

    // Sort mentions by start position
    const sortedMentions = [...mentionedUsers].sort((a, b) => a.start - b.start);

    sortedMentions.forEach((mention, idx) => {
      // Add text before mention (invisible)
      if (mention.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className="invisible">
            {messageText.slice(lastIndex, mention.start)}
          </span>
        );
      }

      lastIndex = mention.end;
    });

    // Add remaining text (invisible)
    if (lastIndex < messageText.length) {
      parts.push(
        <span key="text-end" className="invisible">
          {messageText.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="relative w-full bg-background/95 backdrop-blur">
      <div className="w-full pb-3 pt-2">
        <div className="relative rounded-2xl border bg-card p-3">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, idx) => idx !== index))
                    }
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Preview (hidden layer showing highlighted mentions) */}
          {mentionedUsers.length > 0 && (
            <div
              className="pointer-events-none absolute left-[13px] right-3 top-[13px] min-h-[22px] max-h-[120px] overflow-hidden whitespace-pre-wrap break-words p-2 text-sm leading-[1.375rem]"
              style={{ zIndex: 1 }}
            >
              <div className="text-transparent">
                {renderMessagePreview()}
              </div>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="relative min-h-[22px] max-h-[120px] w-full resize-none overflow-y-auto rounded-xl border-0 bg-transparent p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:text-muted-foreground leading-[1.375rem]"
            style={{ zIndex: 2, caretColor: "auto" }}
            placeholder="Send a message... use @ to mention someone"
            disabled={disabled || isSending}
            value={messageText}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Mention Dropdown */}
          {mentionOpen && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 mb-2 w-auto min-w-[200px] max-w-[320px] max-h-60 overflow-y-auto rounded-xl border bg-background shadow-lg">
              <div className="space-y-0.5 p-1">
                {filteredMembers.map((member, index) => (
                  <button
                    key={member.id}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                      index === selectedMentionIndex
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => insertMention(member.id, member.user_name)}
                    onMouseEnter={() => setSelectedMentionIndex(index)}
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(member.user_name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">{member.user_name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {member.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length === 0) return;
                setAttachments((prev) => [...prev, ...files].slice(0, 5));
                event.currentTarget.value = "";
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={disabled || isSending || attachments.length >= 5}
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-full px-4"
              disabled={isDisabled}
              onClick={handleSend}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}