"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  FileType,
  Trash2,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Loader2 } from "lucide-react";
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
}

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

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  canDelete = false,
  onDelete,
  status,
}) => {
  const fileExt = doc.originalName?.split(".").pop()?.toLowerCase() || "file";
  const { icon: Icon } = getFileIcon(fileExt);

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const getStatusLabel = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "REVISED":
        return "Revised";
      case "PENDING":
        return "Pending";
      default:
        return null;
    }
  };

  const getDotColor = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "REVISED":
        return "bg-amber-500";
      case "PENDING":
        return "bg-blue-500";
      default:
        return "bg-neutral-400 dark:bg-neutral-600";
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(doc.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      // If cross-origin, avoid fetch (likely blocked by CORS) and open directly.
      if (typeof window !== "undefined" && doc.signedUrl) {
        try {
          const url = new URL(doc.signedUrl);
          if (url.origin !== window.location.origin) {
            window.open(doc.signedUrl, "_blank", "noopener,noreferrer");
            return;
          }
        } catch {
          // fall through to fetch if URL parsing fails
        }
      }

      const response = await fetch(doc.signedUrl);

      if (!response.ok || !response.body) {
        throw new Error("Download failed");
      }

      const contentLength = Number(response.headers.get("content-length")) || 0;

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (contentLength) {
          const percent = Math.round((receivedLength / contentLength) * 100);
          setProgress(percent);
        }
      }

      // Merge chunks
      const blob = new Blob(chunks as BlobPart[]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback for cross-origin or unexpected download failures
      if (typeof window !== "undefined" && doc.signedUrl) {
        window.open(doc.signedUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      transition={{ duration: 0.25 }}
      className="
        group relative flex items-center gap-4 rounded-xl p-4
        border border-border 
        bg-white dark:bg-neutral-900
        hover:bg-muted/40 dark:hover:bg-neutral-800
        transition-all duration-200
      "
    >
      {/* 🗑 Delete Button */}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="
            absolute top-3 right-3 p-1
            rounded-full border border-border
            bg-white dark:bg-neutral-900 
            hover:bg-muted dark:hover:bg-neutral-800
            transition-colors
          "
        >
          <Trash2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
        </button>
      )}

      {/* 📄 File Icon */}
      <div className="relative flex-shrink-0 w-20 h-20 p-2 flex items-center justify-center">
        <div
          className="
            relative w-18 h-19 rounded-lg 
            border border-border 
            bg-gray-600/20 dark:bg-neutral-800 
            flex items-center justify-center
            transition-all duration-200 group-hover:scale-[1.03]
          "
        >
          {/* File icon */}
          <Icon className="text-neutral-700 dark:text-neutral-300" size={22} />

          {/* Corner fold */}
          <div
            className="
              absolute top-0 right-0 w-0 h-0 
              border-l-[10px] border-l-transparent
              border-t-[10px] border-t-white/40 dark:border-t-neutral-700/40
            "
          />

          {/* File extension tag */}
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

      {/* 📁 File Info */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 truncate pr-6">
            {doc.originalName}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {doc.created_at
              ? `Uploaded on ${formatDate(doc.created_at, { month: "short" })}`
              : "Uploaded date not available"}
          </p>
        </div>

        {/* 🔘 Actions + Status */}
        <div className="flex items-end justify-between gap-3 mt-3">
          {/* 📥 Download Button */}
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
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress ? `${progress}%` : "Preparing..."}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </button>

          {/* 🟢 Status */}
          {getStatusLabel() && (
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
  );
};

export default DocumentCard;
