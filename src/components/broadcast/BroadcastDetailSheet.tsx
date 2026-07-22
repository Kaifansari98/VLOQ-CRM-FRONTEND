"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,

  FileCode,
  Download,
  Calendar,
  User,
  ExternalLink,
  History,
  Paperclip,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck,
  Building,
  Tag,
  ArrowDownToLine,
  Eye,
  Video,
  FileImage,
  Presentation,
  FileArchive,
  Megaphone,
} from "lucide-react";
import { BroadcastItem } from "@/types/broadcast";
import { useMarkBroadcastReadMutation, useBroadcastReaders, stripHtmlAndEntities } from "@/api/broadcast";
import { PreviewModal } from "@/components/utils/documentCard";
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

interface BroadcastDetailSheetProps {
  item: BroadcastItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleBookmark?: (id: string) => void;
  isSuperAdmin?: boolean;
}

export const BroadcastDetailSheet: React.FC<BroadcastDetailSheetProps> = ({
  item,
  open,
  onOpenChange,
  isSuperAdmin = false,
}) => {
  const markReadMutation = useMarkBroadcastReadMutation();
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; ext: string } | null>(null);
  const [videoDoc, setVideoDoc] = useState<{ url: string; name: string } | null>(null);

  const numericId = item?.numericId;
  const { data: readersList, isLoading: isLoadingReaders } = useBroadcastReaders(
    isSuperAdmin && open ? numericId : null
  );

  useEffect(() => {
    if (open && numericId && numericId > 0) {
      markReadMutation.mutate(numericId);
    }
  }, [open, numericId]);

  const handleDownloadAll = () => {
    if (!item?.attachments) return;
    item.attachments.forEach((att) => {
      if (att.url) {
        window.open(att.url, "_blank");
      }
    });
  };

  if (!item) return null;

  const getBroadcastTypeIcon = (type: string) => {
    if (type === "document") {
      return (
        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-200">
        <Megaphone className="w-5 h-5" />
      </div>
    );
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-xl p-0 flex flex-col gap-0 border-l shadow-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{item.title || "Broadcast Details"}</SheetTitle>
          <SheetDescription>View broadcast announcement details and attachments</SheetDescription>
        </SheetHeader>
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Hero Section */}
          <div className="flex items-start gap-4">
            {getBroadcastTypeIcon(item.type)}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                  {item.type}
                </Badge>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{item.title}</h2>
              {item.summary && <p className="text-xs text-muted-foreground">{stripHtmlAndEntities(item.summary || "")}</p>}
            </div>
          </div>




          {/* Grid Metadata Specs */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-0.5">Target Audience</span>
              <span className="font-semibold">{item.audience}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] mb-0.5">Last Updated</span>
              <span className="font-semibold">{item.updatedAt}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] mb-0.5">Created By</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={item.updatedBy.avatar} />
                  <AvatarFallback>{item.updatedBy.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{item.updatedBy.name}</span>
              </div>
            </div>
            {isSuperAdmin && (
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Read Count</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {item.readCount} user(s) read
                </span>
              </div>
            )}
          </div>

          {/* Main Tabs (Overview vs Readers list for Super Admin) */}
          <Tabs defaultValue="content" className="w-full">
            {isSuperAdmin && (
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="content" className="text-xs">Broadcast Details</TabsTrigger>
                <TabsTrigger value="readers" className="text-xs">Read Activity ({readersList?.length || item.readCount})</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="content" className="space-y-6 m-0">
              {/* Description Body */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content</h4>
                <div
                  className="text-xs leading-relaxed text-foreground space-y-2 border p-3.5 rounded-lg bg-card break-words w-full max-w-full overflow-x-auto rich-text-container"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
                <style dangerouslySetInnerHTML={{ __html: `
                  .rich-text-container * {
                    max-width: 100% !important;
                    word-break: break-word !important;
                    white-space: pre-wrap !important;
                  }
                  .rich-text-container [style*="background"] {
                    background: transparent !important;
                    background-color: transparent !important;
                  }
                  .rich-text-container [style*="color"] {
                    color: inherit !important;
                  }
                `}} />
              </div>

              {/* Video Embed Links */}
              {item.videoLinks && item.videoLinks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-primary" /> Video Attachments ({item.videoLinks.length})
                  </h4>
                  <div className="space-y-3">
                    {item.videoLinks.map((url, idx) => {
                      const embedUrl = getYouTubeEmbedUrl(url);
                      return (
                        <div key={idx} className="border rounded-xl overflow-hidden bg-card p-2 space-y-2">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={`Video ${idx + 1}`}
                              className="w-full aspect-video rounded-lg"
                              allowFullScreen
                            />
                          ) : (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-xs text-primary underline p-2"
                            >
                              <ExternalLink className="w-4 h-4" /> Watch Video Tutorial
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Attachments ({item.attachments?.length || 0})</span>
                </h4>
                <div className="space-y-2">
                  {item.attachments && item.attachments.length > 0 ? (
                    item.attachments.map((att) => {
                      const ext = getExtension(att.name, att.type);
                      const fileIconInfo = getFileIconInfo(ext);
                      return (
                        <div
                          key={att.id}
                          onClick={() => {
                            if (!att.url) return;
                            if (VIDEO_EXTENSIONS.includes(ext)) {
                              setVideoDoc({ url: att.url, name: att.name });
                            } else if (PREVIEWABLE_EXTENSIONS.includes(ext)) {
                              setPreviewDoc({ url: att.url, name: att.name, ext });
                            } else {
                              window.open(att.url, "_blank");
                            }
                          }}
                          className="group flex items-center justify-between p-3 rounded-xl border bg-card text-xs hover:border-primary/40 hover:shadow-sm cursor-pointer transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className={`p-2 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105 ${fileIconInfo.colorClass}`}>
                              <fileIconInfo.Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">{att.name}</div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span className="font-medium">{ext.toUpperCase()}</span>
                                {att.size && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <span>{att.size}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {att.url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 rounded-lg transition-colors shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(att.url, "_blank");
                              }}
                            >
                              <ArrowDownToLine className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 border rounded-xl border-dashed text-center text-xs text-muted-foreground bg-muted/10">
                      No file attachments for this broadcast
                    </div>
                  )}
                </div>
              </div>


            </TabsContent>

            {/* READERS LIST TAB (Super Admin) */}
            {isSuperAdmin && (
              <TabsContent value="readers" className="space-y-4 m-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Users Who Read This Broadcast</h4>
                {isLoadingReaders ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading readers list...</div>
                ) : readersList && readersList.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {readersList.map((reader) => (
                      <div key={reader.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback>{(reader.user?.user_name || "User").slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground">{reader.user?.user_name || `User #${reader.user_id}`}</div>
                            {reader.user?.email && <div className="text-[10px] text-muted-foreground">{reader.user.email}</div>}
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
                          {new Date(reader.read_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 border rounded-xl border-dashed text-center text-xs text-muted-foreground">
                    No users have marked this broadcast as read yet.
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Footer */}
        <SheetFooter className="p-4 border-t bg-muted/10">
          <Button variant="outline" className="w-full text-xs" onClick={() => onOpenChange(false)}>
            Close Overview
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>

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
    </>
  );
};
