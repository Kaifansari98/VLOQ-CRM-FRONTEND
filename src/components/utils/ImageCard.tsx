"use client";

import { Trash2, SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

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
    <div className="group relative flex items-center justify-between gap-4 rounded-xl p-3 border border-border shadow-sm overflow-hidden bg-card">
      {/* Delete Button Skeleton */}
      {canDelete && (
        <div className="absolute top-3 right-1.5 p-1 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse">
          <div className="w-4 h-4" />
        </div>
      )}

      {/* Thumbnail Skeleton */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Details Skeleton */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {/* Title Skeleton */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-2" />

          {/* Date Skeleton */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 mt-0.5" />
        </div>

        {/* Actions + Status Skeleton */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {/* View Button Skeleton */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-20 h-7" />

          {/* Status Skeleton */}
          {status && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
export const ImageComponent: React.FC<DocumentCardProps> = ({
  doc,
  index = 0,
  canDelete = false,
  onView,
  onDelete,
  status,
  isLoading = false,
}) => {
  // Skeleton
  if (isLoading) {
    return (
      <div className="group relative flex items-center gap-4 rounded-xl p-4 border border-border bg-white">
        {/* Delete Button */}
        {canDelete && (
          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-muted animate-pulse" />
        )}

        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-muted animate-pulse" />

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 min-w-0 gap-2">
          <div className="h-4 rounded bg-muted animate-pulse w-2/3" />
          <div className="h-3 rounded bg-muted animate-pulse w-1/3" />
          <div className="flex items-center justify-between mt-2">
            <div className="h-6 rounded bg-muted animate-pulse w-16" />
            <div className="h-3 rounded bg-muted animate-pulse w-10" />
          </div>
        </div>
      </div>
    );
  }

  // Neutral ShadCN-style status dot
  const statusDot = (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-neutral-400" />
      <span className="text-xs font-medium text-neutral-600">
        {status
          ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
          : ""}
      </span>
    </div>
  );

  return (
    <div
      className={`
        group relative flex items-center gap-4 rounded-xl p-4 
        border border-border bg-white 
        transition-all duration-200 
        hover:bg-muted/40
      `}
    >
      {/* Delete Button */}
      {canDelete && (
        <button
          onClick={() => onDelete?.(doc.id)}
          className="
            absolute top-3 right-3 p-1 
            rounded-full border border-border
            bg-white hover:bg-muted transition-colors
          "
        >
          <Trash2 className="w-4 h-4 text-neutral-600" />
        </button>
      )}

      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted">
          <img
            src={doc.signedUrl}
            alt={doc.doc_og_name}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 truncate pr-6">
            {doc.doc_og_name}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Uploaded on{" "}
            {new Date(doc.created_at!).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => onView?.(index)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-md 
              border border-border bg-muted/30 
              text-neutral-700 text-xs font-medium
              hover:bg-muted transition
            "
          >
            <SquareArrowOutUpRight className="w-4 h-4" />
            View
          </button>

          {status && statusDot}
        </div>
      </div>
    </div>
  );
};
