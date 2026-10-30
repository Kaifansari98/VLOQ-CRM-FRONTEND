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
  Loader2,
  DraftingCompass,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import VideoViewerModal from "./VideoViewerModal";


export type DesignType = "2D" | "3D" | "2D + 3D";

/**
 * Detects whether a file represents 2D, 3D, or 2D + 3D design:
 * - Bracketed: [2D], [3D], [2D + 3D]
 * - System naming: D{rev}_2D_... (2D), D{rev}_3D_... (3D), D{rev}_... (2D + 3D)
 * - Explicit keywords: 2D+3D, 2D_3D, 2D & 3D, or isolated 2D / 3D tokens
 */
export function detectDesignType(fileName?: string | null): DesignType | null {
  if (!fileName) return null;
  const name = fileName.trim();

  // 1. Bracket format e.g. [2D + 3D], [2D+3D], [2D], [3D]
  const bracketMatch = name.match(/^\[(2D\s*[\+\&]\s*3D|2D_3D|2D\-3D|2D|3D)\]/i);
  if (bracketMatch) {
    const raw = bracketMatch[1].toUpperCase().replace(/\s+/g, "");
    if (raw.includes("+") || raw.includes("&") || raw.includes("_") || raw.includes("-")) {
      return "2D + 3D";
    }
    if (raw === "2D") return "2D";
    if (raw === "3D") return "3D";
  }

  // 2. Explicit 2D+3D / 2D & 3D / 2D_3D anywhere in name
  if (/(2D\s*[\+\&]\s*3D|2D_3D|2D\-3D|2D3D)/i.test(name)) {
    return "2D + 3D";
  }

  // 3. System naming convention: D{rev}_2D_... or D{rev}_3D_...
  const revTypeMatch = name.match(/^D\d+_(2D|3D)_/i);
  if (revTypeMatch) {
    return revTypeMatch[1].toUpperCase() as "2D" | "3D";
  }

  // 4. Standalone 2D / 3D token (bounded by word boundaries, underscores, hyphens, etc.)
  if (/(?:^|[\s_\-\(\[])2D(?:[\s_\-\.\)\]]|$)/i.test(name)) {
    return "2D";
  }
  if (/(?:^|[\s_\-\(\[])3D(?:[\s_\-\.\)\]]|$)/i.test(name)) {
    return "3D";
  }

  // 5. System naming convention for 2D + 3D: D{rev}_... (no 2D_ or 3D_ prefix)
  // e.g. D0_aaaaaaaaaaa_Small_Order_2026-10-30.pdf
  if (/^D\d+_[a-zA-Z0-9]/i.test(name)) {
    return "2D + 3D";
  }

  return null;
}

// ─── 2D Architectural CAD Blueprint Illustration ─────────────────────────────
const Blueprint2DIcon: React.FC = () => (
  <svg
    viewBox="0 0 100 80"
    className="w-full h-full object-cover"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="80" fill="#F8FAFC" className="dark:fill-neutral-900" />
    {/* Blueprint grid */}
    <path
      d="M10 0v80M25 0v80M40 0v80M55 0v80M70 0v80M85 0v80M0 15h100M0 30h100M0 45h100M0 60h100M0 75h100"
      stroke="#E2E8F0"
      strokeWidth="0.5"
      strokeDasharray="1.5 1.5"
      className="dark:stroke-neutral-800"
    />
    {/* Outer wall outline */}
    <rect
      x="12"
      y="8"
      width="76"
      height="64"
      stroke="#334155"
      strokeWidth="2.5"
      fill="#FFFFFF"
      className="dark:stroke-neutral-300 dark:fill-neutral-800"
    />
    {/* Interior walls */}
    <path
      d="M12 40h48M60 8v64M40 8v32M12 56h28M40 56v16"
      stroke="#334155"
      strokeWidth="2"
      strokeLinecap="square"
      className="dark:stroke-neutral-300"
    />
    {/* Door swing arcs (blue CAD style) */}
    <path d="M32 40a12 12 0 0 1 12-12" stroke="#2563EB" strokeWidth="1" strokeDasharray="1.5 1.5" />
    <path d="M60 32a10 10 0 0 1 10-10" stroke="#2563EB" strokeWidth="1" strokeDasharray="1.5 1.5" />
    {/* Windows */}
    <line x1="20" y1="8" x2="32" y2="8" stroke="#38BDF8" strokeWidth="2.5" />
    <line x1="68" y1="8" x2="80" y2="8" stroke="#38BDF8" strokeWidth="2.5" />
    <line x1="88" y1="26" x2="88" y2="46" stroke="#38BDF8" strokeWidth="2.5" />
    <line x1="22" y1="72" x2="44" y2="72" stroke="#38BDF8" strokeWidth="2.5" />
  </svg>
);

