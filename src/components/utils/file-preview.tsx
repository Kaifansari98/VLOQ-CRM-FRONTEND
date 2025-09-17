"use client";

import React from "react";
import { FileText } from "lucide-react"; // single icon
import { getFileExtension } from "@/components/utils/filehelper";

interface DocumentPreviewProps {
  file: {
    doc_sys_name: string;
    doc_og_name?: string;
    signedUrl?: string;
  };
  size?: "small" | "medium" | "large";
  onClick?: () => void;
}

const sizeClasses = {
  small: "h-20 sm:h-24",
  medium: "h-28 sm:h-32",
  large: "h-32 sm:h-36",
};

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  file,
  size = "medium",
  onClick,
}) => {
  const ext = getFileExtension(file.doc_sys_name).toLowerCase();

  return (
    <div className="relative group">
      <div
        onClick={onClick}
        className={`${sizeClasses[size]} w-full flex flex-col items-center justify-center bg-gray-100 
          border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 
          transition-colors cursor-pointer p-2`}
      >
        <FileText size={24} className="text-gray-500" />
        <span className="text-xs sm:text-sm font-semibold text-gray-700 mt-1">
          .{ext.toUpperCase()}
        </span>
      </div>

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
        <span className="text-white text-xs sm:text-sm font-medium px-2 text-center">
          {file.doc_og_name ?? "document"}
        </span>
      </div>
    </div>
  );
};

export default DocumentPreview;
