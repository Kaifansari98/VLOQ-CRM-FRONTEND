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

  const filteredReaders = (readersList || []).filter((r) => {
    const name = (r.user?.user_name || "").toLowerCase();
    const email = (r.user?.email || "").toLowerCase();
    const q = readerSearch.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-5.5rem)] space-y-4 font-sans">
      {/* 1 & 2. Combined Header and Content */}
      <div className="flex flex-col border rounded-2xl bg-card shadow-2xs w-full overflow-hidden">
        {/* Header Strip */}
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

          {/* Styled Icon Box for Circular (Blue Megaphone) & Document (Orange BookOpen) */}
          <div
            className={`p-2.5 rounded-2xl border shrink-0 flex items-center justify-center shadow-2xs ${
              item.type === "circular"
                ? "bg-blue-500/10 border-blue-200/80 dark:border-blue-900/50 text-blue-600 dark:text-blue-400"
                : "bg-amber-500/10 border-amber-200/80 dark:border-amber-900/50 text-amber-600 dark:text-amber-400"
            }`}
          >
            {item.type === "circular" ? (
              <Megaphone className="w-5 h-5 stroke-[2]" />
            ) : (
              <BookOpen className="w-5 h-5 stroke-[2]" />
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground max-w-3xl break-words">
              {item.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {item.type === "circular" ? <Megaphone className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                {item.type}
              </span>

              {/* Broadcast ID Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800">
                <Hash className="w-3 h-3" />
                {item.id}
              </span>

              {/* Category Badge */}
              {item.type === "document" && item.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                  <span className="text-indigo-500/70 font-normal">Category:</span>
                  <span className="font-bold">{item.category}</span>
                </span>
              )}

              {/* Status Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {item.status}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column Metadata Strip with Vertical Dividers */}
        {(() => {
          const rawDateStr = item.publishDate || item.updatedAt || "";
          const parts = rawDateStr.includes(",") ? rawDateStr.split(",") : [rawDateStr, ""];
          const datePart = parts[0]?.trim() || "N/A";
          const timePart = parts.slice(1).join(",").trim();

          return (
            <div className="flex items-center divide-x divide-border/60 text-xs shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
              {/* Published On */}
              <div className="px-4 first:pl-0 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.2]" />
                  <span>Published On</span>
                </div>
                <div className="font-bold text-foreground text-xs leading-tight">
                  <div>{datePart}</div>
                  {timePart && <div className="text-[11px] font-medium text-muted-foreground mt-0.5">{timePart}</div>}
                </div>
              </div>

              {/* Created By */}
              <div className="px-4 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[2.2]" />
                  <span>Created By</span>
                </div>
                <div className="font-bold text-foreground text-xs leading-tight">
                  {item.updatedBy?.name || "Super Admin"}
                </div>
              </div>

              {/* Target Audience (Only for Super Admin) */}
              {isSuperAdmin && (
                <div className="px-4 last:pr-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
                    <Users className="w-4 h-4 text-foreground shrink-0 stroke-[2.2]" />
                    <span>Target Audience</span>
                  </div>
                  {(() => {
                    const rawAud = item.audience || "";
                    const isAll = !rawAud || rawAud === "-" || rawAud.toLowerCase() === "all users" || rawAud.toLowerCase() === "all organization users";
                    if (isAll) {
                      return (
                        <div className="font-bold text-foreground text-xs leading-tight">
                          All Organization Users
                        </div>
                      );
                    }

                    const audienceList = rawAud.split(",").map((s) => s.trim()).filter(Boolean);

                    if (audienceList.length <= 1) {
                      return (
                        <div className="font-bold text-foreground text-xs leading-tight max-w-[180px] truncate">
                          {audienceList[0] || rawAud}
                        </div>
                      );
                    }

                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1.5 font-bold text-foreground text-xs leading-tight hover:opacity-80 cursor-pointer transition-opacity text-left group">
                            <span className="truncate max-w-[120px]">{audienceList[0]}</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-foreground border border-border/80 group-hover:bg-accent transition-colors shrink-0">
                              +{audienceList.length - 1}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-3 space-y-2 shadow-md border rounded-xl">
                          <div className="flex items-center justify-between pb-1.5 border-b text-xs font-bold text-foreground">
                            <span className="flex items-center gap-1.5 text-foreground">
                              <Users className="w-3.5 h-3.5 text-foreground" />
                              Target Audience ({audienceList.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                            {audienceList.map((aud, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-muted/80 text-foreground border border-border"
                              >
                                {aud}
                              </span>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })()}
      </div>

        {/* Broadcast Content Box */}
        <div className="flex flex-col p-4 border-t border-border/40 w-full">
          <div className="flex items-center justify-between pb-3 mb-3 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-3.5 h-3.5" />
              </span>
              Broadcast Content
            </h3>
            {item.category && (
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                {item.category}
              </span>
            )}
          </div>

          <div className="overflow-y-auto max-h-[480px] pr-3 text-xs sm:text-sm leading-relaxed text-foreground rich-text-container bg-muted/10 p-4 sm:p-5 rounded-xl border border-border/30">
            <div dangerouslySetInnerHTML={{ __html: item.content }} />
            <style dangerouslySetInnerHTML={{ __html: `
              .rich-text-container * {
                max-width: 100% !important;
                overflow-wrap: break-word !important;
                word-break: normal !important;
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
                margin-bottom: 0.5rem;
              }
              .rich-text-container ul {
                list-style-type: disc;
                padding-left: 1.25rem;
                margin-bottom: 0.5rem;
              }
              .rich-text-container li {
                margin-bottom: 0.25rem;
              }
            `}} />
          </div>
        </div>
      </div>

      {/* Lower Section: Attachments & Media (Full Width) */}
      <div className="w-full">
        {/* Attachments Box */}
        <div className="flex flex-col border rounded-2xl bg-card p-4.5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b shrink-0 gap-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 m-0">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
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
                Read Activity (Read: {readersList?.length || item.readCount} | Sent: {item.totalSent || 0})
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
                {/* Video Links */}
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

                {/* File Attachments */}
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

      {/* Modals */}
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

      {/* Read Activity Modal */}
      {isSuperAdmin && (
        <BaseModal
          open={isReadActivityOpen}
          onOpenChange={setIsReadActivityOpen}
          title={`Read Activity (Read: ${readersList?.length || item.readCount} | Sent: ${item.totalSent || 0})`}
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
                placeholder="Search readers..."
                value={readerSearch}
                onChange={(e) => setReaderSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-lg"
              />
            </div>

            {isLoadingReaders ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading readers...</div>
            ) : filteredReaders.length > 0 ? (
              <div className="space-y-2 pr-2 max-h-[350px] overflow-y-auto overflow-x-hidden">
                {filteredReaders.map((reader) => (
                  <div key={reader.id} className="flex items-center justify-between p-2 rounded-xl border bg-card text-xs">
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
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      {new Date(reader.read_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border rounded-xl border-dashed text-center text-xs text-muted-foreground bg-muted/10">
                No readers found.
              </div>
            )}
          </div>
        </BaseModal>
      )}
    </div>
  );
};
