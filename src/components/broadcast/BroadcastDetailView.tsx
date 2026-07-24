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
  CheckCircle2,

  FileSpreadsheet,
  ArrowDownToLine,
  Users,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { BroadcastItem } from "@/types/broadcast";
import { useMarkBroadcastReadMutation, useBroadcastReaders, stripHtmlAndEntities } from "@/api/broadcast";
import DocumentCard, { PreviewModal } from "@/components/utils/documentCard";
import VideoViewerModal from "@/components/utils/VideoViewerModal";

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
    <div className="flex flex-col h-[calc(100vh-5.5rem)] overflow-hidden space-y-3 font-sans">
      {/* 1. Sleek Compact Single Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/60 shadow-2xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-lg shrink-0 border-border/60 hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {item.type === "circular" ? <Megaphone className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {item.type}
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

            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-2xl">
              {item.title}
            </h1>
          </div>
        </div>

        {/* Compact Right Metadata Strip */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 flex-wrap">
          <div className="flex items-center gap-1.5" title="Published Date">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-foreground text-[11px]">
              {item.publishDate || item.updatedAt}
            </span>
          </div>

          <div className="h-3 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-1.5" title="Created By">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-medium text-foreground text-[11px]">
              {item.updatedBy?.name || "Super Admin"}
            </span>
          </div>

          {isSuperAdmin && item.audience && (
            <>
              <div className="h-3 w-px bg-border/60 hidden sm:block" />
              <div className="flex items-center gap-1.5 max-w-[180px]" title={`Audience: ${item.audience}`}>
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-medium text-foreground text-[11px] truncate">
                  {item.audience}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Main Dashboard Viewport Area (Fills 100% remaining screen height) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Broadcast Content (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full border rounded-2xl bg-card p-4.5 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b shrink-0">
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

          <div className="flex-1 overflow-y-auto pr-2 text-xs leading-relaxed text-foreground space-y-3 rich-text-container bg-muted/10 p-4 rounded-xl border border-border/30">
            <div dangerouslySetInnerHTML={{ __html: item.content }} />
            <style dangerouslySetInnerHTML={{ __html: `
              .rich-text-container * {
                max-width: 100% !important;
                word-break: break-word !important;
              }
              .rich-text-container p {
                margin-bottom: 0.5rem;
              }
              .rich-text-container p:last-child {
                margin-bottom: 0;
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
              }
              .rich-text-container ul {
                list-style-type: disc;
                padding-left: 1.25rem;
              }
            `}} />
          </div>
        </div>

        {/* Right Column: Attachments, Videos & Readers Activity (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full border rounded-2xl bg-card p-4.5 shadow-2xs overflow-hidden">
          {isSuperAdmin ? (
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "attachments" | "readers")} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-full mb-3 shrink-0 gap-1 relative">
                {[
                  {
                    id: "attachments",
                    label: `Attachments (${(item.attachments?.length || 0) + (item.videoLinks?.length || 0)})`,
                  },
                  {
                    id: "readers",
                    label: `Read Activity (${readersList?.length || item.readCount})`,
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as "attachments" | "readers")}
                      className={`relative flex items-center justify-center py-2 text-xs font-bold rounded-full transition-colors duration-200 select-none ${
                        isActive
                          ? "text-white dark:text-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabPill_BroadcastDetail"
                          className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-md"
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <TabsContent value="attachments" className="flex-1 overflow-y-auto space-y-4 m-0 pr-1">
                {/* Video Links */}
                {item.videoLinks && item.videoLinks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-primary" /> Video Attachments ({item.videoLinks.length})
                    </h4>
                    <div className="space-y-2">
                      {item.videoLinks.map((url, idx) => {
                        const embedUrl = getYouTubeEmbedUrl(url);
                        return (
                          <div key={idx} className="border rounded-xl overflow-hidden bg-card p-2 space-y-1 shadow-2xs">
                            {embedUrl ? (
                              <div className="relative w-full aspect-video min-h-[240px] rounded-lg overflow-hidden bg-black shadow-xs">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Document Attachments ({item.attachments?.length || 0})
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
                  {item.attachments && item.attachments.length > 0 ? (
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
                  ) : (
                    <div className="p-4 border rounded-xl border-dashed text-center text-xs text-muted-foreground bg-muted/10">
                      No file attachments for this broadcast
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="readers" className="flex-1 flex flex-col min-h-0 m-0 space-y-2.5">
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
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
                            {reader.user?.email && <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{reader.user.email}</div>}
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
              </TabsContent>
            </Tabs>
          ) : (
            /* Regular User View Right Panel */
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Video Links */}
              {item.videoLinks && item.videoLinks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-primary" /> Video Attachments ({item.videoLinks.length})
                  </h4>
                  <div className="space-y-2">
                    {item.videoLinks.map((url, idx) => {
                      const embedUrl = getYouTubeEmbedUrl(url);
                      return (
                        <div key={idx} className="border rounded-xl overflow-hidden bg-card p-2 space-y-1 shadow-2xs">
                          {embedUrl ? (
                            <div className="relative w-full aspect-video min-h-[240px] rounded-lg overflow-hidden bg-black shadow-xs">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Document Attachments ({item.attachments?.length || 0})
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
                {item.attachments && item.attachments.length > 0 ? (
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
                ) : (
                  <div className="p-4 border rounded-xl border-dashed text-center text-xs text-muted-foreground bg-muted/10">
                    No file attachments for this broadcast
                  </div>
                )}
              </div>
            </div>
          )}
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
    </div>
  );
};
