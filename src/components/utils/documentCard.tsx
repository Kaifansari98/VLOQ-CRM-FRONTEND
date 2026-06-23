"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileType,
  Trash2,
  Download,
  Eye,
  Play,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import VideoViewerModal from "./VideoViewerModal";

interface DocumentData {
  id: number;
  originalName: string;
  signedUrl: string;
  created_at?: string;
}

interface DocumentCardProps {
  doc: DocumentData;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
  status?: "APPROVED" | "REJECTED" | "PENDING" | string;
  isLatest?: boolean;
  disableActions?: boolean;
  alwaysShowText?: boolean;
  compact?: boolean;
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "3gp", "wmv", "flv", "ogg"];
const PREVIEWABLE_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", ...IMAGE_EXTENSIONS];
const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

const getFileIcon = (ext: string) => {
  switch (ext) {
    case "pdf":
      return { icon: FileText };
    case "doc":
    case "docx":
      return { icon: FileText };
    case "xls":
    case "xlsx":
      return { icon: FileSpreadsheet };
    case "ppt":
    case "pptx":
      return { icon: FileSpreadsheet };
    case "zip":
    case "rar":
      return { icon: FileArchive };
    case "txt":
    case "md":
      return { icon: FileCode };
    default:
      return { icon: FileType };
  }
};

