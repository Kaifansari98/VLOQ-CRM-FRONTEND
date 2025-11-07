"use client";

import React from "react";
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
}

const getFileIcon = (ext: string) => {
  switch (ext) {
    case "pdf":
      return { icon: FileText, color: "from-red-500 to-red-600" };
    case "doc":
    case "docx":
      return { icon: FileText, color: "from-blue-500 to-blue-600" };
    case "xls":
    case "xlsx":
      return { icon: FileSpreadsheet, color: "from-green-500 to-green-600" };
    case "ppt":
    case "pptx":
      return { icon: FileSpreadsheet, color: "from-orange-500 to-orange-600" };
    case "zip":
    case "rar":
      return { icon: FileArchive, color: "from-yellow-500 to-yellow-600" };
    case "txt":
    case "md":
      return { icon: FileCode, color: "from-gray-500 to-gray-600" };
    default:
      return { icon: FileType, color: "from-cyan-500 to-cyan-600" };
  }
};

const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  canDelete = false,
  onDelete,
}) => {
  const fileExt = doc.originalName?.split(".").pop()?.toLowerCase() || "file";
  const { icon: Icon, color } = getFileIcon(fileExt);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(doc.id);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(doc.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Error downloading file:", error);
    }
  };

  return (
    <motion.div className="group relative flex items-center gap-4 rounded-xl p-2 border transition-all duration-300 cursor-pointer overflow-hidden">
      {/* ✅ Delete Button */}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-1.5 right-2 p-1 rounded-full dark:bg-red-950 border dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900 transition-all  z-10"
          title="Delete Document"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      )}

      {/* Icon Container */}
      <div className="relative flex-shrink-0 w-20 h-20 rounded-lg p-2 overflow-hidden flex items-center justify-center">
        <div
          className={`relative w-14 h-16 rounded-md shadow-md transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br ${color}`}
        >
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-white/30 rounded-tr-md"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="text-white/90" size={24} />
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white/95 dark:bg-white/90 rounded">
            <span className="text-[8px] font-black tracking-wider text-black">
              .{fileExt.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* File Info */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate pr-6">
            {doc.originalName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {doc.created_at
              ? `Uploaded on ${formatDate(doc.created_at, { month: "short" })}`
              : "Uploaded on: null"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-xs"
            title="View Document"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentCard;
