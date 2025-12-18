"use client";

import { Trash2, SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import ImageViewerModal from "./ImageViewerModal";

import { useState } from "react";
import Image from "next/image";

interface DocumentCardProps {
  doc: {
    id: number | string;
    doc_og_name: string;
    signedUrl: string;
    created_at?: string;
  };
  index?: number;
  canDelete?: boolean;
  onView?: (index: number) => void;
  onDelete?: (id: number | string) => void;
  status?: "APPROVED" | "REJECTED" | "PENDING" | string;
  isLoading?: boolean;
}

// Skeleton Loading Component
export const DocumentCardSkeleton: React.FC<{
  canDelete?: boolean;
  status?: boolean;
}> = ({ canDelete = false, status }) => {
  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-xl p-3 border border-border bg-card dark:bg-neutral-900">
      {/* Delete Button Skeleton */}
      {canDelete && (
        <div className="absolute top-3 right-1.5 p-1 rounded-full bg-gray-200 dark:bg-neutral-700 animate-pulse">
          <div className="w-4 h-4" />
        </div>
      )}

      {/* Thumbnail Skeleton */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-gray-200 dark:bg-neutral-700 animate-pulse" />
      </div>

      {/* Details Skeleton */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-1/2 mt-0.5" />
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-200 dark:bg-neutral-700 animate-pulse w-20 h-7" />
          {status && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-neutral-600 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-16" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ImageComponent: React.FC<DocumentCardProps> = ({
  doc,
  canDelete = false,
  onDelete,
  status,
  isLoading = false,
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState("");

  const handleView = () => {
    setViewerUrl(doc.signedUrl);
    setViewerOpen(true);
  };

  if (isLoading) return <DocumentCardSkeleton />;

  const getStatusColor = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "PENDING":
        return "bg-blue-500";

      default:
        return "bg-neutral-400 darK:bg-neutral-600";
    }
  };


  const formatStatus = (status?: string) => {
  if (!status) return "";
  return status.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};


  return (
    <>
      <div
        className="
        group relative flex items-center gap-4 rounded-xl p-4 
        border border-border bg-white dark:bg-neutral-900
        transition-all duration-200 hover:bg-muted/40 dark:hover:bg-neutral-800
      "
      >
        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={() => onDelete?.(doc.id)}
            className="
            absolute top-3 right-3 p-1 rounded-full 
            border border-border bg-white dark:bg-neutral-900 
            hover:bg-muted dark:hover:bg-neutral-800 
            transition-colors
          "
          >
            <Trash2 className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          </button>
        )}

        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted dark:bg-neutral-800">
            <Image
              src={doc.signedUrl}
              alt={doc.doc_og_name}
              fill
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 truncate pr-6">
              {doc.doc_og_name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Uploaded on{" "}
              {new Date(doc.created_at!).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-end justify-between mt-3">
            <button
              onClick={handleView}
              className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md 
              border border-border bg-muted/30 dark:bg-neutral-800/40 
              text-neutral-700 dark:text-neutral-300 text-xs font-medium
              hover:bg-muted transition dark:hover:bg-neutral-700
            "
            >
              <SquareArrowOutUpRight className="w-4 h-4" />
              View
            </button>

            {status && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 capitalize">{formatStatus(status)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------
            🔥 IMAGE VIEWER MODAL
          --------------------------- */}
      <ImageViewerModal
        open={viewerOpen}
        imageUrl={viewerUrl}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
};
