"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  FileText,
  FileCode,
  Download,
  Calendar,
  User,
  ExternalLink,
  ArrowLeft,
  Eye,
  Video,
  FileImage,
  Presentation,
  FileArchive,
  Megaphone,
  BookOpen,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  ArrowDownToLine,
  Users,
  Search,
  LayoutGrid,
  List,
  Hash,
} from "lucide-react";
import { BroadcastItem } from "@/types/broadcast";
import { useMarkBroadcastReadMutation, useBroadcastReaders, stripHtmlAndEntities } from "@/api/broadcast";
import DocumentCard, { PreviewModal } from "@/components/utils/documentCard";
import VideoViewerModal from "@/components/utils/VideoViewerModal";
import BaseModal from "@/components/utils/baseModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "3gp", "wmv", "flv", "ogg"];
const PREVIEWABLE_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", ...IMAGE_EXTENSIONS];

const getExtension = (name: string, type: string) => {
  if (name) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  if (type) {
    const parts = type.split("/");
    if (parts.length === 2) {
      const ext = parts[1].toLowerCase();
      if (ext === "vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
      if (ext === "vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
      if (ext === "vnd.openxmlformats-officedocument.presentationml.presentation") return "pptx";
      if (ext === "msword") return "doc";
      if (ext === "vnd.ms-excel") return "xls";
      if (ext === "vnd.ms-powerpoint") return "ppt";
      return ext;
    }
  }
  return "file";
};

const getFileIconInfo = (ext: string) => {
  const t = (ext || "").toLowerCase();
  
  if (t === "pdf") {
    return {
      Icon: FileText,
      colorClass: "text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/20",
    };
  }
  if (["xls", "xlsx", "csv"].includes(t)) {
    return {
      Icon: FileSpreadsheet,
      colorClass: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20",
    };
  }
  if (["doc", "docx"].includes(t)) {
    return {
      Icon: FileText,
      colorClass: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20",
    };
  }
  if (["ppt", "pptx"].includes(t)) {
    return {
      Icon: Presentation,
      colorClass: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20",
    };
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(t)) {
    return {
      Icon: FileArchive,
      colorClass: "text-purple-600 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20",
    };
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(t)) {
    return {
      Icon: FileImage,
      colorClass: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20",
    };
  }
  return {
    Icon: FileCode,
    colorClass: "text-slate-600 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/20",
  };
};

interface BroadcastDetailViewProps {
  item: BroadcastItem;
  onBack: () => void;
  onToggleBookmark?: (id: string) => void;
  isSuperAdmin?: boolean;
}

export const BroadcastDetailView: React.FC<BroadcastDetailViewProps> = ({
  item,
  onBack,
  onToggleBookmark,
  isSuperAdmin = false,
}) => {
  const markReadMutation = useMarkBroadcastReadMutation();
  const [activeTab, setActiveTab] = useState<"attachments" | "readers">("attachments");
  const [attachmentViewMode, setAttachmentViewMode] = useState<"grid" | "list">("grid");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; ext: string } | null>(null);
  const [videoDoc, setVideoDoc] = useState<{ url: string; name: string } | null>(null);
  const [readerSearch, setReaderSearch] = useState("");
  const [isReadActivityOpen, setIsReadActivityOpen] = useState(false);

  const numericId = item?.numericId;
  const { data: readersList, isLoading: isLoadingReaders } = useBroadcastReaders(
    isSuperAdmin ? numericId : null
  );

  useEffect(() => {
    if (!isSuperAdmin && numericId && numericId > 0) {
      markReadMutation.mutate(numericId);
    }
  }, [numericId, isSuperAdmin]);

  const isScheduled =
    item.status?.toLowerCase() === "scheduled" ||
    (item.rawPublishAt && !isNaN(new Date(item.rawPublishAt).getTime()) && new Date(item.rawPublishAt) > new Date()) ||
    (item.publishDate && !isNaN(new Date(item.publishDate).getTime()) && new Date(item.publishDate) > new Date());

  const validRecipients = (readersList || []).filter((r) => {
    const name = (r.user?.user_name || "").toLowerCase().trim();
    const email = (r.user?.email || "").toLowerCase().trim();

    // Exclude Vloq Master and Master Admin users from broadcast recipient list
    if (
      name.includes("vloq master") ||
      name.includes("master admin") ||
      email.includes("vloq master") ||
      email.includes("masteradmin")
    ) {
      return false;
    }
    return true;
  });

  const totalSentCount = readersList ? validRecipients.length : Math.max(0, (item.totalSent || 0) - 1);
  const readCount = readersList ? validRecipients.filter((r) => r.is_read || !!r.read_at).length : (item.readCount || 0);
  const unreadCount = Math.max(0, totalSentCount - readCount);

  const handleDownloadAll = () => {
    if (!item?.attachments) return;
    item.attachments.forEach((att) => {
      if (att.url) {
        window.open(att.url, "_blank");
      }
    });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (parsed.hostname.includes("youtu.be")) {
        const v = parsed.pathname.slice(1);
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const filteredReaders = validRecipients.filter((r) => {
    const name = (r.user?.user_name || "").toLowerCase().trim();
    const email = (r.user?.email || "").toLowerCase().trim();
    const q = readerSearch.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-5.5rem)] space-y-4 font-sans">
      <div className="flex flex-col border rounded-2xl bg-card shadow-2xs w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-lg shrink-0 border-border/60 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div
            className={`p-2.5 rounded-2xl border shrink-0 flex items-center justify-center shadow-2xs ${
              item.type === "circular"
                ? "bg-blue-500/10 border-blue-200/80 dark:border-blue-900/50 text-blue-600 dark:text-blue-400"
                : "bg-amber-500/10 border-amber-200/80 dark:border-amber-900/50 text-amber-600 dark:text-amber-400"
            }`}
          >
            {item.type === "circular" ? (
              <Megaphone className="w-5 h-5" />
            ) : (
              <BookOpen className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md border-border/80 text-muted-foreground bg-muted/20">
                {item.id}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded-md ${
                  item.type === "circular"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                }`}
              >
                {item.type}
              </Badge>
              {item.category && (
                <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground">
                  {item.category}
                </Badge>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate mt-1">
              {item.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{(item.publishDate || item.updatedAt || "").split(",")[0].trim() || "N/A"}</span>
          </div>
          {item.updatedBy?.name && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="truncate max-w-[120px]">{item.updatedBy.name}</span>
            </div>
          )}
        </div>
      </div>

        <div className="p-5 border-t space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <FileText className="w-3.5 h-3.5" />
              </span>
              Broadcast Content
            </h3>
          </div>

          <div className="ql-editor ql-snow overflow-y-auto max-h-[480px] pr-3 text-xs sm:text-sm leading-relaxed text-foreground rich-text-container bg-muted/10 p-4 sm:p-5 rounded-xl border border-border/30">
            <div dangerouslySetInnerHTML={{ __html: item.content }} />
            <style dangerouslySetInnerHTML={{ __html: `
              .rich-text-container * {
                max-width: 100% !important;
                overflow-wrap: break-word !important;
                word-break: normal !important;
                hyphens: none !important;
                -webkit-hyphens: none !important;
              }
              .rich-text-container p {
                margin-top: 0 !important;
                margin-bottom: 0.75rem !important;
                line-height: 1.6 !important;
              }
              .rich-text-container p:last-child {
                margin-bottom: 0 !important;
              }
              .rich-text-container u {
                text-decoration: underline;
              }
              .rich-text-container s, .rich-text-container strike {
                text-decoration: line-through;
              }
              .rich-text-container strong, .rich-text-container b {
                font-weight: 700;
              }
              .rich-text-container em, .rich-text-container i {
                font-style: italic;
              }
              .rich-text-container ol {
                list-style-type: decimal;
                padding-left: 1.25rem;
                margin-bottom: 0.75rem;
              }
              .rich-text-container ul {
                list-style-type: disc;
                padding-left: 1.25rem;
                margin-bottom: 0.75rem;
              }
              .rich-text-container li {
                margin-bottom: 0.25rem;
                line-height: 1.6;
              }
            `}} />
          </div>
        </div>

        <div className="p-5 border-t space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <FileArchive className="w-3.5 h-3.5" />
              </span>
              Attachments & Media
            </h3>
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReadActivityOpen(true)}
                className="h-7 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border-primary/20 gap-1.5 rounded-lg cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                {isScheduled
                  ? `Target Audience (${totalSentCount} Users | Scheduled)`
                  : `Read Activity (Read: ${readCount} | Sent: ${totalSentCount})`}
              </Button>
            )}
          </div>

          <div className="space-y-4 m-0">
            {(item.videoLinks?.length ?? 0) === 0 && (item.attachments?.length ?? 0) === 0 ? (
              <div className="p-6 border rounded-xl border-dashed text-center text-xs text-muted-foreground bg-muted/10 flex flex-col items-center justify-center gap-2">
                <FileArchive className="w-6 h-6 text-muted-foreground/40" />
                <span>No attachments or media attached to this broadcast</span>
              </div>
            ) : (
              <>
                {item.videoLinks && item.videoLinks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-primary" /> Video Attachments ({item.videoLinks.length})
                    </h4>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                      {item.videoLinks.map((url, idx) => {
                        const embedUrl = getYouTubeEmbedUrl(url);
                        return (
                          <div key={idx} className="border rounded-xl overflow-hidden bg-card p-2 space-y-1 shadow-2xs">
                            {embedUrl ? (
                              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-xs">
                                <iframe
                                  src={embedUrl}
                                  title={`Video ${idx + 1}`}
                                  className="w-full h-full rounded-lg border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <a
                                href={url.startsWith("http") ? url : `https://${url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-xs text-primary underline p-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Watch Video Tutorial
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {item.attachments && item.attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Document Attachments ({item.attachments.length})
                      </h4>
                      <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border">
                        <button
                          type="button"
                          onClick={() => setAttachmentViewMode("grid")}
                          className={`p-1 rounded-md transition-all ${
                            attachmentViewMode === "grid"
                              ? "bg-background text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="Grid View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachmentViewMode("list")}
                          className={`p-1 rounded-md transition-all ${
                            attachmentViewMode === "list"
                              ? "bg-background text-foreground shadow-2xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title="List View"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className={attachmentViewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "grid grid-cols-1 gap-2"}>
                      {item.attachments.map((att) => (
                        <DocumentCard
                          key={att.id}
                          doc={{
                            id: Number(att.id) || Date.now(),
                            originalName: att.name || "Attachment",
                            signedUrl: att.url || "",
                          }}
                          compact={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {previewDoc && (
        <PreviewModal
          url={previewDoc.url}
          fileName={previewDoc.name}
          fileExt={previewDoc.ext}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {videoDoc && (
        <VideoViewerModal
          open={!!videoDoc}
          videoUrl={videoDoc.url}
          title={videoDoc.name}
          onClose={() => setVideoDoc(null)}
        />
      )}

      {isSuperAdmin && (
        <BaseModal
          open={isReadActivityOpen}
          onOpenChange={setIsReadActivityOpen}
          title={
            isScheduled
              ? `Target Audience (${totalSentCount} Users - Scheduled)`
              : `Read Activity (Read: ${readCount} | Sent: ${totalSentCount})`
          }
          size="md"
          icon={
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Eye className="w-4 h-4" />
            </span>
          }
        >
          <div className="flex flex-col space-y-3 p-4">
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sent users..."
                value={readerSearch}
                onChange={(e) => setReaderSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-lg"
              />
            </div>

            {isLoadingReaders ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading recipients...</div>
            ) : filteredReaders.length > 0 ? (
              <div className="space-y-2 pr-2 max-h-[350px] overflow-y-auto overflow-x-hidden">
                {filteredReaders.map((reader) => {
                  const isUserRead = reader.is_read || !!reader.read_at;
                  return (
                    <div key={reader.user_id || reader.id} className="flex items-center justify-between p-2 rounded-xl border bg-card text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 rounded-lg border">
                          <AvatarFallback className="rounded-lg font-bold text-[10px] bg-primary/10 text-primary">
                            {(reader.user?.user_name || "User").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-xs text-foreground">{reader.user?.user_name || `User #${reader.user_id}`}</div>
                          {reader.user?.email && <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{reader.user.email}</div>}
                        </div>
                      </div>
                      {isUserRead ? (
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {reader.read_at
                            ? new Date(reader.read_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Viewed"}
                        </div>
                      ) : isScheduled ? (
                        <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border border-blue-500/20">
                          <Clock className="w-3 h-3 text-blue-500" />
                          Scheduled for Release
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          Not Viewed Yet
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 border rounded-xl border-dashed text-center text-xs text-muted-foreground bg-muted/10">
                No users found.
              </div>
            )}
          </div>
        </BaseModal>
      )}
    </div>
  );
};