// ─── 3D Isometric Room Render Illustration ────────────────────────────────────
const Model3DIcon: React.FC = () => (
  <svg
    viewBox="0 0 100 80"
    className="w-full h-full object-cover"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="80" fill="#F8FAFC" className="dark:fill-neutral-900" />
    {/* Isometric Room Floor */}
    <polygon
      points="50,18 88,38 50,62 12,38"
      fill="#E2E8F0"
      stroke="#CBD5E1"
      strokeWidth="1"
      className="dark:fill-neutral-800 dark:stroke-neutral-700"
    />
    {/* Back Left Wall */}
    <polygon
      points="12,38 50,62 50,34 12,10"
      fill="#CBD5E1"
      stroke="#94A3B8"
      strokeWidth="1"
      className="dark:fill-neutral-700 dark:stroke-neutral-600"
    />
    {/* Back Right Wall */}
    <polygon
      points="50,62 88,38 88,10 50,34"
      fill="#94A3B8"
      stroke="#64748B"
      strokeWidth="1"
      className="dark:fill-neutral-600 dark:stroke-neutral-500"
    />
    {/* Floor lines */}
    <line x1="31" y1="28" x2="69" y2="50" stroke="#CBD5E1" strokeWidth="0.8" />
    <line x1="22" y1="33" x2="60" y2="56" stroke="#CBD5E1" strokeWidth="0.8" />
    {/* Furniture: Bed / Sofa */}
    <polygon points="30,42 44,50 44,42 30,34" fill="#059669" />
    <polygon points="30,42 44,50 40,52 26,44" fill="#10B981" />
    {/* Furniture: Table */}
    <polygon points="54,50 64,55 60,57 50,52" fill="#D97706" />
    {/* Wall Windows */}
    <polygon
      points="18,22 30,29 30,19 18,12"
      fill="#93C5FD"
      stroke="#60A5FA"
      strokeWidth="1"
      fillOpacity="0.85"
    />
    <polygon
      points="68,29 80,22 80,12 68,19"
      fill="#93C5FD"
      stroke="#60A5FA"
      strokeWidth="1"
      fillOpacity="0.85"
    />
  </svg>
);

// ─── Dual 2D + 3D Split Illustration (Side-by-side as shown in image) ────────
const Combo2D3DIcon: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center overflow-hidden">
    <div className="w-1/2 h-full border-r border-neutral-300 dark:border-neutral-700">
      <Blueprint2DIcon />
    </div>
    <div className="w-1/2 h-full">
      <Model3DIcon />
    </div>
  </div>
);

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
  tagLabel?: string;
  isLatest?: boolean;
  disableActions?: boolean;
  alwaysShowText?: boolean;
  compact?: boolean;
  isDesignDoc?: boolean;
  designType?: DesignType;
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