const getOfficePreviewUrl = (signedUrl: string): string =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`;

// ─── Preview Modal ────────────────────────────────────────────────────────────

interface PreviewModalProps {
  url: string;
  fileName: string;
  fileExt: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ url, fileName, fileExt, onClose }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isImage = IMAGE_EXTENSIONS.includes(fileExt);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const preparePreview = async () => {
      try {
        setIframeLoaded(false);
        setPreviewError(null);

        if (isImage) {
          if (!cancelled) {
            setPreviewUrl(url);
          }
          return;
        }

        if (fileExt === "pdf") {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Unable to load PDF preview.");
          }

          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);

          if (!cancelled) {
            setPreviewUrl(objectUrl);
          }
          return;
        }

        if (OFFICE_EXTENSIONS.includes(fileExt)) {
          setPreviewUrl(getOfficePreviewUrl(url));
          return;
        }

        setPreviewError("Preview is not available for this file type.");
      } catch (error: any) {
        if (!cancelled) {
          setPreviewError(error?.message || "Failed to load preview.");
        }
      }
    };

    preparePreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileExt, url, isImage]);

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex flex-col"
      onClick={onClose}
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-white dark:bg-neutral-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-muted text-neutral-500 dark:text-neutral-400">
              {fileExt}
            </span>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {fileName}
            </span>
            <button
              onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              className="p-1 rounded text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        {/* Iframe area */}
        <div className="relative flex-1 min-h-0 bg-neutral-100 dark:bg-neutral-950 flex flex-col">
          {!previewError && (!previewUrl || (!iframeLoaded && !isImage)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-900">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading preview…</span>
            </div>
          )}
          {previewError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-neutral-900">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {previewError}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                Open File In New Tab
              </Button>
            </div>
          ) : previewUrl ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt={`Preview — ${fileName}`}
                  className="max-w-full max-h-full object-contain drop-shadow-md rounded"
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
            ) : (
              <iframe
                src={previewUrl}
                title={`Preview — ${fileName}`}
                className="absolute inset-0 w-full h-full border-0 bg-white"
                onLoad={() => setIframeLoaded(true)}
                allow="fullscreen"
              />
            )
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ─── DocumentCard ─────────────────────────────────────────────────────────────

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  canDelete = false,
  onDelete,
  status,
  isLatest = false,
  disableActions = false,
  alwaysShowText = false,
  compact = false,
}) => {
  const params = useParams();
  const routeLeadId = Number(params?.lead ?? params?.leadId ?? 0);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const { shouldDisableBlockedActions: shouldDisableRouteBlockedActions } =
    useLeadAccessControl({
      leadId: routeLeadId || undefined,
      userType,
    });
  const shouldHideDelete =
    disableActions || shouldDisableRouteBlockedActions;
  const fileExt = doc.originalName?.split(".").pop()?.toLowerCase() || "file";
  const { icon: Icon } = getFileIcon(fileExt);
  const isImage = IMAGE_EXTENSIONS.includes(fileExt);
  const isVideo = VIDEO_EXTENSIONS.includes(fileExt);
  const canPreview = PREVIEWABLE_EXTENSIONS.includes(fileExt);

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const getStatusLabel = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED": return "Approved";
      case "REJECTED": return "Rejected";
      case "REVISED": return "Revised";
      case "PENDING": return "Pending";
      default: return null;
    }
  };
  const hasStatus = Boolean(getStatusLabel());

  const getDotColor = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED": return "bg-green-500";
      case "REJECTED": return "bg-red-500";
      case "REVISED": return "bg-amber-500";
      case "PENDING": return "bg-blue-500";
      default: return "bg-neutral-400 dark:bg-neutral-600";
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shouldHideDelete) return;
    onDelete?.(doc.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      const response = await fetch(doc.signedUrl);

      if (!response.ok || !response.body) {
        throw new Error("Download failed");
      }

      const contentLength = Number(response.headers.get("content-length")) || 0;
      const disposition = response.headers.get("content-disposition") || "";
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        if (contentLength) {
          setProgress(Math.round((receivedLength / contentLength) * 100));
        }
      }

      const blob = new Blob(chunks as BlobPart[]);
      const url = window.URL.createObjectURL(blob);

      const filenameFromHeader = (() => {
        const match =
          disposition.match(/filename\*=UTF-8''([^;]+)/i) ||
          disposition.match(/filename="?([^"]+)"?/i);
        return match ? decodeURIComponent(match[1]) : "";
      })();

      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFromHeader || doc.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      if (typeof window !== "undefined" && doc.signedUrl) {
        const a = document.createElement("a");
        a.href = doc.signedUrl;
        a.download = doc.originalName;
        a.rel = "noopener noreferrer";
        a.target = "_self";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (compact) {
    return (
      <>
        <div
          className={`
            group relative flex items-center gap-3 rounded-lg p-2.5
            border border-border bg-white dark:bg-neutral-900
            hover:bg-muted/30 dark:hover:bg-neutral-800
            transition-all duration-200 w-full min-w-[200px]
          `}
        >
          {/* File Icon */}
          <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
            <div
              className="
                relative w-11 h-11 rounded-md 
                border border-border 
                bg-gray-600/10 dark:bg-neutral-800 
                flex items-center justify-center
                overflow-hidden
              "
            >
              {isImage ? (
                <img
                  src={doc.signedUrl}
                  alt={doc.originalName}
                  className="w-full h-full object-cover"
                />
              ) : isVideo ? (
                <div
                  className="relative w-full h-full cursor-pointer flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                >
                  <video
                    src={doc.signedUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ) : (
                <Icon className="text-neutral-700 dark:text-neutral-300" size={18} />
              )}
            </div>
          </div>

          {/* File Info */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate pr-1" title={doc.originalName}>
              {doc.originalName}
            </h3>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              {fileExt.toUpperCase()} file
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            {isVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideo(true);
                }}
                className="p-1.5 rounded border border-border bg-muted/20 text-neutral-600 dark:text-neutral-400 hover:bg-muted transition"
                aria-label="Play video"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}
            {canPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="p-1.5 rounded border border-border bg-muted/20 text-neutral-600 dark:text-neutral-400 hover:bg-muted transition"
                aria-label="Preview document"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-1.5 rounded border border-border bg-muted/20 text-neutral-600 dark:text-neutral-400 hover:bg-muted transition disabled:opacity-50"
              aria-label="Download document"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Modals */}
        {showPreview && (
          <PreviewModal
            url={doc.signedUrl}
            fileName={doc.originalName}
            fileExt={fileExt}
            onClose={() => setShowPreview(false)}
          />
        )}
        {showVideo && (
          <VideoViewerModal
            open={showVideo}
            videoUrl={doc.signedUrl}
            title={doc.originalName}
            onClose={() => setShowVideo(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <motion.div
        transition={{ duration: 0.25 }}
        className={`
          group relative flex items-center gap-4 rounded-xl p-4
          border bg-white dark:bg-neutral-900
          hover:bg-muted/40 dark:hover:bg-neutral-800
          transition-all duration-200 w-full min-w-[250px] sm:min-w-[300px]
          @container
          ${isLatest
            ? "border-emerald-400 ring-1 ring-emerald-200 dark:border-emerald-500/70 dark:ring-emerald-500/20"
            : "border-border"
          }
        `}
      >
        {/* Delete Button */}
        {canDelete && !shouldHideDelete && (
          <button
            type="button"
            onClick={handleDelete}
            title="Delete"
            className="
              absolute top-3 right-3 p-1
              rounded-full border border-border
              bg-white dark:bg-neutral-900 
              hover:bg-muted dark:hover:bg-neutral-800
              transition-colors
            "
            aria-label="Delete document"
          >
            <Trash2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          </button>
        )}

        {/* File Icon */}
        <div className="relative flex-shrink-0 w-20 h-20 p-2 flex items-center justify-center">
          <div
            className="
              relative w-18 h-19 rounded-lg 
              border border-border 
              bg-gray-600/20 dark:bg-neutral-800 
              flex items-center justify-center
              transition-all duration-200 group-hover:scale-[1.03]
              overflow-hidden
            "
          >
            {isImage ? (
              <img
                src={doc.signedUrl}
                alt={doc.originalName}
                className="w-full h-full object-cover"
              />
            ) : isVideo ? (
              <div
                className="relative w-full h-full cursor-pointer flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowVideo(true);
                }}
              >
                <video
                  src={doc.signedUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors">
                  <Play className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              <Icon className="text-neutral-700 dark:text-neutral-300" size={22} />
            )}
            
            {!isImage && (
              <div
                className="
                  absolute top-0 right-0 w-0 h-0 
                  border-l-[10px] border-l-transparent
                  border-t-[10px] border-t-white/40 dark:border-t-neutral-700/40
                "
              />
            )}
            <div
              className="
                absolute -bottom-1.5 left-1/2 -translate-x-1/2 
                px-2 pb-[1px] rounded-md
                bg-white dark:bg-neutral-900 
                border border-border
              "
            >
              <span className="text-[8px] font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide">
                .{fileExt.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 truncate pr-6">
              {doc.originalName}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {doc.created_at
                ? `Uploaded on ${formatDate(doc.created_at, {
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
                : "Uploaded date not available"}
            </p>
          </div>

          {/* Actions + Status */}
          <div className="flex items-end justify-between gap-3 mt-3">
            <div className="flex items-center gap-2">
              {/* Play Button for videos */}
              {isVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                    border border-border 
                    bg-muted/30 dark:bg-neutral-800/40 
                    text-neutral-700 dark:text-neutral-300 text-xs font-medium
                    hover:bg-muted transition dark:hover:bg-neutral-700
                  "
                  aria-label="Play video"
                  title="Play"
                >
                  <Play className="w-4 h-4" />
                  {alwaysShowText ? (
                    <span>Play</span>
                  ) : (
                    !hasStatus && <span className="hidden @sm:inline">Play</span>
                  )}
                </button>
              )}
              {/* Preview Button — only for previewable types */}
              {canPreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPreview(true);
                  }}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                    border border-border 
                    bg-muted/30 dark:bg-neutral-800/40 
                    text-neutral-700 dark:text-neutral-300 text-xs font-medium
                    hover:bg-muted transition dark:hover:bg-neutral-700
                  "
                  aria-label="Preview document"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                  {alwaysShowText ? (
                    <span>Preview</span>
                  ) : (
                    !hasStatus && <span className="hidden @sm:inline">Preview</span>
                  )}
                </button>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                  border border-border 
                  bg-muted/30 dark:bg-neutral-800/40 
                  text-neutral-700 dark:text-neutral-300 text-xs font-medium
                  hover:bg-muted transition dark:hover:bg-neutral-700
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
                aria-label="Download document"
                title="Download"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className={alwaysShowText ? "" : "hidden @sm:inline"}>
                      {progress ? `${progress}%` : "Preparing..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {alwaysShowText ? (
                      <span>Download</span>
                    ) : (
                      !hasStatus && <span className="hidden @sm:inline">Download</span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Status */}
            {hasStatus && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getDotColor()}`} />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {getStatusLabel()}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          url={doc.signedUrl}
          fileName={doc.originalName}
          fileExt={fileExt}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Video Viewer Modal */}
      {showVideo && (
        <VideoViewerModal
          open={showVideo}
          videoUrl={doc.signedUrl}
          title={doc.originalName}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
};

export default DocumentCard;
