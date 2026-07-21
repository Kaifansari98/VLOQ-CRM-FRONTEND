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
} from "lucide-react";
import { BroadcastItem } from "@/types/broadcast";
import { useMarkBroadcastReadMutation, useBroadcastReaders, stripHtmlAndEntities } from "@/api/broadcast";

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

  const numericId = item?.numericId;
  const { data: readersList, isLoading: isLoadingReaders } = useBroadcastReaders(
    isSuperAdmin && open ? numericId : null
  );

  useEffect(() => {
    if (open && numericId && numericId > 0) {
      markReadMutation.mutate(numericId);
    }
  }, [open, numericId]);

  if (!item) return null;

  const getFileIcon = (fileType?: string) => {
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return <div className="p-3 bg-red-500/10 text-red-600 rounded-xl font-black text-xs border border-red-200">PDF</div>;
      case "docx":
      case "doc":
        return <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl font-black text-xs border border-blue-200">DOCX</div>;
      case "xlsx":
      case "xls":
        return <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl font-black text-xs border border-emerald-200">XLSX</div>;
      case "pptx":
      case "ppt":
        return <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl font-black text-xs border border-amber-200">PPTX</div>;
      default:
        return <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl font-black text-xs border border-purple-200">ZIP</div>;
    }
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
            {getFileIcon(item.fileType)}
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

          {/* Action Buttons Row */}
          {item.attachments && item.attachments.length > 0 && item.attachments[0].url && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                className="w-full gap-2 text-xs font-medium h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  window.open(item.attachments![0].url, "_blank");
                }}
              >
                <Download className="w-4 h-4" /> Download Attachment
              </Button>
            </div>
          )}

          {/* Grid Metadata Specs */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-0.5">Department</span>
              <span className="font-semibold">{item.department}</span>
            </div>
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
                  className="text-xs leading-relaxed text-foreground space-y-2 border p-3.5 rounded-lg bg-card whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
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
                              className="w-full h-48 rounded-lg"
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
                    item.attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold truncate">{att.name}</div>
                            <div className="text-[11px] text-muted-foreground">{att.type.toUpperCase()}</div>
                          </div>
                        </div>
                        {att.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => window.open(att.url, "_blank")}
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
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
  );
};