export const PreviewModal: React.FC<PreviewModalProps> = ({ url, fileName, fileExt, onClose }) => {
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
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Failed to load image preview.");
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) {
            setPreviewUrl(objectUrl);
          }
          return;
        }

        const isPdf = fileExt === "pdf" || fileName?.toLowerCase().endsWith(".pdf") || url.toLowerCase().includes(".pdf");
        if (isPdf) {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Failed to load PDF preview.");
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
  tagLabel,
  isLatest = false,
  disableActions = false,
  alwaysShowText = false,
  compact = false,
  isDesignDoc = false,
  designType: propDesignType,
}) => {
  const params = useParams();
  const routeLeadId = Number(params?.lead ?? params?.leadId ?? 0);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const isCustomVendor = useAppSelector(
    (state) => state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only,
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

  // Extract design type
  const effectiveDesignType: DesignType | null =
    propDesignType ||
    detectDesignType(doc.originalName) ||
    (isDesignDoc || tagLabel === "Design" ? "2D + 3D" : null);

  let displayOriginalName = doc.originalName;
  let designTypeTag: string | null = effectiveDesignType;
  if (doc.originalName) {
    const match = doc.originalName.match(/^\[(2D\s*[\+\&]\s*3D|2D_3D|2D\-3D|2D|3D)\]\s*(.*)$/i);
    if (match) {
      displayOriginalName = match[2];
    }
  }

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
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Download error:", err);
      if (typeof window !== "undefined" && doc.signedUrl) {
        const a = document.createElement("a");
        a.href = doc.signedUrl;
        a.rel = "noopener noreferrer";
        a.target = "_blank";
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
            {canDelete && !shouldHideDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded border border-border bg-muted/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"
                aria-label="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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

  if (effectiveDesignType) {
    const isThemeImage = isImage && doc.signedUrl;
    const isThemeVideo = isVideo && doc.signedUrl;

    const tagBg =
      effectiveDesignType === "2D"
        ? "bg-[#0070F3]"
        : effectiveDesignType === "3D"
        ? "bg-[#00A854]"
        : "bg-[#7928CA]";


    return (
      <>
        <motion.div
          transition={{ duration: 0.25 }}
          className={`
            group relative flex items-center gap-3.5 rounded-xl p-3 sm:p-4
            border bg-white dark:bg-neutral-900
            hover:shadow-md transition-all duration-200 w-full min-w-[260px]
            border-neutral-200/90 dark:border-neutral-800
          `}
        >
          {/* Delete Button (restored to original top-right position and style) */}
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

          {/* Left: Thumbnail Box with Colored Tag at Bottom-Left as shown in image */}
          <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-20 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center shadow-xs">
            {isThemeImage ? (
              <img
                src={doc.signedUrl}
                alt={displayOriginalName}
                className="w-full h-full object-cover"
              />
            ) : isThemeVideo ? (
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
            ) : effectiveDesignType === "2D" ? (
              <Blueprint2DIcon />
            ) : effectiveDesignType === "3D" ? (
              <Model3DIcon />
            ) : (
              <Combo2D3DIcon />
            )}

          </div>

          {/* Right: File Info & Bottom Actions Row as shown in image */}
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h3
                className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate pr-6"
                title={displayOriginalName}
              >
                {displayOriginalName}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                <Calendar size={12} className="shrink-0 opacity-70" />
                <span className="truncate">
                  {doc.created_at
                    ? formatDate(doc.created_at, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Date unavailable"}
                </span>
              </div>
            </div>

            {/* Bottom Actions Row: Preview & Download (Left) + Design Tag at Right Bottom Corner */}
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2">
              {isThemeVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                  title="Play"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                title="Download"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{progress ? `${progress}%` : "Preparing..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>

            {/* Design Tag at right bottom corner */}
            <span
              className={`px-2 py-1 rounded-[4px] text-[10px] sm:text-[11px] font-bold text-white shadow-xs leading-none tracking-wide select-none flex items-center justify-center shrink-0 ${tagBg}`}
            >
              {effectiveDesignType}
            </span>
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
                alt={displayOriginalName}
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
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 truncate pr-6" title={displayOriginalName}>
                {displayOriginalName}
              </h3>
            </div>
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

            {/* Status & Design Type / Tag Label */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {tagLabel && (
                <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 shadow-3xs">
                  {tagLabel}
                </span>
              )}
              {isCustomVendor && designTypeTag && (
                <span className="text-zinc-700 font-semibold">
                  {designTypeTag} File
                </span>
              )}
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
